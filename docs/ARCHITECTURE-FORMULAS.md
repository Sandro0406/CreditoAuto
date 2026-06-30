# Decisión: fórmulas en TypeScript

- **Cálculo:** `src/app/lib/financialCalculations.ts` (`calcularCreditoVehicular`)
- **Persistencia:** `payment_schedule` + `financial_indicators` vía `src/app/lib/api/amortization.ts`
- **Postgres:** DDL, RLS, CHECK — sin funciones PL/pgSQL de amortización

Flujo: UI → TS calcula → API persiste → Supabase almacena snapshot.
