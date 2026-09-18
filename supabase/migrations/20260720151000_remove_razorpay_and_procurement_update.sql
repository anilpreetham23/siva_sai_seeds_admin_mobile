-- AgriFlow ERP: Procurement & Slot Booking Update Migration
-- 1. Remove Razorpay tables, triggers, and functions
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.payment_orders CASCADE;
DROP FUNCTION IF EXISTS public.verify_and_complete_payment CASCADE;
DROP FUNCTION IF EXISTS public.create_pending_purchase CASCADE;
DROP FUNCTION IF EXISTS public.mark_payment_failed CASCADE;

-- 2. Clean up seed_purchases columns
ALTER TABLE public.seed_purchases DROP COLUMN IF EXISTS upi_id;
ALTER TABLE public.seed_purchases DROP COLUMN IF EXISTS transaction_id;
ALTER TABLE public.seed_purchases ADD COLUMN IF NOT EXISTS pickup_date date;
ALTER TABLE public.seed_purchases ADD COLUMN IF NOT EXISTS warehouse_id bigint REFERENCES public.warehouses(id);

-- Make sure payment_status values conform to 'pending' or 'paid' or 'failed'
ALTER TABLE public.seed_purchases ALTER COLUMN payment_status SET DEFAULT 'pending';

-- 3. Modify warehouse_slots table for configurable capacity & booking count
ALTER TABLE public.warehouse_slots ADD COLUMN IF NOT EXISTS max_bookings integer DEFAULT 10;
ALTER TABLE public.warehouse_slots ADD COLUMN IF NOT EXISTS current_booking_count integer DEFAULT 0;

-- 4. Add procurement columns to booking_slots table
ALTER TABLE public.booking_slots ADD COLUMN IF NOT EXISTS procurement_status text DEFAULT 'pending_procurement';
ALTER TABLE public.booking_slots ADD COLUMN IF NOT EXISTS grain_quality text; -- 'Good', 'Average', 'Bad'
ALTER TABLE public.booking_slots ADD COLUMN IF NOT EXISTS received_quantity_kg numeric;
ALTER TABLE public.booking_slots ADD COLUMN IF NOT EXISTS procurement_remarks text;
ALTER TABLE public.booking_slots ADD COLUMN IF NOT EXISTS procured_at timestamptz;
ALTER TABLE public.booking_slots ADD COLUMN IF NOT EXISTS moisture_pct numeric;

-- Drop function update_booking_status to prevent "cannot change return type of existing function" error
DROP FUNCTION IF EXISTS public.update_booking_status(bigint, text, bigint, text, bigint) CASCADE;

