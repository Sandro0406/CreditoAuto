# Fase 0A — Mapeo Frontend ↔ Supabase

Esquema aprobado antes de migraciones SQL. Diseño **frontend-first**.

## Entidades localStorage → tablas

| Frontend key | Tabla Supabase |
|---|---|
| `clientes` | `clients` |
| `solicitudes` | `loans` + `vehicles` |
| `configuracion` | `app_settings` |
| Cronograma (runtime) | `payment_schedule` |
| Indicadores (runtime) | `financial_indicators` |

## Mapeo de campos

| Frontend | Tabla | Columna BD |
|---|---|---|
| — | `users` | `id`, `username`, `role` |
| `id_cliente` | `clients` | `id` (bigserial, expuesto como string) |
| `nombre_cliente` | `clients` | `full_name` |
| `dni_cliente` | `clients` | `document_number` |
| `telefono_cliente` | `clients` | `phone` |
| `direccion_cliente` | `clients` | `address` |
| `fecha_registro` | `clients` | `created_at` |
| `marca_vehiculo` | `vehicles` | `brand` |
| `modelo_vehiculo` | `vehicles` | `model` |
| `precio_vehiculo` | `vehicles` / `loans` | `vehicle_price` / `total_vehicle_price` |
| `moneda` | `vehicles` / `loans` | `currency_type` |
| `cliente_id` | `loans` | `client_id` |
| `cuota_inicial` | `loans` | `initial_payment_amount` |
| `monto_prestamo` | `loans` | `financed_amount` |
| `tasa_interes` | `loans` | `annual_interest_rate` |
| `tipo_tasa` | `loans` | `interest_rate_type` |
| `capitalizacion` | `loans` | `capitalization_period` |
| `frecuencia_pago` | `loans` | `payment_frequency` |
| `plazo_credito` | `loans` | `loan_term_in_months` |
| `periodo_gracia` | `loans` | `number_of_grace_periods` |
| `tipo_gracia` | `loans` | `grace_period_type` |
| `valor_residual` | `loans` | `residual_value_amount` |
| `tasa_descuento` | `loans` | `discount_rate` |
| `fecha_inicio` | `loans` | `start_date` |
| `fecha_solicitud` | `loans` | `created_at` |
| `estado` | `loans` | `status` |
| `id` (SOL-xxx) | `loans` | `external_code` |
| cronograma.* | `payment_schedule` | ver migración SQL |
| indicadores.* | `financial_indicators` | ver migración SQL |
| configuracion.* | `app_settings` | `key` + `value` jsonb |

## Columnas extra vs ERD académico

### payment_schedule
- `grace_type`, `residual_paid`, `debtor_flow`, `present_value`

### financial_indicators
- `tea`, `periodic_rate`, `discount_rate_periodic`, `french_installment`, `residual_value`, `num_periods`, `tir_periodic`, `tir_annual`, `tcea`, `calculation_snapshot`

## Estado: APROBADO
