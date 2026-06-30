-- CreditoAuto initial schema (frontend-first)

-- Profiles linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'asesor' CHECK (role IN ('asesor', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clients (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'DNI',
  document_number CHAR(8) NOT NULL CHECK (document_number ~ '^[0-9]{8}$'),
  phone CHAR(9) NOT NULL CHECK (phone ~ '^[0-9]{9}$'),
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, document_number)
);

CREATE TABLE IF NOT EXISTS public.vehicles (
  id BIGSERIAL PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  vehicle_price NUMERIC(14, 2) NOT NULL CHECK (vehicle_price > 0),
  currency_type TEXT NOT NULL CHECK (currency_type IN ('Soles', 'Dólares')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_code TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id BIGINT REFERENCES public.clients(id) ON DELETE SET NULL,
  vehicle_id BIGINT NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  initial_payment_amount NUMERIC(14, 2) NOT NULL CHECK (initial_payment_amount >= 0),
  financed_amount NUMERIC(14, 2) NOT NULL CHECK (financed_amount > 0),
  total_vehicle_price NUMERIC(14, 2) NOT NULL CHECK (total_vehicle_price > 0),
  annual_interest_rate NUMERIC(10, 4) NOT NULL CHECK (annual_interest_rate > 0),
  interest_rate_type TEXT NOT NULL CHECK (interest_rate_type IN ('Efectiva', 'Nominal')),
  capitalization_period TEXT,
  payment_frequency TEXT NOT NULL CHECK (payment_frequency IN ('Mensual', 'Quincenal', 'Semanal')),
  loan_term_in_months INTEGER NOT NULL CHECK (loan_term_in_months > 0),
  number_of_grace_periods INTEGER NOT NULL DEFAULT 0 CHECK (number_of_grace_periods >= 0),
  grace_period_type TEXT NOT NULL DEFAULT 'Ninguno' CHECK (grace_period_type IN ('Ninguno', 'Total', 'Parcial')),
  residual_value_amount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (residual_value_amount >= 0),
  discount_rate NUMERIC(10, 4) NOT NULL CHECK (discount_rate > 0),
  start_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'Aprobado', 'Rechazado', 'Calculado')),
  currency_type TEXT NOT NULL CHECK (currency_type IN ('Soles', 'Dólares')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, external_code)
);

CREATE TABLE IF NOT EXISTS public.payment_schedule (
  id BIGSERIAL PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL CHECK (installment_number > 0),
  due_date DATE NOT NULL,
  grace_type TEXT NOT NULL CHECK (grace_type IN ('Normal', 'Gracia Total', 'Gracia Parcial')),
  initial_balance NUMERIC(14, 2) NOT NULL,
  interest NUMERIC(14, 2) NOT NULL,
  amortization NUMERIC(14, 2) NOT NULL,
  installment_amount NUMERIC(14, 2) NOT NULL,
  residual_paid NUMERIC(14, 2) NOT NULL DEFAULT 0,
  final_balance NUMERIC(14, 2) NOT NULL,
  debtor_flow NUMERIC(14, 2) NOT NULL,
  present_value NUMERIC(14, 2) NOT NULL,
  UNIQUE (loan_id, installment_number)
);

CREATE TABLE IF NOT EXISTS public.financial_indicators (
  id BIGSERIAL PRIMARY KEY,
  loan_id UUID NOT NULL UNIQUE REFERENCES public.loans(id) ON DELETE CASCADE,
  financed_amount NUMERIC(14, 2) NOT NULL,
  tea NUMERIC(12, 8) NOT NULL,
  periodic_rate NUMERIC(12, 8) NOT NULL,
  discount_rate_periodic NUMERIC(12, 8) NOT NULL,
  num_periods INTEGER NOT NULL,
  total_interest NUMERIC(14, 2) NOT NULL,
  total_paid NUMERIC(14, 2) NOT NULL,
  van NUMERIC(14, 2) NOT NULL,
  tir_periodic NUMERIC(12, 8) NOT NULL,
  tir_annual NUMERIC(12, 8) NOT NULL,
  tcea NUMERIC(12, 8) NOT NULL,
  french_installment NUMERIC(14, 2) NOT NULL,
  residual_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
  calculation_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.app_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, username, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'asesor')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update_own ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY clients_all_own ON public.clients FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY vehicles_select ON public.vehicles FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.loans l WHERE l.vehicle_id = vehicles.id AND l.user_id = auth.uid())
  OR NOT EXISTS (SELECT 1 FROM public.loans l WHERE l.vehicle_id = vehicles.id)
);
CREATE POLICY vehicles_insert ON public.vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY vehicles_update ON public.vehicles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.loans l WHERE l.vehicle_id = vehicles.id AND l.user_id = auth.uid())
);

CREATE POLICY loans_all_own ON public.loans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY schedule_all_own ON public.payment_schedule FOR ALL USING (
  EXISTS (SELECT 1 FROM public.loans l WHERE l.id = payment_schedule.loan_id AND l.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.loans l WHERE l.id = payment_schedule.loan_id AND l.user_id = auth.uid())
);

CREATE POLICY indicators_all_own ON public.financial_indicators FOR ALL USING (
  EXISTS (SELECT 1 FROM public.loans l WHERE l.id = financial_indicators.loan_id AND l.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.loans l WHERE l.id = financial_indicators.loan_id AND l.user_id = auth.uid())
);

CREATE POLICY settings_all_own ON public.app_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clients_user ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_user ON public.loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_client ON public.loans(client_id);
CREATE INDEX IF NOT EXISTS idx_schedule_loan ON public.payment_schedule(loan_id);
