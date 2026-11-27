export const DEFAULT_CUSTOM_CODE = '';
export const SESSION_DIR = 'session_ourin';

// Supported command prefixes: /, ., !, ?, #, $, %, &
export const ALLOWED_PREFIXES = ['/', '.', '!', '?', '#', '$', '%', '&'];

export type BotStatus =
  | 'idle'
  | 'connecting'
  | 'waiting_code'
  | 'code_ready'
  | 'connected'
  | 'closed'
  | 'error';

export interface LogEntry {
  id: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'code';
  message: string;
}

export type WhatsAppButtonType =
  | 'quick_reply'
  | 'cta_url'
  | 'cta_copy'
  | 'vcard'
  | 'cta_call'
  | 'cta_reminder'
  | 'cta_cancel_reminder';

export type QuickReplyTriggerAction = 'list' | 'menu' | 'owner' | 'admin' | 'unknown';

export type ResponseConfigKey =
  | 'menu'
  | 'list'
  | 'carousel'
  | 'invoice'
  | 'confirm_summary'
  | 'confirm_promo_input'
  | 'confirm_promo_valid'
  | 'confirm_promo_invalid'
  | 'payment_success_dm'
  | 'payment_success_group'
  | 'payment_expired'
  | 'payment_error'
  | 'order_group_notif'
  | 'stock_empty'
  | 'checkout_session_expired'
  | 'promo_cancelled'
  | 'contact_owner_empty'
  | 'contact_admin_empty'
  | 'expiry_warning_owner'
  | 'kick_anti_kudeta'
  | 'kick_bot_not_admin'
  | 'kick_success'
  | 'open_bot_not_admin'
  | 'open_already'
  | 'open_success'
  | 'close_bot_not_admin'
  | 'close_already'
  | 'close_success';

export type MandatoryButtonRole =
  | 'carousel_order'
  | 'list_dropdown'
  | 'invoice_pay_url'
  | 'invoice_contact_admin'
  | 'confirm_promo'
  | 'confirm_direct';

export interface WhatsAppButton {
  id: string;
  type: WhatsAppButtonType;
  name: string;
  output: string;
  triggerAction?: QuickReplyTriggerAction;
  callTargetName?: string;
  callPhoneNumber?: string;
  mandatory?: boolean;
  mandatoryRole?: MandatoryButtonRole;
}

export interface ResponseExtraConfig {
  includeMedia?: boolean;
  selectedPicture?: string;
  buttons?: WhatsAppButton[];
}

export type ResponseExtrasMap = Partial<Record<ResponseConfigKey, ResponseExtraConfig>>;

export interface ProductVariantItem {
  id: string;
  name: string;
  variant: string;
  stock: number;
  price: number;
  category: string;
}

export interface StoreInfoConfig {
  storeName: string;
  ownerName: string;
  ownerNumber: string;
  adminName?: string;
  adminNumber?: string;
  webLink?: string;
  telegramBot?: string;
  waLink?: string;
}

export interface MenuCommandConfig {
  menuOutputText: string;
  menuFooterText: string;
  menuButtons: WhatsAppButton[];
  includeMedia: boolean;
  selectedPicture: string;
}

export interface ListCommandConfig {
  listOutputText: string;
  listFooterText: string;
  listIncludeMedia?: boolean;
  listSelectedPicture?: string;
  listButtons?: WhatsAppButton[];
}

export interface CarouselCommandConfig {
  carouselOutputText: string;
  carouselFooterText: string;
  carouselPicture: string;
  carouselButtons?: WhatsAppButton[];
}

export interface InvoiceCommandConfig {
  invoiceOutputText: string;
  invoiceFooterText: string;
  invoiceButtons?: WhatsAppButton[];
}

export interface ConfirmationCommandConfig {
  confirmSummaryText: string;
  confirmInputPromoText: string;
  confirmPromoSuccessText: string;
  confirmPromoInvalidText: string;
  confirmFooterText?: string;
  confirmInputPromoFooter?: string;
  confirmPromoSuccessFooter?: string;
  confirmPromoInvalidFooter?: string;
}

export interface PricingConfig {
  mode: 'rp' | 'percent';
  value: number;
}

export interface ApiConfig {
  xavieraApiKey: string;
  xavieraBaseUrl: string;
  lunasQrisApiKey?: string;
  lunasQrisSecretKey?: string;
  lunasQrisBaseUrl?: string;
}

export interface CommandsConfig {
  storeInfo: StoreInfoConfig;
  pricingConfig?: PricingConfig;
  menuOutputText: string;
  menuFooterText?: string;
  menuButtons: WhatsAppButton[];
  includeMedia?: boolean;
  selectedPicture?: string;
  listOutputText: string;
  listFooterText?: string;
  carouselOutputText?: string;
  carouselFooterText?: string;
  carouselPicture?: string;
  invoiceOutputText?: string;
  invoiceFooterText?: string;
  confirmSummaryText?: string;
  confirmInputPromoText?: string;
  confirmPromoSuccessText?: string;
  confirmPromoInvalidText?: string;
  confirmFooterText?: string;
  confirmInputPromoFooter?: string;
  confirmPromoSuccessFooter?: string;
  confirmPromoInvalidFooter?: string;
  // Respon Transaksi (Status Bayar)
  paymentSuccessDmText?: string;
  paymentSuccessDmFooter?: string;
  paymentSuccessGroupText?: string;
  paymentSuccessGroupFooter?: string;
  paymentExpiredText?: string;
  paymentExpiredFooter?: string;
  paymentErrorText?: string;
  paymentErrorFooter?: string;
  // Respon Notifikasi Alur Pesanan
  orderGroupNotifText?: string;
  orderGroupNotifFooter?: string;
  stockEmptyText?: string;
  stockEmptyFooter?: string;
  sessionExpiredText?: string;
  sessionExpiredFooter?: string;
  promoCancelledText?: string;
  promoCancelledFooter?: string;
  // Respon Kontak & Pengingat Status
  contactOwnerEmptyText?: string;
  contactOwnerEmptyFooter?: string;
  contactAdminEmptyText?: string;
  contactAdminEmptyFooter?: string;
  expiryWarningOwnerText?: string;
  expiryWarningOwnerFooter?: string;
  // Respon Moderasi & Keamanan Grup (Kick, Open, Close & AntiKudeta)
  kickAntiKudetaText?: string;
  kickAntiKudetaFooter?: string;
  kickBotNotAdminText?: string;
  kickBotNotAdminFooter?: string;
  kickSuccessText?: string;
  kickSuccessFooter?: string;
  openBotNotAdminText?: string;
  openBotNotAdminFooter?: string;
  openAlreadyText?: string;
  openAlreadyFooter?: string;
  openSuccessText?: string;
  openSuccessFooter?: string;
  closeBotNotAdminText?: string;
  closeBotNotAdminFooter?: string;
  closeAlreadyText?: string;
  closeAlreadyFooter?: string;
  closeSuccessText?: string;
  closeSuccessFooter?: string;
  // Konfigurasi Foto & Tombol Per-Respon
  responseExtras?: ResponseExtrasMap;
  xavieraApiKey?: string;
  xavieraBaseUrl?: string;
  lunasQrisApiKey?: string;
  lunasQrisSecretKey?: string;
  lunasQrisBaseUrl?: string;
}




