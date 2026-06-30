-- Fix: vehicle INSERT ... RETURNING blocked by vehicles_select
-- SELECT only allowed vehicles linked to user's loans, but loan is created AFTER vehicle.
DROP POLICY IF EXISTS vehicles_select ON public.vehicles;
CREATE POLICY vehicles_select ON public.vehicles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.loans l
      WHERE l.vehicle_id = vehicles.id AND l.user_id = auth.uid()
    )
    OR NOT EXISTS (
      SELECT 1 FROM public.loans l
      WHERE l.vehicle_id = vehicles.id
    )
  );
