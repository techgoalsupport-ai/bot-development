import React, { useMemo, useState } from 'react';
import { BarChart3, LineChart as LineChartIcon, Award, Layers } from 'lucide-react';
import { PremiumProduct, TransactionItem } from '../../types/dashboard.types';

interface SalesAnalyticsSectionProps {
  transactions: TransactionItem[];
  productsList: PremiumProduct[];
  resolveXavieraCategory: (trx: TransactionItem) => string;
}

type ChartRangeDays = 7 | 30;
type ChartDisplayMode = 'bar' | 'line';

const CHART_MODE_STORAGE_KEY = 'wanzt_sales_chart_mode';

interface DailyBucket {
  key: string;
  shortLabel: string;
  fullLabel: string;
  revenue: number;
  profit: number;
  count: number;
}

function formatRupiah(val: number): string {
  if (!Number.isFinite(val)) return 'Rp 0';
  return `Rp ${Math.round(val).toLocaleString('id-ID')}`;
}

function formatCompactRupiah(val: number): string {
  if (!Number.isFinite(val) || val <= 0) return 'Rp 0';
  if (val >= 1_000_000) {
    const jt = val / 1_000_000;
    return `Rp ${Number.isInteger(jt) ? jt : jt.toFixed(1).replace('.', ',')}jt`;
  }
  if (val >= 1_000) {
    const rb = Math.round(val / 1_000);
    return `Rp ${rb}rb`;
  }
  return `Rp ${Math.round(val)}`;
}

