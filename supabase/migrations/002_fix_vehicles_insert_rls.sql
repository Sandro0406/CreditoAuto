-- Fix: vehicles INSERT blocked by missing or restrictive RLS policy
DROP POLICY IF EXISTS vehicles_insert ON public.vehicles;
CREATE POLICY vehicles_insert ON public.vehicles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
