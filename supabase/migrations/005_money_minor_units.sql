-- Dinero en unidades enteras: 1.0000 = 10_000 (4 decimales, sin error de centavo)

-- vehicles
ALTER TABLE public.vehicles
  ALTER COLUMN vehicle_price TYPE BIGINT
  USING (ROUND(vehicle_price * 10000)::BIGINT);

-- loans
ALTER TABLE public.loans
  ALTER COLUMN initial_payment_amount TYPE BIGINT
  USING (ROUND(initial_payment_amount * 10000)::BIGINT),
  ALTER COLUMN financed_amount TYPE BIGINT
  USING (ROUND(financed_amount * 10000)::BIGINT),
  ALTER COLUMN total_vehicle_price TYPE BIGINT
  USING (ROUND(total_vehicle_price * 10000)::BIGINT),
  ALTER COLUMN residual_value_amount TYPE BIGINT
  USING (ROUND(residual_value_amount * 10000)::BIGINT);

-- payment_schedule
ALTER TABLE public.payment_schedule
  ALTER COLUMN initial_balance TYPE BIGINT USING (ROUND(initial_balance * 10000)::BIGINT),
  ALTER COLUMN interest TYPE BIGINT USING (ROUND(interest * 10000)::BIGINT),
  ALTER COLUMN amortization TYPE BIGINT USING (ROUND(amortization * 10000)::BIGINT),
  ALTER COLUMN installment_amount TYPE BIGINT USING (ROUND(installment_amount * 10000)::BIGINT),
  ALTER COLUMN residual_paid TYPE BIGINT USING (ROUND(residual_paid * 10000)::BIGINT),
  ALTER COLUMN final_balance TYPE BIGINT USING (ROUND(final_balance * 10000)::BIGINT),
  ALTER COLUMN debtor_flow TYPE BIGINT USING (ROUND(debtor_flow * 10000)::BIGINT),
  ALTER COLUMN present_value TYPE BIGINT USING (ROUND(present_value * 10000)::BIGINT);

-- financial_indicators (montos; tasas TEA/TIR siguen NUMERIC)
ALTER TABLE public.financial_indicators
  ALTER COLUMN financed_amount TYPE BIGINT USING (ROUND(financed_amount * 10000)::BIGINT),
  ALTER COLUMN total_interest TYPE BIGINT USING (ROUND(total_interest * 10000)::BIGINT),
  ALTER COLUMN total_paid TYPE BIGINT USING (ROUND(total_paid * 10000)::BIGINT),
  ALTER COLUMN van TYPE BIGINT USING (ROUND(van * 10000)::BIGINT),
  ALTER COLUMN french_installment TYPE BIGINT USING (ROUND(french_installment * 10000)::BIGINT),
  ALTER COLUMN residual_value TYPE BIGINT USING (ROUND(residual_value * 10000)::BIGINT);

COMMENT ON COLUMN public.vehicles.vehicle_price IS 'Minor units: 1.0000 currency = 10000';
COMMENT ON COLUMN public.loans.financed_amount IS 'Minor units: 1.0000 currency = 10000';
