import React, { useState, useMemo, useEffect } from 'react';
import {
  Wallet,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Target,
  Eye,
  EyeOff,
  ArrowUpRight,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  Receipt,
  ExternalLink,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import {
  XavieraProfileState,
  LunasQrisBalanceState,
  StoreInfoConfig,
  PremiumProduct,
  TransactionItem,
} from '../../types/dashboard.types';
import { useTransactions } from '../../hooks/useTransactions';
import { sanitizeSafeHttpsUrl } from '../../utils/urlValidation';
import { downloadTransactionsCsv } from '../../utils/exportTransactionsCsv';
import { SalesAnalyticsSection } from './SalesAnalyticsSection';

interface TabSaldoTransaksiProps {
  storeInfo: StoreInfoConfig;
  xavieraProfile: XavieraProfileState;
  lunasQrisBalance?: LunasQrisBalanceState;
  transactionsState: ReturnType<typeof useTransactions>;
  productsList?: PremiumProduct[];
  onRefreshProfile: () => void;
  onRefreshLunasQris?: () => void;
  onNavigateToKoneksiLayanan: () => void;
  showToast: (msg: string) => void;
}

const ITEMS_PER_PAGE = 10;
const HIDE_BALANCE_STORAGE_KEY = 'wanzt_hide_wallet_balances';

function getStoreInitials(storeName?: string): string {
  const clean = (storeName || '').trim();
  if (!clean) return 'TS';
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

function formatRupiah(val: number | null | undefined): string {
  const num = Number(val);
  if (!Number.isFinite(num)) return 'Rp 0';
  return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
}

function formatPercent(val: number | null | undefined): string {
  const num = Number(val);
  if (!Number.isFinite(num) || num === 0) return '0';
  return Number.isInteger(num) ? String(num) : num.toFixed(1).replace('.', ',');
}

export const TabSaldoTransaksi: React.FC<TabSaldoTransaksiProps> = ({
  storeInfo,
  xavieraProfile,
  lunasQrisBalance,
  transactionsState,
  productsList = [],
  onRefreshProfile,
  onRefreshLunasQris,
  onNavigateToKoneksiLayanan,
  showToast,
}) => {
  const {
    transactions,
    filteredTransactions,
    summary,
    loading,
    isSyncing,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    fetchTransactions,
    syncPendingTransactions,
    deleteTransactionItem,
  } = transactionsState;

  const [hideBalances, setHideBalances] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(HIDE_BALANCE_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const toggleHideBalances = () => {
    setHideBalances((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(HIDE_BALANCE_STORAGE_KEY, next ? '1' : '0');
      } catch {}
      return next;
    });
  };

  const handleCopy = (text: string, label: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(keyId);
    showToast(`${label} disalin`);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE) || 1;
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  // Peta kategori resmi dari katalog Aplikasi Premium Xaviera (tanpa membuat kategori sendiri)
  const productCategoryLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of productsList) {
      const pName = (p.name || '').trim().toLowerCase();
      const cat = (p.category || '').trim();
      if (pName && cat && cat !== 'Premium Apps' && !map.has(pName)) {
        map.set(pName, cat);
      }
    }
    return map;
  }, [productsList]);

  const resolveXavieraCategory = useMemo(() => {
    return (trx: TransactionItem): string => {
      const stored = (trx.category || '').trim();
      if (stored) return stored;
      const key = (trx.productName || '').trim().toLowerCase();
      return productCategoryLookup.get(key) || '';
    };
  }, [productCategoryLookup]);

  const handleExportCsv = () => {
    const exportedCount = downloadTransactionsCsv({
      transactions: filteredTransactions,
      statusFilter,
      resolveCategory: resolveXavieraCategory,
    });
    if (exportedCount > 0) {
      showToast(`Export CSV berhasil (${exportedCount} transaksi)`);
    } else {
      showToast('Tidak ada data transaksi untuk diekspor');
    }
  };

  const storeName = (storeInfo?.storeName || '').trim() || 'Wanzt Store';
  const storeInitials = getStoreInitials(storeName);

  const xavieraBal = xavieraProfile.data?.balance ?? 0;
  const lunasActiveBal = lunasQrisBalance?.balance ?? 0;
  const lunasHoldBal = lunasQrisBalance?.balanceHold ?? 0;

  const revenue7d = summary.revenue7d ?? 0;
  const profit7d = summary.profit7d ?? 0;
  const paidCount7d = summary.paidCount7d ?? 0;
  const margin7dPercent = summary.margin7dPercent ?? 0;
  const revenueChangePercent = summary.revenueChangePercent ?? 0;
  const totalProfit = summary.totalProfit ?? 0;

  const isAnyBalanceLoading = Boolean(xavieraProfile.loading || lunasQrisBalance?.loading);

  const renderStatusBadge = (status: 'pending' | 'paid' | 'cancel') => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Lunas
          </span>
        );
      case 'cancel':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
            <XCircle className="w-3 h-3 text-rose-600" />
            Batal
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Bagian Atas: Wallet Toko + Ringkasan 7 Hari & Total */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Kiri: Kartu Wallet Toko (Saldo Xaviera + Saldo LunasQRIS) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            {/* Header Kartu: Avatar Singkatan Toko + Nama Toko + Tombol Eye & Refresh */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#0084D1] to-sky-400 text-white font-bold text-sm tracking-wide flex items-center justify-center shrink-0">
                  {storeInitials}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate leading-tight">
                    {storeName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Wallet toko</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={toggleHideBalances}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-[#0084D1] border border-slate-200 flex items-center justify-center transition cursor-pointer"
                  title={hideBalances ? 'Tampilkan Nominal Saldo' : 'Sembunyikan Nominal Saldo'}
                  aria-label={hideBalances ? 'Tampilkan Nominal Saldo' : 'Sembunyikan Nominal Saldo'}
                >
                  {hideBalances ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRefreshProfile();
                    if (onRefreshLunasQris) onRefreshLunasQris();
                    showToast('Menyegarkan saldo Xaviera & LunasQRIS...');
                  }}
                  disabled={isAnyBalanceLoading}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-[#0084D1] border border-slate-200 flex items-center justify-center transition cursor-pointer disabled:opacity-50"
                  title="Sinkronkan Saldo"
                  aria-label="Sinkronkan Saldo"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isAnyBalanceLoading ? 'animate-spin text-[#0084D1]' : ''}`}
                  />
                </button>
              </div>
            </div>

            {/* Saldo Tersedia (Saldo Xaviera) */}
            <div className="mt-6">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>Saldo tersedia</span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-slate-600">Xaviera Store</span>
              </div>
              <div className="mt-1.5 font-mono tabular-nums font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                {xavieraProfile.loading ? (
                  <span className="text-sm font-sans font-normal text-slate-400">
                    Memuat saldo...
                  </span>
                ) : hideBalances ? (
                  'Rp ••••••'
                ) : (
                  formatRupiah(xavieraBal)
                )}
              </div>
            </div>

            {/* Garis Pemisah Putus-putus */}
            <div className="border-t border-dashed border-slate-200 my-5" />

            {/* Saldo LunasQRIS */}
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-xs text-slate-500">Saldo LunasQRIS</div>
                <div className="mt-1 font-mono tabular-nums font-bold text-lg sm:text-xl text-emerald-600 tracking-tight">
                  {lunasQrisBalance?.loading ? (
                    <span className="text-sm font-sans font-normal text-slate-400">
                      Memuat saldo...
                    </span>
                  ) : hideBalances ? (
                    'Rp ••••••'
                  ) : (
                    formatRupiah(lunasActiveBal)
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Saldo Tertahan</span>
                <span className="font-mono tabular-nums text-xs font-semibold text-slate-700">
                  {hideBalances ? 'Rp ••••' : formatRupiah(lunasHoldBal)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Kartu Wallet */}
          <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="truncate">
              <span>Akun: {xavieraProfile.data?.username || '-'}</span>
              <span className="mx-1.5" aria-hidden="true">·</span>
              <span>{lunasQrisBalance?.configured ? 'QRIS Aktif' : 'QRIS Belum Diatur'}</span>
            </div>
            <button
              type="button"
              onClick={onNavigateToKoneksiLayanan}
              className="text-xs font-semibold text-[#0084D1] hover:underline cursor-pointer inline-flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <span>Kelola API</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Kanan: 4 Kartu Metrik 7 Hari Terakhir + Strip Total Keseluruhan */}
        <div className="lg:col-span-7 flex flex-col gap-3.5">
          {/* Grid 2x2 Metrik 7 Hari Terakhir */}
          <div className="grid grid-cols-2 gap-3.5 flex-1">
            {/* 1. Omzet */}
            <div className="bg-amber-50/45 border border-amber-200/75 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0084D1]">
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  <span>Omzet</span>
                </div>
                <span className="text-[11px] text-slate-400 whitespace-nowrap">7 hari</span>
              </div>

              <div className="mt-3">
                <div className="font-mono tabular-nums text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {formatRupiah(revenue7d)}
                </div>
                <div
                  className={`mt-1 text-[11px] font-medium flex items-center gap-1 ${
                    revenueChangePercent > 0
                      ? 'text-emerald-600'
                      : revenueChangePercent < 0
                      ? 'text-rose-600'
                      : 'text-slate-500'
                  }`}
                >
                  {revenueChangePercent < 0 && <TrendingDown className="w-3 h-3 shrink-0" />}
                  <span>
                    {revenueChangePercent > 0 ? '+' : ''}
                    {formatPercent(revenueChangePercent)}% vs 7 hari lalu
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Keuntungan */}
            <div className="bg-emerald-50/45 border border-emerald-200/75 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <Wallet className="w-4 h-4 shrink-0" />
                  <span>Keuntungan</span>
                </div>
                <span className="text-[11px] text-slate-400 whitespace-nowrap">7 hari</span>
              </div>

              <div className="mt-3">
                <div className="font-mono tabular-nums text-xl sm:text-2xl font-bold text-emerald-700 tracking-tight">
                  {formatRupiah(profit7d)}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Harga jual - modal - promo
                </div>
              </div>
            </div>

            {/* 3. Transaksi */}
            <div className="bg-sky-50/45 border border-sky-200/75 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0084D1]">
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>Transaksi</span>
                </div>
                <span className="text-[11px] text-slate-400 whitespace-nowrap">7 hari</span>
              </div>

              <div className="mt-3">
                <div className="font-mono tabular-nums text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {paidCount7d}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  {paidCount7d} item terjual
                </div>
              </div>
            </div>

            {/* 4. Margin */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                  <Target className="w-4 h-4 shrink-0" />
                  <span>Margin</span>
                </div>
                <span className="text-[11px] text-slate-400 whitespace-nowrap">7 hari</span>
              </div>

              <div className="mt-3">
                <div className="font-mono tabular-nums text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {formatPercent(margin7dPercent)}%
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Untung dari omzet
                </div>
              </div>
            </div>
          </div>

          {/* Strip Ringkasan Total Keseluruhan */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-3.5 sm:px-5 grid grid-cols-3 divide-x divide-slate-200">
            <div className="pr-3">
              <span className="text-[11px] text-slate-500 block">Omzet total</span>
              <span className="font-mono tabular-nums text-sm sm:text-base font-bold text-slate-900 mt-0.5 block truncate">
                {formatRupiah(summary.totalRevenue)}
              </span>
            </div>
            <div className="px-3 sm:px-4">
              <span className="text-[11px] text-slate-500 block">Untung total</span>
              <span className="font-mono tabular-nums text-sm sm:text-base font-bold text-emerald-600 mt-0.5 block truncate">
                {formatRupiah(totalProfit)}
              </span>
            </div>
            <div className="pl-3 sm:pl-4">
              <span className="text-[11px] text-slate-500 block">Transaksi</span>
              <span className="font-mono tabular-nums text-sm sm:text-base font-bold text-slate-900 mt-0.5 block">
                {summary.paidCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Grafik Penjualan, Produk Terlaris, & Kategori Terlaris */}
      <SalesAnalyticsSection
        transactions={transactions}
        productsList={productsList}
        resolveXavieraCategory={resolveXavieraCategory}
      />

      {/* 3. Bagian Bawah: Daftar Transaksi (Search, Filter Lunas/Pending/Batal, Export CSV, & Tabel) */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {/* Toolbar Header + Aksi */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Daftar Transaksi
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Riwayat pesanan QRIS pelanggan · Total {summary.totalCount} order tercatat
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredTransactions.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
              title="Export data transaksi sesuai filter aktif ke file CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={syncPendingTransactions}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-sky-50 hover:bg-sky-100 text-[#0084D1] border border-sky-200 transition cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
              title="Sinkronkan status transaksi pending"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sinkron...' : 'Sinkron Pending'}</span>
            </button>

            <button
              type="button"
              onClick={fetchTransactions}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Segarkan</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Lunas / Pending / Batal */}
        <div className="p-3 sm:p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor HP, Order ID, produk, varian..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0084D1] focus:ring-2 focus:ring-[#0084D1]/15 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="w-full md:w-auto max-w-full flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1 overflow-x-auto scrollbar-none">
            {(
              [
                { id: 'all', label: 'Semua', count: summary.totalCount },
                { id: 'paid', label: 'Lunas', count: summary.paidCount },
                { id: 'pending', label: 'Pending', count: summary.pendingCount },
                { id: 'cancel', label: 'Batal', count: summary.cancelCount },
              ] as const
            ).map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-[#0084D1] text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono tabular-nums shrink-0 leading-none ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Konten Daftar / Tabel */}
        {loading && filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-[#0084D1]" />
            <p className="text-xs">Memuat daftar transaksi...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Receipt className="w-7 h-7 mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-slate-600 text-xs">Tidak ada transaksi ditemukan</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {searchQuery
                ? 'Coba ganti kata kunci pencarian.'
                : 'Pesanan baru akan otomatis muncul di sini.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block md:hidden divide-y divide-slate-100">
              {paginatedTransactions.map((trx) => {
                const buyerClean = trx.customerNumber ? trx.customerNumber.replace(/[^0-9]/g, '') : '';
                const waUrl = buyerClean ? `https://wa.me/${buyerClean}` : '';
                const safePaymentUrl = sanitizeSafeHttpsUrl(trx.paymentUrl);
                const orderKey = `order-${trx.orderId}`;
                const numKey = `num-${trx.orderId}`;
                const trxProfit = trx.profit ?? 0;

                return (
                  <div key={trx.id || trx.orderId} className="p-3.5 space-y-2.5">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 truncate">
                          {trx.orderId}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(trx.orderId, 'Order ID', orderKey)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer shrink-0"
                          title="Salin Order ID"
                        >
                          {copiedId === orderKey ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      {renderStatusBadge(trx.status)}
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-slate-900 leading-snug">{trx.productName}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{trx.variantName}</p>

                      <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                        <span className="text-[11px] text-slate-400">Pembeli:</span>
                        <span className="font-mono text-slate-800 font-medium">{trx.customerNumber || '-'}</span>
                        {trx.customerNumber && (
                          <button
                            type="button"
                            onClick={() => handleCopy(trx.customerNumber, 'Nomor HP', numKey)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                            title="Salin Nomor HP"
                          >
                            {copiedId === numKey ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-emerald-600 hover:text-emerald-700 rounded transition"
                            title="Chat WhatsApp"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50/80 rounded-xl p-2.5 grid grid-cols-2 gap-1.5 text-xs border border-slate-100">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Nominal</span>
                        <span className="font-mono tabular-nums font-medium text-slate-700">
                          {formatRupiah(trx.nominal)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[10px] block">Keuntungan</span>
                        <span className="font-mono tabular-nums font-semibold text-emerald-600">
                          {trx.status === 'paid' && trxProfit > 0 ? `+${formatRupiah(trxProfit)}` : 'Rp 0'}
                        </span>
                      </div>
                      <div className="col-span-2 border-t border-slate-200/60 pt-1.5 mt-0.5 flex justify-between items-center">
                        <span className="font-semibold text-slate-800 text-[11px]">
                          Total {trx.uniqueCode > 0 ? `(Kode +${trx.uniqueCode})` : ''}
                        </span>
                        <span className="font-mono tabular-nums font-bold text-[#0084D1] text-sm">
                          {formatRupiah(trx.total)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      {safePaymentUrl ? (
                        <a
                          href={safePaymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-sky-600 hover:text-sky-700 font-medium inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Web Checkout</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400">-</span>
                      )}

                      {deleteConfirmId === trx.orderId ? (
                        <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 p-0.5 rounded-lg">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTransactionItem(trx.id || trx.orderId);
                              setDeleteConfirmId(null);
                            }}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-medium flex items-center gap-1 transition cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            Hapus
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(null);
                            }}
                            className="px-1.5 py-1 text-slate-500 hover:text-slate-700 text-[10px] cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(trx.orderId);
                            setTimeout(() => {
                              setDeleteConfirmId((prev) => (prev === trx.orderId ? null : prev));
                            }, 4000);
                          }}
                          className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition cursor-pointer inline-flex items-center gap-1"
                          title="Hapus transaksi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold text-[11px]">
                    <th className="py-3 px-4 whitespace-nowrap">Pembeli</th>
                    <th className="py-3 px-4 whitespace-nowrap">Produk &amp; Varian</th>
                    <th className="py-3 px-4 whitespace-nowrap">Order ID</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">Nominal</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">Total</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">Untung</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">Status</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedTransactions.map((trx) => {
                    const buyerClean = trx.customerNumber ? trx.customerNumber.replace(/[^0-9]/g, '') : '';
                    const waUrl = buyerClean ? `https://wa.me/${buyerClean}` : '';
                    const safePaymentUrl = sanitizeSafeHttpsUrl(trx.paymentUrl);
                    const orderKey = `order-${trx.orderId}`;
                    const numKey = `num-${trx.orderId}`;
                    const trxProfit = trx.profit ?? 0;

                    return (
                      <tr key={trx.id || trx.orderId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-medium whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono tabular-nums text-slate-900 text-xs">
                              {trx.customerNumber || '-'}
                            </span>
                            {trx.customerNumber && (
                              <button
                                type="button"
                                onClick={() => handleCopy(trx.customerNumber, 'Nomor HP', numKey)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                                title="Salin Nomor HP"
                              >
                                {copiedId === numKey ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                            {waUrl && (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 text-emerald-600 hover:text-emerald-700 rounded transition"
                                title="Chat WhatsApp"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          {trx.customerName && trx.customerName !== `Pelanggan-${buyerClean.slice(-4)}` && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {trx.customerName}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="text-xs font-semibold text-slate-900">{trx.productName}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{trx.variantName}</div>
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {trx.orderId}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(trx.orderId, 'Order ID', orderKey)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                              title="Salin Order ID"
                            >
                              {copiedId === orderKey ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap text-right">
                          <div className="font-mono tabular-nums">{formatRupiah(trx.nominal)}</div>
                          {trx.uniqueCode > 0 && (
                            <div className="text-[10px] text-amber-600 font-mono tabular-nums">
                              +{trx.uniqueCode.toLocaleString('id-ID')} unik
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap text-right">
                          {formatRupiah(trx.total)}
                        </td>

                        <td className="py-3 px-4 font-mono tabular-nums whitespace-nowrap text-right">
                          {trx.status === 'paid' && trxProfit > 0 ? (
                            <span className="font-semibold text-emerald-600">
                              +{formatRupiah(trxProfit)}
                            </span>
                          ) : (
                            <span className="text-slate-400">Rp 0</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {renderStatusBadge(trx.status)}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {safePaymentUrl && (
                              <a
                                href={safePaymentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium inline-flex items-center gap-1 transition"
                                title="Buka Web Checkout"
                              >
                                <span>Web</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}

                            {deleteConfirmId === trx.orderId ? (
                              <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 p-0.5 rounded-lg">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTransactionItem(trx.id || trx.orderId);
                                    setDeleteConfirmId(null);
                                  }}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-medium flex items-center gap-1 transition cursor-pointer"
                                >
                                  <Check className="w-3 h-3" />
                                  Hapus
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmId(null);
                                  }}
                                  className="px-1.5 py-1 text-slate-500 hover:text-slate-700 text-[10px] cursor-pointer"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(trx.orderId);
                                  setTimeout(() => {
                                    setDeleteConfirmId((prev) => (prev === trx.orderId ? null : prev));
                                  }, 4000);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Hapus transaksi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {filteredTransactions.length > ITEMS_PER_PAGE && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="tabular-nums">
              Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} dari{' '}
              {filteredTransactions.length} transaksi
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono tabular-nums text-[11px] font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
