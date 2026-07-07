-- Gastos periódicos (Compra Inteligente): seguro de desgravamen, seguro de
-- riesgo, GPS, portes y gastos administrativos. Se cobran cada período
-- (incluso en gracia) y entran al flujo del deudor, por lo que la TCEA
-- refleja el costo real del crédito.
--
-- NOTA: esta migración ya fue aplicada al proyecto Supabase remoto
-- (vía MCP, nombre "add_periodic_expenses_fields") antes de existir este
-- archivo local. Se documenta aquí para mantener el historial de esquema
-- sincronizado con la carpeta migrations/.

-- loans: parámetros de entrada por operación
ALTER TABLE public.loans
  ADD COLUMN IF NOT EXISTS credit_life_insurance_rate NUMERIC NOT NULL DEFAULT 0
    CHECK (credit_life_insurance_rate >= 0),
  ADD COLUMN IF NOT EXISTS risk_insurance_amount BIGINT NOT NULL DEFAULT 0
    CHECK (risk_insurance_amount >= 0),
  ADD COLUMN IF NOT EXISTS gps_amount BIGINT NOT NULL DEFAULT 0
    CHECK (gps_amount >= 0),
  ADD COLUMN IF NOT EXISTS postage_amount BIGINT NOT NULL DEFAULT 0
    CHECK (postage_amount >= 0),
  ADD COLUMN IF NOT EXISTS admin_fee_amount BIGINT NOT NULL DEFAULT 0
    CHECK (admin_fee_amount >= 0);

-- payment_schedule: desglose de gastos por cuota
ALTER TABLE public.payment_schedule
  ADD COLUMN IF NOT EXISTS credit_life_insurance BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS risk_insurance BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gps BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS postage BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS admin_fee BIGINT NOT NULL DEFAULT 0;

-- financial_indicators: total de gastos periódicos
ALTER TABLE public.financial_indicators
  ADD COLUMN IF NOT EXISTS total_expenses BIGINT NOT NULL DEFAULT 0;
