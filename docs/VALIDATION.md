# Fase 0C — Validación de fórmulas

**Fuente de verdad:** Blackboard / Prof. Senmache → MD §6C/§6D → `financialCalculations.ts`

**Decisión arquitectura:** fórmulas en TypeScript; Postgres solo persistencia.

**Precisión monetaria:** montos en BD como `BIGINT` en unidades ×10 000 (4 decimales; S/ 1.0000 = 10000). Cálculos redondean con `roundMoney()` en cada línea del cronograma.

## Discrepancia crítica — monto préstamo

| Fuente | Fórmula | Caso base (80k, CI 16k, VR 20k) |
|---|---|---|
| MD §6D / curso | precio − cuota_inicial | 64,000 |
| MD §7 L699 | precio − CI − VR | 44,000 (error) |
| Frontend | precio − CI; VR al final | 64,000 |

## Caso 1 §6D (validado)

- Entrada: 80,000 / CI 16,000 / 36 meses / TEA 10% / VR 20,000 / desc 12%
- Monto: 64,000
- Cuota francesa: 1,570.35
- Total intereses: 12,532.66
- Total pagado: 76,532.66
- VAN: 2,065.35
- TCEA: 10.00%

## Caso 2 §6D (gracia parcial)

- Entrada: 25,000 / CI 3,750 / 24 meses / TNA 12% cap mensual / gracia parcial 3 / VR 8,000
- Monto: 21,250
- TEM: 1.00%
- P1–P3: cuota = interés, amortización = 0

## Regresión

Ejecutar: `npm run validate-formulas`
