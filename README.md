# CreditoAuto + Supabase

Sistema de crédito vehicular (Compra Inteligente) integrado con Supabase.

## Setup

1. **Proyecto Supabase** `finanzas` (`odrxnroovaxtookzjoor`) — [dashboard](https://supabase.com/dashboard/project/odrxnroovaxtookzjoor).

2. **Migración** — ya aplicada (`initial_creditoauto_schema`). Tablas: `users`, `clients`, `vehicles`, `loans`, `payment_schedule`, `financial_indicators`, `app_settings`.

3. **Variables de entorno** — `.env` ya configurado con URL y anon key.

4. **Usuario de la app (Supabase Auth)** — ya creado:
   - Email: `adoa2705@gmail.com` (o usuario `adoa` en el login)
   - Contraseña de **app**: `123456` (cámbiala en Auth → Users si quieres)
   - **No** uses `password_db.txt` para entrar a la app — ese archivo es solo la contraseña de **Postgres** (conexión directa a la BD)

5. **Instalar y ejecutar**:
   ```bash
   npm install
   npm run validate-formulas
   npm run dev
   ```

## Login (app)

- Email: `adoa2705@gmail.com` — o usuario: `adoa`
- Contraseña: `123456` (Supabase Auth, no la de la base de datos)

## Credenciales de base de datos

`password_db.txt` guarda la contraseña de **PostgreSQL** (SQL Editor, `psql`, migraciones CLI). No se usa en el frontend ni en el login de la app.

## Arquitectura

- **Fórmulas:** `src/app/lib/financialCalculations.ts` (TypeScript)
- **Persistencia:** Supabase PostgreSQL (`clients`, `loans`, `vehicles`, `payment_schedule`, `financial_indicators`, `app_settings`)
- **Auth:** Supabase Auth + tabla `users`

## Documentación

- `docs/SCHEMA-MAP.md` — mapeo frontend ↔ BD
- `docs/FLOW.md` — flujo de negocio
- `docs/VALIDATION.md` — casos numéricos §6D
- `docs/COURSE-PARITY.md` — paridad con curso UPC
- `docs/REVIEW.md` — revisión de código y checkpoints

## Validación

```bash
npm run validate-formulas   # Casos §6D
npm run build               # Build producción
```
