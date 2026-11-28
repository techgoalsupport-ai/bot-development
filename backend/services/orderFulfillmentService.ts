import { CommandsConfig } from '../types/bot.types.ts';
import {
  claimTransactionFulfillment,
  completeTransactionFulfillment,
  TransactionRecord,
} from './transactionManager.ts';
import {
  createXavieraProductOrder,
  formatXavieraCredentials,
  resolveXavieraProductTarget,
  XavieraCredentialItem,
  XavieraProductOrderResponse,
} from './xavieraService.ts';
import { resolvePlaceholders, VariantPlaceholderContext } from './placeholderHelper.ts';

export interface FulfillmentOutcome {
  status: 'fulfilled' | 'failed' | 'in_progress';
  supplierOrderId?: string;
  credentialsText: string;
  accountEmail: string;
  accountPassword: string;
  credentials: XavieraCredentialItem[];
  saldoRemaining?: number;
  error?: string;
  fromCache?: boolean;
}

export interface OrderFulfillmentDeps {
  claim?: (orderId: string) => {
    claimed: boolean;
    existing?: TransactionRecord;
    reason?: 'not_found' | 'already_fulfilled' | 'in_progress';
  };
  complete?: typeof completeTransactionFulfillment;
  resolveTarget?: typeof resolveXavieraProductTarget;
  createOrder?: (
    config: CommandsConfig,
    params: { productId: string; variantId?: string; qty?: number }
  ) => Promise<XavieraProductOrderResponse>;
}

const CREDENTIAL_PLACEHOLDER_REGEX =
  /\{(credentials|accountDetails|akun|kredensial|dataAkun|accountEmail|emailAkun|email|accountPassword|passwordAkun|password)\}/i;

/**
 * Mengeksekusi pemesanan produk akun premium ke API Xaviera tepat setelah pembayaran QRIS berstatus paid.
 * Dilengkapi penguncian atomik di SQLite untuk mencegah double-order.
 */
