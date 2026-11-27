import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Package,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';
import {
  BASE_JANUARY_SALES_SERIES,
  INITIAL_ORDERS,
  INITIAL_SALES,
  formatKg,
  formatSoles,
} from '../data/seedData';
import type {
  CompanySettings,
  ModuleId,
  Order,
  Product,
  Sale,
} from '../types/erp';

interface DashboardViewProps {
  products: Product[];
  orders: Order[];
  sales: Sale[];
  settings: CompanySettings;
  onNavigate: (module: ModuleId) => void;
}

type DateRangeKey = 'month' | '15d' | '7d';

const CATEGORY_COLORS: Record<string, string> = {
  Frutas: '#22A84D',
  Verduras: '#7BE938',
  Tubérculos: '#F5B727',
  Hortalizas: '#E07A16',
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  orders,
  sales,
  settings,
  onNavigate,
}) => {
  const [dateRange, setDateRange] = useState<DateRangeKey>('month');
  const [hoveredBarIdx, setHoveredBarIdx] = useState<number | null>(null);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);

  // Calculate live deltas added on top of the January baseline so user actions reflect immediately
  const extraSalesTotal = useMemo(() => {
    const initialIds = new Set(INITIAL_SALES.map((s) => s.id));
    return sales
      .filter((s) => s.estado === 'Registrada' && !initialIds.has(s.id))
      .reduce((acc, s) => acc + s.total, 0);
  }, [sales]);

  const extraOrdersCount = useMemo(() => {
    const initialIds = new Set(INITIAL_ORDERS.map((o) => o.id));
    return orders.filter((o) => !initialIds.has(o.id)).length;
  }, [orders]);

  const totalMonthSales = 58420 + extraSalesTotal;
  const totalMonthOrders = 136 + extraOrdersCount;

  const activeProducts = useMemo(
    () => products.filter((p) => p.estado === 'Activo'),
    [products]
  );

  const totalStockKg = useMemo(
    () => activeProducts.reduce((acc, p) => acc + p.stockKg, 0),
    [activeProducts]
  );

  const criticalProducts = useMemo(
    () =>
      activeProducts.filter(
        (p) => p.stockKg <= settings.umbralStockCriticoKg
      ),
    [activeProducts, settings.umbralStockCriticoKg]
  );

  const chartSeries = useMemo(() => {
    const base = BASE_JANUARY_SALES_SERIES.map((pt, idx) =>
      idx === BASE_JANUARY_SALES_SERIES.length - 1
        ? {
            ...pt,
            amount: pt.amount + extraSalesTotal,
            ordersCount: pt.ordersCount + extraOrdersCount,
          }
        : pt
    );
    if (dateRange === '7d') return base.slice(-5);
    if (dateRange === '15d') return base.slice(-8);
    return base;
  }, [dateRange, extraSalesTotal, extraOrdersCount]);

  const rangeSalesTotal = useMemo(() => {
    if (dateRange === 'month') return totalMonthSales;
    return chartSeries.reduce((acc, p) => acc + p.amount, 0);
  }, [dateRange, totalMonthSales, chartSeries]);

  const rangeOrdersCount = useMemo(() => {
    if (dateRange === 'month') return totalMonthOrders;
    return chartSeries.reduce((acc, p) => acc + p.ordersCount, 0);
  }, [dateRange, totalMonthOrders, chartSeries]);

  // Category distribution for Donut Chart
  const categoryBreakdown = useMemo(() => {
    const baseDistribution = [
      { name: 'Frutas', pct: 42, color: CATEGORY_COLORS.Frutas },
      { name: 'Verduras', pct: 33, color: CATEGORY_COLORS.Verduras },
      { name: 'Tubérculos', pct: 15, color: CATEGORY_COLORS.Tubérculos },
      { name: 'Hortalizas', pct: 10, color: CATEGORY_COLORS.Hortalizas },
    ];
    return baseDistribution.map((item) => ({
      ...item,
      amount: Math.round((rangeSalesTotal * item.pct) / 100),
    }));
  }, [rangeSalesTotal]);

  const maxBarAmount = Math.max(...chartSeries.map((d) => d.amount), 8000);
  const yAxisMax = Math.ceil(maxBarAmount / 1000) * 1000;

  // Build SVG trendline curve coordinates above the bars
  const trendPoints = useMemo(() => {
    const count = chartSeries.length;
    return chartSeries.map((pt, i) => {
      const x = ((i + 0.5) / count) * 560;
      const barTopY = 200 - (pt.amount / yAxisMax) * 170;
      const y = Math.max(18, barTopY - 14);
      return { x, y };
    });
  }, [chartSeries, yAxisMax]);

  const trendPathD = useMemo(() => {
    if (trendPoints.length < 2) return '';
    let d = `M ${trendPoints[0].x} ${trendPoints[0].y}`;
    for (let i = 1; i < trendPoints.length; i++) {
      const prev = trendPoints[i - 1];
      const curr = trendPoints[i];
      const cx = (prev.x + curr.x) / 2;
      d += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  }, [trendPoints]);

  // Donut arc math
  const donutCircumference = 2 * Math.PI * 66;
  let cumulativeOffset = 0;

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#12261B]">
            Dashboard Ejecutivo
          </h1>
          <p className="text-sm text-[#587162] mt-0.5">
            Resumen general de operaciones
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#DCE8E0] px-3.5 py-2 shadow-xs">
            <Calendar className="w-4 h-4 text-[#1E7A3E] shrink-0" />
            <select
              aria-label="Seleccionar rango de fechas"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRangeKey)}
              className="bg-transparent text-xs font-semibold text-[#17281E] focus:outline-none cursor-pointer"
            >
              <option value="month">Ene 01, 2026 – Ene 31, 2026</option>
              <option value="15d">Ene 13, 2026 – Ene 31, 2026</option>
              <option value="7d">Ene 22, 2026 – Ene 31, 2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Ventas */}
        <div className="rounded-2xl bg-white border border-[#E2ECE5] p-5 shadow-[0_2px_10px_rgba(14,54,32,0.03)]">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF8EE] text-[#1E9D44]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#1D8E3F] font-mono-num">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +12.5%
            </span>
          </div>
          <div className="mt-4">
            <div className="font-mono-num text-2xl font-bold tracking-tight text-[#12261B]">
              {formatSoles(rangeSalesTotal)}
            </div>
            <div className="text-xs font-medium text-[#5B7264] mt-1">
              Ventas del periodo
            </div>
          </div>
        </div>

        {/* KPI 2: Pedidos */}
        <button
          type="button"
          onClick={() => onNavigate('pedidos')}
          className="text-left rounded-2xl bg-white border border-[#E2ECE5] p-5 shadow-[0_2px_10px_rgba(14,54,32,0.03)] hover:border-[#9AD8AC] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEF6E6] text-[#D97706]">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#1D8E3F] font-mono-num">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +8.8%
            </span>
          </div>
          <div className="mt-4">
            <div className="font-mono-num text-2xl font-bold tracking-tight text-[#12261B]">
              {rangeOrdersCount}
            </div>
            <div className="text-xs font-medium text-[#5B7264] mt-1">
              Pedidos registrados
            </div>
          </div>
        </button>

        {/* KPI 3: Productos Activos */}
        <button
          type="button"
          onClick={() => onNavigate('productos')}
          className="text-left rounded-2xl bg-white border border-[#E2ECE5] p-5 shadow-[0_2px_10px_rgba(14,54,32,0.03)] hover:border-[#9AD8AC] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EBF5FE] text-[#0284C7]">
              <Package className="w-5 h-5" />
            </div>
            <span className="font-mono-num text-xs font-medium text-[#587162]">
              {formatKg(totalStockKg)}
            </span>
          </div>
          <div className="mt-4">
            <div className="font-mono-num text-2xl font-bold tracking-tight text-[#12261B]">
              {activeProducts.length}
            </div>
            <div className="text-xs font-medium text-[#5B7264] mt-1">
              Productos activos en catálogo
            </div>
          </div>
        </button>

        {/* KPI 4: Stock Crítico */}
        <button
          type="button"
          onClick={() => onNavigate('inventario')}
          className="text-left rounded-2xl bg-white border border-[#E2ECE5] p-5 shadow-[0_2px_10px_rgba(14,54,32,0.03)] hover:border-[#ECA9A9] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEECEC] text-[#DC2626]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="font-mono-num text-xs font-semibold text-[#DC2626]">
              ≤ {settings.umbralStockCriticoKg} kg
            </span>
          </div>
          <div className="mt-4">
            <div className="font-mono-num text-2xl font-bold tracking-tight text-[#12261B]">
              {criticalProducts.length}
            </div>
            <div className="text-xs font-medium text-[#5B7264] mt-1">
              Productos con stock crítico
            </div>
          </div>
        </button>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Evolución de ventas */}
        <div className="lg:col-span-7 rounded-2xl bg-white border border-[#E2ECE5] p-6 shadow-[0_2px_10px_rgba(14,54,32,0.03)]">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="font-display text-base font-bold text-[#12261B]">
                Evolución de ventas
              </h2>
              <p className="text-xs text-[#5B7264] mt-0.5">
                Ingresos diarios acumulados en soles (S/)
              </p>
            </div>
            {hoveredBarIdx !== null && chartSeries[hoveredBarIdx] && (
              <div className="text-right">
                <div className="font-mono-num text-sm font-bold text-[#157A39]">
                  {formatSoles(chartSeries[hoveredBarIdx].amount)}
                </div>
                <div className="text-[11px] text-[#5B7264] font-mono-num">
                  {chartSeries[hoveredBarIdx].dayLabel} · {chartSeries[hoveredBarIdx].ordersCount} pedidos
                </div>
              </div>
            )}
          </div>

          <div className="relative flex items-end gap-3">
            {/* Y Axis */}
            <div className="flex flex-col justify-between h-[210px] pb-7 text-[11px] font-mono-num text-[#748B7D] select-none shrink-0">
              <span>{(yAxisMax / 1000).toFixed(0)}K</span>
              <span>{((yAxisMax * 0.66) / 1000).toFixed(1)}K</span>
              <span>{((yAxisMax * 0.33) / 1000).toFixed(1)}K</span>
              <span>0</span>
            </div>

            {/* SVG Bar + Trend Curve */}
            <div className="flex-1 min-w-0">
              <svg
                viewBox="0 0 560 225"
                className="w-full h-[225px] overflow-visible"
                role="img"
                aria-label="Gráfico de evolución de ventas diarias"
              >
                <defs>
                  <linearGradient id="salesBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#85F040" />
                    <stop offset="100%" stopColor="#1B8F41" />
                  </linearGradient>
                  <linearGradient id="salesBarHoverGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9CF95A" />
                    <stop offset="100%" stopColor="#21A94D" />
                  </linearGradient>
                  <marker
                    id="trendArrow"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="4"
                    orient="auto"
                  >
                    <path d="M0,1 L7,4 L0,7 Z" fill="#22A84D" />
                  </marker>
                </defs>

                {/* Horizontal Gridlines */}
                {[30, 86, 143, 200].map((yPos) => (
                  <line
                    key={yPos}
                    x1="0"
                    y1={yPos}
                    x2="560"
                    y2={yPos}
                    stroke="#EBF2ED"
                    strokeWidth="1"
                  />
                ))}

                {/* Bars */}
                {chartSeries.map((pt, idx) => {
                  const slotW = 560 / chartSeries.length;
                  const barW = Math.min(26, slotW * 0.58);
                  const x = idx * slotW + (slotW - barW) / 2;
                  const barH = Math.max(8, (pt.amount / yAxisMax) * 170);
                  const y = 200 - barH;
                  const isHovered = hoveredBarIdx === idx;

                  return (
                    <g
                      key={pt.dateISO}
                      onMouseEnter={() => setHoveredBarIdx(idx)}
                      onMouseLeave={() => setHoveredBarIdx(null)}
                      className="cursor-pointer"
                    >
                      <rect
                        x={x}
                        y={y}
                        width={barW}
                        height={barH}
                        rx="5"
                        fill={
                          isHovered
                            ? 'url(#salesBarHoverGrad)'
                            : 'url(#salesBarGrad)'
                        }
                        opacity={
                          hoveredBarIdx === null || isHovered ? 1 : 0.65
                        }
                      />
                      {/* Show every 2nd label cleanly on desktop */}
                      {(idx % 2 === 0 || idx === chartSeries.length - 1 || chartSeries.length <= 8) && (
                        <text
                          x={x + barW / 2}
                          y="218"
                          textAnchor="middle"
                          fontSize="10.5"
                          fill="#637B6D"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {pt.dayLabel}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Smooth Upward Trendline */}
                {trendPathD && (
                  <path
                    d={trendPathD}
                    fill="none"
                    stroke="#22A84D"
                    strokeWidth="2.75"
                    strokeLinecap="round"
                    markerEnd="url(#trendArrow)"
                    className="pointer-events-none"
                  />
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* Right: Ventas por categoría (Donut) */}
        <div className="lg:col-span-5 rounded-2xl bg-white border border-[#E2ECE5] p-6 shadow-[0_2px_10px_rgba(14,54,32,0.03)] flex flex-col justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-[#12261B]">
              Ventas por categoría
            </h2>
            <p className="text-xs text-[#5B7264] mt-0.5">
              Participación por familia de producto
            </p>
          </div>

          <div className="my-4 flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="relative w-[176px] h-[176px] shrink-0">
              <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
                {categoryBreakdown.map((seg) => {
                  const dashLen = (seg.pct / 100) * donutCircumference;
                  const dashArray = `${Math.max(0, dashLen - 3)} ${donutCircumference}`;
                  const dashOffset = -cumulativeOffset;
                  cumulativeOffset += dashLen;
                  const isHighlighted =
                    hoveredCat === null || hoveredCat === seg.name;

                  return (
                    <circle
                      key={seg.name}
                      cx="90"
                      cy="90"
                      r="66"
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={hoveredCat === seg.name ? 26 : 22}
                      strokeDasharray={dashArray}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="butt"
                      opacity={isHighlighted ? 1 : 0.35}
                      className="transition-all duration-150 cursor-pointer"
                      onMouseEnter={() => setHoveredCat(seg.name)}
                      onMouseLeave={() => setHoveredCat(null)}
                    />
                  );
                })}
              </svg>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <span className="font-mono-num text-base font-bold text-[#12261B]">
                  {formatSoles(rangeSalesTotal).replace('.00', '')}
                </span>
                <span className="text-[11px] font-medium text-[#5B7264] mt-0.5">
                  Total
                </span>
              </div>
            </div>

            <div className="w-full space-y-2.5">
              {categoryBreakdown.map((seg) => (
                <div
                  key={seg.name}
                  onMouseEnter={() => setHoveredCat(seg.name)}
                  onMouseLeave={() => setHoveredCat(null)}
                  className={`flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-sm transition-colors cursor-pointer ${
                    hoveredCat === seg.name ? 'bg-[#F2F7F3]' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="font-medium text-[#1F3528]">{seg.name}</span>
                  </div>
                  <div className="font-mono-num text-xs font-bold text-[#12261B]">
                    {seg.pct}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Operational Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Recent Orders */}
        <div className="lg:col-span-7 rounded-2xl bg-white border border-[#E2ECE5] p-5 shadow-[0_2px_10px_rgba(14,54,32,0.03)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-bold text-[#12261B]">
              Pedidos recientes
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('pedidos')}
              className="text-xs font-semibold text-[#1E7A3E] hover:underline cursor-pointer"
            >
              Ver todos
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#EBF2ED] text-xs text-[#61786A]">
                  <th className="pb-2.5 font-semibold">Pedido</th>
                  <th className="pb-2.5 font-semibold">Cliente</th>
                  <th className="pb-2.5 font-semibold">Estado</th>
                  <th className="pb-2.5 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F6F3]">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-[#F8FBF9]">
                    <td className="py-3 font-mono-num text-xs font-semibold text-[#12261B] whitespace-nowrap">
                      {order.numeroPedido}
                    </td>
                    <td className="py-3 text-[#263B2E] max-w-[200px] truncate">
                      {order.clienteNombre}
                    </td>
                    <td className="py-3 text-xs font-medium text-[#1E7A3E] whitespace-nowrap">
                      {order.estado}
                    </td>
                    <td className="py-3 font-mono-num text-xs font-bold text-[#12261B] text-right whitespace-nowrap">
                      {formatSoles(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Critical Stock Alerts */}
        <div className="lg:col-span-5 rounded-2xl bg-white border border-[#E2ECE5] p-5 shadow-[0_2px_10px_rgba(14,54,32,0.03)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-bold text-[#12261B]">
              Alertas de reposición
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('inventario')}
              className="text-xs font-semibold text-[#1E7A3E] hover:underline cursor-pointer"
            >
              Gestionar stock
            </button>
          </div>

          {criticalProducts.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#5B7264]">
              Todo el catálogo se encuentra sobre el umbral mínimo de{' '}
              <span className="font-mono-num font-semibold">
                {formatKg(settings.umbralStockCriticoKg)}
              </span>
              .
            </div>
          ) : (
            <div className="divide-y divide-[#F2F6F3]">
              {criticalProducts.slice(0, 5).map((prod) => (
                <div
                  key={prod.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={prod.imagenUrl}
                      alt={prod.nombre}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-lg object-contain bg-[#FAFDFB] border border-[#E8F0EA] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#12261B] truncate">
                        {prod.nombre}
                      </div>
                      <div className="text-xs text-[#61786A]">
                        {prod.categoriaNombre} · {prod.origen}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono-num text-xs font-bold text-[#C82333]">
                      {formatKg(prod.stockKg)}
                    </div>
                    <div className="text-[11px] text-[#748B7D]">Crítico</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
