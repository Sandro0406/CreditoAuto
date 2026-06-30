# Fase 0D — Paridad Curso ↔ MD ↔ Frontend

Curso: **1ASI0642-2610-7069** — Finanzas e Ingeniería Económica (Prof. Martín Senmache)

## Matriz triple

| Regla | Curso | MD §6C/§6D | Frontend | Veredicto |
|---|---|---|---|---|
| Préstamo | Precio − CI | §6D: 64k | `calcularMontoPrestamo` | Alineados |
| Restar VR del capital | No | §7 error | No | Curso + FE correctos |
| TNA → TEA | (1+in/m)^m−1 | Igual | `convertirATasaEfectivaAnual` | Alineados |
| TEA → TEP | (1+TEA)^(d/360)−1 | Igual | 30/360 mensual | Alineados |
| Cuota francesa | R = C·i(1+i)^n/... | Igual | `calcularCuotaFrancesa` | Alineados |
| Gracia total | SF=SI+I | Igual | capitaliza | Alineados |
| Gracia parcial | R=I | Igual | cuota=interés | Alineados |
| VAN | Σ Ft/(1+COK)^t | Igual | flujos deudor | Alineados |
| TIR | VAN=0 | Newton §7 | bisección | Alineados |
| TCEA | (1+TIR)^(360/f)−1 | Igual | `tirAnual` | Alineados |
| Compra Inteligente | No en slides | §6D VR final | balón última cuota | Extensión SBS |

## Materiales de referencia

Copiar PDFs del curso a `docs/course-materials/`:
- Unidad 1: Tasas Nominal y Efectiva
- Unidad 3: Planes de Pago, VAN/TIR
- Avance clase 7069 v3 + Excel modelo

## Conclusión

MD §6C y frontend coinciden con el curso. Corregir/anotar §7 L699 en informe TF.