function getLocalDateKey(dateObj: Date): string {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const SalesAnalyticsSection: React.FC<SalesAnalyticsSectionProps> = ({
  transactions,
  productsList,
  resolveXavieraCategory,
}) => {
  const [rangeDays, setRangeDays] = useState<ChartRangeDays>(7);
  const [chartMode, setChartMode] = useState<ChartDisplayMode>(() => {
    try {
      const saved = window.localStorage.getItem(CHART_MODE_STORAGE_KEY);
      if (saved === 'bar' || saved === 'line') return saved;
    } catch {}
    return 'bar';
  });
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const handleChangeChartMode = (mode: ChartDisplayMode) => {
    setChartMode(mode);
    setHoveredIdx(null);
    try {
      window.localStorage.setItem(CHART_MODE_STORAGE_KEY, mode);
    } catch {}
  };

  const paidTransactions = useMemo(
    () => transactions.filter((t) => t.status === 'paid'),
    [transactions]
  );

  // 1. Data Grafik Penjualan (7 hari / 30 hari)
  const chartData = useMemo<DailyBucket[]>(() => {
    const now = new Date();
    const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const buckets: DailyBucket[] = [];
    const bucketMap = new Map<string, DailyBucket>();

    const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    for (let offset = rangeDays - 1; offset >= 0; offset--) {
      const d = new Date(startDay);
      d.setDate(startDay.getDate() - offset);
      const key = getLocalDateKey(d);
      const bucket: DailyBucket = {
        key,
        shortLabel: `${d.getDate()} ${monthShort[d.getMonth()]}`,
        fullLabel: `${d.getDate()} ${monthShort[d.getMonth()]} ${d.getFullYear()}`,
        revenue: 0,
        profit: 0,
        count: 0,
      };
      buckets.push(bucket);
      bucketMap.set(key, bucket);
    }

    for (const trx of paidTransactions) {
      const ts = trx.updatedAt || trx.createdAt;
      if (!ts) continue;
      const d = new Date(ts);
      if (Number.isNaN(d.getTime())) continue;
      const target = bucketMap.get(getLocalDateKey(d));
      if (!target) continue;

      const rev = Number(trx.nominal) > 0 ? Number(trx.nominal) : Number(trx.total || 0);
      const prof = Math.max(0, Number(trx.profit || 0));
      target.revenue += rev;
      target.profit += prof;
      target.count += 1;
    }

    return buckets;
  }, [paidTransactions, rangeDays]);

  const chartPeriodTotals = useMemo(() => {
    return chartData.reduce(
      (acc, d) => {
        acc.revenue += d.revenue;
        acc.profit += d.profit;
        acc.count += d.count;
        return acc;
      },
      { revenue: 0, profit: 0, count: 0 }
    );
  }, [chartData]);

  const maxChartVal = useMemo(() => {
    const peak = chartData.reduce((m, item) => Math.max(m, item.revenue, item.profit), 0);
    if (peak <= 0) return 100000;
    // Bulatkan ke atas agar grid garis rapi
    const magnitude = Math.pow(10, Math.floor(Math.log10(peak)));
    const normalized = peak / magnitude;
    const step = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return step * magnitude;
  }, [chartData]);

  // 2. Daftar Produk Terlaris (Top 5 transaksi Lunas)
  const topProducts = useMemo(() => {
    const map = new Map<
      string,
      { name: string; count: number; revenue: number; profit: number }
    >();

    for (const trx of paidTransactions) {
      const name = (trx.productName || '').trim();
      if (!name) continue;
      const existing = map.get(name) || { name, count: 0, revenue: 0, profit: 0 };
      const rev = Number(trx.nominal) > 0 ? Number(trx.nominal) : Number(trx.total || 0);
      const prof = Math.max(0, Number(trx.profit || 0));
      existing.count += 1;
      existing.revenue += rev;
      existing.profit += prof;
      map.set(name, existing);
    }

    return Array.from(map.values())
      .sort((a, b) => b.count - a.count || b.revenue - a.revenue)
      .slice(0, 5);
  }, [paidTransactions]);

  // 3. Kategori Terlaris (Wajib berasal dari kategori Aplikasi Premium Xaviera)
  const premiumCategoriesSet = useMemo(() => {
    const set = new Set<string>();
    for (const p of productsList) {
      const cat = (p.category || '').trim();
      if (cat && cat !== 'Premium Apps') {
        set.add(cat.toLowerCase());
      }
    }
    return set;
  }, [productsList]);

  const topCategories = useMemo(() => {
    const map = new Map<
      string,
      { category: string; count: number; revenue: number; profit: number }
    >();

    for (const trx of paidTransactions) {
      const cat = resolveXavieraCategory(trx);
      if (!cat) continue;
      // Jika katalog Aplikasi Premium Xaviera sudah termuat dan transaksi punya kategori non-aplikasi-premium (seperti SMM/Game Topup/E-Wallet/Pulsa), abaikan
      if (premiumCategoriesSet.size > 0 && !premiumCategoriesSet.has(cat.toLowerCase())) {
        // Izinkan jika memang produk tersebut tidak ada di katalog non-aplikasi-premium hanya bila berasal dari produk aplikasi premium
        const matchesPremiumProduct = productsList.some(
          (p) => (p.name || '').trim().toLowerCase() === (trx.productName || '').trim().toLowerCase()
        );
        if (!matchesPremiumProduct) continue;
      }

      const key = cat.toLowerCase();
      const existing = map.get(key) || { category: cat, count: 0, revenue: 0, profit: 0 };
      const rev = Number(trx.nominal) > 0 ? Number(trx.nominal) : Number(trx.total || 0);
      const prof = Math.max(0, Number(trx.profit || 0));
      existing.count += 1;
      existing.revenue += rev;
      existing.profit += prof;
      map.set(key, existing);
    }

    return Array.from(map.values())
      .sort((a, b) => b.count - a.count || b.revenue - a.revenue)
      .slice(0, 5);
  }, [paidTransactions, resolveXavieraCategory, premiumCategoriesSet, productsList]);

  // Dimensi SVG Grafik
  const svgWidth = 760;
  const svgHeight = 230;
  const padLeft = 64;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 30;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;
  const colSlotW = plotW / chartData.length;
  const barGroupW = Math.min(28, Math.max(8, colSlotW * 0.66));
  const singleBarW = Math.max(3, (barGroupW - 2) / 2);

  const activeItem = hoveredIdx !== null ? chartData[hoveredIdx] : null;
  const hasAnySalesInPeriod = chartPeriodTotals.count > 0;

  const linePoints = useMemo(() => {
    const revPts: Array<{ x: number; y: number }> = [];
    const profPts: Array<{ x: number; y: number }> = [];

    chartData.forEach((item, idx) => {
      const centerX = padLeft + idx * colSlotW + colSlotW / 2;
      const revY = padTop + plotH - (item.revenue / maxChartVal) * plotH;
      const profY = padTop + plotH - (item.profit / maxChartVal) * plotH;
      revPts.push({ x: centerX, y: revY });
      profPts.push({ x: centerX, y: profY });
    });

    return {
      revPointsStr: revPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
      profPointsStr: profPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
      revPts,
      profPts,
    };
  }, [chartData, colSlotW, maxChartVal, padLeft, padTop, plotH]);

  return (
    <div className="space-y-5">
      {/* 1. Grafik Penjualan (Mode Batang / Garis + 7 Hari / 30 Hari) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              {chartMode === 'line' ? (
                <LineChartIcon className="w-4 h-4 text-[#0084D1]" />
              ) : (
                <BarChart3 className="w-4 h-4 text-[#0084D1]" />
              )}
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Grafik Penjualan
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#0084D1] inline-block" />
                <span>Omzet:</span>
                <strong className="font-mono tabular-nums text-slate-800">
                  {formatRupiah(chartPeriodTotals.revenue)}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                <span>Keuntungan:</span>
                <strong className="font-mono tabular-nums text-emerald-700">
                  {formatRupiah(chartPeriodTotals.profit)}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-600">
                {chartPeriodTotals.count} transaksi lunas
              </span>
            </div>
          </div>

          {/* Kontrol Mode Grafik (Batang / Garis) + Rentang Waktu (7 Hari / 30 Hari) */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0">
            {/* Switch Mode Grafik */}
            <div
              className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1"
              role="group"
              aria-label="Mode tampilan grafik"
            >
              <button
                type="button"
                onClick={() => handleChangeChartMode('bar')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                  chartMode === 'bar'
                    ? 'bg-white text-slate-900 font-semibold border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent'
                }`}
                title="Mode Grafik Batang"
              >
                <BarChart3 className="w-3.5 h-3.5 text-[#0084D1]" />
                <span>Batang</span>
              </button>
              <button
                type="button"
                onClick={() => handleChangeChartMode('line')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                  chartMode === 'line'
                    ? 'bg-white text-slate-900 font-semibold border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent'
                }`}
                title="Mode Grafik Garis"
              >
                <LineChartIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Garis</span>
              </button>
            </div>

            {/* Pilihan Rentang Waktu */}
            <div
              className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1"
              role="group"
              aria-label="Rentang waktu grafik"
            >
              {([7, 30] as const).map((days) => {
                const isActive = rangeDays === days;
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => {
                      setRangeDays(days);
                      setHoveredIdx(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-[#0084D1] text-white font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                    }`}
                  >
                    {days} Hari
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Area Tooltip Ringkas Saat Hover/Tap */}
        <div className="mt-3 min-h-[28px] flex items-center justify-between text-xs">
          {activeItem ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1">
              <span className="font-semibold text-slate-900">{activeItem.fullLabel}</span>
              <span aria-hidden="true">·</span>
              <span>
                Omzet:{' '}
                <strong className="font-mono tabular-nums text-[#0084D1]">
                  {formatRupiah(activeItem.revenue)}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Untung:{' '}
                <strong className="font-mono tabular-nums text-emerald-600">
                  {formatRupiah(activeItem.profit)}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-500">
                {activeItem.count} transaksi
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400">
              {chartMode === 'line'
                ? 'Arahkan kursor atau ketuk kolom grafik garis untuk melihat detail harian.'
                : 'Arahkan kursor atau ketuk batang grafik untuk melihat detail harian.'}
            </span>
          )}
        </div>

        {/* Grafik SVG Responsif (Mode Batang & Mode Garis) */}
        <div className="relative mt-2 w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full min-w-[540px] h-56 select-none"
            role="img"
            aria-label={`Grafik penjualan mode ${chartMode === 'line' ? 'garis' : 'batang'} ${rangeDays} hari terakhir`}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {/* Mode Garis: Background Pita Kolom Vertikal Selang-seling seperti Referensi */}
            {chartMode === 'line' &&
              chartData.map((item, idx) => {
                const slotX = padLeft + idx * colSlotW;
                const isHovered = hoveredIdx === idx;
                return (
                  <g key={`band-${item.key}`}>
                    <rect
                      x={slotX}
                      y={padTop}
                      width={colSlotW}
                      height={plotH}
                      fill={
                        isHovered
                          ? '#E0F2FE'
                          : idx % 2 === 0
                          ? '#F8FAFC'
                          : '#EDF2F7'
                      }
                    />
                    {idx > 0 && (
                      <line
                        x1={slotX}
                        y1={padTop}
                        x2={slotX}
                        y2={padTop + plotH}
                        stroke="#FFFFFF"
                        strokeWidth={1.5}
                      />
                    )}
                  </g>
                );
              })}

            {/* Grid Y & Label Nominal */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = padTop + plotH - ratio * plotH;
              const val = Math.round(maxChartVal * ratio);
              return (
                <g key={idx}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={svgWidth - padRight}
                    y2={y}
                    stroke={
                      ratio === 0
                        ? '#CBD5E1'
                        : chartMode === 'line'
                        ? 'rgba(255,255,255,0.65)'
                        : '#F1F5F9'
                    }
                    strokeWidth={1}
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    className="fill-slate-400 text-[10px] font-mono"
                  >
                    {formatCompactRupiah(val)}
                  </text>
                </g>
              );
            })}

            {/* Mode Batang */}
            {chartMode === 'bar' &&
              chartData.map((item, idx) => {
                const slotX = padLeft + idx * colSlotW;
                const centerX = slotX + colSlotW / 2;
                const groupStartX = centerX - barGroupW / 2;
                const revH = Math.max(
                  item.revenue > 0 ? 3 : 0,
                  (item.revenue / maxChartVal) * plotH
                );
                const profH = Math.max(
                  item.profit > 0 ? 3 : 0,
                  (item.profit / maxChartVal) * plotH
                );

                const revY = padTop + plotH - revH;
                const profY = padTop + plotH - profH;
                const isHovered = hoveredIdx === idx;

                return (
                  <g key={`bar-${item.key}`}>
                    <rect
                      x={slotX}
                      y={padTop}
                      width={colSlotW}
                      height={plotH}
                      fill={isHovered ? '#F8FAFC' : 'transparent'}
                      rx={4}
                    />
                    <rect
                      x={groupStartX}
                      y={revY}
                      width={singleBarW}
                      height={revH}
                      rx={Math.min(3, singleBarW / 2)}
                      fill={isHovered ? '#0369A1' : '#0084D1'}
                      opacity={item.revenue > 0 ? 1 : 0}
                    />
                    <rect
                      x={groupStartX + singleBarW + 2}
                      y={profY}
                      width={singleBarW}
                      height={profH}
                      rx={Math.min(3, singleBarW / 2)}
                      fill={isHovered ? '#059669' : '#10B981'}
                      opacity={item.profit > 0 ? 1 : 0}
                    />
                  </g>
                );
              })}

            {/* Mode Garis: Polyline Omzet & Keuntungan */}
            {chartMode === 'line' && (
              <g>
                {hoveredIdx !== null && (
                  <line
                    x1={padLeft + hoveredIdx * colSlotW + colSlotW / 2}
                    y1={padTop}
                    x2={padLeft + hoveredIdx * colSlotW + colSlotW / 2}
                    y2={padTop + plotH}
                    stroke="#94A3B8"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                )}

                <polyline
                  fill="none"
                  stroke="#0084D1"
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={linePoints.revPointsStr}
                />

                <polyline
                  fill="none"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={linePoints.profPointsStr}
                />

                {/* Titik Aktif Saat Hover/Tap (atau titik kecil pada mode 7 hari) */}
                {chartData.map((item, idx) => {
                  const isHovered = hoveredIdx === idx;
                  const showStaticDot = rangeDays === 7 && (item.revenue > 0 || item.profit > 0);
                  if (!isHovered && !showStaticDot) return null;
                  const revPt = linePoints.revPts[idx];
                  const profPt = linePoints.profPts[idx];
                  return (
                    <g key={`pts-${item.key}`} className="pointer-events-none">
                      <circle
                        cx={revPt.x}
                        cy={revPt.y}
                        r={isHovered ? 4.5 : 3}
                        fill="#FFFFFF"
                        stroke="#0084D1"
                        strokeWidth={2}
                      />
                      <circle
                        cx={profPt.x}
                        cy={profPt.y}
                        r={isHovered ? 4.5 : 3}
                        fill="#FFFFFF"
                        stroke="#10B981"
                        strokeWidth={2}
                      />
                    </g>
                  );
                })}
              </g>
            )}

            {/* Interaksi Hover/Tap Kolom + Label Tanggal Sumbu X */}
            {chartData.map((item, idx) => {
              const slotX = padLeft + idx * colSlotW;
              const centerX = slotX + colSlotW / 2;
              const showXLabel =
                rangeDays === 7 || idx === 0 || idx === chartData.length - 1 || idx % 5 === 0;
              const isHovered = hoveredIdx === idx;

              return (
                <g
                  key={`hit-${item.key}`}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onClick={() => setHoveredIdx(idx)}
                  className="cursor-pointer"
                >
                  <rect
                    x={slotX}
                    y={padTop}
                    width={colSlotW}
                    height={plotH}
                    fill="transparent"
                  />
                  {showXLabel && (
                    <text
                      x={centerX}
                      y={svgHeight - 8}
                      textAnchor="middle"
                      className={`text-[10px] ${
                        isHovered ? 'fill-slate-900 font-semibold' : 'fill-slate-400'
                      }`}
                    >
                      {item.shortLabel}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {!hasAnySalesInPeriod && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-5">
              <div className="bg-white/95 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-500">
                Belum ada transaksi Lunas dalam {rangeDays} hari terakhir.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Daftar Produk Terlaris & Kategori Terlaris */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Kiri: Daftar Produk Terlaris */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col">
          <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#0084D1]" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Produk Terlaris
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Transaksi lunas</span>
          </div>

          {topProducts.length === 0 ? (
            <div className="flex-1 py-8 flex items-center justify-center text-center text-xs text-slate-400">
              Belum ada produk terjual (status Lunas).
            </div>
          ) : (
            <div className="divide-y divide-slate-100 mt-1">
              {topProducts.map((item, idx) => {
                const maxCount = topProducts[0]?.count || 1;
                const pct = Math.max(8, Math.round((item.count / maxCount) * 100));
                return (
                  <div key={item.name} className="py-3 first:pt-2 last:pb-1 space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-mono tabular-nums text-[11px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono tabular-nums text-xs font-bold text-slate-900">
                          {item.count} terjual
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0084D1] rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums whitespace-nowrap shrink-0">
                        <span>{formatRupiah(item.revenue)}</span>
                        <span className="mx-1 text-slate-300">·</span>
                        <span className="text-emerald-600 font-semibold">
                          +{formatRupiah(item.profit)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Kanan: Kategori Terlaris (Kategori Asli Xaviera Aplikasi Premium) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col">
          <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Kategori Terlaris
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Kategori resmi Xaviera</span>
          </div>

          {topCategories.length === 0 ? (
            <div className="flex-1 py-8 flex items-center justify-center text-center text-xs text-slate-400">
              Belum ada data kategori dari transaksi Aplikasi Premium Xaviera yang lunas.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 mt-1">
              {topCategories.map((item, idx) => {
                const maxCount = topCategories[0]?.count || 1;
                const pct = Math.max(8, Math.round((item.count / maxCount) * 100));
                return (
                  <div key={item.category} className="py-3 first:pt-2 last:pb-1 space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 font-mono tabular-nums text-[11px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono tabular-nums text-xs font-bold text-slate-900">
                          {item.count} terjual
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums whitespace-nowrap shrink-0">
                        <span>{formatRupiah(item.revenue)}</span>
                        <span className="mx-1 text-slate-300">·</span>
                        <span className="text-emerald-600 font-semibold">
                          +{formatRupiah(item.profit)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
