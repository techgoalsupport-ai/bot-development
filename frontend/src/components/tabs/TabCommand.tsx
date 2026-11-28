import React from 'react';
import {
  Check,
  RefreshCw,
  LayoutTemplate,
  QrCode,
} from 'lucide-react';
import {
  WhatsAppButton,
  StoreInfoConfig,
  ResponseConfigKey,
  ResponseExtraConfig,
  ResponseExtrasMap,
} from '../../types/dashboard.types';
import {
  TemplatePickerModal,
  BotCommandCategory,
  TemplatePackageResult,
} from '../modals/TemplatePickerModal';
import {
  MediaGalleryPicker,
  CollapsibleVariableChips,
  ResponsePhotoToggle,
  ResponseButtonsSection,
  ResponseSubTabPillBar,
  ResponseEditorPanel,
  ResponseSubTabItem,
} from './ResponseSectionWidgets';
import {
  getDefaultButtonsForResponse,
  mergeMandatoryButtons,
} from '../../utils/responseConfig';

interface TabCommandProps {
  selectedCommand:
    | 'Menu'
    | 'List'
    | 'Carousel'
    | 'Invoice'
    | 'Confirmation'
    | 'Transaksi'
    | 'Notifikasi'
    | 'Kontak'
    | 'Grup';
  setSelectedCommand: (
    cmd:
      | 'Menu'
      | 'List'
      | 'Carousel'
      | 'Invoice'
      | 'Confirmation'
      | 'Transaksi'
      | 'Notifikasi'
      | 'Kontak'
      | 'Grup'
  ) => void;
  // Menu Props
  menuOutputText: string;
  setMenuOutputText: (txt: string) => void;
  menuFooterText: string;
  setMenuFooterText: React.Dispatch<React.SetStateAction<string>>;
  includeMedia: boolean;
  setIncludeMedia: (val: boolean) => void;
  selectedPicture: string;
  setSelectedPicture: (pic: string) => void;
  availablePictures: string[];
  setAvailablePictures: (pics: string[]) => void;
  menuButtons: WhatsAppButton[];
  setMenuButtons: React.Dispatch<React.SetStateAction<WhatsAppButton[]>>;
  onOpenAddButtonModal: (targetKey?: ResponseConfigKey) => void;
  onEditButton: (btn: WhatsAppButton, targetKey?: ResponseConfigKey) => void;
  onDeleteButton: (id: string, targetKey?: ResponseConfigKey) => void;
  onSaveMenu: () => void;
  // List Props
  listOutputText: string;
  setListOutputText: (txt: string) => void;
  listFooterText: string;
  setListFooterText: React.Dispatch<React.SetStateAction<string>>;
  onSaveList: () => void;
  // Carousel Props
  carouselOutputText: string;
  setCarouselOutputText: (txt: string) => void;
  carouselFooterText: string;
  setCarouselFooterText: React.Dispatch<React.SetStateAction<string>>;
  carouselPicture: string;
  setCarouselPicture: (pic: string) => void;
  onSaveCarousel: () => void;
  // Invoice Props
  invoiceOutputText: string;
  setInvoiceOutputText: (txt: string) => void;
  invoiceFooterText: string;
  setInvoiceFooterText: React.Dispatch<React.SetStateAction<string>>;
  onSaveInvoice: () => void;
  // Confirmation (Checkout Promo) Props
  confirmSummaryText: string;
  setConfirmSummaryText: (txt: string) => void;
  confirmInputPromoText: string;
  setConfirmInputPromoText: (txt: string) => void;
  confirmPromoSuccessText: string;
  setConfirmPromoSuccessText: (txt: string) => void;
  confirmPromoInvalidText: string;
  setConfirmPromoInvalidText: (txt: string) => void;
  confirmFooterText: string;
  setConfirmFooterText: React.Dispatch<React.SetStateAction<string>>;
  confirmInputPromoFooter: string;
  setConfirmInputPromoFooter: React.Dispatch<React.SetStateAction<string>>;
  confirmPromoSuccessFooter: string;
  setConfirmPromoSuccessFooter: React.Dispatch<React.SetStateAction<string>>;
  confirmPromoInvalidFooter: string;
  setConfirmPromoInvalidFooter: React.Dispatch<React.SetStateAction<string>>;
  onSaveConfirmation: () => void;
  // Transaksi Props
  paymentSuccessDmText: string;
  setPaymentSuccessDmText: (txt: string) => void;
  paymentSuccessDmFooter: string;
  setPaymentSuccessDmFooter: React.Dispatch<React.SetStateAction<string>>;
  paymentSuccessGroupText: string;
  setPaymentSuccessGroupText: (txt: string) => void;
  paymentSuccessGroupFooter: string;
  setPaymentSuccessGroupFooter: React.Dispatch<React.SetStateAction<string>>;
  paymentExpiredText: string;
  setPaymentExpiredText: (txt: string) => void;
  paymentExpiredFooter: string;
  setPaymentExpiredFooter: React.Dispatch<React.SetStateAction<string>>;
  paymentErrorText: string;
  setPaymentErrorText: (txt: string) => void;
  paymentErrorFooter: string;
  setPaymentErrorFooter: React.Dispatch<React.SetStateAction<string>>;
  onSaveTransaksi: () => void;
  // Notifikasi Props
  orderGroupNotifText: string;
  setOrderGroupNotifText: (txt: string) => void;
  orderGroupNotifFooter: string;
  setOrderGroupNotifFooter: React.Dispatch<React.SetStateAction<string>>;
  stockEmptyText: string;
  stockEmptyFooter: string;
  setStockEmptyText: (txt: string) => void;
  setStockEmptyFooter: React.Dispatch<React.SetStateAction<string>>;
  sessionExpiredText: string;
  sessionExpiredFooter: string;
  setSessionExpiredText: (txt: string) => void;
  setSessionExpiredFooter: React.Dispatch<React.SetStateAction<string>>;
  promoCancelledText: string;
  promoCancelledFooter: string;
  setPromoCancelledText: (txt: string) => void;
  setPromoCancelledFooter: React.Dispatch<React.SetStateAction<string>>;
  onSaveNotifikasi: () => void;
  // Kontak Props
  contactOwnerEmptyText: string;
  setContactOwnerEmptyText: (txt: string) => void;
  contactOwnerEmptyFooter: string;
  setContactOwnerEmptyFooter: React.Dispatch<React.SetStateAction<string>>;
  contactAdminEmptyText: string;
  setContactAdminEmptyText: (txt: string) => void;
  contactAdminEmptyFooter: string;
  setContactAdminEmptyFooter: React.Dispatch<React.SetStateAction<string>>;
  expiryWarningOwnerText: string;
  setExpiryWarningOwnerText: (txt: string) => void;
  expiryWarningOwnerFooter: string;
  setExpiryWarningOwnerFooter: React.Dispatch<React.SetStateAction<string>>;
  onSaveKontak: () => void;
  // Grup (Moderasi & AntiKudeta) Props
  kickAntiKudetaText: string;
  setKickAntiKudetaText: (txt: string) => void;
  kickAntiKudetaFooter: string;
  setKickAntiKudetaFooter: React.Dispatch<React.SetStateAction<string>>;
  kickBotNotAdminText: string;
  setKickBotNotAdminText: (txt: string) => void;
  kickBotNotAdminFooter: string;
  setKickBotNotAdminFooter: React.Dispatch<React.SetStateAction<string>>;
  kickSuccessText: string;
  setKickSuccessText: (txt: string) => void;
  kickSuccessFooter: string;
  setKickSuccessFooter: React.Dispatch<React.SetStateAction<string>>;
  openBotNotAdminText: string;
  setOpenBotNotAdminText: (txt: string) => void;
  openBotNotAdminFooter: string;
  setOpenBotNotAdminFooter: React.Dispatch<React.SetStateAction<string>>;
  openAlreadyText: string;
  setOpenAlreadyText: (txt: string) => void;
  openAlreadyFooter: string;
  setOpenAlreadyFooter: React.Dispatch<React.SetStateAction<string>>;
  openSuccessText: string;
  setOpenSuccessText: (txt: string) => void;
  openSuccessFooter: string;
  setOpenSuccessFooter: React.Dispatch<React.SetStateAction<string>>;
  closeBotNotAdminText: string;
  setCloseBotNotAdminText: (txt: string) => void;
  closeBotNotAdminFooter: string;
  setCloseBotNotAdminFooter: React.Dispatch<React.SetStateAction<string>>;
  closeAlreadyText: string;
  setCloseAlreadyText: (txt: string) => void;
  closeAlreadyFooter: string;
  setCloseAlreadyFooter: React.Dispatch<React.SetStateAction<string>>;
  closeSuccessText: string;
  setCloseSuccessText: (txt: string) => void;
  closeSuccessFooter: string;
  setCloseSuccessFooter: React.Dispatch<React.SetStateAction<string>>;
  onSaveGrup: () => void;
  // Per-response Photo & Button Map
  responseExtras: ResponseExtrasMap;
  onUpdateResponseExtra: (key: ResponseConfigKey, patch: Partial<ResponseExtraConfig>) => void;
  // General Props
  storeInfo: StoreInfoConfig;
  isSavingConfig: boolean;
  showToast: (msg: string) => void;
}

const COMMAND_TABS: Array<{
  id:
    | 'Menu'
    | 'List'
    | 'Carousel'
    | 'Invoice'
    | 'Confirmation'
    | 'Transaksi'
    | 'Notifikasi'
    | 'Kontak'
    | 'Grup';
  label: string;
  desc: string;
}> = [
  { id: 'Menu', label: 'Menu', desc: 'Respon awal bot' },
  { id: 'List', label: 'List', desc: 'Daftar katalog produk' },
  { id: 'Carousel', label: 'Carousel', desc: 'Kartu varian produk' },
  { id: 'Invoice', label: 'Invoice', desc: 'Tagihan QRIS otomatis' },
  { id: 'Confirmation', label: 'Konfirmasi', desc: 'Ringkasan & promo checkout' },
  { id: 'Transaksi', label: 'Transaksi', desc: 'Lunas, expired & error QRIS' },
  { id: 'Notifikasi', label: 'Notifikasi', desc: 'Alur order grup, stok & sesi' },
  { id: 'Kontak', label: 'Kontak', desc: 'Kontak owner, admin & sewa bot' },
  { id: 'Grup', label: 'Grup', desc: 'Moderasi & keamanan grup' },
];

