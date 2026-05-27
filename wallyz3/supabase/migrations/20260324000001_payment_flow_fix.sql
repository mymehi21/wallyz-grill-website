-- Columns needed for correct payment flow
ALTER TABLE pickup_orders ADD COLUMN IF NOT EXISTS clover_checkout_session_id text;
ALTER TABLE pickup_orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Order status values used in this system:
-- pending_payment          = order saved, customer redirected to Clover payment page
-- paid                     = payment verified by Clover + POS order created successfully
-- paid_clover_sync_failed  = payment verified but POS order creation failed — staff must be notified manually
-- payment_failed           = Clover verified payment was NOT completed
-- payment_unverifiable     = Clover session lookup failed — payment status unknown
COMMENT ON COLUMN pickup_orders.status IS
  'pending_payment | paid | paid_clover_sync_failed | payment_failed | payment_unverifiable';
