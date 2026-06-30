# Fase 0B — Flujo de negocio §7 ↔ UI

## Flujo reconstruido (pseudocódigo §7)

1. Login → Dashboard
2. Registro cliente (opcional previo)
3. Nueva solicitud: vehículo + crédito + gracia
4. Cálculo preview monto = precio − cuota_inicial
5. Tabla amortización: cronograma + VAN/TIR/TCEA
6. Persistencia en Supabase

## Correspondencia pantallas

| Paso | Componente | Supabase |
|---|---|---|
| Login | `Login.tsx` | Auth `signInWithPassword` |
| Dashboard | `Dashboard.tsx` | stats desde API |
| Clientes | `RegistroCliente`, `ListaClientes` | `clients` |
| Solicitud | `SolicitudCredito` | `vehicles` + `loans` |
| Amortización | `TablaAmortizacion` | `payment_schedule` + `financial_indicators` |
| Config | `Configuracion` | `app_settings` |

## Secuencia post-integración

```
Login → signIn → Dashboard
Clientes → insert/select clients
Solicitud → insert vehicle + loan
Amortización → calcularCreditoVehicular (TS) → upsert schedule + indicators
```

## Nota §7 L699

El pseudocódigo resta VR del préstamo; **incorrecto**. Fuente de verdad: curso + §6D + frontend (`precio − cuota_inicial`).