export async function fulfillXavieraOrderForTransaction(
  params: {
    orderId: string;
    config: CommandsConfig;
    productName: string;
    variantName: string;
    xavieraProductId?: string;
    xavieraVariantId?: string;
    addLog?: (type: 'info' | 'success' | 'warning' | 'error' | 'code', msg: string) => void;
  },
  deps: OrderFulfillmentDeps = {}
): Promise<FulfillmentOutcome> {
  const claimFn = deps.claim || claimTransactionFulfillment;
  const completeFn = deps.complete || completeTransactionFulfillment;
  const resolveTargetFn = deps.resolveTarget || resolveXavieraProductTarget;
  const createOrderFn = deps.createOrder || createXavieraProductOrder;

  const claimRes = claimFn(params.orderId);
  if (!claimRes.claimed) {
    if (claimRes.reason === 'already_fulfilled' && claimRes.existing) {
      let parsedCreds: unknown = [];
      try {
        if (claimRes.existing.credentialsJson) {
          parsedCreds = JSON.parse(claimRes.existing.credentialsJson);
        }
      } catch {}
      const formatted = formatXavieraCredentials(parsedCreds);
      return {
        status: 'fulfilled',
        supplierOrderId: claimRes.existing.supplierOrderId || '-',
        credentialsText: formatted.credentialsText,
        accountEmail: formatted.accountEmail,
        accountPassword: formatted.accountPassword,
        credentials: formatted.normalizedItems,
        fromCache: true,
      };
    }

    if (claimRes.reason === 'in_progress') {
      return {
        status: 'in_progress',
        credentialsText:
          '⏳ Pesanan Anda sedang dalam antrean pengiriman sistem. Mohon tunggu beberapa saat.',
        accountEmail: '-',
        accountPassword: '-',
        credentials: [],
      };
    }
  }

  const savedRec = claimRes.existing;
  let productId = (params.xavieraProductId || savedRec?.xavieraProductId || '').trim();
  let variantId = (params.xavieraVariantId || savedRec?.xavieraVariantId || '').trim();

  if (!productId) {
    try {
      const resolved = await resolveTargetFn(params.config, params.productName, params.variantName);
      productId = (resolved.productId || '').trim();
      if (!variantId && resolved.variantId) {
        variantId = resolved.variantId.trim();
      }
    } catch {}
  }

  if (!productId) {
    const errMsg = `ID produk Xaviera untuk "${params.productName} (${params.variantName})" tidak ditemukan di katalog.`;
    completeFn(params.orderId, {
      supplierStatus: 'failed',
      deliveryError: errMsg,
    });
    params.addLog?.('error', `❌ Auto-order Xaviera gagal (${params.orderId}): ${errMsg}`);
    return {
      status: 'failed',
      credentialsText: `⚠️ Pengiriman akun otomatis terkendala (${errMsg}). Silakan hubungi admin dengan Order ID #${params.orderId}.`,
      accountEmail: '-',
      accountPassword: '-',
      credentials: [],
      error: errMsg,
    };
  }

  params.addLog?.(
    'info',
    `📦 Mengirim order otomatis ke Xaviera API untuk ${params.orderId} (productId: ${productId}${variantId ? `, variantId: ${variantId}` : ''})...`
  );

  const orderRes = await createOrderFn(params.config, {
    productId,
    ...(variantId ? { variantId } : {}),
    qty: 1,
  });

  if (!orderRes.success || !orderRes.order) {
    const errMsg = orderRes.error || 'Gagal memproses order di server Xaviera.';
    completeFn(params.orderId, {
      supplierStatus: 'failed',
      deliveryError: errMsg,
    });
    params.addLog?.('error', `❌ Auto-order Xaviera gagal (${params.orderId}): ${errMsg}`);
    return {
      status: 'failed',
      credentialsText: `⚠️ Pengiriman akun otomatis terkendala (${errMsg}). Silakan hubungi admin dengan menyertakan Order ID #${params.orderId}.`,
      accountEmail: '-',
      accountPassword: '-',
      credentials: [],
      error: errMsg,
    };
  }

  const formatted = formatXavieraCredentials(orderRes.order.credentials);
  const supplierOrderId = orderRes.order.id || '-';

  completeFn(params.orderId, {
    supplierOrderId,
    supplierStatus: 'fulfilled',
    credentials: formatted.normalizedItems,
  });

  params.addLog?.(
    'success',
    `🔐 Kredensial akun dari Xaviera diterima untuk ${params.orderId} (Supplier Order ID: ${supplierOrderId}${
      orderRes.saldo !== undefined ? ` | Sisa Saldo Xaviera: Rp ${orderRes.saldo.toLocaleString('id-ID')}` : ''
    })`
  );

  return {
    status: 'fulfilled',
    supplierOrderId,
    credentialsText:
      formatted.credentialsText ||
      `Order berhasil diproses (ID Supplier: ${supplierOrderId}). Hubungi admin bila detail akun belum tampil.`,
    accountEmail: formatted.accountEmail || '-',
    accountPassword: formatted.accountPassword || '-',
    credentials: formatted.normalizedItems,
    saldoRemaining: orderRes.saldo,
  };
}

/**
 * Merakit pesan payment_success_dm sekaligus memastikan kredensial tetap terkirim
 * walau template lama tenant belum menuliskan placeholder {credentials}.
 */
export function buildPaymentSuccessDmMessage(
  template: string,
  config: CommandsConfig,
  ctx: VariantPlaceholderContext,
  fulfillment: FulfillmentOutcome
): string {
  const rendered = resolvePlaceholders(template, config, ctx);
  const hasCredentialPlaceholder = CREDENTIAL_PLACEHOLDER_REGEX.test(template || '');

  if (!hasCredentialPlaceholder && fulfillment.credentialsText) {
    return `${rendered}\n\n🔐 *Detail Akun / Kredensial Anda:*\n${fulfillment.credentialsText}`;
  }

  return rendered;
}
