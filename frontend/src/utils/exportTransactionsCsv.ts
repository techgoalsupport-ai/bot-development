import { TransactionItem } from '../types/dashboard.types';

function escapeCsvCell(rawValue: unknown): string {
  const str = rawValue === null || rawValue === undefined ? '' : String(rawValue);
  // Mitigate spreadsheet formula injection when opened in Excel/Sheets
  const safeStr = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  if (/[",\n\r]/.test(safeStr)) {
    return `"${safeStr.replace(/"/g, '""')}"`;
  }
  return safeStr;
}

function formatStatusLabel(status: TransactionItem['status']): string {
  switch (status) {
    case 'paid':
      return 'Lunas';
    case 'cancel':
      return 'Batal';
    case 'pending':
    default:
      return 'Pending';
  }
}

function formatCsvTimestamp(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export function buildTransactionsCsvContent(
  transactions: TransactionItem[],
  resolveCategory?: (trx: TransactionItem) => string
): string {
  const headers = [
    'Tanggal',
    'Order ID',
    'Pembeli',
    'Produk',
    'Varian',
    'Kategori',
    'Harga Modal',
    'Diskon Promo',
    'Nominal',
    'Kode Unik',
    'Total',
    'Keuntungan',
    'Status',
  ];

  const rows = transactions.map((trx) => {
    const resolvedCategory = resolveCategory
      ? resolveCategory(trx)
      : (trx.category || '').trim();
    const profitValue = trx.status === 'paid' ? Math.max(0, Number(trx.profit || 0)) : 0;

    return [
      formatCsvTimestamp(trx.createdAt),
      trx.orderId,
      trx.customerNumber || '-',
      trx.productName,
      trx.variantName,
      resolvedCategory || '-',
      Math.max(0, Number(trx.costPrice || 0)),
      Math.max(0, Number(trx.discountAmount || 0)),
      Math.max(0, Number(trx.nominal || 0)),
      Math.max(0, Number(trx.uniqueCode || 0)),
      Math.max(0, Number(trx.total || 0)),
      profitValue,
      formatStatusLabel(trx.status),
    ].map(escapeCsvCell);
  });

  return '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

export function downloadTransactionsCsv(params: {
  transactions: TransactionItem[];
  statusFilter: 'all' | 'paid' | 'pending' | 'cancel';
  resolveCategory?: (trx: TransactionItem) => string;
}): number {
  const { transactions, statusFilter, resolveCategory } = params;
  if (!transactions.length) return 0;

  const csvContent = buildTransactionsCsvContent(transactions, resolveCategory);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const today = new Date();
  const dateStamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;
  const filterSlug = statusFilter === 'paid' ? 'lunas' : statusFilter === 'cancel' ? 'batal' : statusFilter;
  const filename = `transaksi-${filterSlug}-${dateStamp}.csv`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return transactions.length;
}
