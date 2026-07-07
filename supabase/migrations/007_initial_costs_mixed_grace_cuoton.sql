-- Fase 2 (paridad Excel "Compra Inteligente - Interbank"):
--   1) Costes iniciales financiados (notariales, registrales, tasación, comisiones)
--   2) Gracia mixta (N períodos Total + N períodos Parcial, en la misma operación)
--   3) Cuotón capitalizante: el valor residual como cronograma paralelo que
--      capitaliza interés + seguro de desgravamen y se liquida en un período
--      extra (N+1), verificado celda por celda contra el Excel modelo.

-- loans: costes iniciales (una sola vez, se financian) + contadores de gracia mixta
ALTER TABLE public.loans
  ADD COLUMN IF NOT EXISTS notarial_cost BIGINT NOT NULL DEFAULT 0
    CHECK (notarial_cost >= 0),
  ADD COLUMN IF NOT EXISTS registry_cost BIGINT NOT NULL DEFAULT 0
    CHECK (registry_cost >= 0),
  ADD COLUMN IF NOT EXISTS appraisal_cost BIGINT NOT NULL DEFAULT 0
    CHECK (appraisal_cost >= 0),
  ADD COLUMN IF NOT EXISTS processing_fee BIGINT NOT NULL DEFAULT 0
    CHECK (processing_fee >= 0),
  ADD COLUMN IF NOT EXISTS activation_fee BIGINT NOT NULL DEFAULT 0
    CHECK (activation_fee >= 0),
  ADD COLUMN IF NOT EXISTS grace_periods_total INTEGER NOT NULL DEFAULT 0
    CHECK (grace_periods_total >= 0),
  ADD COLUMN IF NOT EXISTS grace_periods_partial INTEGER NOT NULL DEFAULT 0
    CHECK (grace_periods_partial >= 0);

-- payment_schedule: bloque del cuotón (saldo/interés/seguro desgravamen paralelos)
-- + permitir el nuevo tipo de período 'Cuotón' (liquidación en N+1).
ALTER TABLE public.payment_schedule
  ADD COLUMN IF NOT EXISTS balloon_initial_balance BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balloon_interest BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balloon_credit_life_insurance BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balloon_final_balance BIGINT NOT NULL DEFAULT 0;

ALTER TABLE public.payment_schedule DROP CONSTRAINT IF EXISTS payment_schedule_grace_type_check;
ALTER TABLE public.payment_schedule
  ADD CONSTRAINT payment_schedule_grace_type_check
  CHECK (grace_type IN ('Normal', 'Gracia Total', 'Gracia Parcial', 'Cuotón'));

-- financial_indicators: totales para transparencia (costes iniciales, saldo
-- regular después de separar el cuotón).
ALTER TABLE public.financial_indicators
  ADD COLUMN IF NOT EXISTS initial_costs BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS regular_schedule_amount BIGINT NOT NULL DEFAULT 0;
