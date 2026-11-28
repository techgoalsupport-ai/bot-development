import { useState, useEffect, useCallback } from 'react';
import {
  ResponseConfigKey,
  ResponseExtraConfig,
  ResponseExtrasMap,
  StoreInfoConfig,
  WhatsAppButton,
} from '../types/dashboard.types';
import {
  ALL_RESPONSE_CONFIG_KEYS,
  createDefaultResponseExtras,
  getDefaultButtonsForResponse,
  mergeMandatoryButtons,
} from '../utils/responseConfig';

export function useStoreConfig(
  xavieraApiKey: string,
  xavieraBaseUrl: string,
  showToast: (msg: string) => void
) {
  // Store Info State (tersimpan valid di server) & Draft State (input aktif di Info Profil)
  const [storeInfo, setStoreInfo] = useState<StoreInfoConfig>({
    storeName: '',
    ownerName: '',
    ownerNumber: '',
    adminName: '',
    adminNumber: '',
    webLink: '',
    telegramBot: '',
    waLink: '',
  });
  const [storeInfoDraft, setStoreInfoDraft] = useState<StoreInfoConfig>({
    storeName: '',
    ownerName: '',
    ownerNumber: '',
    adminName: '',
    adminNumber: '',
    webLink: '',
    telegramBot: '',
    waLink: '',
  });

  // Payment Gateway LunasQRIS States
  const [lunasQrisApiKey, setLunasQrisApiKey] = useState<string>('');
  const [lunasQrisSecretKey, setLunasQrisSecretKey] = useState<string>('');
  const [lunasQrisBaseUrl, setLunasQrisBaseUrl] = useState<string>('https://lunasqris.com');

  // Footer States per Command
  const [menuFooterText, setMenuFooterText] = useState<string>('{webLink} • Otomatis');
  const [listFooterText, setListFooterText] = useState<string>('{webLink} • Pilih Produk');
  const [carouselFooterText, setCarouselFooterText] = useState<string>('{storeName} Official');
  const [invoiceFooterText, setInvoiceFooterText] = useState<string>('{storeName} Official • Pembayaran Otomatis');
  const [confirmFooterText, setConfirmFooterText] = useState<string>('{storeName} • Konfirmasi Pesanan');
  const [confirmInputPromoFooter, setConfirmInputPromoFooter] = useState<string>('{storeName} • Konfirmasi Pesanan');
  const [confirmPromoSuccessFooter, setConfirmPromoSuccessFooter] = useState<string>('{storeName} • Promo Berhasil');
  const [confirmPromoInvalidFooter, setConfirmPromoInvalidFooter] = useState<string>('{storeName} • Cek Kode Promo');

  // Command State
  const [selectedCommand, setSelectedCommandState] = useState<
    'Menu' | 'List' | 'Carousel' | 'Invoice' | 'Confirmation' | 'Transaksi' | 'Notifikasi' | 'Kontak' | 'Grup'
  >(() => {
    try {
      const saved = window.sessionStorage.getItem('wanzt_tenant_cmd_subtab');
      if (
        saved &&
        ['Menu', 'List', 'Carousel', 'Invoice', 'Confirmation', 'Transaksi', 'Notifikasi', 'Kontak', 'Grup'].includes(saved)
      ) {
        return saved as any;
      }
    } catch {}
    return 'Menu';
  });
  const setSelectedCommand = (
    cmd: 'Menu' | 'List' | 'Carousel' | 'Invoice' | 'Confirmation' | 'Transaksi' | 'Notifikasi' | 'Kontak' | 'Grup'
  ) => {
    try {
      window.sessionStorage.setItem('wanzt_tenant_cmd_subtab', cmd);
    } catch {}
    setSelectedCommandState(cmd);
  };
  const [carouselOutputText, setCarouselOutputText] = useState<string>(
    `*{storeName}*\n\n*{produkName} | {category}*\n\nNikmati produk pilihanmu dengan harga terbaik di {storeName}.\n\n*Detail Produk:*\n- Varian: {varian}\n- Harga: {price}\n- Stok: {stock} tersedia\n\nProduk tersedia selama stok masih ada. Silakan pilih tindakan di bawah ini untuk melanjutkan.`
  );
  const [carouselPicture, setCarouselPicture] = useState<string>('snaptik-app-7690985506468908308-slide-2.jpg');
  const [invoiceOutputText, setInvoiceOutputText] = useState<string>(
    `🧾 *INVOICE PEMBAYARAN*\n*{storeName}*\n\n📦 *Produk:* {produkName}\n⚡ *Varian:* {varian}\n🆔 *Order ID:* \`{orderId}\`\n\n💰 *Harga:* Rp {price}\n⚡ *Fee Gateway:* +Rp {unikCode}\n💳 *TOTAL BAYAR:* *Rp {total}*\n\n⚠️ *PENTING:* Transfer tepat *Rp {total}* hingga digit terakhir agar pembayaran terverifikasi otomatis.\n\n⏰ *Batas Waktu:* 15 Menit\n\n📌 *Cara Pembayaran:*\n1. Pindai (scan) kode QRIS di atas atau klik tombol *Web Checkout* di bawah.\n2. Pastikan nominal transfer sama persis dengan Total Bayar.\n3. Begitu transfer berhasil, detail akun akan langsung dikirimkan ke chat ini secara otomatis.\n\n_Harap selesaikan pembayaran sebelum batas waktu berakhir._`
  );
  const [confirmSummaryText, setConfirmSummaryText] = useState<string>(
    `🛒 *RINCIAN PESANAN*\nHalo kak, silakan konfirmasi pesanan Anda:\n\n• *Produk:* {produkName}\n• *Varian:* {varian}\n• *Harga Normal:* Rp {price}\n\nPunya kode promo? Silakan pilih tombol di bawah untuk menggunakan diskon atau langsung bayar.`
  );
  const [confirmInputPromoText, setConfirmInputPromoText] = useState<string>(
    `🎟️ *MASUKKAN KODE PROMO*\nSilakan ketik kode promo Anda (contoh: HEMAT10) atau ketik *BATAL* untuk melanjutkan dengan harga normal.\n\n⏱️ _Batas waktu: 3 menit._`
  );
  const [confirmPromoSuccessText, setConfirmPromoSuccessText] = useState<string>(
    `🎉 *KODE PROMO BERHASIL DIGUNAKAN!*\n• *Kode Promo:* {promoCode}\n• *Harga Awal:* Rp {price}\n• *Potongan Diskon:* -Rp {discount}\n• *Total Bayar:* Rp {finalPrice}\n\nInvoice pembayaran QRIS sedang diterbitkan...`
  );
  const [confirmPromoInvalidText, setConfirmPromoInvalidText] = useState<string>(
    `⚠️ *KODE PROMO TIDAK DAPAT DIGUNAKAN*\nKode promo *{promoCode}* tidak dapat diterapkan.\nPenyebab: *{reason}*\n\nSilakan ketik kode promo lain, atau ketik *BATAL* untuk lanjut bayar harga normal (Rp {price}).`
  );
  const [menuOutputText, setMenuOutputText] = useState<string>(
    'Halo kak! Selamat datang di {storeName} ✨\n\nSilakan pilih layanan yang ingin Anda pesan melalui tombol interaktif di bawah ini:'
  );
  const [menuButtons, setMenuButtons] = useState<WhatsAppButton[]>([]);
  const [listOutputText, setListOutputText] = useState<string>(
    'Silakan pilih kategori produk dari daftar list di bawah ini untuk melihat detail produk:'
  );

  // Transaksi State
  const [paymentSuccessDmText, setPaymentSuccessDmText] = useState<string>(
    '🎉 *PEMBAYARAN DITERIMA & LUNAS!*\nTerima kasih kak *{customerName}*, pembayaran untuk pesanan Anda berhasil diverifikasi otomatis.\n\n📦 *Detail Transaksi:*\n• *Order ID:* `{orderId}`\n• *Produk:* {produkName}\n• *Varian:* {varian}\n• *Total Bayar:* Rp {totalPrice}\n• *Waktu:* {paymentExpiry}\n\n🔐 *Detail Akun / Kredensial Anda:*\n{credentials}\n\nSimpan data akun di atas dengan baik. ID Order Supplier: `{supplierOrderId}`'
  );
  const [paymentSuccessDmFooter, setPaymentSuccessDmFooter] = useState<string>('{storeName} • Layanan Otomatis 24/7');
  const [paymentSuccessGroupText, setPaymentSuccessGroupText] = useState<string>(
    '🎉 *TRANSAKSI BERHASIL (LUNAS)*\n\nPembayaran untuk *{produkName}* ({varian}) berhasil diverifikasi otomatis oleh sistem!\n\n• *Order ID:* `{orderId}`\n• *Pembeli:* @{customerNumber}\n• *Total:* Rp {totalPrice}\n\nDetail pesanan telah dikirimkan ke nomor pembeli via chat pribadi (DM). Terima kasih telah berbelanja di *{storeName}*! ✨'
  );
  const [paymentSuccessGroupFooter, setPaymentSuccessGroupFooter] = useState<string>('{storeName} Official Bot');
  const [paymentExpiredText, setPaymentExpiredText] = useState<string>(
    '⏰ *INVOICE KEDALUWARSA*\nInvoice pembayaran QRIS dengan Order ID `{orderId}` telah kedaluwarsa karena melewati batas waktu toleransi.\n\nSilakan buat pesanan baru melalui menu katalog kami jika masih berminat memesan.'
  );
  const [paymentExpiredFooter, setPaymentExpiredFooter] = useState<string>('{storeName} • Auto-Cancel Invoice');
  const [paymentErrorText, setPaymentErrorText] = useState<string>(
    '⚠️ *KENDALA PEMBUATAN INVOICE QRIS*\nMaaf kak, sistem kami mengalami kendala teknis saat menerbitkan kode pembayaran QRIS.\n\nKeterangan: *{errorMessage}*\n\nSilakan coba lagi beberapa saat lagi atau hubungi CS kami: wa.me/{adminNumber}'
  );
  const [paymentErrorFooter, setPaymentErrorFooter] = useState<string>('{storeName} • Bantuan Pelanggan');

  // Notifikasi State
  const [orderGroupNotifText, setOrderGroupNotifText] = useState<string>(
    '👋 Halo kak @{customerNumber}!\n\nUntuk kenyamanan dan privasi transaksi Anda, proses checkout & konfirmasi pesanan *{produkName}* telah kami kirimkan ke chat pribadi (DM) Anda.\n\nSilakan buka chat pribadi dari bot ini untuk memilih opsi promo dan melihat invoice QRIS. Terima kasih! ✨'
  );
  const [orderGroupNotifFooter, setOrderGroupNotifFooter] = useState<string>('{storeName} Official');
  const [stockEmptyText, setStockEmptyText] = useState<string>(
    '⚠️ *STOK SEDANG KOSONG*\nMohon maaf kak, produk/varian *{varian}* saat ini sedang habis terjual.\n\nTim kami sedang melakukan restock secepatnya. Silakan pantau terus katalog kami ya!'
  );
  const [stockEmptyFooter, setStockEmptyFooter] = useState<string>('{storeName} • Info Ketersediaan Stok');
  const [sessionExpiredText, setSessionExpiredText] = useState<string>(
    '⏱️ *SESI TRANSAKSI KEDALUWARSA*\nBatas waktu transaksi 3 menit telah berakhir karena tidak ada aktivitas respon.\n\nSesi pembelian ini dibatalkan secara otomatis demi keamanan sistem. Silakan ulangi pemesanan produk jika Anda masih ingin melanjutkan.'
  );
  const [sessionExpiredFooter, setSessionExpiredFooter] = useState<string>('{storeName} • Auto-Timeout System');
  const [promoCancelledText, setPromoCancelledText] = useState<string>(
    '✅ *PENGGUNAAN KODE PROMO DIBATALKAN*\nKupon promo berhasil dibatalkan. Pesanan Anda akan diproses dengan harga normal *Rp {price}*.\n\nInvoice QRIS sedang diterbitkan...'
  );
  const [promoCancelledFooter, setPromoCancelledFooter] = useState<string>('{storeName} • Checkout Normal');

  // Kontak & Peringatan State
  const [contactOwnerEmptyText, setContactOwnerEmptyText] = useState<string>(
    'ℹ️ *INFORMASI KONTAK OWNER*\nKontak WhatsApp Owner saat ini belum dikonfigurasi di dashboard bot toko ini.\n\nSilakan hubungi admin bot atau coba kembali nanti.'
  );
  const [contactOwnerEmptyFooter, setContactOwnerEmptyFooter] = useState<string>(
    '{storeName} • Informasi Owner'
  );
  const [contactAdminEmptyText, setContactAdminEmptyText] = useState<string>(
    'ℹ️ *INFORMASI LAYANAN PELANGGAN (CS)*\nKontak Customer Service / Admin saat ini belum dikonfigurasi di dashboard bot toko ini.\n\nSilakan coba hubungi pemilik toko atau coba kembali nanti.'
  );
  const [contactAdminEmptyFooter, setContactAdminEmptyFooter] = useState<string>(
    '{storeName} • Layanan Pelanggan'
  );
  const [expiryWarningOwnerText, setExpiryWarningOwnerText] = useState<string>(
    '⚠️ *PERINGATAN MASA AKTIF BOT WHATSAPP*\nHalo *{ownerName}*, bot toko *{storeName}* (Tenant ID: `{tenantId}`) memiliki sisa masa aktif *{remainingTime}*.\n\nMasa sewa akan kedaluwarsa pada:\n📅 *{expiryDate}*\n\nSegera hubungi Master Admin untuk memperpanjang masa aktif agar layanan bot WhatsApp toko Anda tidak terhenti otomatis.'
  );
  const [expiryWarningOwnerFooter, setExpiryWarningOwnerFooter] = useState<string>(
    'Sistem Notifikasi Otomatis Master Server'
  );

  // Moderasi Grup (Kick & AntiKudeta) State
  const [kickAntiKudetaText, setKickAntiKudetaText] = useState<string>(
    '[AntiKudeta] @{pelakuNumber} terdeteksi mencoba mengeluarkan {ownerName} (Owner)'
  );
  const [kickAntiKudetaFooter, setKickAntiKudetaFooter] = useState<string>(
    '{storeName} • Proteksi AntiKudeta'
  );
  const [kickBotNotAdminText, setKickBotNotAdminText] = useState<string>(
    '⚠️ *Bot Bukan Admin*\nBot belum menjadi admin di grup *{groupName}*, sehingga tidak dapat mengeluarkan anggota.\n\nSilakan jadikan nomor bot sebagai admin grup terlebih dahulu.'
  );
  const [kickBotNotAdminFooter, setKickBotNotAdminFooter] = useState<string>(
    '{storeName} • Moderasi Grup'
  );
  const [kickSuccessText, setKickSuccessText] = useState<string>(
    '✅ @{targetNumber} berhasil dikeluarkan dari grup *{groupName}* oleh @{pelakuNumber}.'
  );
  const [kickSuccessFooter, setKickSuccessFooter] = useState<string>(
    '{storeName} • Moderasi Grup'
  );
  const [openBotNotAdminText, setOpenBotNotAdminText] = useState<string>(
    '⚠️ *Bot Bukan Admin*\nBot belum menjadi admin di grup *{groupName}*, sehingga tidak dapat membuka pengaturan chat grup.\n\nSilakan jadikan nomor bot sebagai admin grup terlebih dahulu.'
  );
  const [openBotNotAdminFooter, setOpenBotNotAdminFooter] = useState<string>(
    '{storeName} • Moderasi Grup'
  );
  const [openAlreadyText, setOpenAlreadyText] = useState<string>(
    'ℹ️ Kondisi grup *{groupName}* saat ini sudah dalam keadaan terbuka (semua anggota dapat mengirim pesan).'
  );
  const [openAlreadyFooter, setOpenAlreadyFooter] = useState<string>(
    '{storeName} • Moderasi Grup'
  );
  const [openSuccessText, setOpenSuccessText] = useState<string>(
    '🔓 Grup *{groupName}* berhasil dibuka oleh @{pelakuNumber}. Sekarang semua anggota dapat mengirim pesan.'
  );
  const [openSuccessFooter, setOpenSuccessFooter] = useState<string>(
    '{storeName} • Moderasi Grup'
  );
  const [closeBotNotAdminText, setCloseBotNotAdminText] = useState<string>(
    '⚠️ *Bot Bukan Admin*\nBot belum menjadi admin di grup *{groupName}*, sehingga tidak dapat menutup pengaturan chat grup.\n\nSilakan jadikan nomor bot sebagai admin grup terlebih dahulu.'
  );
  const [closeBotNotAdminFooter, setCloseBotNotAdminFooter] = useState<string>(
    '{storeName} • Moderasi Grup'
  );
  const [closeAlreadyText, setCloseAlreadyText] = useState<string>(
    'ℹ️ Kondisi grup *{groupName}* saat ini sudah dalam keadaan ditutup (hanya admin yang dapat mengirim pesan).'
  );
  const [closeAlreadyFooter, setCloseAlreadyFooter] = useState<string>(
    '{storeName} • Moderasi Grup'
  );
  const [closeSuccessText, setCloseSuccessText] = useState<string>(
    '🔒 Grup *{groupName}* berhasil ditutup oleh @{pelakuNumber}. Sekarang hanya admin yang dapat mengirim pesan.'
  );
  const [closeSuccessFooter, setCloseSuccessFooter] = useState<string>(
    '{storeName} • Moderasi Grup'
  );

  // Per-response Photo & Interactive Buttons Config (list, carousel, invoice, confirm_*, transaksi, notifikasi, kontak)
  const [responseExtras, setResponseExtras] = useState<ResponseExtrasMap>(() =>
    createDefaultResponseExtras()
  );

  const updateResponseExtra = useCallback(
    (key: ResponseConfigKey, patch: Partial<ResponseExtraConfig>) => {
      if (key === 'menu') {
        if (patch.includeMedia !== undefined) setIncludeMedia(patch.includeMedia);
        if (patch.selectedPicture !== undefined) setSelectedPicture(patch.selectedPicture);
        if (patch.buttons !== undefined) setMenuButtons(patch.buttons);
        return;
      }

      setResponseExtras((prev) => {
        const current = prev[key] || {
          includeMedia: key === 'carousel',
          selectedPicture: '',
          buttons: getDefaultButtonsForResponse(key),
        };
        const nextButtons =
          patch.buttons !== undefined
            ? mergeMandatoryButtons(key, patch.buttons)
            : current.buttons;
        return {
          ...prev,
          [key]: {
            ...current,
            ...patch,
            includeMedia:
              key === 'carousel'
                ? true
                : key === 'invoice'
                  ? false
                  : patch.includeMedia !== undefined
                    ? patch.includeMedia
                    : Boolean(current.includeMedia),
            buttons: nextButtons,
          },
        };
      });
    },
    []
  );

  // Media Menu from ./src/media/picture
  const [includeMedia, setIncludeMedia] = useState<boolean>(false);
  const [selectedPicture, setSelectedPicture] = useState<string>('');
  const [availablePictures, setAvailablePictures] = useState<string[]>([]);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  useEffect(() => {
    fetch('/api/media/pictures')
      .then((res) => res.json())
      .then((data) => {
        if (data.pictures) {
          setAvailablePictures(data.pictures);
          if (data.pictures.length > 0 && !selectedPicture) {
            setSelectedPicture(data.pictures[0]);
          }
        }
      })
      .catch(() => {});
  }, []);

  const loadInitialConfig = (config: any) => {
    if (!config) return;
    if (config.menuOutputText) setMenuOutputText(config.menuOutputText);
    if (config.menuButtons) setMenuButtons(config.menuButtons);
    if (config.listOutputText) setListOutputText(config.listOutputText);
    if (config.includeMedia !== undefined) setIncludeMedia(config.includeMedia);
    if (config.selectedPicture) setSelectedPicture(config.selectedPicture);
    if (config.carouselOutputText) setCarouselOutputText(config.carouselOutputText);
    if (config.carouselPicture) setCarouselPicture(config.carouselPicture);
    if (config.invoiceOutputText) setInvoiceOutputText(config.invoiceOutputText);
    if (config.invoiceFooterText) setInvoiceFooterText(config.invoiceFooterText);
    if (config.confirmSummaryText) setConfirmSummaryText(config.confirmSummaryText);
    if (config.confirmInputPromoText) setConfirmInputPromoText(config.confirmInputPromoText);
    if (config.confirmPromoSuccessText) setConfirmPromoSuccessText(config.confirmPromoSuccessText);
    if (config.confirmPromoInvalidText) setConfirmPromoInvalidText(config.confirmPromoInvalidText);
    if (config.confirmFooterText !== undefined) setConfirmFooterText(config.confirmFooterText);
    if (config.confirmInputPromoFooter !== undefined) {
      setConfirmInputPromoFooter(config.confirmInputPromoFooter);
    } else if (config.confirmFooterText) {
      setConfirmInputPromoFooter(config.confirmFooterText);
    }
    if (config.confirmPromoSuccessFooter !== undefined) {
      setConfirmPromoSuccessFooter(config.confirmPromoSuccessFooter);
    } else if (config.confirmFooterText) {
      setConfirmPromoSuccessFooter(config.confirmFooterText);
    }
    if (config.confirmPromoInvalidFooter !== undefined) {
      setConfirmPromoInvalidFooter(config.confirmPromoInvalidFooter);
    } else if (config.confirmFooterText) {
      setConfirmPromoInvalidFooter(config.confirmFooterText);
    }
    if (config.storeInfo) {
      setStoreInfo(config.storeInfo);
      setStoreInfoDraft(config.storeInfo);
    }
    if (config.menuFooterText !== undefined) setMenuFooterText(config.menuFooterText);
    if (config.listFooterText !== undefined) setListFooterText(config.listFooterText);
    if (config.carouselFooterText !== undefined) setCarouselFooterText(config.carouselFooterText);
    if (config.lunasQrisApiKey !== undefined) setLunasQrisApiKey(config.lunasQrisApiKey);
    if (config.lunasQrisSecretKey !== undefined) setLunasQrisSecretKey(config.lunasQrisSecretKey);
    if (config.lunasQrisBaseUrl !== undefined) setLunasQrisBaseUrl(config.lunasQrisBaseUrl);

    // Transaksi
    if (config.paymentSuccessDmText) setPaymentSuccessDmText(config.paymentSuccessDmText);
    if (config.paymentSuccessDmFooter !== undefined) setPaymentSuccessDmFooter(config.paymentSuccessDmFooter);
    if (config.paymentSuccessGroupText) setPaymentSuccessGroupText(config.paymentSuccessGroupText);
    if (config.paymentSuccessGroupFooter !== undefined) setPaymentSuccessGroupFooter(config.paymentSuccessGroupFooter);
    if (config.paymentExpiredText) setPaymentExpiredText(config.paymentExpiredText);
    if (config.paymentExpiredFooter !== undefined) setPaymentExpiredFooter(config.paymentExpiredFooter);
    if (config.paymentErrorText) setPaymentErrorText(config.paymentErrorText);
    if (config.paymentErrorFooter !== undefined) setPaymentErrorFooter(config.paymentErrorFooter);

    // Notifikasi
    if (config.orderGroupNotifText) setOrderGroupNotifText(config.orderGroupNotifText);
    if (config.orderGroupNotifFooter !== undefined) setOrderGroupNotifFooter(config.orderGroupNotifFooter);
    if (config.stockEmptyText) setStockEmptyText(config.stockEmptyText);
    if (config.stockEmptyFooter !== undefined) setStockEmptyFooter(config.stockEmptyFooter);
    if (config.sessionExpiredText) setSessionExpiredText(config.sessionExpiredText);
    if (config.sessionExpiredFooter !== undefined) setSessionExpiredFooter(config.sessionExpiredFooter);
    if (config.promoCancelledText) setPromoCancelledText(config.promoCancelledText);
    if (config.promoCancelledFooter !== undefined) setPromoCancelledFooter(config.promoCancelledFooter);

    // Kontak & Peringatan
    if (config.contactOwnerEmptyText) setContactOwnerEmptyText(config.contactOwnerEmptyText);
    if (config.contactOwnerEmptyFooter !== undefined) setContactOwnerEmptyFooter(config.contactOwnerEmptyFooter);
    if (config.contactAdminEmptyText) setContactAdminEmptyText(config.contactAdminEmptyText);
    if (config.contactAdminEmptyFooter !== undefined) setContactAdminEmptyFooter(config.contactAdminEmptyFooter);
    if (config.expiryWarningOwnerText) setExpiryWarningOwnerText(config.expiryWarningOwnerText);
    if (config.expiryWarningOwnerFooter !== undefined) setExpiryWarningOwnerFooter(config.expiryWarningOwnerFooter);

    // Moderasi Grup
    if (config.kickAntiKudetaText) setKickAntiKudetaText(config.kickAntiKudetaText);
    if (config.kickAntiKudetaFooter !== undefined) setKickAntiKudetaFooter(config.kickAntiKudetaFooter);
    if (config.kickBotNotAdminText) setKickBotNotAdminText(config.kickBotNotAdminText);
    if (config.kickBotNotAdminFooter !== undefined) setKickBotNotAdminFooter(config.kickBotNotAdminFooter);
    if (config.kickSuccessText) setKickSuccessText(config.kickSuccessText);
    if (config.kickSuccessFooter !== undefined) setKickSuccessFooter(config.kickSuccessFooter);
    if (config.openBotNotAdminText) setOpenBotNotAdminText(config.openBotNotAdminText);
    if (config.openBotNotAdminFooter !== undefined) setOpenBotNotAdminFooter(config.openBotNotAdminFooter);
    if (config.openAlreadyText) setOpenAlreadyText(config.openAlreadyText);
    if (config.openAlreadyFooter !== undefined) setOpenAlreadyFooter(config.openAlreadyFooter);
    if (config.openSuccessText) setOpenSuccessText(config.openSuccessText);
    if (config.openSuccessFooter !== undefined) setOpenSuccessFooter(config.openSuccessFooter);
    if (config.closeBotNotAdminText) setCloseBotNotAdminText(config.closeBotNotAdminText);
    if (config.closeBotNotAdminFooter !== undefined) setCloseBotNotAdminFooter(config.closeBotNotAdminFooter);
    if (config.closeAlreadyText) setCloseAlreadyText(config.closeAlreadyText);
    if (config.closeAlreadyFooter !== undefined) setCloseAlreadyFooter(config.closeAlreadyFooter);
    if (config.closeSuccessText) setCloseSuccessText(config.closeSuccessText);
    if (config.closeSuccessFooter !== undefined) setCloseSuccessFooter(config.closeSuccessFooter);

    // Per-response Extras (Photo ON/OFF, Selected Photo, Mandatory + Custom Buttons)
    const normalizedExtras: ResponseExtrasMap = createDefaultResponseExtras();
    const rawExtras = config.responseExtras && typeof config.responseExtras === 'object' ? config.responseExtras : {};
    for (const key of ALL_RESPONSE_CONFIG_KEYS) {
      if (key === 'menu') continue;
      const item = rawExtras[key];
      const baseButtons = Array.isArray(item?.buttons)
        ? item.buttons
        : getDefaultButtonsForResponse(key);
      normalizedExtras[key] = {
        includeMedia:
          key === 'carousel'
            ? true
            : key === 'invoice'
              ? false
              : Boolean(item?.includeMedia),
        selectedPicture:
          key === 'carousel'
            ? config.carouselPicture || item?.selectedPicture || ''
            : typeof item?.selectedPicture === 'string'
              ? item.selectedPicture
              : '',
        buttons: mergeMandatoryButtons(key, baseButtons),
      };
    }
    setResponseExtras(normalizedExtras);
  };

  const syncConfigToServer = async (
    firstArg?: any,
    newButtons?: WhatsAppButton[],
    newListText?: string,
    newIncludeMedia?: boolean,
    newSelectedPicture?: string,
    newApiKey?: string,
    newBaseUrl?: string,
    newCarouselText?: string,
    newCarouselPicture?: string,
    newStoreInfo?: StoreInfoConfig,
    newMenuFooter?: string,
    newListFooter?: string,
    newCarouselFooter?: string,
    newLunasQrisApiKey?: string,
    newLunasQrisSecretKey?: string,
    newLunasQrisBaseUrl?: string
  ) => {
    setIsSavingConfig(true);
    try {
      let payload: any = {
        menuOutputText,
        menuFooterText,
        menuButtons,
        listOutputText,
        listFooterText,
        includeMedia,
        selectedPicture,
        carouselOutputText,
        carouselFooterText,
        carouselPicture,
        invoiceOutputText,
        invoiceFooterText,
        confirmSummaryText,
        confirmInputPromoText,
        confirmPromoSuccessText,
        confirmPromoInvalidText,
        confirmFooterText,
        confirmInputPromoFooter,
        confirmPromoSuccessFooter,
        confirmPromoInvalidFooter,
        // Transaksi
        paymentSuccessDmText,
        paymentSuccessDmFooter,
        paymentSuccessGroupText,
        paymentSuccessGroupFooter,
        paymentExpiredText,
        paymentExpiredFooter,
        paymentErrorText,
        paymentErrorFooter,
        // Notifikasi
        orderGroupNotifText,
        orderGroupNotifFooter,
        stockEmptyText,
        stockEmptyFooter,
        sessionExpiredText,
        sessionExpiredFooter,
        promoCancelledText,
        promoCancelledFooter,
        // Kontak & Peringatan
        contactOwnerEmptyText,
        contactOwnerEmptyFooter,
        contactAdminEmptyText,
        contactAdminEmptyFooter,
        expiryWarningOwnerText,
        expiryWarningOwnerFooter,
        // Moderasi Grup
        kickAntiKudetaText,
        kickAntiKudetaFooter,
        kickBotNotAdminText,
        kickBotNotAdminFooter,
        kickSuccessText,
        kickSuccessFooter,
        openBotNotAdminText,
        openBotNotAdminFooter,
        openAlreadyText,
        openAlreadyFooter,
        openSuccessText,
        openSuccessFooter,
        closeBotNotAdminText,
        closeBotNotAdminFooter,
        closeAlreadyText,
        closeAlreadyFooter,
        closeSuccessText,
        closeSuccessFooter,
        responseExtras,
        xavieraApiKey: newApiKey !== undefined ? newApiKey : xavieraApiKey,
        xavieraBaseUrl: newBaseUrl !== undefined ? newBaseUrl : xavieraBaseUrl,
        lunasQrisApiKey: newLunasQrisApiKey !== undefined ? newLunasQrisApiKey : lunasQrisApiKey,
        lunasQrisSecretKey: newLunasQrisSecretKey !== undefined ? newLunasQrisSecretKey : lunasQrisSecretKey,
        lunasQrisBaseUrl: newLunasQrisBaseUrl !== undefined ? newLunasQrisBaseUrl : lunasQrisBaseUrl,
      };

      if (firstArg && typeof firstArg === 'object' && !Array.isArray(firstArg)) {
        const isEvent = Boolean(firstArg.nativeEvent || firstArg._reactName || firstArg.target);
        if (!isEvent) {
          payload = { ...payload, ...firstArg };
        }
      } else {
        if (firstArg !== undefined && typeof firstArg === 'string') payload.menuOutputText = firstArg;
        if (newButtons !== undefined) payload.menuButtons = newButtons;
        if (newListText !== undefined) payload.listOutputText = newListText;
        if (newIncludeMedia !== undefined) payload.includeMedia = newIncludeMedia;
        if (newSelectedPicture !== undefined) payload.selectedPicture = newSelectedPicture;
        if (newApiKey !== undefined) payload.xavieraApiKey = newApiKey;
        if (newBaseUrl !== undefined) payload.xavieraBaseUrl = newBaseUrl;
        if (newCarouselText !== undefined) payload.carouselOutputText = newCarouselText;
        if (newCarouselPicture !== undefined) payload.carouselPicture = newCarouselPicture;
        if (newStoreInfo !== undefined) payload.storeInfo = newStoreInfo;
        if (newMenuFooter !== undefined) payload.menuFooterText = newMenuFooter;
        if (newListFooter !== undefined) payload.listFooterText = newListFooter;
        if (newCarouselFooter !== undefined) payload.carouselFooterText = newCarouselFooter;
        if (newLunasQrisApiKey !== undefined) payload.lunasQrisApiKey = newLunasQrisApiKey;
        if (newLunasQrisSecretKey !== undefined) payload.lunasQrisSecretKey = newLunasQrisSecretKey;
        if (newLunasQrisBaseUrl !== undefined) payload.lunasQrisBaseUrl = newLunasQrisBaseUrl;
      }

      const res = await fetch('/api/bot/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToast(errData?.error || 'Gagal menyimpan konfigurasi ke server');
        return false;
      }
      return true;
    } catch (e) {
      console.error('Gagal menyimpan config ke server', e);
      return false;
    } finally {
      setIsSavingConfig(false);
    }
  };

  return {
    storeInfo,
    setStoreInfo,
    storeInfoDraft,
    setStoreInfoDraft,
    lunasQrisApiKey,
    setLunasQrisApiKey,
    lunasQrisSecretKey,
    setLunasQrisSecretKey,
    lunasQrisBaseUrl,
    setLunasQrisBaseUrl,
    menuFooterText,
    setMenuFooterText,
    listFooterText,
    setListFooterText,
    carouselFooterText,
    setCarouselFooterText,
    invoiceFooterText,
    setInvoiceFooterText,
    confirmFooterText,
    setConfirmFooterText,
    confirmInputPromoFooter,
    setConfirmInputPromoFooter,
    confirmPromoSuccessFooter,
    setConfirmPromoSuccessFooter,
    confirmPromoInvalidFooter,
    setConfirmPromoInvalidFooter,
    selectedCommand,
    setSelectedCommand,
    carouselOutputText,
    setCarouselOutputText,
    carouselPicture,
    setCarouselPicture,
    invoiceOutputText,
    setInvoiceOutputText,
    confirmSummaryText,
    setConfirmSummaryText,
    confirmInputPromoText,
    setConfirmInputPromoText,
    confirmPromoSuccessText,
    setConfirmPromoSuccessText,
    confirmPromoInvalidText,
    setConfirmPromoInvalidText,
    menuOutputText,
    setMenuOutputText,
    menuButtons,
    setMenuButtons,
    listOutputText,
    setListOutputText,
    includeMedia,
    setIncludeMedia,
    selectedPicture,
    setSelectedPicture,
    availablePictures,
    setAvailablePictures,
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
    // Notifikasi
    orderGroupNotifText,
    setOrderGroupNotifText,
    orderGroupNotifFooter,
    setOrderGroupNotifFooter,
    stockEmptyText,
    setStockEmptyText,
    stockEmptyFooter,
    setStockEmptyFooter,
    sessionExpiredText,
    setSessionExpiredText,
    sessionExpiredFooter,
    setSessionExpiredFooter,
    promoCancelledText,
    setPromoCancelledText,
    promoCancelledFooter,
    setPromoCancelledFooter,
    // Kontak & Peringatan
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
    // Moderasi Grup
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
    responseExtras,
    setResponseExtras,
    updateResponseExtra,
    isSavingConfig,
    loadInitialConfig,
    syncConfigToServer,
  };
}
