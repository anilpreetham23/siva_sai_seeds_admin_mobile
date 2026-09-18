-- Phase 2: Razorpay Payment Integration Tables & RPCs
-- Creates payment_orders, payments tables and RPCs for atomic payment processing.

-- ============================================================================
-- 1. payment_orders — tracks Razorpay orders linked to seed purchases
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payment_orders (
  id            bigserial PRIMARY KEY,
  order_id      text        NOT NULL UNIQUE,          -- Razorpay order_xxx
  farmer_id     bigint      NOT NULL REFERENCES public.users(id),
  purchase_id   bigint      NOT NULL REFERENCES public.seed_purchases(id),
  gateway       text        NOT NULL DEFAULT 'razorpay',
  amount        numeric     NOT NULL,                 -- amount in paisa (INR smallest unit)
  currency      text        NOT NULL DEFAULT 'INR',
  status        text        NOT NULL DEFAULT 'pending', -- pending | paid | failed | expired
  razorpay_receipt text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_farmer   ON public.payment_orders(farmer_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_purchase ON public.payment_orders(purchase_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status   ON public.payment_orders(status);

-- ============================================================================
-- 2. payments — stores verified payment details from Razorpay
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id                  bigserial PRIMARY KEY,
  payment_order_id    bigint    NOT NULL REFERENCES public.payment_orders(id),
  gateway_payment_id  text      UNIQUE,                -- pay_xxx from Razorpay
  gateway_signature   text,                            -- HMAC signature
  payment_method      text,                            -- upi, card, netbanking, wallet, etc.
  status              text      NOT NULL DEFAULT 'captured', -- captured | failed | refunded
  paid_at             timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(payment_order_id);

-- ============================================================================
-- 3. Enable RLS on new tables (deny-all by default; edge functions use
--    SECURITY DEFINER RPCs which bypass RLS)
-- ============================================================================
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments       ENABLE ROW LEVEL SECURITY;

-- Farmers can read their own payment_orders (for the frontend history)
CREATE POLICY payment_orders_farmer_read ON public.payment_orders
  FOR SELECT USING (farmer_id = (
    SELECT app_user_id FROM public.profiles
    WHERE id = auth.uid()
  ));

-- Farmers can read their own payments via payment_order
CREATE POLICY payments_farmer_read ON public.payments
  FOR SELECT USING (payment_order_id IN (
    SELECT id FROM public.payment_orders
    WHERE farmer_id = (
      SELECT app_user_id FROM public.profiles
      WHERE id = auth.uid()
    )
  ));

-- ============================================================================
-- 4. RPC: create_pending_purchase
--    Creates a seed_purchase in 'pending_payment' status WITHOUT reducing stock.
--    Stock is only reduced after payment verification.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_pending_purchase(
  p_farmer_id   bigint,
  p_seed_id     bigint,
  p_quantity_kg numeric,
  p_warehouse_id bigint
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_seed RECORD;
  v_total numeric;
  v_invoice text;
  v_purchase_id bigint;
BEGIN
  -- Validate seed
  SELECT * INTO v_seed FROM seeds WHERE id = p_seed_id AND is_active = TRUE;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Seed not found or inactive');
  END IF;

  -- Validate stock
  IF v_seed.stock_kg < p_quantity_kg THEN
    RETURN json_build_object('error', 'Insufficient stock. Available: ' || round(v_seed.stock_kg / 100.0, 2) || ' Qtl');
  END IF;

  -- Calculate total from DB price (never trust frontend)
  v_total := v_seed.price_per_kg * p_quantity_kg;
  v_invoice := 'INV-' || extract(epoch from now())::bigint;

  -- Create purchase in pending_payment state — NO stock reduction yet
  INSERT INTO seed_purchases
    (farmer_id, seed_id, quantity_kg, price_per_kg, total_amount,
     payment_status, invoice_number)
  VALUES
    (p_farmer_id, p_seed_id, p_quantity_kg, v_seed.price_per_kg, v_total,
     'pending_payment', v_invoice)
  RETURNING id INTO v_purchase_id;

  RETURN json_build_object(
    'id', v_purchase_id,
    'invoice_number', v_invoice,
    'total_amount', v_total,
    'price_per_kg', v_seed.price_per_kg,
    'seed_name', v_seed.name
  );
END;
$function$;

-- ============================================================================
-- 5. RPC: verify_and_complete_payment
--    Atomically verifies payment and completes the purchase:
--      - Updates payment_orders status
--      - Inserts payment record
--      - Updates seed_purchase status to 'paid'
--      - Reduces inventory
--      - Creates transaction record
--      - Creates farmer notification
--    All inside a single DB transaction — auto-rolls back on failure.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.verify_and_complete_payment(
  p_order_id          text,
  p_payment_id        text,
  p_signature         text,
  p_payment_method    text,
  p_farmer_id         bigint
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_po           RECORD;
  v_purchase     RECORD;
  v_seed         RECORD;
  v_txn_number   text;
  v_payment_pk   bigint;
  v_farmer_name  text;
  v_warehouse_name text := 'the warehouse';
  v_effective_wh bigint;
  v_mgr          RECORD;
  v_notif_msg    text;
BEGIN
  -- 1. Fetch and lock the payment order
  SELECT * INTO v_po
  FROM payment_orders
  WHERE order_id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Payment order not found');
  END IF;

  -- Validate farmer ownership
  IF v_po.farmer_id <> p_farmer_id THEN
    RETURN json_build_object('error', 'Unauthorized: payment order does not belong to this farmer');
  END IF;

  -- Prevent duplicate verification
  IF v_po.status = 'paid' THEN
    RETURN json_build_object('error', 'Payment already verified', 'already_paid', true);
  END IF;

  IF v_po.status NOT IN ('pending') THEN
    RETURN json_build_object('error', 'Payment order is in invalid state: ' || v_po.status);
  END IF;

  -- 2. Fetch the linked purchase
  SELECT * INTO v_purchase FROM seed_purchases WHERE id = v_po.purchase_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Linked purchase not found');
  END IF;

  -- 3. Fetch seed and validate stock (could have changed since order creation)
  SELECT * INTO v_seed FROM seeds WHERE id = v_purchase.seed_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Seed not found');
  END IF;

  IF v_seed.stock_kg < v_purchase.quantity_kg THEN
    -- Stock depleted between order creation and payment — mark order failed
    UPDATE payment_orders SET status = 'failed', updated_at = now() WHERE id = v_po.id;
    UPDATE seed_purchases SET payment_status = 'payment_failed' WHERE id = v_po.purchase_id;
    RETURN json_build_object('error', 'Stock depleted during payment. Your payment will be refunded.');
  END IF;

  -- 4. Update payment_orders → paid
  UPDATE payment_orders
  SET status = 'paid', updated_at = now()
  WHERE id = v_po.id;

  -- 5. Insert payment record
  INSERT INTO payments (payment_order_id, gateway_payment_id, gateway_signature, payment_method, status, paid_at)
  VALUES (v_po.id, p_payment_id, p_signature, p_payment_method, 'captured', now())
  RETURNING id INTO v_payment_pk;

  -- 6. Update seed_purchase → paid
  UPDATE seed_purchases
  SET payment_status = 'paid', updated_at = now()
  WHERE id = v_po.purchase_id;

  -- 7. Reduce inventory
  UPDATE seeds
  SET stock_kg = stock_kg - v_purchase.quantity_kg,
      updated_at = now()
  WHERE id = v_purchase.seed_id;

  -- 8. Generate transaction
  v_txn_number := 'TXN-' || extract(epoch from now())::bigint;

  INSERT INTO transactions
    (reference_type, reference_id, farmer_id, amount, transaction_id, direction, status, description, invoice_number)
  VALUES
    ('seed_purchase', v_po.purchase_id, p_farmer_id, v_purchase.total_amount,
     p_payment_id, 'debit', 'completed',
     'Razorpay Payment: ' || v_seed.name || ' ' || round(v_purchase.quantity_kg / 100.0, 2) || ' Qtl',
     v_purchase.invoice_number);

  -- 9. Get farmer name for notifications
  SELECT name INTO v_farmer_name FROM users WHERE id = p_farmer_id;

  -- Resolve warehouse name
  v_effective_wh := v_seed.warehouse_id;
  IF v_effective_wh IS NOT NULL THEN
    SELECT name INTO v_warehouse_name FROM warehouses WHERE id = v_effective_wh;
  END IF;

  -- 10. Farmer notification — Payment Successful
  INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
  VALUES (p_farmer_id, 'Payment Successful',
    'Your payment of Rs.' || round(v_purchase.total_amount, 2) || ' for ' ||
    round(v_purchase.quantity_kg / 100.0, 2) || ' Qtl of ' || v_seed.name ||
    ' has been received. Payment ID: ' || p_payment_id,
    'success', 'seed_purchase', v_po.purchase_id);

  -- 11. Manager/Super Admin notification
  v_notif_msg := COALESCE(v_farmer_name, 'A farmer') || ' purchased ' ||
    round(v_purchase.quantity_kg / 100.0, 2) || ' Qtl of ' || v_seed.name ||
    ' at ' || v_warehouse_name || '. Total: Rs.' || round(v_purchase.total_amount, 2) ||
    '. Payment: Razorpay (Paid). ID: ' || p_payment_id || '.';

  FOR v_mgr IN SELECT id FROM users WHERE role IN ('manager', 'super_admin') AND status = 'active' LOOP
    INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (v_mgr.id, 'New Seed Purchase (Online Payment)', v_notif_msg, 'info', 'seed_purchase', v_po.purchase_id);
  END LOOP;

  -- 12. Return success
  RETURN json_build_object(
    'success', true,
    'purchase_id', v_po.purchase_id,
    'payment_id', p_payment_id,
    'order_id', p_order_id,
    'transaction_number', v_txn_number,
    'amount', v_purchase.total_amount,
    'invoice_number', v_purchase.invoice_number,
    'seed_name', v_seed.name,
    'quantity_kg', v_purchase.quantity_kg,
    'price_per_kg', v_purchase.price_per_kg
  );
END;
$function$;

-- ============================================================================
-- 6. RPC: mark_payment_failed
--    Called when payment fails/is cancelled. Updates statuses, does NOT touch stock.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.mark_payment_failed(
  p_order_id  text,
  p_farmer_id bigint
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_po RECORD;
BEGIN
  SELECT * INTO v_po FROM payment_orders WHERE order_id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Payment order not found');
  END IF;

  IF v_po.farmer_id <> p_farmer_id THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  -- Only mark failed if still pending
  IF v_po.status = 'pending' THEN
    UPDATE payment_orders SET status = 'failed', updated_at = now() WHERE id = v_po.id;
    UPDATE seed_purchases SET payment_status = 'payment_failed' WHERE id = v_po.purchase_id;

    -- Farmer notification — Payment Failed
    INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (p_farmer_id, 'Payment Failed',
      'Your payment for seed purchase #' || v_po.purchase_id || ' was not completed. Please try again.',
      'error', 'seed_purchase', v_po.purchase_id);
  END IF;

  RETURN json_build_object('success', true);
END;
$function$;