export const TabCommand: React.FC<TabCommandProps> = ({
  selectedCommand,
  setSelectedCommand,
  menuOutputText,
  setMenuOutputText,
  menuFooterText,
  setMenuFooterText,
  includeMedia,
  setIncludeMedia,
  selectedPicture,
  setSelectedPicture,
  availablePictures,
  setAvailablePictures,
  menuButtons,
  setMenuButtons,
  onOpenAddButtonModal,
  onEditButton,
  onDeleteButton,
  onSaveMenu,
  listOutputText,
  setListOutputText,
  listFooterText,
  setListFooterText,
  onSaveList,
  carouselOutputText,
  setCarouselOutputText,
  carouselFooterText,
  setCarouselFooterText,
  carouselPicture,
  setCarouselPicture,
  onSaveCarousel,
  invoiceOutputText,
  setInvoiceOutputText,
  invoiceFooterText,
  setInvoiceFooterText,
  onSaveInvoice,
  confirmSummaryText,
  setConfirmSummaryText,
  confirmInputPromoText,
  setConfirmInputPromoText,
  confirmPromoSuccessText,
  setConfirmPromoSuccessText,
  confirmPromoInvalidText,
  setConfirmPromoInvalidText,
  confirmFooterText,
  setConfirmFooterText,
  confirmInputPromoFooter,
  setConfirmInputPromoFooter,
  confirmPromoSuccessFooter,
  setConfirmPromoSuccessFooter,
  confirmPromoInvalidFooter,
  setConfirmPromoInvalidFooter,
  onSaveConfirmation,
  // Transaksi
  paymentSuccessDmText,
  setPaymentSuccessDmText,
  paymentSuccessDmFooter,
  setPaymentSuccessDmFooter,
  paymentSuccessGroupText,
  setPaymentSuccessGroupText,
  paymentSuccessGroupFooter,
  setPaymentSuccessGroupFooter,
  paymentExpiredText,
  setPaymentExpiredText,
  paymentExpiredFooter,
  setPaymentExpiredFooter,
  paymentErrorText,
  setPaymentErrorText,
  paymentErrorFooter,
  setPaymentErrorFooter,
  onSaveTransaksi,
  // Notifikasi
  orderGroupNotifText,
  setOrderGroupNotifText,
  orderGroupNotifFooter,
  setOrderGroupNotifFooter,
  stockEmptyText,
  stockEmptyFooter,
  setStockEmptyText,
  setStockEmptyFooter,
  sessionExpiredText,
  sessionExpiredFooter,
  setSessionExpiredText,
  setSessionExpiredFooter,
  promoCancelledText,
  promoCancelledFooter,
  setPromoCancelledText,
  setPromoCancelledFooter,
  onSaveNotifikasi,
  // Kontak
  contactOwnerEmptyText,
  setContactOwnerEmptyText,
  contactOwnerEmptyFooter,
  setContactOwnerEmptyFooter,
  contactAdminEmptyText,
  setContactAdminEmptyText,
  contactAdminEmptyFooter,
  setContactAdminEmptyFooter,
  expiryWarningOwnerText,
  setExpiryWarningOwnerText,
  expiryWarningOwnerFooter,
  setExpiryWarningOwnerFooter,
  onSaveKontak,
  // Grup
  kickAntiKudetaText,
  setKickAntiKudetaText,
  kickAntiKudetaFooter,
  setKickAntiKudetaFooter,
  kickBotNotAdminText,
  setKickBotNotAdminText,
  kickBotNotAdminFooter,
  setKickBotNotAdminFooter,
  kickSuccessText,
  setKickSuccessText,
  kickSuccessFooter,
  setKickSuccessFooter,
  openBotNotAdminText,
  setOpenBotNotAdminText,
  openBotNotAdminFooter,
  setOpenBotNotAdminFooter,
  openAlreadyText,
  setOpenAlreadyText,
  openAlreadyFooter,
  setOpenAlreadyFooter,
  openSuccessText,
  setOpenSuccessText,
  openSuccessFooter,
  setOpenSuccessFooter,
  closeBotNotAdminText,
  setCloseBotNotAdminText,
  closeBotNotAdminFooter,
  setCloseBotNotAdminFooter,
  closeAlreadyText,
  setCloseAlreadyText,
  closeAlreadyFooter,
  setCloseAlreadyFooter,
  closeSuccessText,
  setCloseSuccessText,
  closeSuccessFooter,
  setCloseSuccessFooter,
  onSaveGrup,
  responseExtras,
  onUpdateResponseExtra,
  isSavingConfig,
  showToast,
}) => {
  const insertTag = (
    tag: string,
    getter: string,
    setter: (val: string) => void,
    toastMsg?: string
  ) => {
    setter(`${getter} ${tag}`);
    showToast(toastMsg || `Tag ${tag} disisipkan`);
  };

  const getExtra = (key: ResponseConfigKey): ResponseExtraConfig => {
    if (key === 'menu') {
      return {
        includeMedia,
        selectedPicture,
        buttons: menuButtons,
      };
    }
    const raw = responseExtras[key];
    return {
      includeMedia:
        key === 'carousel' ? true : key === 'invoice' ? false : Boolean(raw?.includeMedia),
      selectedPicture:
        key === 'carousel'
          ? carouselPicture
          : raw?.selectedPicture || selectedPicture || '',
      buttons: mergeMandatoryButtons(
        key,
        Array.isArray(raw?.buttons) ? raw.buttons : getDefaultButtonsForResponse(key)
      ),
    };
  };

  const readSavedSubPill = <T extends ResponseConfigKey>(
    storageKey: string,
    allowed: readonly T[],
    fallback: T
  ): T => {
    try {
      const saved = window.sessionStorage.getItem(storageKey);
      if (saved && (allowed as readonly string[]).includes(saved)) {
        return saved as T;
      }
    } catch {}
    return fallback;
  };

  // Option B: Active Sub-Tab Pill per kategori multi-respon (tersimpan di sessionStorage agar bertahan saat refresh)
  type ConfirmSubKey =
    | 'confirm_summary'
    | 'confirm_promo_input'
    | 'confirm_promo_valid'
    | 'confirm_promo_invalid';
  type TransaksiSubKey =
    | 'payment_success_dm'
    | 'payment_success_group'
    | 'payment_expired'
    | 'payment_error';
  type NotifSubKey =
    | 'order_group_notif'
    | 'stock_empty'
    | 'checkout_session_expired'
    | 'promo_cancelled';
  type KontakSubKey =
    | 'contact_owner_empty'
    | 'contact_admin_empty'
    | 'expiry_warning_owner';
  type GrupSubKey =
    | 'kick_anti_kudeta'
    | 'kick_bot_not_admin'
    | 'kick_success'
    | 'open_bot_not_admin'
    | 'open_already'
    | 'open_success'
    | 'close_bot_not_admin'
    | 'close_already'
    | 'close_success';

  const [activeConfirmPill, setActiveConfirmPillState] = React.useState<ConfirmSubKey>(() =>
    readSavedSubPill(
      'wanzt_tenant_cmd_subpill_confirm',
      ['confirm_summary', 'confirm_promo_input', 'confirm_promo_valid', 'confirm_promo_invalid'] as const,
      'confirm_summary'
    )
  );
  const [activeTransaksiPill, setActiveTransaksiPillState] = React.useState<TransaksiSubKey>(() =>
    readSavedSubPill(
      'wanzt_tenant_cmd_subpill_transaksi',
      ['payment_success_dm', 'payment_success_group', 'payment_expired', 'payment_error'] as const,
      'payment_success_dm'
    )
  );
  const [activeNotifPill, setActiveNotifPillState] = React.useState<NotifSubKey>(() =>
    readSavedSubPill(
      'wanzt_tenant_cmd_subpill_notif',
      ['order_group_notif', 'stock_empty', 'checkout_session_expired', 'promo_cancelled'] as const,
      'order_group_notif'
    )
  );
  const [activeKontakPill, setActiveKontakPillState] = React.useState<KontakSubKey>(() =>
    readSavedSubPill(
      'wanzt_tenant_cmd_subpill_kontak',
      ['contact_owner_empty', 'contact_admin_empty', 'expiry_warning_owner'] as const,
      'contact_owner_empty'
    )
  );
  const [activeGrupPill, setActiveGrupPillState] = React.useState<GrupSubKey>(() =>
    readSavedSubPill(
      'wanzt_tenant_cmd_subpill_grup',
      [
        'kick_anti_kudeta',
        'kick_bot_not_admin',
        'kick_success',
        'open_bot_not_admin',
        'open_already',
        'open_success',
        'close_bot_not_admin',
        'close_already',
        'close_success',
      ] as const,
      'kick_anti_kudeta'
    )
  );

  const setActiveConfirmPill = (next: ConfirmSubKey) => {
    try {
      window.sessionStorage.setItem('wanzt_tenant_cmd_subpill_confirm', next);
    } catch {}
    setActiveConfirmPillState(next);
  };
  const setActiveTransaksiPill = (next: TransaksiSubKey) => {
    try {
      window.sessionStorage.setItem('wanzt_tenant_cmd_subpill_transaksi', next);
    } catch {}
    setActiveTransaksiPillState(next);
  };
  const setActiveNotifPill = (next: NotifSubKey) => {
    try {
      window.sessionStorage.setItem('wanzt_tenant_cmd_subpill_notif', next);
    } catch {}
    setActiveNotifPillState(next);
  };
  const setActiveKontakPill = (next: KontakSubKey) => {
    try {
      window.sessionStorage.setItem('wanzt_tenant_cmd_subpill_kontak', next);
    } catch {}
    setActiveKontakPillState(next);
  };
  const setActiveGrupPill = (next: GrupSubKey) => {
    try {
      window.sessionStorage.setItem('wanzt_tenant_cmd_subpill_grup', next);
    } catch {}
    setActiveGrupPillState(next);
  };

  const confirmSubTabs: Array<ResponseSubTabItem<ConfirmSubKey>> = [
    { key: 'confirm_summary', indexNumber: 1, pillLabel: 'Ringkasan Pesanan' },
    { key: 'confirm_promo_input', indexNumber: 2, pillLabel: 'Input Kode Promo' },
    { key: 'confirm_promo_valid', indexNumber: 3, pillLabel: 'Promo Valid' },
    { key: 'confirm_promo_invalid', indexNumber: 4, pillLabel: 'Promo Tidak Valid' },
  ];

  const transaksiSubTabs: Array<ResponseSubTabItem<TransaksiSubKey>> = [
    { key: 'payment_success_dm', indexNumber: 1, pillLabel: 'Lunas (DM)' },
    { key: 'payment_success_group', indexNumber: 2, pillLabel: 'Lunas (Grup)' },
    { key: 'payment_expired', indexNumber: 3, pillLabel: 'QRIS Kedaluwarsa' },
    { key: 'payment_error', indexNumber: 4, pillLabel: 'Kendala QRIS' },
  ];

  const notifSubTabs: Array<ResponseSubTabItem<NotifSubKey>> = [
    { key: 'order_group_notif', indexNumber: 1, pillLabel: 'Order Grup ke DM' },
    { key: 'stock_empty', indexNumber: 2, pillLabel: 'Stok Kosong' },
    { key: 'checkout_session_expired', indexNumber: 3, pillLabel: 'Sesi Habis' },
    { key: 'promo_cancelled', indexNumber: 4, pillLabel: 'Batal Kupon' },
  ];

  const kontakSubTabs: Array<ResponseSubTabItem<KontakSubKey>> = [
    { key: 'contact_owner_empty', indexNumber: 1, pillLabel: 'Owner Kosong' },
    { key: 'contact_admin_empty', indexNumber: 2, pillLabel: 'CS / Admin Kosong' },
    { key: 'expiry_warning_owner', indexNumber: 3, pillLabel: 'Peringatan Sewa' },
  ];

  const grupSubTabs: Array<ResponseSubTabItem<GrupSubKey>> = [
    { key: 'kick_anti_kudeta', indexNumber: 1, pillLabel: 'Kudeta Grup' },
    { key: 'kick_bot_not_admin', indexNumber: 2, pillLabel: 'Kick: Bot Bukan Admin' },
    { key: 'kick_success', indexNumber: 3, pillLabel: 'Berhasil Kick' },
    { key: 'open_bot_not_admin', indexNumber: 4, pillLabel: 'Open: Bot Bukan Admin' },
    { key: 'open_already', indexNumber: 5, pillLabel: 'Grup Sudah Terbuka' },
    { key: 'open_success', indexNumber: 6, pillLabel: 'Berhasil Buka Grup' },
    { key: 'close_bot_not_admin', indexNumber: 7, pillLabel: 'Close: Bot Bukan Admin' },
    { key: 'close_already', indexNumber: 8, pillLabel: 'Grup Sudah Ditutup' },
    { key: 'close_success', indexNumber: 9, pillLabel: 'Berhasil Tutup Grup' },
  ];

  // State Template Picker Modal (Paket Pesan + Footer + Tombol)
  const [pickerState, setPickerState] = React.useState<{
    isOpen: boolean;
    category: BotCommandCategory;
    categoryLabel: string;
    currentContent: string;
    onSelect: (pkg: TemplatePackageResult) => void;
  }>({
    isOpen: false,
    category: 'menu',
    categoryLabel: 'Menu',
    currentContent: '',
    onSelect: () => {},
  });

  const openTemplatePicker = (
    responseKey: ResponseConfigKey,
    categoryLabel: string,
    currentContent: string,
    setText: (val: string) => void,
    setFooter: (val: string) => void
  ) => {
    setPickerState({
      isOpen: true,
      category: responseKey as BotCommandCategory,
      categoryLabel,
      currentContent,
      onSelect: (pkg: TemplatePackageResult) => {
        setText(pkg.content);
        if (pkg.footer_text !== undefined) {
          setFooter(pkg.footer_text);
        }
        const incomingButtons = Array.isArray(pkg.buttons) ? pkg.buttons : [];
        if (responseKey === 'menu') {
          setMenuButtons(incomingButtons.map((b) => ({ ...b, mandatory: false, mandatoryRole: undefined })));
        } else {
          onUpdateResponseExtra(responseKey, {
            buttons: mergeMandatoryButtons(responseKey, incomingButtons),
          });
        }
      },
    });
  };

  const listExtra = getExtra('list');
  const carouselExtra = getExtra('carousel');
  const invoiceExtra = getExtra('invoice');

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Header (Desktop only label) & Ringkas Tab Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h2 className="hidden md:block text-base font-semibold text-slate-900 tracking-tight">
          Respon Bot
        </h2>

        {/* Sub-Tab Segmented Switcher */}
        <div className="w-full md:w-auto max-w-full overflow-x-auto scrollbar-none flex items-center gap-1 p-1 bg-white md:bg-slate-100/90 rounded-xl border border-slate-200/90 shadow-2xs md:shadow-none">
          {COMMAND_TABS.map((tab) => {
            const isActive = selectedCommand === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCommand(tab.id)}
                className={`shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer active:scale-[0.97] ${
                  isActive
                    ? 'bg-[#0084D1] text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* COMMAND: MENU */}
      {selectedCommand === 'Menu' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-5">
          <ResponsePhotoToggle
            title="Gambar Header Menu"
            subtitle="Sertakan foto dari galeri di atas pesan menu."
            includeMedia={includeMedia}
            onToggleMedia={setIncludeMedia}
            selectedPicture={selectedPicture}
            onSelectPicture={setSelectedPicture}
            availablePictures={availablePictures}
            setAvailablePictures={setAvailablePictures}
            showToast={showToast}
          />

          {/* Output Text */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-800">
                Teks Pesan Menu
              </label>
              <button
                type="button"
                onClick={() =>
                  openTemplatePicker('menu', 'Command Menu', menuOutputText, setMenuOutputText, setMenuFooterText)
                }
                className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-[#0084D1] text-[#0084D1] hover:text-white border border-sky-200 hover:border-transparent text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-95"
                title="Pilih Paket Template Resmi untuk Command Menu"
              >
                <LayoutTemplate className="w-3.5 h-3.5" />
                <span>Pilih Template</span>
              </button>
            </div>

            <textarea
              rows={5}
              value={menuOutputText}
              onChange={(e) => setMenuOutputText(e.target.value)}
              placeholder="Ketik teks pesan menu..."
              className="w-full bg-slate-50/60 border border-slate-200 rounded-xl p-3.5 text-sm sm:text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0084D1] focus:ring-2 focus:ring-[#0084D1]/15 transition font-sans leading-relaxed"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <CollapsibleVariableChips
                tags={['{storeName}', '{ownerName}', '{ownerNumber}', '{adminNumber}', '{webLink}', '{waLink}']}
                onInsert={(ph) => insertTag(ph, menuOutputText, setMenuOutputText)}
              />
              <span className="text-[11px] font-mono text-slate-400">Prefix: / . ! #</span>
            </div>
          </div>

          {/* Footer Text */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-800 block">
              Teks Footer
            </label>
            <input
              type="text"
              value={menuFooterText}
              onChange={(e) => setMenuFooterText(e.target.value)}
              placeholder="{webLink} (opsional)"
              className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0084D1] focus:ring-2 focus:ring-[#0084D1]/15 transition"
            />
            <CollapsibleVariableChips
              compact
              label="Variabel Footer"
              tags={['{webLink}', '{storeName}', '{ownerNumber}', '{adminNumber}']}
              onInsert={(ph) => insertTag(ph, menuFooterText, setMenuFooterText)}
            />
          </div>

          {/* Interactive WhatsApp Buttons */}
          <ResponseButtonsSection
            responseKey="menu"
            buttons={menuButtons}
            subtitle="Tombol aksi pada pesan menu."
            onAddButton={(k) => onOpenAddButtonModal(k)}
            onEditButton={(b, k) => onEditButton(b, k)}
            onDeleteButton={(id, k) => onDeleteButton(id, k)}
          />

          {/* Save Menu Bar */}
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              disabled={isSavingConfig}
              onClick={() => onSaveMenu()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 rounded-xl bg-[#0084D1] hover:bg-[#0073b7] active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSavingConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Simpan Menu</span>
            </button>
          </div>
        </div>
      )}

      {/* COMMAND: LIST */}
      {selectedCommand === 'List' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-5">
          {/* Foto Toggle Per-Respon List */}
          <ResponsePhotoToggle
            title="Gambar Header List Katalog"
            subtitle="Aktifkan untuk menyertakan foto dari galeri di atas pesan List."
            includeMedia={Boolean(listExtra.includeMedia)}
            onToggleMedia={(val) => onUpdateResponseExtra('list', { includeMedia: val })}
            selectedPicture={listExtra.selectedPicture || ''}
            onSelectPicture={(pic) => onUpdateResponseExtra('list', { selectedPicture: pic })}
            availablePictures={availablePictures}
            setAvailablePictures={setAvailablePictures}
            showToast={showToast}
          />

          {/* Output Text */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-800">
                Teks Pesan List Katalog
              </label>
              <button
                type="button"
                onClick={() =>
                  openTemplatePicker('list', 'Command List', listOutputText, setListOutputText, setListFooterText)
                }
                className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-[#0084D1] text-[#0084D1] hover:text-white border border-sky-200 hover:border-transparent text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-95"
                title="Pilih Paket Template Resmi untuk Command List"
              >
                <LayoutTemplate className="w-3.5 h-3.5" />
                <span>Pilih Template</span>
              </button>
            </div>

            <textarea
              rows={6}
              value={listOutputText}
              onChange={(e) => setListOutputText(e.target.value)}
              placeholder="Silakan pilih produk:\n\n{daftarProduk}"
              className="w-full bg-slate-50/60 border border-slate-200 rounded-xl p-3.5 text-sm sm:text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0084D1] focus:ring-2 focus:ring-[#0084D1]/15 transition font-sans leading-relaxed"
            />

            <CollapsibleVariableChips
              tags={['{storeName}', '{daftarProduk}', '{ownerName}', '{webLink}', '{adminNumber}', '{waLink}']}
              onInsert={(ph) => insertTag(ph, listOutputText, setListOutputText)}
            />
            <p className="text-[11px] text-slate-400">
              Tag <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded font-mono font-medium">{'{daftarProduk}'}</code> otomatis memuat katalog per kategori.
            </p>
          </div>

          {/* Footer Text */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-800 block">
              Teks Footer
            </label>
            <input
              type="text"
              value={listFooterText}
              onChange={(e) => setListFooterText(e.target.value)}
              placeholder="{webLink} (opsional)"
              className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0084D1] focus:ring-2 focus:ring-[#0084D1]/15 transition"
            />
            <CollapsibleVariableChips
              compact
              label="Variabel Footer"
              tags={['{webLink}', '{storeName}', '{ownerNumber}', '{adminNumber}']}
              onInsert={(ph) => insertTag(ph, listFooterText, setListFooterText)}
            />
          </div>

          {/* Tombol Wajib Dropdown + Tombol Kustom */}
          <ResponseButtonsSection
            responseKey="list"
            buttons={listExtra.buttons || []}
            subtitle="Tombol wajib menu dropdown hanya dapat diubah namanya; Anda juga bisa menambah tombol kustom."
            onAddButton={(k) => onOpenAddButtonModal(k)}
            onEditButton={(b, k) => onEditButton(b, k)}
            onDeleteButton={(id, k) => onDeleteButton(id, k)}
          />

          {/* Save List Bar */}
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              disabled={isSavingConfig}
              onClick={() => onSaveList()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 rounded-xl bg-[#0084D1] hover:bg-[#0073b7] active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSavingConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Simpan List</span>
            </button>
          </div>
        </div>
      )}

      {/* COMMAND: CAROUSEL (Tanpa saklar OFF foto karena wajib mengirim gambar di kartu) */}
      {selectedCommand === 'Carousel' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-5">
          <MediaGalleryPicker
            label="Gambar Header Kartu Carousel (Wajib Aktif)"
            selectedPicture={carouselPicture}
            onSelectPicture={setCarouselPicture}
            availablePictures={availablePictures}
            setAvailablePictures={setAvailablePictures}
            showToast={showToast}
          />

          {/* Template Output Text */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-xs font-semibold text-slate-800">
                Template Teks Kartu
              </label>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    openTemplatePicker('carousel', 'Command Carousel', carouselOutputText, setCarouselOutputText, setCarouselFooterText)
                  }
                  className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-[#0084D1] text-[#0084D1] hover:text-white border border-sky-200 hover:border-transparent text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-95"
                  title="Pilih Paket Template Resmi untuk Command Carousel"
                >
                  <LayoutTemplate className="w-3.5 h-3.5" />
                  <span>Pilih Template</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const defaultVal = `*{storeName}*\n\n*{produkName} | {category}*\n\n*Detail Produk:*\n- Varian: {varian}\n- Harga: {price}\n- Stok: {stock} tersedia\n\nSilakan pilih tindakan di bawah ini untuk melanjutkan.`;
                    setCarouselOutputText(defaultVal);
                    showToast('Template direset ke default');
                  }}
                  className="whitespace-nowrap text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Reset Default
                </button>
              </div>
            </div>

            <textarea
              rows={6}
              value={carouselOutputText}
              onChange={(e) => setCarouselOutputText(e.target.value)}
              placeholder="Tulis template kartu carousel..."
              className="w-full bg-slate-50/60 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0084D1] focus:ring-2 focus:ring-[#0084D1]/15 transition font-mono leading-relaxed"
            />

            <CollapsibleVariableChips
              tags={[
                '{storeName}',
                '{produkName}',
                '{category}',
                '{varian}',
                '{price}',
                '{stock}',
                '{adminNumber}',
                '{ownerNumber}',
                '{webLink}',
              ]}
              onInsert={(ph) => insertTag(ph, carouselOutputText, setCarouselOutputText)}
            />
          </div>

          {/* Footer Text */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-800 block">
              Teks Footer
            </label>
            <input
              type="text"
              value={carouselFooterText}
              onChange={(e) => setCarouselFooterText(e.target.value)}
              placeholder="{storeName} Official"
              className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0084D1] focus:ring-2 focus:ring-[#0084D1]/15 transition"
            />
            <CollapsibleVariableChips
              compact
              label="Variabel Footer"
              tags={['{storeName}', '{webLink}', '{ownerNumber}', '{adminNumber}']}
              onInsert={(ph) => insertTag(ph, carouselFooterText, setCarouselFooterText)}
            />
          </div>

          {/* Tombol Kartu Carousel (Order Wajib + Contact Admin Opsional + Custom) */}
          <ResponseButtonsSection
            responseKey="carousel"
            buttons={carouselExtra.buttons || []}
            subtitle="Tombol Order wajib ada di setiap kartu carousel (hanya nama dapat diubah). Tombol lain bersifat opsional."
            onAddButton={(k) => onOpenAddButtonModal(k)}
            onEditButton={(b, k) => onEditButton(b, k)}
            onDeleteButton={(id, k) => onDeleteButton(id, k)}
          />

          {/* Save Carousel Bar */}
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              disabled={isSavingConfig}
              onClick={() => onSaveCarousel()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 rounded-xl bg-[#0084D1] hover:bg-[#0073b7] active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSavingConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Simpan Carousel</span>
            </button>
          </div>
        </div>
      )}

      {/* COMMAND: INVOICE (Tanpa pengaturan foto galeri karena menggunakan QRIS dinamis) */}
      {selectedCommand === 'Invoice' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-5">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 text-xs text-slate-600">
            <QrCode className="w-4 h-4 text-[#0084D1] shrink-0" />
            <span>
              Invoice otomatis menyertakan gambar kode QR pembayaran QRIS LunasQRIS, sehingga tidak memerlukan pemilih foto galeri.
            </span>
          </div>

          {/* Output Text */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-800">
                Template Teks Tagihan Invoice
              </label>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    openTemplatePicker('invoice', 'Invoice Pembayaran', invoiceOutputText, setInvoiceOutputText, setInvoiceFooterText)
                  }
                  className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-[#0084D1] text-[#0084D1] hover:text-white border border-sky-200 hover:border-transparent text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-95"
                  title="Pilih Paket Template Resmi untuk Invoice Pembayaran"
                >
                  <LayoutTemplate className="w-3.5 h-3.5" />
                  <span>Pilih Template</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const defaultVal = `*INVOICE PEMBAYARAN*\n*{storeName}*\n\nProduk: {produkName}\nVarian: {varian}\nOrder ID: \`{orderId}\`\n\nHarga: Rp {price}\nFee: +Rp {unikCode}\n*TOTAL BAYAR: Rp {total}*\n\nTransfer tepat *Rp {total}* hingga digit terakhir agar otomatis terverifikasi.\nBatas Waktu: 15 Menit.`;
                    setInvoiceOutputText(defaultVal);
                    showToast('Template invoice direset ke default');
                  }}
                  className="whitespace-nowrap text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Reset Default
                </button>
              </div>
            </div>

            <textarea
              rows={7}
              value={invoiceOutputText}
              onChange={(e) => setInvoiceOutputText(e.target.value)}
              placeholder="Tulis template invoice di sini..."
              className="w-full bg-slate-50/60 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0084D1] focus:ring-2 focus:ring-[#0084D1]/15 transition font-mono leading-relaxed"
            />

            <CollapsibleVariableChips
              tags={[
                '{storeName}',
                '{produkName}',
                '{category}',
                '{varian}',
                '{price}',
                '{adminNumber}',
                '{webLink}',
                { tag: '{orderId}', tone: 'amber' },
                { tag: '{total}', tone: 'amber' },
                { tag: '{unikCode}', tone: 'amber' },
                { tag: '{paymentUrl}', tone: 'emerald' },
              ]}
              onInsert={(ph) => insertTag(ph, invoiceOutputText, setInvoiceOutputText)}
            />
          </div>

          {/* Footer Text */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-800 block">
              Teks Footer
            </label>
            <input
              type="text"
              value={invoiceFooterText}
              onChange={(e) => setInvoiceFooterText(e.target.value)}
              placeholder="{storeName} Official"
              className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0084D1] focus:ring-2 focus:ring-[#0084D1]/15 transition"
            />
            <CollapsibleVariableChips
              compact
              label="Variabel Footer"
              tags={['{storeName}', '{webLink}', '{ownerNumber}', '{adminNumber}']}
              onInsert={(ph) => insertTag(ph, invoiceFooterText, setInvoiceFooterText)}
            />
          </div>

          {/* Tombol Wajib Invoice: Link Bayar LunasQRIS + Hubungi Admin + Custom */}
          <ResponseButtonsSection
            responseKey="invoice"
            buttons={invoiceExtra.buttons || []}
            subtitle="Tombol Link Bayar LunasQRIS & Hubungi Admin bersifat wajib untuk keamanan pembayaran (hanya nama dapat diubah)."
            onAddButton={(k) => onOpenAddButtonModal(k)}
            onEditButton={(b, k) => onEditButton(b, k)}
            onDeleteButton={(id, k) => onDeleteButton(id, k)}
          />

          {/* Save Invoice Bar */}
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              disabled={isSavingConfig}
              onClick={() => onSaveInvoice()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 rounded-xl bg-[#0084D1] hover:bg-[#0073b7] active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSavingConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Simpan Invoice</span>
            </button>
          </div>
        </div>
      )}

      {/* COMMAND: CONFIRMATION (Option B: Sub-Tab Pill di Dalam Halaman) */}
      {selectedCommand === 'Confirmation' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-5">
          <div className="space-y-3.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Konfirmasi Checkout &amp; Promo</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih sub-tab di bawah untuk mengatur foto, pesan, footer, dan tombol interaktif tiap tahap checkout.
              </p>
            </div>

            <ResponseSubTabPillBar
              items={confirmSubTabs}
              activeKey={activeConfirmPill}
              onSelect={setActiveConfirmPill}
              ariaLabel="Sub-tab Respon Konfirmasi Checkout"
            />
          </div>

          {activeConfirmPill === 'confirm_summary' && (
            <ResponseEditorPanel
              title="Ringkasan Pesanan (Order Summary)"
              description="Dikirim saat pembeli klik Order sebelum pembayaran QRIS."
              responseKey="confirm_summary"
              extraConfig={getExtra('confirm_summary')}
              availablePictures={availablePictures}
              setAvailablePictures={setAvailablePictures}
              onUpdateExtra={(patch) => onUpdateResponseExtra('confirm_summary', patch)}
              textValue={confirmSummaryText}
              onChangeText={setConfirmSummaryText}
              textRows={5}
              textPlaceholder="Tulis template ringkasan pesanan di sini..."
              variableTags={['{storeName}', '{produkName}', '{varian}', '{price}', '{adminNumber}', '{webLink}']}
              onInsertVariable={(ph) => insertTag(ph, confirmSummaryText, setConfirmSummaryText)}
              footerLabel="Teks Footer Ringkasan Pesanan"
              footerValue={confirmFooterText}
              onChangeFooter={setConfirmFooterText}
              footerPlaceholder="{storeName} • Konfirmasi Pesanan"
              onInsertFooterVariable={(ph) => insertTag(ph, confirmFooterText, setConfirmFooterText)}
              onOpenTemplate={() =>
                openTemplatePicker('confirm_summary', 'Ringkasan Pesanan', confirmSummaryText, setConfirmSummaryText, setConfirmFooterText)
              }
              onResetDefault={() => {
                setConfirmSummaryText(
                  `🛒 *RINCIAN PESANAN*\nHalo kak, silakan konfirmasi pesanan Anda:\n\n• *Produk:* {produkName}\n• *Varian:* {varian}\n• *Harga Normal:* Rp {price}\n\nPunya kode promo? Silakan pilih tombol di bawah untuk menggunakan diskon atau langsung bayar.`
                );
                showToast('Ringkasan pesanan direset ke default');
              }}
              onAddButton={onOpenAddButtonModal}
              onEditButton={onEditButton}
              onDeleteButton={onDeleteButton}
              showToast={showToast}
            />
          )}

          {activeConfirmPill === 'confirm_promo_input' && (
            <ResponseEditorPanel
              title="Permintaan Input Kode Promo"
              description="Instruksi saat tombol Pakai Kode Promo ditekan."
              responseKey="confirm_promo_input"
              extraConfig={getExtra('confirm_promo_input')}
              availablePictures={availablePictures}
              setAvailablePictures={setAvailablePictures}
              onUpdateExtra={(patch) => onUpdateResponseExtra('confirm_promo_input', patch)}
              textValue={confirmInputPromoText}
              onChangeText={setConfirmInputPromoText}
              textRows={4}
              textPlaceholder="Tulis instruksi input kode promo di sini..."
              variableTags={['{storeName}', '{produkName}', '{varian}', '{price}']}
              onInsertVariable={(ph) => insertTag(ph, confirmInputPromoText, setConfirmInputPromoText)}
              footerLabel="Teks Footer Input Kode Promo"
              footerValue={confirmInputPromoFooter}
              onChangeFooter={setConfirmInputPromoFooter}
              footerPlaceholder="{storeName} • Konfirmasi Pesanan"
              onInsertFooterVariable={(ph) => insertTag(ph, confirmInputPromoFooter, setConfirmInputPromoFooter)}
              onOpenTemplate={() =>
                openTemplatePicker('confirm_promo_input', 'Input Kode Promo', confirmInputPromoText, setConfirmInputPromoText, setConfirmInputPromoFooter)
              }
              onResetDefault={() => {
                setConfirmInputPromoText(
                  `🎟️ *MASUKKAN KODE PROMO*\nSilakan ketik kode promo Anda (contoh: HEMAT10) atau ketik *BATAL* untuk melanjutkan dengan harga normal.\n\n⏱️ _Batas waktu: 3 menit._`
                );
                showToast('Instruksi promo direset ke default');
              }}
              onAddButton={onOpenAddButtonModal}
              onEditButton={onEditButton}
              onDeleteButton={onDeleteButton}
              showToast={showToast}
            />
          )}

          {activeConfirmPill === 'confirm_promo_valid' && (
            <ResponseEditorPanel
              title="Pesan Kode Promo Valid"
              description="Konfirmasi potongan diskon sebelum invoice QRIS."
              responseKey="confirm_promo_valid"
              extraConfig={getExtra('confirm_promo_valid')}
              availablePictures={availablePictures}
              setAvailablePictures={setAvailablePictures}
              onUpdateExtra={(patch) => onUpdateResponseExtra('confirm_promo_valid', patch)}
              textValue={confirmPromoSuccessText}
              onChangeText={setConfirmPromoSuccessText}
              textRows={5}
              textPlaceholder="Tulis template pesan promo valid di sini..."
              variableTags={[
                '{storeName}',
                '{produkName}',
                '{varian}',
                '{price}',
                { tag: '{promoCode}', tone: 'emerald' },
                { tag: '{discount}', tone: 'emerald' },
                { tag: '{finalPrice}', tone: 'emerald' },
              ]}
              onInsertVariable={(ph) => insertTag(ph, confirmPromoSuccessText, setConfirmPromoSuccessText)}
              footerLabel="Teks Footer Promo Valid"
              footerValue={confirmPromoSuccessFooter}
              onChangeFooter={setConfirmPromoSuccessFooter}
              footerPlaceholder="{storeName} • Promo Berhasil"
              onInsertFooterVariable={(ph) => insertTag(ph, confirmPromoSuccessFooter, setConfirmPromoSuccessFooter)}
              onOpenTemplate={() =>
                openTemplatePicker('confirm_promo_valid', 'Pesan Promo Valid', confirmPromoSuccessText, setConfirmPromoSuccessText, setConfirmPromoSuccessFooter)
              }
              onResetDefault={() => {
                setConfirmPromoSuccessText(
                  `🎉 *KODE PROMO BERHASIL DIGUNAKAN!*\n• *Kode Promo:* {promoCode}\n• *Harga Awal:* Rp {price}\n• *Potongan Diskon:* -Rp {discount}\n• *Total Bayar:* Rp {finalPrice}\n\nInvoice pembayaran QRIS sedang diterbitkan...`
                );
                showToast('Template promo valid direset ke default');
              }}
              onAddButton={onOpenAddButtonModal}
              onEditButton={onEditButton}
              onDeleteButton={onDeleteButton}
              showToast={showToast}
            />
          )}

          {activeConfirmPill === 'confirm_promo_invalid' && (
            <ResponseEditorPanel
              title="Pesan Kode Promo Tidak Valid"
              description="Balasan saat kupon habis, kadaluwarsa, atau salah."
              responseKey="confirm_promo_invalid"
              extraConfig={getExtra('confirm_promo_invalid')}
              availablePictures={availablePictures}
              setAvailablePictures={setAvailablePictures}
              onUpdateExtra={(patch) => onUpdateResponseExtra('confirm_promo_invalid', patch)}
              textValue={confirmPromoInvalidText}
              onChangeText={setConfirmPromoInvalidText}
              textRows={5}
              textPlaceholder="Tulis template pesan promo invalid di sini..."
              variableTags={[
                '{storeName}',
                '{produkName}',
                '{varian}',
                '{price}',
                { tag: '{promoCode}', tone: 'rose' },
                { tag: '{reason}', tone: 'rose' },
              ]}
              onInsertVariable={(ph) => insertTag(ph, confirmPromoInvalidText, setConfirmPromoInvalidText)}
              footerLabel="Teks Footer Promo Invalid"
              footerValue={confirmPromoInvalidFooter}
              onChangeFooter={setConfirmPromoInvalidFooter}
              footerPlaceholder="{storeName} • Cek Kode Promo"
              onInsertFooterVariable={(ph) => insertTag(ph, confirmPromoInvalidFooter, setConfirmPromoInvalidFooter)}
              onOpenTemplate={() =>
                openTemplatePicker('confirm_promo_invalid', 'Pesan Promo Invalid', confirmPromoInvalidText, setConfirmPromoInvalidText, setConfirmPromoInvalidFooter)
              }
              onResetDefault={() => {
                setConfirmPromoInvalidText(
                  `⚠️ *KODE PROMO TIDAK DAPAT DIGUNAKAN*\nKode promo *{promoCode}* tidak dapat diterapkan.\nPenyebab: *{reason}*\n\nSilakan ketik kode promo lain, atau ketik *BATAL* untuk lanjut bayar harga normal (Rp {price}).`
                );
                showToast('Template promo invalid direset ke default');
              }}
              onAddButton={onOpenAddButtonModal}
              onEditButton={onEditButton}
              onDeleteButton={onDeleteButton}
              showToast={showToast}
            />
          )}

          {/* Save Confirmation Bar */}
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              disabled={isSavingConfig}
              onClick={() => onSaveConfirmation()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 rounded-xl bg-[#0084D1] hover:bg-[#0073b7] active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSavingConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Simpan Konfirmasi</span>
            </button>
          </div>
        </div>
      )}

      {/* COMMAND: TRANSAKSI (Option B: Sub-Tab Pill di Dalam Halaman) */}
      {selectedCommand === 'Transaksi' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-5">
          <div className="space-y-3.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Respon Transaksi QRIS</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih sub-tab di bawah untuk mengatur foto, pesan, footer, dan tombol interaktif untuk status pembayaran.
              </p>
            </div>

            <ResponseSubTabPillBar
              items={transaksiSubTabs}
              activeKey={activeTransaksiPill}
              onSelect={setActiveTransaksiPill}
              ariaLabel="Sub-tab Respon Transaksi QRIS"
            />
          </div>

          {activeTransaksiPill === 'payment_success_dm' && (
            <ResponseEditorPanel
              title="Pembayaran Lunas (DM Pembeli)"
              description="Dikirim ke DM pembeli saat transfer QRIS terverifikasi lunas."
              responseKey="payment_success_dm"
              extraConfig={getExtra('payment_success_dm')}
              availablePictures={availablePictures}
              setAvailablePictures={setAvailablePictures}
              onUpdateExtra={(patch) => onUpdateResponseExtra('payment_success_dm', patch)}
              textValue={paymentSuccessDmText}
              onChangeText={setPaymentSuccessDmText}
              textRows={6}
              textPlaceholder="Tulis format pesan pembayaran lunas DM di sini..."
              variableTags={['{customerName}', '{customerNumber}', '{orderId}', '{produkName}', '{varian}', '{totalPrice}', '{paymentExpiry}', '{credentials}', '{accountEmail}', '{accountPassword}', '{supplierOrderId}', '{storeName}']}
              onInsertVariable={(ph) => insertTag(ph, paymentSuccessDmText, setPaymentSuccessDmText)}
              footerLabel="Teks Footer DM Lunas"
              footerValue={paymentSuccessDmFooter}
              onChangeFooter={setPaymentSuccessDmFooter}
              footerPlaceholder="{storeName} • Layanan Otomatis 24/7"
              onInsertFooterVariable={(ph) => insertTag(ph, paymentSuccessDmFooter, setPaymentSuccessDmFooter)}
              onOpenTemplate={() =>
                openTemplatePicker('payment_success_dm', 'Transaksi Lunas (DM)', paymentSuccessDmText, setPaymentSuccessDmText, setPaymentSuccessDmFooter)
              }
              onResetDefault={() => {
                setPaymentSuccessDmText('🎉 *PEMBAYARAN DITERIMA & LUNAS!*\nTerima kasih kak *{customerName}*, pembayaran untuk pesanan Anda berhasil diverifikasi otomatis.\n\n📦 *Detail Transaksi:*\n• *Order ID:* `{orderId}`\n• *Produk:* {produkName}\n• *Varian:* {varian}\n• *Total Bayar:* Rp {totalPrice}\n• *Waktu:* {paymentExpiry}\n\n🔐 *Detail Akun / Kredensial Anda:*\n{credentials}\n\nSimpan data akun di atas dengan baik. ID Order Supplier: `{supplierOrderId}`');
                showToast('Template lunas DM direset ke default');
              }}
              onAddButton={onOpenAddButtonModal}
              onEditButton={onEditButton}
              onDeleteButton={onDeleteButton}
              showToast={showToast}
            />
          )}

          {activeTransaksiPill === 'payment_success_group' && (
            <ResponseEditorPanel
              title="Notifikasi Lunas di Grup"
              description="Pengumuman transaksi sukses di grup tanpa data akun."
              responseKey="payment_success_group"
              extraConfig={getExtra('payment_success_group')}
              availablePictures={availablePictures}
              setAvailablePictures={setAvailablePictures}
              onUpdateExtra={(patch) => onUpdateResponseExtra('payment_success_group', patch)}
              textValue={paymentSuccessGroupText}
              onChangeText={setPaymentSuccessGroupText}
              textRows={6}
              textPlaceholder="Tulis format pengumuman lunas grup di sini..."
              variableTags={['{customerNumber}', '{orderId}', '{supplierOrderId}', '{produkName}', '{varian}', '{totalPrice}', '{storeName}']}
              onInsertVariable={(ph) => insertTag(ph, paymentSuccessGroupText, setPaymentSuccessGroupText)}
              footerLabel="Teks Footer Grup Lunas"
              footerValue={paymentSuccessGroupFooter}
              onChangeFooter={setPaymentSuccessGroupFooter}
              footerPlaceholder="{storeName} Official Bot"
              onInsertFooterVariable={(ph) => insertTag(ph, paymentSuccessGroupFooter, setPaymentSuccessGroupFooter)}
              onOpenTemplate={() =>
                openTemplatePicker('payment_success_group', 'Transaksi Lunas (Grup)', paymentSuccessGroupText, setPaymentSuccessGroupText, setPaymentSuccessGroupFooter)
              }
              onResetDefault={() => {
                setPaymentSuccessGroupText('🎉 *TRANSAKSI BERHASIL (LUNAS)*\n\nPembayaran untuk *{produkName}* ({varian}) berhasil diverifikasi otomatis oleh sistem!\n\n• *Order ID:* `{orderId}`\n• *Pembeli:* @{customerNumber}\n• *Total:* Rp {totalPrice}\n\nDetail pesanan telah dikirimkan ke nomor pembeli via chat pribadi (DM). Terima kasih telah berbelanja di *{storeName}*! ✨');
                showToast('Template lunas grup direset ke default');
              }}
              onAddButton={onOpenAddButtonModal}
              onEditButton={onEditButton}
              onDeleteButton={onDeleteButton}
              showToast={showToast}
            />
          )}

          {activeTransaksiPill === 'payment_expired' && (
            <ResponseEditorPanel
              title="Tagihan QRIS Kedaluwarsa"
              description="Dikirim saat batas waktu pembayaran berakhir."
              responseKey="payment_expired"
              extraConfig={getExtra('payment_expired')}
              availablePictures={availablePictures}
              setAvailablePictures={setAvailablePictures}
              onUpdateExtra={(patch) => onUpdateResponseExtra('payment_expired', patch)}
              textValue={paymentExpiredText}
              onChangeText={setPaymentExpiredText}
              textRows={4}
              textPlaceholder="Tulis pesan tagihan kedaluwarsa di sini..."
              variableTags={['{orderId}', '{storeName}', '{webLink}']}
              onInsertVariable={(ph) => insertTag(ph, paymentExpiredText, setPaymentExpiredText)}
              footerLabel="Teks Footer Kedaluwarsa"
              footerValue={paymentExpiredFooter}
              onChangeFooter={setPaymentExpiredFooter}
              footerPlaceholder="{storeName} • Auto-Cancel Invoice"
              onInsertFooterVariable={(ph) => insertTag(ph, paymentExpiredFooter, setPaymentExpiredFooter)}
              onOpenTemplate={() =>
                openTemplatePicker('payment_expired', 'Transaksi Kedaluwarsa', paymentExpiredText, setPaymentExpiredText, setPaymentExpiredFooter)
              }
              onResetDefault={() => {
                setPaymentExpiredText('⏰ *INVOICE KEDALUWARSA*\nInvoice pembayaran QRIS dengan Order ID `{orderId}` telah kedaluwarsa karena melewati batas waktu toleransi.\n\nSilakan buat pesanan baru melalui menu katalog kami jika masih berminat memesan.');
                showToast('Template expired direset ke default');
              }}
              onAddButton={onOpenAddButtonModal}
              onEditButton={onEditButton}
              onDeleteButton={onDeleteButton}
              showToast={showToast}
            />
          )}

          {activeTransaksiPill === 'payment_error' && (
            <ResponseEditorPanel
              title="Kendala Gateway QRIS"
              description="Pesan bila terjadi gangguan saat menerbitkan QRIS."
              responseKey="payment_error"
              extraConfig={getExtra('payment_error')}
              availablePictures={availablePictures}
              setAvailablePictures={setAvailablePictures}
              onUpdateExtra={(patch) => onUpdateResponseExtra('payment_error', patch)}
              textValue={paymentErrorText}
              onChangeText={setPaymentErrorText}
              textRows={4}
              textPlaceholder="Tulis pesan kendala gateway QRIS di sini..."
              variableTags={['{errorMessage}', '{adminNumber}', '{ownerNumber}', '{storeName}']}
              onInsertVariable={(ph) => insertTag(ph, paymentErrorText, setPaymentErrorText)}
              footerLabel="Teks Footer Kendala Gateway"
              footerValue={paymentErrorFooter}
              onChangeFooter={setPaymentErrorFooter}
              footerPlaceholder="{storeName} • Bantuan Pelanggan"
              onInsertFooterVariable={(ph) => insertTag(ph, paymentErrorFooter, setPaymentErrorFooter)}
              onOpenTemplate={() =>
                openTemplatePicker('payment_error', 'Kendala Gateway QRIS', paymentErrorText, setPaymentErrorText, setPaymentErrorFooter)
              }
              onResetDefault={() => {
                setPaymentErrorText('⚠️ *KENDALA PEMBUATAN INVOICE QRIS*\nMaaf kak, sistem kami mengalami kendala teknis saat menerbitkan kode pembayaran QRIS.\n\nKeterangan: *{errorMessage}*\n\nSilakan coba lagi beberapa saat lagi atau hubungi CS kami: wa.me/{adminNumber}');
                showToast('Template kendala gateway direset ke default');
              }}
              onAddButton={onOpenAddButtonModal}
              onEditButton={onEditButton}
              onDeleteButton={onDeleteButton}
              showToast={showToast}
            />
          )}

          {/* Save Button Transaksi */}
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              disabled={isSavingConfig}
              onClick={() => onSaveTransaksi()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 rounded-xl bg-[#0084D1] hover:bg-[#0073b7] active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSavingConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Simpan Respon Transaksi</span>
            </button>
          </div>
        </div>
      )}

      {/* COMMAND: NOTIFIKASI (Option B: Sub-Tab Pill di Dalam Halaman) */}
      {selectedCommand === 'Notifikasi' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-5">
          <div className="space-y-3.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Respon Notifikasi Sistem</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih sub-tab di bawah untuk mengatur foto, pesan, footer, dan tombol interaktif untuk notifikasi otomatis.
              </p>
            </div>

            <ResponseSubTabPillBar
              items={notifSubTabs}
              activeKey={activeNotifPill}
              onSelect={setActiveNotifPill}
              ariaLabel="Sub-tab Respon Notifikasi Sistem"
            />
          </div>

          {activeNotifPill === 'order_group_notif' && (
            <ResponseEditorPanel
              title="Notifikasi Order Grup ke DM"
              description="Pemberitahuan di grup untuk lanjut konfirmasi di DM."
              responseKey="order_group_notif"
              extraConfig={getExtra('order_group_notif')}
              availablePictures={availablePictures}
              setAvailablePictures={setAvailablePictures}
              onUpdateExtra={(patch) => onUpdateResponseExtra('order_group_notif', patch)}
              textValue={orderGroupNotifText}
              onChangeText={setOrderGroupNotifText}
              textRows={5}
              textPlaceholder="Tulis pesan petunjuk alur grup ke DM di sini..."
              variableTags={['{customerNumber}', '{produkName}', '{storeName}']}
              onInsertVariable={(ph) => insertTag(ph, orderGroupNotifText, setOrderGroupNotifText)}
              footerLabel="Teks Footer Alur Grup"
              footerValue={orderGroupNotifFooter}
              onChangeFooter={setOrderGroupNotifFooter}
              footerPlaceholder="{storeName} Official"
              onInsertFooterVariable={(ph) => insertTag(ph, orderGroupNotifFooter, setOrderGroupNotifFooter)}
              onOpenTemplate={() =>
                openTemplatePicker('order_group_notif', 'Alur Order Grup', orderGroupNotifText, setOrderGroupNotifText, setOrderGroupNotifFooter)
              }
              onResetDefault={() => {
                setOrderGroupNotifText('👋 Halo kak @{customerNumber}!\n\nUntuk kenyamanan dan privasi transaksi Anda, proses checkout & konfirmasi pesanan *{produkName}* telah kami kirimkan ke chat pribadi (DM) Anda.\n\nSilakan buka chat pribadi dari bot ini untuk memilih opsi promo dan melihat invoice QRIS. Terima kasih! ✨');
                showToast('Template notif alur grup direset ke default');
              }}
              onAddButton={onOpenAddButtonModal}
              onEditButton={onEditButton}
              onDeleteButton={onDeleteButton}
              showToast={showToast}
            />
          )}

          {activeNotifPill === 'stock_empty' && (
            <ResponseEditorPanel
              title="Pesan Stok Kosong / Habis"
              description="Balasan saat varian yang dipilih stoknya 0."
              responseKey="stock_empty"
              extraConfig={getExtra('stock_empty')}
              availablePictures={availablePictures}
              setAvailablePictures={setAvailablePictures}
              onUpdateExtra={(patch) => onUpdateResponseExtra('stock_empty', patch)}
              textValue={stockEmptyText}
              onChangeText={setStockEmptyText}
              textRows={4}
              textPlaceholder="Tulis pesan stok kosong di sini..."
              variableTags={['{varian}', '{produkName}', '{storeName}']}
              onInsertVariable={(ph) => insertTag(ph, stockEmptyText, setStockEmptyText)}
              footerLabel="Teks Footer Stok Kosong"
              footerValue={stockEmptyFooter}
              onChangeFooter={setStockEmptyFooter}
              footerPlaceholder="{storeName} • Info Ketersediaan Stok"
              onInsertFooterVariable={(ph) => insertTag(ph, stockEmptyFooter, setStockEmptyFooter)}
              onOpenTemplate={() =>
                openTemplatePicker('stock_empty', 'Stok Kosong', stockEmptyText, setStockEmptyText, setStockEmptyFooter)
              }
              onResetDefault={() => {
                setStockEmptyText('⚠️ *STOK SEDANG KOSONG*\nMohon maaf kak, produk/varian *{varian}* saat ini sedang habis terjual.\n\nTim kami sedang melakukan restock secepatnya. Silakan pantau terus katalog kami ya!');
                showToast('Template stok kosong direset ke default');
              }}
              onAddButton={onOpenAddButtonModal}
              onEditButton={onEditButton}
              onDeleteButton={onDeleteButton}
              showToast={showToast}
            />
          )}

          {activeNotifPill === 'checkout_session_expired' && (
            <ResponseEditorPanel
              title="Sesi Checkout Habis (3 Menit)"
              description="Notifikasi saat pembeli tidak merespon konfirmasi."
              responseKey="checkout_session_expired"
              extraConfig={getExtra('checkout_session_expired')}
              availablePictures={availablePictures}
              setAvailablePictures={setAvailablePictures}
              onUpdateExtra={(patch) => onUpdateResponseExtra('checkout_session_expired', patch)}
              textValue={sessionExpiredText}
              onChangeText={setSessionExpiredText}
              textRows={4}
              textPlaceholder="Tulis pesan timeout transaksi di sini..."
              variableTags={['{storeName}', '{webLink}']}
              onInsertVariable={(ph) => insertTag(ph, sessionExpiredText, setSessionExpiredText)}
              footerLabel="Teks Footer Timeout Sesi"
              footerValue={sessionExpiredFooter}
              onChangeFooter={setSessionExpiredFooter}
              footerPlaceholder="{storeName} • Auto-Timeout System"
              onInsertFooterVariable={(ph) => insertTag(ph, sessionExpiredFooter, setSessionExpiredFooter)}
              onOpenTemplate={() =>
                openTemplatePicker('checkout_session_expired', 'Sesi Checkout Habis', sessionExpiredText, setSessionExpiredText, setSessionExpiredFooter)
              }
              onResetDefault={() => {
                setSessionExpiredText('⏱️ *SESI TRANSAKSI KEDALUWARSA*\nBatas waktu transaksi 3 menit telah berakhir karena tidak ada aktivitas respon.\n\nSesi pembelian ini dibatalkan secara otomatis demi keamanan sistem. Silakan ulangi pemesanan produk jika Anda masih ingin melanjutkan.');
                showToast('Template sesi habis direset ke default');
              }}
              onAddButton={onOpenAddButtonModal}
              onEditButton={onEditButton}
              onDeleteButton={onDeleteButton}
              showToast={showToast}
            />
          )}

          {activeNotifPill === 'promo_cancelled' && (
            <ResponseEditorPanel
              title="Pembatalan Kupon Promo ('BATAL')"
              description="Balasan saat pembeli batal pakai kupon dan bayar normal."
              responseKey="promo_cancelled"
              extraConfig={getExtra('promo_cancelled')}
              availablePictures={availablePictures}
              setAvailablePictures={setAvailablePictures}
              onUpdateExtra={(patch) => onUpdateResponseExtra('promo_cancelled', patch)}
              textValue={promoCancelledText}
              onChangeText={setPromoCancelledText}
              textRows={4}
              textPlaceholder="Tulis pesan pembatalan kupon promo di sini..."
              variableTags={['{price}', '{storeName}']}
              onInsertVariable={(ph) => insertTag(ph, promoCancelledText, setPromoCancelledText)}
              footerLabel="Teks Footer Batal Promo"
              footerValue={promoCancelledFooter}
              onChangeFooter={setPromoCancelledFooter}
              footerPlaceholder="{storeName} • Checkout Normal"
              onInsertFooterVariable={(ph) => insertTag(ph, promoCancelledFooter, setPromoCancelledFooter)}
              onOpenTemplate={() =>
                openTemplatePicker('promo_cancelled', 'Kupon Dibatalkan', promoCancelledText, setPromoCancelledText, setPromoCancelledFooter)
              }
              onResetDefault={() => {
                setPromoCancelledText('✅ *PENGGUNAAN KODE PROMO DIBATALKAN*\nKupon promo berhasil dibatalkan. Pesanan Anda akan diproses dengan harga normal *Rp {price}*.\n\nInvoice QRIS sedang diterbitkan...');
                showToast('Template batal promo direset ke default');
              }}
              onAddButton={onOpenAddButtonModal}
              onEditButton={onEditButton}
              onDeleteButton={onDeleteButton}
              showToast={showToast}
            />
          )}

          {/* Save Button Notifikasi */}
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              disabled={isSavingConfig}
              onClick={() => onSaveNotifikasi()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 rounded-xl bg-[#0084D1] hover:bg-[#0073b7] active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSavingConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Simpan Respon Notifikasi</span>
            </button>
          </div>
        </div>
      )}

      {/* COMMAND: KONTAK & INFO (Option B: Sub-Tab Pill di Dalam Halaman) */}
      {selectedCommand === 'Kontak' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-5">
          <div className="space-y-3.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Kontak Toko &amp; Peringatan Sewa</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih sub-tab di bawah untuk mengatur foto, pesan, footer, dan tombol interaktif untuk kontak maupun peringatan sewa.
              </p>
            </div>

            <ResponseSubTabPillBar
              items={kontakSubTabs}
              activeKey={activeKontakPill}
              onSelect={setActiveKontakPill}
              ariaLabel="Sub-tab Respon Kontak Toko dan Sewa"
            />
          </div>

          {activeKontakPill === 'contact_owner_empty' && (
            <ResponseEditorPanel
              title="Kontak Owner Belum Diatur"
              description="Balasan perintah /owner bila nomor belum diset."
              responseKey="contact_owner_empty"
              extraConfig={getExtra('contact_owner_empty')}
              availablePictures={availablePictures}
              setAvailablePictures={setAvailablePictures}
              onUpdateExtra={(patch) => onUpdateResponseExtra('contact_owner_empty', patch)}
              textValue={contactOwnerEmptyText}
              onChangeText={setContactOwnerEmptyText}
              textRows={4}
              textPlaceholder="Tulis respon kontak owner belum diatur..."
              variableTags={['{storeName}', '{webLink}', '{adminNumber}']}
              onInsertVariable={(ph) => insertTag(ph, contactOwnerEmptyText, setContactOwnerEmptyText)}
              footerLabel="Teks Footer Kontak Owner Kosong"
              footerValue={contactOwnerEmptyFooter}
              onChangeFooter={setContactOwnerEmptyFooter}
              footerPlaceholder="{storeName} • Informasi Owner"
              onInsertFooterVariable={(ph) => insertTag(ph, contactOwnerEmptyFooter, setContactOwnerEmptyFooter)}
              onOpenTemplate={() =>
                openTemplatePicker('contact_owner_empty', 'Kontak Owner Belum Diatur', contactOwnerEmptyText, setContactOwnerEmptyText, setContactOwnerEmptyFooter)
              }
              onResetDefault={() => {
                setContactOwnerEmptyText('ℹ️ *INFORMASI KONTAK OWNER*\nKontak WhatsApp Owner saat ini belum dikonfigurasi di dashboard bot toko ini.\n\nSilakan hubungi admin bot atau coba kembali nanti.');
                showToast('Template kontak owner kosong direset ke default');
              }}
              onAddButton={onOpenAddButtonModal}
              onEditButton={onEditButton}
              onDeleteButton={onDeleteButton}
              showToast={showToast}
            />
          )}

          {activeKontakPill === 'contact_admin_empty' && (
            <ResponseEditorPanel
              title="Kontak CS / Admin Belum Diatur"
              description="Balasan perintah /admin bila nomor belum diset."
              responseKey="contact_admin_empty"
              extraConfig={getExtra('contact_admin_empty')}
              availablePictures={availablePictures}
              setAvailablePictures={setAvailablePictures}
              onUpdateExtra={(patch) => onUpdateResponseExtra('contact_admin_empty', patch)}
              textValue={contactAdminEmptyText}
              onChangeText={setContactAdminEmptyText}
              textRows={4}
              textPlaceholder="Tulis respon kontak CS / admin belum diatur..."
              variableTags={['{storeName}', '{webLink}', '{ownerNumber}']}
              onInsertVariable={(ph) => insertTag(ph, contactAdminEmptyText, setContactAdminEmptyText)}
              footerLabel="Teks Footer Kontak Admin Kosong"
              footerValue={contactAdminEmptyFooter}
              onChangeFooter={setContactAdminEmptyFooter}
              footerPlaceholder="{storeName} • Layanan Pelanggan"
              onInsertFooterVariable={(ph) => insertTag(ph, contactAdminEmptyFooter, setContactAdminEmptyFooter)}
              onOpenTemplate={() =>
                openTemplatePicker('contact_admin_empty', 'Kontak Admin Belum Diatur', contactAdminEmptyText, setContactAdminEmptyText, setContactAdminEmptyFooter)
              }
              onResetDefault={() => {
                setContactAdminEmptyText('ℹ️ *INFORMASI LAYANAN PELANGGAN (CS)*\nKontak Customer Service / Admin saat ini belum dikonfigurasi di dashboard bot toko ini.\n\nSilakan coba hubungi pemilik toko atau coba kembali nanti.');
                showToast('Template kontak admin kosong direset ke default');
              }}
              onAddButton={onOpenAddButtonModal}
              onEditButton={onEditButton}
              onDeleteButton={onDeleteButton}
              showToast={showToast}
            />
          )}

          {activeKontakPill === 'expiry_warning_owner' && (
            <ResponseEditorPanel
              title="Peringatan Masa Sewa Kedaluwarsa"
              description="Notifikasi ke WhatsApp owner sebelum masa aktif habis."
              responseKey="expiry_warning_owner"
              extraConfig={getExtra('expiry_warning_owner')}
              availablePictures={availablePictures}
              setAvailablePictures={setAvailablePictures}
              onUpdateExtra={(patch) => onUpdateResponseExtra('expiry_warning_owner', patch)}
              textValue={expiryWarningOwnerText}
              onChangeText={setExpiryWarningOwnerText}
              textRows={5}
              textPlaceholder="Tulis pesan peringatan masa sewa bot di sini..."
              variableTags={['{ownerName}', '{storeName}', '{tenantId}', '{remainingTime}', '{expiryDate}', '{extendUrl}']}
              onInsertVariable={(ph) => insertTag(ph, expiryWarningOwnerText, setExpiryWarningOwnerText)}
              footerLabel="Teks Footer Peringatan Sewa"
              footerValue={expiryWarningOwnerFooter}
              onChangeFooter={setExpiryWarningOwnerFooter}
              footerPlaceholder="Sistem Notifikasi Otomatis Master Server"
              onInsertFooterVariable={(ph) => insertTag(ph, expiryWarningOwnerFooter, setExpiryWarningOwnerFooter)}
              onOpenTemplate={() =>
                openTemplatePicker('expiry_warning_owner', 'Peringatan Masa Sewa Bot', expiryWarningOwnerText, setExpiryWarningOwnerText, setExpiryWarningOwnerFooter)
              }
              onResetDefault={() => {
                setExpiryWarningOwnerText('⚠️ *PERINGATAN MASA AKTIF BOT WHATSAPP*\nHalo *{ownerName}*, bot toko *{storeName}* (Tenant ID: `{tenantId}`) memiliki sisa masa aktif *{remainingTime}*.\n\nMasa sewa akan kedaluwarsa pada:\n📅 *{expiryDate}*\n\nSegera hubungi Master Admin untuk memperpanjang masa aktif agar layanan bot WhatsApp toko Anda tidak terhenti otomatis.');
                showToast('Template peringatan masa sewa direset ke default');
              }}
              onAddButton={onOpenAddButtonModal}
              onEditButton={onEditButton}
              onDeleteButton={onDeleteButton}
              showToast={showToast}
            />
          )}

          {/* Save Button Kontak */}
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              disabled={isSavingConfig}
              onClick={() => onSaveKontak()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 rounded-xl bg-[#0084D1] hover:bg-[#0073b7] active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSavingConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Simpan Respon Kontak</span>
            </button>
          </div>
        </div>
      )}

      {/* COMMAND: GRUP (Moderasi & Proteksi AntiKudeta) */}
      {selectedCommand === 'Grup' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-5">
          <div className="space-y-3.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Respon Moderasi &amp; Keamanan Grup</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Atur pesan balasan command grup (Kick, Open, Close &amp; Proteksi AntiKudeta Owner).
              </p>
            </div>

            <ResponseSubTabPillBar
              items={grupSubTabs}
              activeKey={activeGrupPill}
              onSelect={setActiveGrupPill}
              ariaLabel="Sub-tab Respon Moderasi Grup"
            />
          </div>

          {activeGrupPill === 'kick_anti_kudeta' && (
            <ResponseEditorPanel
              title="Pesan Kudeta Grup (AntiKudeta Owner)"
              description="Dikirim otomatis saat admin grup mencoba mengeluarkan nomor Owner via command Kick."
              responseKey="kick_anti_kudeta"
              extraConfig={getExtra('kick_anti_kudeta')}
              availablePictures={availablePictures}
              setAvailablePictures={setAvailablePictures}
              onUpdateExtra={(patch) => onUpdateResponseExtra('kick_anti_kudeta', patch)}
              textValue={kickAntiKudetaText}
              onChangeText={setKickAntiKudetaText}
              textRows={4}
              textPlaceholder="Tulis pesan peringatan AntiKudeta grup di sini..."
              variableTags={[
                { tag: '@{pelakuNumber}', tone: 'rose' },
                { tag: '{ownerName}', tone: 'emerald' },
                '{pelakuName}',
                '{ownerNumber}',
                '{groupName}',
                '{storeName}',
              ]}
              onInsertVariable={(ph) => insertTag(ph, kickAntiKudetaText, setKickAntiKudetaText)}
              footerLabel="Teks Footer Kudeta Grup"
              footerValue={kickAntiKudetaFooter}
              onChangeFooter={setKickAntiKudetaFooter}
              footerPlaceholder="{storeName} • Proteksi AntiKudeta"
              onInsertFooterVariable={(ph) => insertTag(ph, kickAntiKudetaFooter, setKickAntiKudetaFooter)}
              onOpenTemplate={() =>
                openTemplatePicker(
                  'kick_anti_kudeta',
                  'Kudeta Grup (AntiKudeta)',
                  kickAntiKudetaText,
                  setKickAntiKudetaText,
                  setKickAntiKudetaFooter
                )
              }
              onResetDefault={() => {
                setKickAntiKudetaText(
                  '[AntiKudeta] @{pelakuNumber} terdeteksi mencoba mengeluarkan {ownerName} (Owner)'
                );
                setKickAntiKudetaFooter('{storeName} • Proteksi AntiKudeta');
                showToast('Template Kudeta Grup direset ke default');
              }}
              onAddButton={onOpenAddButtonModal}
              onEditButton={onEditButton}
              onDeleteButton={onDeleteButton}
              showToast={showToast}
            />
          )}

          {activeGrupPill === 'kick_bot_not_admin' && (
            <ResponseEditorPanel
              title="Pesan Bot Bukan Admin Grup"
              description="Dikirim saat admin grup memicu command Kick namun nomor bot belum dijadikan admin grup."
              responseKey="kick_bot_not_admin"
              extraConfig={getExtra('kick_bot_not_admin')}
              availablePictures={availablePictures}
              setAvailablePictures={setAvailablePictures}
              onUpdateExtra={(patch) => onUpdateResponseExtra('kick_bot_not_admin', patch)}
              textValue={kickBotNotAdminText}
              onChangeText={setKickBotNotAdminText}
              textRows={4}
              textPlaceholder="Tulis pesan pemberitahuan bot belum menjadi admin grup..."
              variableTags={['{groupName}', '@{pelakuNumber}', '{pelakuName}', '{storeName}']}
              onInsertVariable={(ph) => insertTag(ph, kickBotNotAdminText, setKickBotNotAdminText)}
              footerLabel="Teks Footer Bot Bukan Admin"
              footerValue={kickBotNotAdminFooter}
              onChangeFooter={setKickBotNotAdminFooter}
              footerPlaceholder="{storeName} • Moderasi Grup"
              onInsertFooterVariable={(ph) => insertTag(ph, kickBotNotAdminFooter, setKickBotNotAdminFooter)}
              onOpenTemplate={() =>
                openTemplatePicker(
                  'kick_bot_not_admin',
                  'Bot Bukan Admin Grup',
                  kickBotNotAdminText,
                  setKickBotNotAdminText,
                  setKickBotNotAdminFooter
                )
              }
              onResetDefault={() => {
                setKickBotNotAdminText(
                  '⚠️ *Bot Bukan Admin*\nBot belum menjadi admin di grup *{groupName}*, sehingga tidak dapat mengeluarkan anggota.\n\nSilakan jadikan nomor bot sebagai admin grup terlebih dahulu.'
                );
                setKickBotNotAdminFooter('{storeName} • Moderasi Grup');
                showToast('Template Bot Bukan Admin direset ke default');
              }}
              onAddButton={onOpenAddButtonModal}
              onEditButton={onEditButton}
              onDeleteButton={onDeleteButton}
              showToast={showToast}
            />
          )}

          {activeGrupPill === 'kick_success' && (
            <ResponseEditorPanel
              title="Pesan Berhasil Mengeluarkan Anggota"
              description="Dikirim setelah bot berhasil mengeluarkan anggota target dari grup."
              responseKey="kick_success"
              extraConfig={getExtra('kick_success')}
              availablePictures={availablePictures}
              setAvailablePictures={setAvailablePictures}
              onUpdateExtra={(patch) => onUpdateResponseExtra('kick_success', patch)}
              textValue={kickSuccessText}
              onChangeText={setKickSuccessText}
              textRows={4}
              textPlaceholder="Tulis pesan konfirmasi anggota berhasil dikeluarkan..."
              variableTags={[
                { tag: '@{targetNumber}', tone: 'amber' },
                '@{pelakuNumber}',
                '{pelakuName}',
                '{groupName}',
                '{storeName}',
              ]}
              onInsertVariable={(ph) => insertTag(ph, kickSuccessText, setKickSuccessText)}
              footerLabel="Teks Footer Berhasil Kick"
              footerValue={kickSuccessFooter}
              onChangeFooter={setKickSuccessFooter}
              footerPlaceholder="{storeName} • Moderasi Grup"
              onInsertFooterVariable={(ph) => insertTag(ph, kickSuccessFooter, setKickSuccessFooter)}
              onOpenTemplate={() =>
                openTemplatePicker(
                  'kick_success',
                  'Berhasil Mengeluarkan Anggota',
                  kickSuccessText,
                  setKickSuccessText,
                  setKickSuccessFooter
                )
              }
              onResetDefault={() => {
                setKickSuccessText(
                  '✅ @{targetNumber} berhasil dikeluarkan dari grup *{groupName}* oleh @{pelakuNumber}.'
                );
                setKickSuccessFooter('{storeName} • Moderasi Grup');
                showToast('Template Berhasil Kick direset ke default');
              }}
              onAddButton={onOpenAddButtonModal}
              onEditButton={onEditButton}
              onDeleteButton={onDeleteButton}
              showToast={showToast}
            />
          )}

          {activeGrupPill === 'open_bot_not_admin' && (
            <ResponseEditorPanel
              title="Open: Pesan Bot Bukan Admin Grup"
              description="Dikirim saat admin grup memicu command Open namun nomor bot belum dijadikan admin grup."
              responseKey="open_bot_not_admin"
              extraConfig={getExtra('open_bot_not_admin')}
              availablePictures={availablePictures}
              setAvailablePictures={setAvailablePictures}
              onUpdateExtra={(patch) => onUpdateResponseExtra('open_bot_not_admin', patch)}
              textValue={openBotNotAdminText}
              onChangeText={setOpenBotNotAdminText}
              textRows={4}
              textPlaceholder="Tulis pesan pemberitahuan bot belum menjadi admin saat command Open..."
              variableTags={['{groupName}', '@{pelakuNumber}', '{pelakuName}', '{storeName}']}
              onInsertVariable={(ph) => insertTag(ph, openBotNotAdminText, setOpenBotNotAdminText)}
              footerLabel="Teks Footer Open Bot Bukan Admin"
              footerValue={openBotNotAdminFooter}
              onChangeFooter={setOpenBotNotAdminFooter}
              footerPlaceholder="{storeName} • Moderasi Grup"
              onInsertFooterVariable={(ph) => insertTag(ph, openBotNotAdminFooter, setOpenBotNotAdminFooter)}
              onOpenTemplate={() =>
                openTemplatePicker(
                  'open_bot_not_admin',
                  'Open: Bot Bukan Admin Grup',
                  openBotNotAdminText,
                  setOpenBotNotAdminText,
                  setOpenBotNotAdminFooter
                )
              }
              onResetDefault={() => {
                setOpenBotNotAdminText(
                  '⚠️ *Bot Bukan Admin*\nBot belum menjadi admin di grup *{groupName}*, sehingga tidak dapat membuka pengaturan chat grup.\n\nSilakan jadikan nomor bot sebagai admin grup terlebih dahulu.'
                );
                setOpenBotNotAdminFooter('{storeName} • Moderasi Grup');
                showToast('Template Open: Bot Bukan Admin direset ke default');
              }}
              onAddButton={onOpenAddButtonModal}
              onEditButton={onEditButton}
              onDeleteButton={onDeleteButton}
              showToast={showToast}
            />
          )}

          {activeGrupPill === 'open_already' && (
            <ResponseEditorPanel
              title="Open: Pesan Grup Sudah Terbuka"
              description="Dikirim saat admin grup memicu command Open padahal grup sudah dalam keadaan terbuka untuk semua anggota."
              responseKey="open_already"
              extraConfig={getExtra('open_already')}
              availablePictures={availablePictures}
              setAvailablePictures={setAvailablePictures}
              onUpdateExtra={(patch) => onUpdateResponseExtra('open_already', patch)}
              textValue={openAlreadyText}
              onChangeText={setOpenAlreadyText}
              textRows={3}
              textPlaceholder="Tulis pesan informasi kondisi grup sudah terbuka..."
              variableTags={['{groupName}', '@{pelakuNumber}', '{pelakuName}', '{storeName}']}
              onInsertVariable={(ph) => insertTag(ph, openAlreadyText, setOpenAlreadyText)}
              footerLabel="Teks Footer Open Sudah Terbuka"
              footerValue={openAlreadyFooter}
              onChangeFooter={setOpenAlreadyFooter}
              footerPlaceholder="{storeName} • Moderasi Grup"
              onInsertFooterVariable={(ph) => insertTag(ph, openAlreadyFooter, setOpenAlreadyFooter)}
              onOpenTemplate={() =>
                openTemplatePicker(
                  'open_already',
                  'Open: Grup Sudah Terbuka',
                  openAlreadyText,
                  setOpenAlreadyText,
                  setOpenAlreadyFooter
                )
              }
              onResetDefault={() => {
                setOpenAlreadyText(
                  'ℹ️ Kondisi grup *{groupName}* saat ini sudah dalam keadaan terbuka (semua anggota dapat mengirim pesan).'
                );
                setOpenAlreadyFooter('{storeName} • Moderasi Grup');
                showToast('Template Open: Grup Sudah Terbuka direset ke default');
              }}
              onAddButton={onOpenAddButtonModal}
              onEditButton={onEditButton}
              onDeleteButton={onDeleteButton}
              showToast={showToast}
            />
          )}

          {activeGrupPill === 'open_success' && (
            <ResponseEditorPanel
              title="Open: Pesan Grup Berhasil Dibuka"
              description="Dikirim setelah bot berhasil membuka pengaturan grup agar semua anggota dapat mengirim pesan."
              responseKey="open_success"
              extraConfig={getExtra('open_success')}
              availablePictures={availablePictures}
              setAvailablePictures={setAvailablePictures}
              onUpdateExtra={(patch) => onUpdateResponseExtra('open_success', patch)}
              textValue={openSuccessText}
              onChangeText={setOpenSuccessText}
              textRows={3}
              textPlaceholder="Tulis pesan konfirmasi grup berhasil dibuka..."
              variableTags={['@{pelakuNumber}', '{pelakuName}', '{groupName}', '{storeName}']}
              onInsertVariable={(ph) => insertTag(ph, openSuccessText, setOpenSuccessText)}
              footerLabel="Teks Footer Berhasil Buka Grup"
              footerValue={openSuccessFooter}
              onChangeFooter={setOpenSuccessFooter}
              footerPlaceholder="{storeName} • Moderasi Grup"
              onInsertFooterVariable={(ph) => insertTag(ph, openSuccessFooter, setOpenSuccessFooter)}
              onOpenTemplate={() =>
                openTemplatePicker(
                  'open_success',
                  'Open: Berhasil Buka Grup',
                  openSuccessText,
                  setOpenSuccessText,
                  setOpenSuccessFooter
                )
              }
              onResetDefault={() => {
                setOpenSuccessText(
                  '🔓 Grup *{groupName}* berhasil dibuka oleh @{pelakuNumber}. Sekarang semua anggota dapat mengirim pesan.'
                );
                setOpenSuccessFooter('{storeName} • Moderasi Grup');
                showToast('Template Open: Berhasil Buka Grup direset ke default');
              }}
              onAddButton={onOpenAddButtonModal}
              onEditButton={onEditButton}
              onDeleteButton={onDeleteButton}
              showToast={showToast}
            />
          )}

          {activeGrupPill === 'close_bot_not_admin' && (
            <ResponseEditorPanel
              title="Close: Pesan Bot Bukan Admin Grup"
              description="Dikirim saat admin grup memicu command Close namun nomor bot belum dijadikan admin grup."
              responseKey="close_bot_not_admin"
              extraConfig={getExtra('close_bot_not_admin')}
              availablePictures={availablePictures}
              setAvailablePictures={setAvailablePictures}
              onUpdateExtra={(patch) => onUpdateResponseExtra('close_bot_not_admin', patch)}
              textValue={closeBotNotAdminText}
              onChangeText={setCloseBotNotAdminText}
              textRows={4}
              textPlaceholder="Tulis pesan pemberitahuan bot belum menjadi admin saat command Close..."
              variableTags={['{groupName}', '@{pelakuNumber}', '{pelakuName}', '{storeName}']}
              onInsertVariable={(ph) => insertTag(ph, closeBotNotAdminText, setCloseBotNotAdminText)}
              footerLabel="Teks Footer Close Bot Bukan Admin"
              footerValue={closeBotNotAdminFooter}
              onChangeFooter={setCloseBotNotAdminFooter}
              footerPlaceholder="{storeName} • Moderasi Grup"
              onInsertFooterVariable={(ph) => insertTag(ph, closeBotNotAdminFooter, setCloseBotNotAdminFooter)}
              onOpenTemplate={() =>
                openTemplatePicker(
                  'close_bot_not_admin',
                  'Close: Bot Bukan Admin Grup',
                  closeBotNotAdminText,
                  setCloseBotNotAdminText,
                  setCloseBotNotAdminFooter
                )
              }
              onResetDefault={() => {
                setCloseBotNotAdminText(
                  '⚠️ *Bot Bukan Admin*\nBot belum menjadi admin di grup *{groupName}*, sehingga tidak dapat menutup pengaturan chat grup.\n\nSilakan jadikan nomor bot sebagai admin grup terlebih dahulu.'
                );
                setCloseBotNotAdminFooter('{storeName} • Moderasi Grup');
                showToast('Template Close: Bot Bukan Admin direset ke default');
              }}
              onAddButton={onOpenAddButtonModal}
              onEditButton={onEditButton}
              onDeleteButton={onDeleteButton}
              showToast={showToast}
            />
          )}

          {activeGrupPill === 'close_already' && (
            <ResponseEditorPanel
              title="Close: Pesan Grup Sudah Ditutup"
              description="Dikirim saat admin grup memicu command Close padahal grup sudah dalam keadaan tertutup (hanya admin yang dapat mengirim pesan)."
              responseKey="close_already"
              extraConfig={getExtra('close_already')}
              availablePictures={availablePictures}
              setAvailablePictures={setAvailablePictures}
              onUpdateExtra={(patch) => onUpdateResponseExtra('close_already', patch)}
              textValue={closeAlreadyText}
              onChangeText={setCloseAlreadyText}
              textRows={3}
              textPlaceholder="Tulis pesan informasi kondisi grup sudah ditutup..."
              variableTags={['{groupName}', '@{pelakuNumber}', '{pelakuName}', '{storeName}']}
              onInsertVariable={(ph) => insertTag(ph, closeAlreadyText, setCloseAlreadyText)}
              footerLabel="Teks Footer Close Sudah Ditutup"
              footerValue={closeAlreadyFooter}
              onChangeFooter={setCloseAlreadyFooter}
              footerPlaceholder="{storeName} • Moderasi Grup"
              onInsertFooterVariable={(ph) => insertTag(ph, closeAlreadyFooter, setCloseAlreadyFooter)}
              onOpenTemplate={() =>
                openTemplatePicker(
                  'close_already',
                  'Close: Grup Sudah Ditutup',
                  closeAlreadyText,
                  setCloseAlreadyText,
                  setCloseAlreadyFooter
                )
              }
              onResetDefault={() => {
                setCloseAlreadyText(
                  'ℹ️ Kondisi grup *{groupName}* saat ini sudah dalam keadaan ditutup (hanya admin yang dapat mengirim pesan).'
                );
                setCloseAlreadyFooter('{storeName} • Moderasi Grup');
                showToast('Template Close: Grup Sudah Ditutup direset ke default');
              }}
              onAddButton={onOpenAddButtonModal}
              onEditButton={onEditButton}
              onDeleteButton={onDeleteButton}
              showToast={showToast}
            />
          )}

          {activeGrupPill === 'close_success' && (
            <ResponseEditorPanel
              title="Close: Pesan Grup Berhasil Ditutup"
              description="Dikirim setelah bot berhasil menutup pengaturan grup sehingga hanya admin yang dapat mengirim pesan."
              responseKey="close_success"
              extraConfig={getExtra('close_success')}
              availablePictures={availablePictures}
              setAvailablePictures={setAvailablePictures}
              onUpdateExtra={(patch) => onUpdateResponseExtra('close_success', patch)}
              textValue={closeSuccessText}
              onChangeText={setCloseSuccessText}
              textRows={3}
              textPlaceholder="Tulis pesan konfirmasi grup berhasil ditutup..."
              variableTags={['@{pelakuNumber}', '{pelakuName}', '{groupName}', '{storeName}']}
              onInsertVariable={(ph) => insertTag(ph, closeSuccessText, setCloseSuccessText)}
              footerLabel="Teks Footer Berhasil Tutup Grup"
              footerValue={closeSuccessFooter}
              onChangeFooter={setCloseSuccessFooter}
              footerPlaceholder="{storeName} • Moderasi Grup"
              onInsertFooterVariable={(ph) => insertTag(ph, closeSuccessFooter, setCloseSuccessFooter)}
              onOpenTemplate={() =>
                openTemplatePicker(
                  'close_success',
                  'Close: Berhasil Tutup Grup',
                  closeSuccessText,
                  setCloseSuccessText,
                  setCloseSuccessFooter
                )
              }
              onResetDefault={() => {
                setCloseSuccessText(
                  '🔒 Grup *{groupName}* berhasil ditutup oleh @{pelakuNumber}. Sekarang hanya admin yang dapat mengirim pesan.'
                );
                setCloseSuccessFooter('{storeName} • Moderasi Grup');
                showToast('Template Close: Berhasil Tutup Grup direset ke default');
              }}
              onAddButton={onOpenAddButtonModal}
              onEditButton={onEditButton}
              onDeleteButton={onDeleteButton}
              showToast={showToast}
            />
          )}

          {/* Save Button Grup */}
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              disabled={isSavingConfig}
              onClick={() => onSaveGrup()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 rounded-xl bg-[#0084D1] hover:bg-[#0073b7] active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSavingConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Simpan Respon Grup</span>
            </button>
          </div>
        </div>
      )}

      {/* Template Picker Modal */}
      <TemplatePickerModal
        isOpen={pickerState.isOpen}
        onClose={() => setPickerState((prev) => ({ ...prev, isOpen: false }))}
        category={pickerState.category}
        categoryLabel={pickerState.categoryLabel}
        currentContent={pickerState.currentContent}
        onSelectTemplate={pickerState.onSelect}
        showToast={showToast}
      />
    </div>
  );
};
