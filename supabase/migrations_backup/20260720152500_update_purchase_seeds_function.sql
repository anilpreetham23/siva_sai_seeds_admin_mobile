-- AgriFlow ERP: Update purchase_seeds function to support pickup_date and warehouse_id
DROP FUNCTION IF EXISTS public.purchase_seeds(bigint, bigint, numeric, text, text, text, bigint) CASCADE;
DROP FUNCTION IF EXISTS public.purchase_seeds(bigint, bigint, numeric, text, text, text, bigint, date) CASCADE;

CREATE OR REPLACE FUNCTION public.purchase_seeds(
  p_farmer_id bigint, 
  p_seed_id bigint, 
  p_quantity_kg numeric, 
  p_payment_method text, 
  p_upi_id text, 
  p_transaction_id text, 
  p_warehouse_id bigint,
  p_pickup_date date DEFAULT NULL
)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_seed RECORD;
  v_effective_warehouse_id bigint;
  v_warehouse_name TEXT := 'the warehouse';
  v_total numeric;
  v_invoice TEXT;
  v_purchase_id bigint;
  v_is_warehouse boolean;
  v_payment_status TEXT;
  v_farmer_name TEXT;
  v_mgr RECORD;
  v_notif_msg TEXT;
BEGIN
  SELECT * INTO v_seed FROM seeds WHERE id = p_seed_id AND is_active = TRUE;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Seed not found or inactive');
  END IF;

  IF v_seed.stock_kg < p_quantity_kg THEN
    RETURN json_build_object('error', 'Insufficient stock. Available: ' || round(v_seed.stock_kg / 100.0, 2) || ' Qtl');
  END IF;

  v_effective_warehouse_id := COALESCE(v_seed.warehouse_id, p_warehouse_id);
  IF v_effective_warehouse_id IS NOT NULL THEN
    SELECT name INTO v_warehouse_name FROM warehouses WHERE id = v_effective_warehouse_id;
  END IF;

  v_total := v_seed.price_per_kg * p_quantity_kg;
  v_invoice := 'INV-' || extract(epoch from now())::bigint;
  v_is_warehouse := (p_payment_method = 'warehouse');
  v_payment_status := CASE WHEN v_is_warehouse THEN 'pending' ELSE 'paid' END;

  INSERT INTO seed_purchases
    (farmer_id, seed_id, quantity_kg, price_per_kg, total_amount, payment_status, invoice_number, pickup_date, warehouse_id)
  VALUES (p_farmer_id, p_seed_id, p_quantity_kg, v_seed.price_per_kg, v_total,
          v_payment_status, v_invoice, p_pickup_date, v_effective_warehouse_id)
  RETURNING id INTO v_purchase_id;

  UPDATE seeds
  SET stock_kg = stock_kg - p_quantity_kg,
      on_hold_kg = COALESCE(on_hold_kg, 0) + p_quantity_kg,
      updated_at = now()
  WHERE id = p_seed_id;

  SELECT name INTO v_farmer_name FROM users WHERE id = p_farmer_id;

  IF NOT v_is_warehouse THEN
    INSERT INTO transactions
      (reference_type, reference_id, farmer_id, amount, upi_id, transaction_id, direction, status, description, invoice_number)
    VALUES ('seed_purchase', v_purchase_id, p_farmer_id, v_total, p_upi_id, p_transaction_id, 'debit', 'completed',
            'Seed purchase: ' || v_seed.name || ' ' || round(p_quantity_kg / 100.0, 2) || ' Qtl', v_invoice);
  END IF;

  v_notif_msg := COALESCE(v_farmer_name, 'A farmer') || ' purchased ' || round(p_quantity_kg / 100.0, 2) || ' Qtl of ' || v_seed.name ||
                 ' at ' || v_warehouse_name || '. Total: Rs.' || round(v_total, 2) ||
                 '. Payment: ' || CASE WHEN v_is_warehouse THEN 'Pay at Warehouse (Pending)' ELSE initcap(p_payment_method) || ' (Paid)' END || '.';

  -- Notify the farmer first!
  INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
  VALUES (p_farmer_id, 'Seed Order Placed', 'Your order of ' || round(p_quantity_kg / 100.0, 2) || ' Qtl of ' || v_seed.name || ' is pending pickup. Payment Method: Pay at Warehouse.', 'info', 'seed_purchase', v_purchase_id);

  -- Notify managers/admins
  FOR v_mgr IN SELECT id FROM users WHERE role IN ('manager', 'super_admin') AND status = 'active' LOOP
    INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (v_mgr.id, 'New Seed Purchase', v_notif_msg, 'info', 'seed_purchase', v_purchase_id);
  END LOOP;

  RETURN json_build_object('success', true, 'id', v_purchase_id);
END;
$function$;
