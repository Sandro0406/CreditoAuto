# Fase 5 — Revisión de código (checklist)

Fecha: 2026-06-28

## 5A Checkpoints

| CP | Estado | Notas |
|---|---|---|
| CP1 SQL/esquema | OK | `supabase/migrations/001_initial_schema.sql` — tablas, RLS, trigger auth |
| CP2 Auth | OK | `Login.tsx` + `auth.ts` — signIn, perfil en `users` |
| CP3 API | OK | `api/clients`, `loans`, `settings`, `amortization`, `mappers` |
| CP4 Cálculo+persistencia | OK | TS calcula; `calculateAndPersistAmortization` guarda schedule+indicators |
| CP5 Sin localStorage | OK | grep `localStorage` en `src/` = 0 |
| CP6 E2E | Pendiente manual | Requiere Supabase activo + usuario seed |

## 5B Checklist

### A. Lógica financiera
- [x] `monto_prestamo` = precio − cuota_inicial (no resta VR)
- [x] VR solo en última cuota
- [x] `validate-formulas.ts` pasa Caso 1 y 2 §6D
- [x] Sin duplicación de fórmulas en SQL

### B. Integración Supabase
- [x] Mapeo frontend↔BD en `mappers.ts`
- [x] Delete previo en cronograma antes de reinsertar
- [x] `calculation_snapshot` con `flujos[]`
- [x] `.env` en `.gitignore`

### C. Seguridad
- [x] RLS en todas las tablas de negocio
- [x] Anon key solo en frontend (`.env.example` sin secretos reales)

### D. Frontend
- [x] Config desde `app_settings`
- [x] `TablaAmortizacion` carga persistido o calcula en memoria
- [x] `ListaSolicitudes` pasa `solicitudId` a amortización

### E. SQL
- [x] Columnas extra §0A en schedule e indicators
- [x] UNIQUE (loan_id, installment_number)
- [x] Sin funciones PL/pgSQL de amortización

### F. Regresión
- [x] `npm run validate-formulas`
- [ ] `npm run build` — ejecutar tras `npm install`

## Bugs corregidos durante implementación

1. **Dashboard.tsx** — imports mal ubicados tras migración (corregido).
2. **ListaSolicitudes** — navegación a amortización sin ID; ahora `onVerAmortizacion(id)`.
3. **RegistroCliente** — eliminado campo `id_cliente` manual; ID auto en BD.

## Pendiente operativo

- Restaurar proyecto Supabase vía dashboard (MCP timeout en sesión).
- Crear usuario `asesor@creditoauto.local` en Auth.
- Aplicar migración SQL en proyecto remoto.