-- 5. Create robust RPC for creating a booking slot with concurrency handling & capacity validation
CREATE OR REPLACE FUNCTION public.create_booking_slot(
  p_farmer_id bigint,
  p_booking_date text,
  p_delivery_address text,
  p_grain_type text,
  p_warehouse_id bigint,
  p_quantity_kg numeric,
  p_warehouse_slot_id bigint
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_wslot RECORD;
  v_available_weight numeric;
  v_dup_exists boolean;
  v_slot_id bigint;
BEGIN
  -- 1. Lock slot to prevent concurrent overbooking
  SELECT * INTO v_wslot 
  FROM warehouse_slots 
  WHERE id = p_warehouse_slot_id AND status = 'active'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Selected time slot not found or inactive');
  END IF;

  -- 2. Verify slot belongs to the selected warehouse and date
  IF v_wslot.warehouse_id <> p_warehouse_id OR v_wslot.slot_date::text <> p_booking_date THEN
    RETURN json_build_object('error', 'Time slot details do not match selected warehouse or date');
  END IF;

  -- 3. Validate booking count limit
  IF COALESCE(v_wslot.current_booking_count, 0) >= COALESCE(v_wslot.max_bookings, 10) THEN
    RETURN json_build_object('error', 'Time slot booking capacity reached. Please select another slot.');
  END IF;

  -- 4. Validate weight capacity limit
  v_available_weight := COALESCE(v_wslot.total_capacity_kg, 0) - COALESCE(v_wslot.booked_capacity_kg, 0);
  IF p_quantity_kg > v_available_weight THEN
    RETURN json_build_object('error', 'Time slot weight capacity exceeded. Available: ' || round(v_available_weight / 100.0, 2) || ' Qtl');
  END IF;

  -- 5. Prevent duplicate bookings by the same farmer for the same date and slot
  SELECT EXISTS(
    SELECT 1 
    FROM booking_slots 
    WHERE farmer_id = p_farmer_id 
      AND warehouse_slot_id = p_warehouse_slot_id 
      AND status NOT IN ('cancelled', 'rejected')
  ) INTO v_dup_exists;

  IF v_dup_exists THEN
    RETURN json_build_object('error', 'You already have a booking request for this time slot');
  END IF;

  -- 6. Insert new booking slot in pending state
  INSERT INTO booking_slots (
    farmer_id, booking_date, delivery_address, grain_type, 
    warehouse_id, quantity_kg, status, warehouse_slot_id, procurement_status
  ) VALUES (
    p_farmer_id, p_booking_date, p_delivery_address, p_grain_type, 
    p_warehouse_id, p_quantity_kg, 'pending', p_warehouse_slot_id, 'pending_procurement'
  )
  RETURNING id INTO v_slot_id;

  -- 7. Atomically increment weight and booking counts
  UPDATE warehouse_slots
  SET booked_capacity_kg = COALESCE(booked_capacity_kg, 0) + p_quantity_kg,
      current_booking_count = COALESCE(current_booking_count, 0) + 1
  WHERE id = p_warehouse_slot_id;

  -- 8. Trigger booking notifications
  INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
  VALUES (
    p_farmer_id, 
    'Booking Submitted', 
    'Your slot booking request for ' || p_booking_date || ' has been submitted. Status: Pending Approval.', 
    'info', 
    'booking_slot', 
    v_slot_id
  );

  -- Return success
  RETURN json_build_object('success', true, 'id', v_slot_id);
END;
$function$;

-- 6. Create robust RPC for booking approval & rejection (replaces old update_booking_status logic)
CREATE OR REPLACE FUNCTION public.update_booking_status(
  p_slot_id bigint, 
  p_status text, 
  p_warehouse_slot_id bigint, -- unused in new flow but kept signature compatible
  p_admin_name text, 
  p_admin_id bigint
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_slot RECORD;
  v_farmer_name text;
  v_mgr RECORD;
BEGIN
  -- 1. Fetch & lock booking
  SELECT * INTO v_slot FROM booking_slots WHERE id = p_slot_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Booking slot not found');
  END IF;

  -- Prevent updating completed bookings
  IF v_slot.status IN ('completed', 'cancelled') THEN
    RETURN json_build_object('error', 'Cannot change status of completed or cancelled booking');
  END IF;

  SELECT name INTO v_farmer_name FROM users WHERE id = v_slot.farmer_id;

  -- Case A: Approval
  IF p_status = 'approved' THEN
    UPDATE booking_slots
    SET status = 'approved'
    WHERE id = p_slot_id;

    -- Notify farmer
    INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (
      v_slot.farmer_id, 
      'Booking Approved', 
      'Your slot booking for ' || v_slot.booking_date || ' has been approved. Status: Approved.', 
      'success', 
      'booking_slot', 
      p_slot_id
    );

    -- Log Audit
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (p_admin_id, 'Approve Booking Slot', 'booking_slot', p_slot_id, p_admin_name || ' approved booking slot #' || p_slot_id);

  -- Case B: Rejection
  ELSIF p_status = 'rejected' THEN
    UPDATE booking_slots
    SET status = 'rejected'
    WHERE id = p_slot_id;

    -- Decrement slot counts to release capacity
    IF v_slot.warehouse_slot_id IS NOT NULL THEN
      UPDATE warehouse_slots
      SET booked_capacity_kg = GREATEST(0, COALESCE(booked_capacity_kg, 0) - v_slot.quantity_kg),
          current_booking_count = GREATEST(0, COALESCE(current_booking_count, 0) - 1)
      WHERE id = v_slot.warehouse_slot_id;
    END IF;

    -- Notify farmer
    INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (
      v_slot.farmer_id, 
      'Booking Rejected', 
      'Your slot booking for ' || v_slot.booking_date || ' has been rejected.', 
      'error', 
      'booking_slot', 
      p_slot_id
    );

    -- Log Audit
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (p_admin_id, 'Reject Booking Slot', 'booking_slot', p_slot_id, p_admin_name || ' rejected booking slot #' || p_slot_id);

  -- Case C: Cancellation (Farmer side / admin cancel)
  ELSIF p_status = 'cancelled' THEN
    UPDATE booking_slots
    SET status = 'cancelled'
    WHERE id = p_slot_id;

    -- Decrement slot counts to release capacity (only if it wasn't already rejected)
    IF v_slot.status NOT IN ('rejected', 'cancelled') AND v_slot.warehouse_slot_id IS NOT NULL THEN
      UPDATE warehouse_slots
      SET booked_capacity_kg = GREATEST(0, COALESCE(booked_capacity_kg, 0) - v_slot.quantity_kg),
          current_booking_count = GREATEST(0, COALESCE(current_booking_count, 0) - 1)
      WHERE id = v_slot.warehouse_slot_id;
    END IF;

    -- Notify farmer
    INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
    VALUES (
      v_slot.farmer_id, 
      'Booking Cancelled', 
      'Your slot booking for ' || v_slot.booking_date || ' has been cancelled.', 
      'warning', 
      'booking_slot', 
      p_slot_id
    );

    -- Log Audit
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (p_admin_id, 'Cancel Booking Slot', 'booking_slot', p_slot_id, p_admin_name || ' cancelled booking slot #' || p_slot_id);
  
  ELSE
    RETURN json_build_object('error', 'Invalid status payload: ' || p_status);
  END IF;

  RETURN json_build_object('success', true);
END;
$function$;

-- 7. Create robust RPC for grain procurement (atomic & secure)
CREATE OR REPLACE FUNCTION public.procure_grain_booking(
  p_slot_id bigint,
  p_received_qty_kg numeric,
  p_moisture_pct numeric,
  p_remarks text,
  p_quality text, -- 'Good', 'Average', 'Bad'
  p_procurement_status text, -- 'Received', 'Rejected', 'Partial Receipt'
  p_admin_id bigint,
  p_admin_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_slot RECORD;
  v_grade text;
  v_rate numeric := 0;
  v_total_amount numeric := 0;
  v_sale_id bigint;
  v_farmer_name text;
  v_warehouse_name text;
BEGIN
  -- 1. Lock the booking slot
  SELECT * INTO v_slot FROM booking_slots WHERE id = p_slot_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Booking slot not found');
  END IF;

  -- Ensure booking is approved
  IF v_slot.status <> 'approved' THEN
    RETURN json_build_object('error', 'Procurement is only allowed for approved bookings');
  END IF;

  -- Determine grade based on quality selection
  v_grade := CASE 
    WHEN p_quality = 'Good' THEN 'A'
    WHEN p_quality = 'Average' THEN 'B'
    ELSE 'C'
  END;

  -- 2. Fetch the market rate
  SELECT price_per_kg INTO v_rate 
  FROM market_rates
  WHERE crop_type = v_slot.grain_type AND grade = v_grade
  ORDER BY effective_date DESC, created_at DESC 
  LIMIT 1;

  IF v_rate IS NULL THEN
    v_rate := 0;
  END IF;

  v_total_amount := p_received_qty_kg * v_rate;

  -- 3. Update slot procurement columns and overall status
  UPDATE booking_slots
  SET status = CASE WHEN p_procurement_status = 'Rejected' THEN 'cancelled' ELSE 'completed' END,
      procurement_status = p_procurement_status,
      grain_quality = p_quality,
      received_quantity_kg = p_received_qty_kg,
      procurement_remarks = p_remarks,
      procured_at = now(),
      moisture_pct = p_moisture_pct
  WHERE id = p_slot_id;

  -- 4. Decrement slot capacities since the produce is now received and off-loaded
  IF v_slot.warehouse_slot_id IS NOT NULL THEN
    UPDATE warehouse_slots
    SET booked_capacity_kg = GREATEST(0, COALESCE(booked_capacity_kg, 0) - v_slot.quantity_kg),
        current_booking_count = GREATEST(0, COALESCE(current_booking_count, 0) - 1)
    WHERE id = v_slot.warehouse_slot_id;
  END IF;

  -- 5. If crop is accepted (not Rejected), update warehouse inventory
  IF p_procurement_status <> 'Rejected' THEN
    -- Increment load in warehouses
    UPDATE warehouses 
    SET current_load_kg = COALESCE(current_load_kg, 0) + p_received_qty_kg 
    WHERE id = v_slot.warehouse_id;

    -- Add to warehouse inventory
    INSERT INTO warehouse_inventory (warehouse_id, grain_type, quantity_kg)
    VALUES (v_slot.warehouse_id, v_slot.grain_type, p_received_qty_kg)
    ON CONFLICT (warehouse_id, grain_type)
    DO UPDATE SET quantity_kg = warehouse_inventory.quantity_kg + EXCLUDED.quantity_kg, last_updated = now();
  END IF;

  -- 6. Upsert linked grain sale
  v_sale_id := v_slot.grain_sale_id;
  IF v_sale_id IS NOT NULL THEN
    UPDATE grain_sales
    SET raw_material_kg = v_slot.quantity_kg,
        good_material_kg = CASE WHEN p_procurement_status = 'Rejected' THEN 0 ELSE p_received_qty_kg END,
        wastage_kg = GREATEST(0, v_slot.quantity_kg - p_received_qty_kg),
        price_per_kg = v_rate,
        total_amount = v_total_amount,
        grade = v_grade,
        status = CASE WHEN p_procurement_status = 'Rejected' THEN 'rejected' ELSE 'received' END,
        updated_at = now()
    WHERE id = v_sale_id;
  ELSE
    -- If no pre-existing grain sale, insert one to keep transactions & ledger intact
    INSERT INTO grain_sales (
      farmer_id, grain_type, grade, raw_material_kg, good_material_kg, 
      wastage_kg, price_per_kg, total_amount, status
    ) VALUES (
      v_slot.farmer_id, v_slot.grain_type, v_grade, v_slot.quantity_kg, 
      CASE WHEN p_procurement_status = 'Rejected' THEN 0 ELSE p_received_qty_kg END,
      GREATEST(0, v_slot.quantity_kg - p_received_qty_kg), v_rate, v_total_amount,
      CASE WHEN p_procurement_status = 'Rejected' THEN 'rejected' ELSE 'received' END
    )
    RETURNING id INTO v_sale_id;
    
    -- Associate new sale ID to booking slot
    UPDATE booking_slots SET grain_sale_id = v_sale_id WHERE id = p_slot_id;
  END IF;

  -- 7. Trigger notifications
  SELECT name INTO v_farmer_name FROM users WHERE id = v_slot.farmer_id;
  SELECT name INTO v_warehouse_name FROM warehouses WHERE id = v_slot.warehouse_id;

  -- Notify Farmer
  INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
  VALUES (
    v_slot.farmer_id,
    CASE WHEN p_procurement_status = 'Rejected' THEN 'Grain Rejected at Procurement' ELSE 'Grain Procurement Completed' END,
    CASE 
      WHEN p_procurement_status = 'Rejected' THEN 'Your grain delivery for ' || v_slot.grain_type || ' was rejected. Remarks: ' || COALESCE(p_remarks, 'None')
      ELSE 'Procured ' || round(p_received_qty_kg / 100.0, 2) || ' Qtl of your ' || v_slot.grain_type || ' at ' || v_warehouse_name || '. Status: ' || p_procurement_status || '.'
    END,
    CASE WHEN p_procurement_status = 'Rejected' THEN 'error' ELSE 'success' END,
    'grain_sale',
    v_sale_id
  );

  -- Log Audit
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (
    p_admin_id,
    'Grain Procurement',
    'booking_slot',
    p_slot_id,
    p_admin_name || ' processed procurement for booking slot #' || p_slot_id || ' status: ' || p_procurement_status || ' quantity: ' || round(p_received_qty_kg / 100.0, 2) || ' Qtl'
  );

  RETURN json_build_object('success', true, 'sale_id', v_sale_id);
END;
$function$;
