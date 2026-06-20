import { useEffect, useMemo, useState } from 'react';
import { Calculator, TrendingUp, FileSpreadsheet, AlertCircle, Download } from 'lucide-react';
import Layout from './Layout';
import {
  calcularCreditoVehicular,
  formatMoney,
  formatPercent,
  SolicitudCreditoData,
} from '../lib/financialCalculations';

type Page = 'dashboard' | 'registro' | 'credito' | 'amortizacion' | 'clientes' | 'solicitudes' | 'configuracion';

interface TablaAmortizacionProps {
  onBack: () => void;
  userName: string;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export default function TablaAmortizacion({ userName, currentPage, onNavigate, onLogout }: TablaAmortizacionProps) {
  const [solicitudes, setSolicitudes] = useState<SolicitudCreditoData[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [activeTab, setActiveTab] = useState<'cronograma' | 'indicadores'>('cronograma');

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('solicitudes') || '[]');
    setSolicitudes(saved);
    if (saved.length > 0) setSelectedId(saved[saved.length - 1].id);
  }, []);

  const selectedSolicitud = solicitudes.find((s) => s.id === selectedId);

  const resultado = useMemo(() => {
    if (!selectedSolicitud) return null;
    return calcularCreditoVehicular(selectedSolicitud);
  }, [selectedSolicitud]);

  const currency = selectedSolicitud?.moneda || 'Soles';

  const exportarCSV = () => {
    if (!resultado) return;
    const headers = ['N°', 'Fecha', 'Tipo', 'Saldo Inicial', 'Interés', 'Amortización', 'Cuota', 'Valor Residual', 'Saldo Final', 'Flujo Deudor', 'Valor Actual'];
    const rows = resultado.cronograma.map(r => [
      r.numero_cuota, r.fecha_pago, r.tipo_periodo,
      r.saldo_inicial, r.interes, r.amortizacion, r.cuota,
      r.valor_residual_pagado, r.saldo_final, r.flujo_deudor, r.valor_actual,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cronograma_${selectedId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout
      currentPage={currentPage}
      userName={userName}
      onNavigate={onNavigate}
      onLogout={onLogout}
      pageTitle="Cálculos Financieros"
    >
      <div className="space-y-4">
        <div className="card-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-teal-500" />
                <p className="font-semibold text-slate-800">Cronograma e Indicadores de Transparencia</p>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Método francés vencido ordinario (30 días/mes) · Compra Inteligente · VAN, TIR y TCEA del deudor
              </p>
            </div>

            <div className="w-full lg:w-96">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Solicitud</label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-2xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm"
              >
                {solicitudes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} — {s.marca_vehiculo} {s.modelo_vehiculo} · {s.moneda}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {solicitudes.length === 0 && (
            <div className="py-16 text-center">
              <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No hay solicitudes registradas para calcular.</p>
              <button onClick={() => onNavigate('credito')} className="mt-3 text-violet-600 hover:underline font-semibold text-sm">
                Crear solicitud de crédito
              </button>
            </div>
          )}
        </div>

        {selectedSolicitud && resultado && (
          <>
            {/* KPI summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                ['Monto financiado', formatMoney(resultado.indicadores.monto_prestamo, currency), 'text-teal-700', 'bg-teal-50 border-teal-200'],
                ['Cuota francesa', formatMoney(resultado.indicadores.cuota_francesa, currency), 'text-emerald-700', 'bg-emerald-50 border-emerald-200'],
                ['Valor residual', formatMoney(resultado.indicadores.valor_residual, currency), 'text-violet-700', 'bg-violet-50 border-violet-200'],
                ['VAN deudor', formatMoney(resultado.indicadores.van, currency), resultado.indicadores.van >= 0 ? 'text-indigo-700' : 'text-rose-700', 'bg-indigo-50 border-indigo-200'],
                ['TCEA', formatPercent(resultado.indicadores.tcea), 'text-amber-700', 'bg-amber-50 border-amber-200'],
              ].map(([label, value, textColor, bgBorder]) => (
                <div key={label} className={`border rounded-2xl shadow-sm p-4 lift ${bgBorder}`}>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
                  <p className={`text-xl font-bold mt-1 ${textColor}`}>{value}</p>
                </div>
              ))}
            </div>

            <div className="card-soft overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 px-2">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('cronograma')}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px
                      ${activeTab === 'cronograma' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Cronograma
                    <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{resultado.cronograma.length}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('indicadores')}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px
                      ${activeTab === 'indicadores' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Indicadores de Transparencia
                  </button>
                </div>
                {activeTab === 'cronograma' && (
                  <button
                    onClick={exportarCSV}
                    className="mr-3 flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-600 transition px-3 py-2 border border-slate-200 rounded-2xl hover:border-violet-300 bg-white hover:bg-violet-50 hover:text-violet-600"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Exportar CSV
                  </button>
                )}
              </div>

              {activeTab === 'cronograma' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {[
                          'N°', 'Fecha', 'Tipo',
                          'Saldo Inicial', 'Interés', 'Amortización',
                          'Cuota', 'Val. Residual', 'Saldo Final',
                          'Flujo Deudor', 'Valor Actual',
                        ].map((h) => (
                          <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {resultado.cronograma.map((row) => (
                        <tr key={row.numero_cuota} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2.5 font-mono text-teal-600 text-xs">{row.numero_cuota}</td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs whitespace-nowrap">{row.fecha_pago}</td>
                          <td className="px-3 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              row.tipo_periodo === 'Normal' ? 'bg-green-100 text-green-700' :
                              row.tipo_periodo === 'Gracia Total' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {row.tipo_periodo === 'Normal' ? 'N' : row.tipo_periodo === 'Gracia Total' ? 'GT' : 'GP'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-700 text-xs">{formatMoney(row.saldo_inicial, currency)}</td>
                          <td className="px-3 py-2.5 text-slate-700 text-xs">{formatMoney(row.interes, currency)}</td>
                          <td className="px-3 py-2.5 text-slate-700 text-xs">{formatMoney(row.amortizacion, currency)}</td>
                          <td className="px-3 py-2.5 font-semibold text-slate-800 text-xs">{formatMoney(row.cuota, currency)}</td>
                          <td className="px-3 py-2.5 text-violet-600 text-xs">{row.valor_residual_pagado > 0 ? formatMoney(row.valor_residual_pagado, currency) : '—'}</td>
                          <td className="px-3 py-2.5 text-slate-700 text-xs">{formatMoney(row.saldo_final, currency)}</td>
                          <td className="px-3 py-2.5 text-rose-600 text-xs">{formatMoney(row.flujo_deudor, currency)}</td>
                          <td className="px-3 py-2.5 text-indigo-600 text-xs">{formatMoney(row.valor_actual, currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                      <tr>
                        <td colSpan={3} className="px-3 py-2.5 text-xs font-bold text-slate-700">TOTALES</td>
                        <td className="px-3 py-2.5 text-xs font-semibold text-slate-600">—</td>
                        <td className="px-3 py-2.5 text-xs font-semibold text-slate-800">{formatMoney(resultado.indicadores.total_intereses, currency)}</td>
                        <td className="px-3 py-2.5 text-xs font-semibold text-slate-600">—</td>
                        <td className="px-3 py-2.5 text-xs font-bold text-slate-900">{formatMoney(resultado.indicadores.total_pagado, currency)}</td>
                        <td className="px-3 py-2.5 text-xs font-semibold text-violet-700">{resultado.indicadores.valor_residual > 0 ? formatMoney(resultado.indicadores.valor_residual, currency) : '—'}</td>
                        <td colSpan={3} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {activeTab === 'indicadores' && (
                <div className="p-5 space-y-6">
                  {/* Tasas */}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Tasas de Interés</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        ['TEA (Tasa Efectiva Anual)', formatPercent(resultado.indicadores.tea)],
                        ['Tasa Periódica del Crédito', formatPercent(resultado.indicadores.tasa_periodica, 6)],
                        ['Tasa Descuento Periódica', formatPercent(resultado.indicadores.tasa_descuento_periodica, 6)],
                        ['TIR Periódica (deudor)', formatPercent(resultado.indicadores.tir_periodica)],
                        ['TIR Anual (deudor)', formatPercent(resultado.indicadores.tir_anual)],
                        ['TCEA', formatPercent(resultado.indicadores.tcea)],
                      ].map(([label, value]) => (
                        <div key={label} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                          <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
                          <p className="text-base font-semibold text-slate-800 mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Montos */}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Montos del Crédito</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        ['Monto Financiado', formatMoney(resultado.indicadores.monto_prestamo, currency)],
                        ['Valor Residual / Cuota Balón', resultado.indicadores.valor_residual > 0 ? formatMoney(resultado.indicadores.valor_residual, currency) : '—'],
                        ['N° de Períodos', resultado.indicadores.numero_periodos.toString()],
                        ['Total Intereses', formatMoney(resultado.indicadores.total_intereses, currency)],
                        ['Total Pagado (incluye balón)', formatMoney(resultado.indicadores.total_pagado, currency)],
                        ['Cuota Mensual (francesa)', formatMoney(resultado.indicadores.cuota_francesa, currency)],
                      ].map(([label, value]) => (
                        <div key={label} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                          <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
                          <p className="text-base font-semibold text-slate-800 mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* VAN */}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Valor Actual Neto (VAN)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className={`border rounded-lg p-4 ${resultado.indicadores.van >= 0 ? 'bg-green-50 border-green-200' : 'bg-rose-50 border-rose-200'}`}>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">VAN del Deudor</p>
                        <p className={`text-2xl font-bold mt-1 ${resultado.indicadores.van >= 0 ? 'text-green-700' : 'text-rose-700'}`}>
                          {formatMoney(resultado.indicadores.van, currency)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {resultado.indicadores.van >= 0
                            ? 'El crédito es conveniente para el deudor a la tasa de descuento indicada.'
                            : 'El costo del crédito supera la tasa de descuento del deudor.'}
                        </p>
                      </div>
                      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                        <p className="text-xs text-slate-400 uppercase tracking-wide">TCEA / TIR Anual Deudor</p>
                        <p className="text-2xl font-bold text-amber-700 mt-1">{formatPercent(resultado.indicadores.tcea)}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Costo efectivo anual del crédito desde la perspectiva del deudor. Equivale a la TEA cuando no hay costos adicionales.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Norma transparencia SBS */}
                  <div className="border border-indigo-100 bg-indigo-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-indigo-700 mb-2">Indicadores — Norma de Transparencia SBS (Res. 8181-2012)</p>
                    <ul className="text-xs text-indigo-700 space-y-1 list-disc list-inside">
                      <li>Monto del crédito: {formatMoney(resultado.indicadores.monto_prestamo, currency)}</li>
                      <li>TEA aplicada: {formatPercent(resultado.indicadores.tea)}</li>
                      <li>TCEA (costo total efectivo anual): {formatPercent(resultado.indicadores.tcea)}</li>
                      <li>Número de cuotas: {resultado.indicadores.numero_periodos}</li>
                      <li>Cuota ordinaria (francesa): {formatMoney(resultado.indicadores.cuota_francesa, currency)}</li>
                      {resultado.indicadores.valor_residual > 0 && (
                        <li>Cuota balón (Compra Inteligente): {formatMoney(resultado.indicadores.valor_residual, currency)} — última cuota</li>
                      )}
                      <li>Total intereses y gastos: {formatMoney(resultado.indicadores.total_intereses, currency)}</li>
                      <li>Monto total a pagar: {formatMoney(resultado.indicadores.total_pagado, currency)}</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
