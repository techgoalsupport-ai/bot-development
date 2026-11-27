export type DocsSectionTab = 'guide' | 'commands' | 'json' | 'api';
export type CategoryGroupFilter = 'all' | 'utama' | 'checkout' | 'transaksi' | 'grup';
export type JsonExampleId = 'minimal' | 'full_buttons' | 'multi_array' | 'group_moderation';
export type ApiEndpointId = 'create_tenant' | 'create_token';
export type ApiLangId = 'curl' | 'nodejs' | 'php' | 'python';

export interface CategoryReferenceRow {
  category: string;
  group: Exclude<CategoryGroupFilter, 'all'>;
  label: string;
  trigger: string;
  mandatoryRoles: string[];
  placeholders: string[];
}

export const CATEGORY_REFERENCE_ROWS: CategoryReferenceRow[] = [
  {
    category: 'menu',
    group: 'utama',
    label: 'Command Menu',
    trigger: 'Pembeli mengetik .menu / /menu atau menekan tombol dengan action "menu"',
    mandatoryRoles: [],
    placeholders: [
      '{storeName}',
      '{ownerName}',
      '{ownerNumber}',
      '{adminName}',
      '{adminNumber}',
      '{webLink}',
      '{waLink}',
      '{telegramBot}',
    ],
  },
  {
    category: 'list',
    group: 'utama',
    label: 'Command List',
    trigger: 'Pembeli mengetik .list / /list atau menekan tombol dengan action "list"',
    mandatoryRoles: ['dropdown'],
    placeholders: [
      '{daftarProduk}',
      '{storeName}',
      '{ownerName}',
      '{ownerNumber}',
      '{adminName}',
      '{adminNumber}',
      '{webLink}',
      '{waLink}',
      '{telegramBot}',
    ],
  },
  {
    category: 'carousel',
    group: 'utama',
    label: 'Command Carousel',
    trigger: 'Menampilkan kartu slide varian dari produk yang dipilih pada dropdown List',
    mandatoryRoles: ['order'],
    placeholders: [
      '{storeName}',
      '{produkName}',
      '{category}',
      '{varian}',
      '{price}',
      '{stock}',
      '{adminName}',
      '{adminNumber}',
      '{ownerName}',
      '{ownerNumber}',
      '{webLink}',
    ],
  },
  {
    category: 'invoice',
    group: 'checkout',
    label: 'Invoice Pembayaran QRIS',
    trigger: 'Bot menerbitkan tagihan QRIS LunasQRIS untuk dibayar pembeli',
    mandatoryRoles: ['pay', 'admin'],
    placeholders: [
      '{storeName}',
      '{produkName}',
      '{category}',
      '{varian}',
      '{price}',
      '{unikCode}',
      '{total}',
      '{finalPrice}',
      '{discount}',
      '{promoCode}',
      '{orderId}',
      '{paymentUrl}',
      '{expiryDate}',
      '{adminNumber}',
      '{webLink}',
    ],
  },
  {
    category: 'confirm_summary',
    group: 'checkout',
    label: 'Konfirmasi: Ringkasan Order (alias: confirmation)',
    trigger: 'Dikirim ke DM pembeli setelah klik Order sebelum QRIS diterbitkan',
    mandatoryRoles: ['promo', 'direct'],
    placeholders: [
      '{storeName}',
      '{produkName}',
      '{varian}',
      '{price}',
      '{customerName}',
      '{customerNumber}',
      '{adminNumber}',
      '{webLink}',
    ],
  },
  {
    category: 'confirm_promo_input',
    group: 'checkout',
    label: 'Konfirmasi: Input Kode Promo',
    trigger: 'Balasan saat pembeli menekan tombol Pakai Kode Promo (batas tunggu 3 menit)',
    mandatoryRoles: [],
    placeholders: ['{storeName}', '{produkName}', '{varian}', '{price}', '{customerName}', '{customerNumber}'],
  },
  {
    category: 'confirm_promo_valid',
    group: 'checkout',
    label: 'Konfirmasi: Promo Valid',
    trigger: 'Konfirmasi nominal diskon ketika kode promo valid dan kuota tersedia',
    mandatoryRoles: [],
    placeholders: [
      '{storeName}',
      '{produkName}',
      '{varian}',
      '{price}',
      '{promoCode}',
      '{discount}',
      '{finalPrice}',
      '{customerName}',
      '{customerNumber}',
    ],
  },
  {
    category: 'confirm_promo_invalid',
    group: 'checkout',
    label: 'Konfirmasi: Promo Invalid',
    trigger: 'Balasan saat kode promo salah, bukan untuk varian ini, habis kuota, atau kedaluwarsa',
    mandatoryRoles: [],
    placeholders: ['{storeName}', '{produkName}', '{varian}', '{price}', '{promoCode}', '{reason}', '{customerName}'],
  },
  {
    category: 'payment_success_dm',
    group: 'transaksi',
    label: 'Transaksi: Lunas (DM)',
    trigger: 'Dikirim ke DM pembeli segera setelah pembayaran QRIS terverifikasi lunas',
    mandatoryRoles: [],
    placeholders: [
      '{customerName}',
      '{customerNumber}',
      '{orderId}',
      '{produkName}',
      '{varian}',
      '{price}',
      '{total}',
      '{finalPrice}',
      '{storeName}',
    ],
  },
  {
    category: 'payment_success_group',
    group: 'transaksi',
    label: 'Transaksi: Lunas (Grup)',
    trigger: 'Pengumuman pelunasan di grup asal apabila order dimulai dari dalam grup',
    mandatoryRoles: [],
    placeholders: [
      '{customerNumber}',
      '{customerName}',
      '{orderId}',
      '{produkName}',
      '{varian}',
      '{price}',
      '{total}',
      '{finalPrice}',
      '{storeName}',
    ],
  },
  {
    category: 'payment_expired',
    group: 'transaksi',
    label: 'Transaksi: Invoice Kedaluwarsa',
    trigger: 'Dikirim otomatis apabila pembeli tidak membayar hingga batas waktu QRIS habis',
    mandatoryRoles: [],
    placeholders: ['{orderId}', '{produkName}', '{varian}', '{customerName}', '{storeName}', '{webLink}'],
  },
  {
    category: 'payment_error',
    group: 'transaksi',
    label: 'Transaksi: Kendala Gateway',
    trigger: 'Pesan fallback saat API payment gateway atau pembuatan invoice mengalami gangguan',
    mandatoryRoles: [],
    placeholders: ['{errorMessage}', '{reason}', '{adminNumber}', '{ownerNumber}', '{storeName}'],
  },
  {
    category: 'order_group_notif',
    group: 'transaksi',
    label: 'Notifikasi: Order Grup ke DM',
    trigger: 'Pesan pengarah di grup agar pembeli memeriksa chat pribadi (DM) untuk checkout',
    mandatoryRoles: [],
    placeholders: ['{customerNumber}', '{customerName}', '{produkName}', '{varian}', '{storeName}'],
  },
  {
    category: 'stock_empty',
    group: 'transaksi',
    label: 'Notifikasi: Stok Kosong',
    trigger: 'Balasan otomatis saat pembeli memilih varian produk yang stoknya habis (0)',
    mandatoryRoles: [],
    placeholders: ['{customerNumber}', '{customerName}', '{produkName}', '{varian}', '{storeName}'],
  },
  {
    category: 'checkout_session_expired',
    group: 'transaksi',
    label: 'Notifikasi: Sesi Checkout Habis',
    trigger: 'Peringatan ketika pembeli mengetik setelah sesi input promo 3 menit kedaluwarsa',
    mandatoryRoles: [],
    placeholders: ['{produkName}', '{varian}', '{price}', '{customerName}', '{storeName}', '{webLink}'],
  },
  {
    category: 'promo_cancelled',
    group: 'transaksi',
    label: 'Notifikasi: Kupon Dibatalkan',
    trigger: 'Konfirmasi ketika pembeli mengetik BATAL saat sesi input kode promo',
    mandatoryRoles: [],
    placeholders: ['{produkName}', '{varian}', '{price}', '{total}', '{storeName}'],
  },
  {
    category: 'contact_owner_empty',
    group: 'utama',
    label: 'Kontak: Owner Kosong',
    trigger: 'Balasan perintah .owner apabila nomor WhatsApp Owner belum diisi di Pengaturan Toko',
    mandatoryRoles: [],
    placeholders: ['{storeName}', '{webLink}', '{adminName}', '{adminNumber}'],
  },
  {
    category: 'contact_admin_empty',
    group: 'utama',
    label: 'Kontak: Admin Kosong',
    trigger: 'Balasan perintah .admin / .contact apabila nomor Admin CS belum diisi di Pengaturan Toko',
    mandatoryRoles: [],
    placeholders: ['{storeName}', '{webLink}', '{ownerName}', '{ownerNumber}'],
  },
  {
    category: 'expiry_warning_owner',
    group: 'utama',
    label: 'Peringatan: Masa Sewa Bot',
    trigger: 'Notifikasi otomatis ke WhatsApp Owner menjelang masa aktif sewa bot berakhir',
    mandatoryRoles: [],
    placeholders: ['{ownerName}', '{storeName}', '{tenantId}', '{remainingTime}', '{expiryDate}', '{extendUrl}'],
  },
  {
    category: 'kick_anti_kudeta',
    group: 'grup',
    label: 'Grup: AntiKudeta (Kudeta Owner)',
    trigger: 'Dikirim di grup saat ada admin/pembuat grup mencoba me-kick nomor Owner toko',
    mandatoryRoles: [],
    placeholders: ['{pelakuNumber}', '{pelakuName}', '{ownerName}', '{ownerNumber}', '{groupName}', '{storeName}'],
  },
  {
    category: 'kick_bot_not_admin',
    group: 'grup',
    label: 'Grup: Kick (Bot Bukan Admin)',
    trigger: 'Balasan saat admin memicu command Kick tetapi nomor bot belum menjadi admin grup',
    mandatoryRoles: [],
    placeholders: ['{groupName}', '{pelakuNumber}', '{pelakuName}', '{storeName}'],
  },
  {
    category: 'kick_success',
    group: 'grup',
    label: 'Grup: Berhasil Kick Anggota',
    trigger: 'Konfirmasi di grup setelah bot berhasil mengeluarkan anggota target',
    mandatoryRoles: [],
    placeholders: ['{targetNumber}', '{targetName}', '{pelakuNumber}', '{pelakuName}', '{groupName}', '{storeName}'],
  },
  {
    category: 'open_bot_not_admin',
    group: 'grup',
    label: 'Grup: Open (Bot Bukan Admin)',
    trigger: 'Balasan saat admin memicu command Open tetapi nomor bot belum menjadi admin grup',
    mandatoryRoles: [],
    placeholders: ['{groupName}', '{pelakuNumber}', '{pelakuName}', '{storeName}'],
  },
  {
    category: 'open_already',
    group: 'grup',
    label: 'Grup: Kondisi Sudah Terbuka',
    trigger: 'Balasan saat admin memicu command Open padahal grup memang sudah dalam keadaan terbuka',
    mandatoryRoles: [],
    placeholders: ['{groupName}', '{pelakuNumber}', '{pelakuName}', '{storeName}'],
  },
  {
    category: 'open_success',
    group: 'grup',
    label: 'Grup: Berhasil Buka Grup',
    trigger: 'Konfirmasi setelah bot mengubah grup menjadi terbuka (semua anggota dapat mengirim pesan)',
    mandatoryRoles: [],
    placeholders: ['{pelakuNumber}', '{pelakuName}', '{groupName}', '{storeName}'],
  },
  {
    category: 'close_bot_not_admin',
    group: 'grup',
    label: 'Grup: Close (Bot Bukan Admin)',
    trigger: 'Balasan saat admin memicu command Close tetapi nomor bot belum menjadi admin grup',
    mandatoryRoles: [],
    placeholders: ['{groupName}', '{pelakuNumber}', '{pelakuName}', '{storeName}'],
  },
  {
    category: 'close_already',
    group: 'grup',
    label: 'Grup: Kondisi Sudah Ditutup',
    trigger: 'Balasan saat admin memicu command Close padahal grup memang sudah ditutup (khusus admin)',
    mandatoryRoles: [],
    placeholders: ['{groupName}', '{pelakuNumber}', '{pelakuName}', '{storeName}'],
  },
  {
    category: 'close_success',
    group: 'grup',
    label: 'Grup: Berhasil Tutup Grup',
    trigger: 'Konfirmasi setelah bot mengubah grup menjadi tertutup (hanya admin dapat mengirim pesan)',
    mandatoryRoles: [],
    placeholders: ['{pelakuNumber}', '{pelakuName}', '{groupName}', '{storeName}'],
  },
];

export interface PlaceholderGlossaryItem {
  token: string;
  aliases: string;
  meaning: string;
  example: string;
}

export interface PlaceholderGlossaryGroup {
  id: string;
  title: string;
  description: string;
  items: PlaceholderGlossaryItem[];
}

export const PLACEHOLDER_GLOSSARY_GROUPS: PlaceholderGlossaryGroup[] = [
  {
    id: 'store',
    title: 'Identitas Toko & Kontak',
    description: 'Diambil langsung dari menu Pengaturan Toko pada dashboard tenant.',
    items: [
      { token: '{storeName}', aliases: '{namaStore}', meaning: 'Nama toko resmi milik tenant', example: 'Toko Digital Nusantara' },
      { token: '{ownerName}', aliases: '{namaOwner}', meaning: 'Nama pemilik toko (juga dipakai di pesan AntiKudeta)', example: 'Budi Santoso' },
      { token: '{ownerNumber}', aliases: '{nomerOwner}', meaning: 'Nomor WhatsApp Owner format 628xxx', example: '6281234567890' },
      { token: '{adminName}', aliases: '{namaAdmin}', meaning: 'Nama Customer Service / Admin toko', example: 'CS Rina' },
      { token: '{adminNumber}', aliases: '{nomerAdmin}', meaning: 'Nomor WhatsApp Admin CS', example: '6289876543210' },
      { token: '{webLink}', aliases: '{linkWebsite}', meaning: 'URL website atau landing page toko', example: 'https://tokoanda.com' },
      { token: '{waLink}', aliases: '{linkSaluran}', meaning: 'Link saluran / komunitas WhatsApp', example: 'https://whatsapp.com/channel/...' },
      { token: '{telegramBot}', aliases: '{botTelegram}', meaning: 'Username Telegram toko', example: '@tokoanda_bot' },
    ],
  },
  {
    id: 'product',
    title: 'Produk, Harga, & Transaksi QRIS',
    description: 'Terisi otomatis oleh backend saat pembeli memilih item, memakai promo, dan membayar.',
    items: [
      { token: '{daftarProduk}', aliases: '-', meaning: 'Daftar katalog produk otomatis (khusus kategori list)', example: '1. Netflix UHD\n2. Spotify...' },
      { token: '{produkName}', aliases: '{productName}', meaning: 'Nama layanan / aplikasi utama', example: 'Netflix Premium' },
      { token: '{varian}', aliases: '{variant}', meaning: 'Nama paket / durasi varian', example: '1 Bulan Private' },
      { token: '{category}', aliases: '{kategori}', meaning: 'Kategori produk dari katalog', example: 'Streaming' },
      { token: '{stock}', aliases: '{stok}', meaning: 'Jumlah sisa stok tersedia', example: '14' },
      { token: '{price}', aliases: '{harga}', meaning: 'Harga normal sebelum promo (auto format ribuan)', example: '35.000' },
      { token: '{promoCode}', aliases: '{kodePromo}', meaning: 'Kode kupon promo yang dipakai', example: 'HEMAT10' },
      { token: '{discount}', aliases: '{potongan}, {diskon}', meaning: 'Nominal potongan diskon promo', example: '5.000' },
      { token: '{unikCode}', aliases: '{kodeUnik}, {feeGateway}', meaning: 'Kode unik / biaya gateway QRIS', example: '127' },
      { token: '{total}', aliases: '{totalBayar}', meaning: 'Total nominal tagihan yang harus dibayar', example: '30.127' },
      { token: '{finalPrice}', aliases: '{hargaAkhir}, {totalDiskon}', meaning: 'Harga akhir setelah dipotong kupon promo', example: '30.000' },
      { token: '{orderId}', aliases: '{order_id}', meaning: 'Kode ID unik transaksi LunasQRIS', example: 'INV-20261127-001' },
      { token: '{paymentUrl}', aliases: '{linkPembayaran}', meaning: 'Tautan halaman QRIS pembeli', example: 'https://lunasqris.com/pay/...' },
      { token: '{customerName}', aliases: '{senderName}, {namaPembeli}', meaning: 'Nama profil WhatsApp pembeli', example: 'Andi Wijaya' },
      { token: '{customerNumber}', aliases: '{nomorPembeli}, {buyerNumber}', meaning: 'Nomor WA pembeli (gunakan @{customerNumber} untuk tag)', example: '6285611122233' },
      { token: '{reason}', aliases: '{alasan}, {alasanBatal}', meaning: 'Alasan kegagalan promo atau kendala order', example: 'Kuota promo habis' },
      { token: '{errorMessage}', aliases: '{pesanError}, {kendala}', meaning: 'Detail pesan gangguan gateway', example: 'Timeout koneksi server QRIS' },
    ],
  },
  {
    id: 'group',
    title: 'Moderasi Grup & Masa Sewa',
    description: 'Dipakai oleh fitur grup (Kick, AntiKudeta, Open, Close) serta pengingat masa aktif bot.',
    items: [
      { token: '{pelakuNumber}', aliases: '{actorNumber}, {adminPelaku}', meaning: 'Nomor WA admin pemicu command (tulis @{pelakuNumber} untuk mention)', example: '6281122334455' },
      { token: '{pelakuName}', aliases: '{actorName}', meaning: 'Nama tampilan (pushName) admin pemicu command', example: 'Admin Satu' },
      { token: '{targetNumber}', aliases: '{nomerTarget}, {nomorTarget}', meaning: 'Nomor WA anggota yang di-kick (tulis @{targetNumber} untuk mention)', example: '6287788990011' },
      { token: '{targetName}', aliases: '{namaTarget}', meaning: 'Nama target yang dikeluarkan dari grup', example: 'Member Spam' },
      { token: '{groupName}', aliases: '{namaGrup}', meaning: 'Judul grup WhatsApp tempat command dijalankan', example: 'Grup Reseller VIP' },
      { token: '{tenantId}', aliases: '{idBot}, {idUnit}', meaning: 'ID unik unit tenant bot', example: 't_tokopembeli_842' },
      { token: '{remainingTime}', aliases: '{sisaWaktu}, {sisaHari}', meaning: 'Sisa waktu masa aktif sewa bot', example: '2 Hari 5 Jam' },
      { token: '{expiryDate}', aliases: '{waktuKedaluwarsa}', meaning: 'Tanggal dan jam berakhirnya masa sewa / invoice', example: '30 Nov 2026 23:59' },
      { token: '{extendUrl}', aliases: '-', meaning: 'Tautan menuju dashboard untuk perpanjangan sewa', example: 'https://testbot.web.id/' },
    ],
  },
];

export const JSON_EXAMPLE_SNIPPETS: Record<JsonExampleId, { title: string; subtitle: string; code: string }> = {
  minimal: {
    title: 'Format Ringkas (Direkomendasikan)',
    subtitle: 'Tanpa id, tanpa mandatory/mandatoryRole, dan kategori tanpa tombol kustom cukup isi name, content, dan footer.',
    code: `{
  "menu": {
    "name": "Menu Utama Bersih",
    "content": "Halo kak! Selamat datang di {storeName}.\\n\\nPilih layanan melalui tombol di bawah:",
    "footer": "{webLink} · Layanan 24 Jam",
    "buttons": [
      { "type": "reply", "name": "📋 Daftar Produk", "action": "list" },
      { "type": "reply", "name": "📞 Hubungi Admin", "action": "admin" },
      { "type": "url", "name": "🌐 Kunjungi Website", "url": "{webLink}" }
    ]
  },

  "payment_success_dm": {
    "name": "Notif Lunas Elegan",
    "content": "Terima kasih kak *{customerName}*!\\nPesanan *{produkName} ({varian})* (#{orderId}) sebesar *Rp {total}* sudah LUNAS.",
    "footer": "{storeName} · Pembayaran Terverifikasi"
  }
}`,
  },
  full_buttons: {
    title: 'Semua Tipe Tombol & Kustomisasi Tombol Wajib',
    subtitle: 'Contoh penggunaan reply, url, copy, call, vcard, serta mengubah label tombol wajib menggunakan field role.',
    code: `{
  "carousel": {
    "name": "Carousel Promo Lengkap",
    "content": "*{produkName}* ({varian})\\nHarga: Rp {price} · Stok: {stock}",
    "footer": "{storeName} · Pilih Varian",
    "buttons": [
      { "role": "order", "name": "🛒 Beli Sekarang" },
      { "type": "reply", "name": "💬 Tanya Admin", "action": "admin" },
      { "type": "copy", "name": "🎟️ Salin Kupon", "value": "HEMAT10" },
      { "type": "url", "name": "📖 Cara Order", "url": "{webLink}" },
      { "type": "call", "name": "📞 Telepon CS", "phone": "{adminNumber}" },
      { "type": "vcard", "name": "👤 Simpan Kontak", "contactName": "{adminName}", "phone": "{adminNumber}" }
    ]
  },

  "invoice": {
    "name": "Invoice Custom Label",
    "content": "Tagihan Order \`{orderId}\`\\nProduk: *{produkName} ({varian})*\\nTotal Bayar: *Rp {total}*",
    "footer": "{webLink} · QRIS Otomatis",
    "buttons": [
      { "role": "pay", "name": "💳 Bayar QRIS Sekarang" },
      { "role": "admin", "name": "💬 Bantuan Admin" }
    ]
  }
}`,
  },
  multi_array: {
    title: 'Multi-Varian (Beberapa Template dalam 1 Kategori)',
    subtitle: 'Gunakan array di dalam key kategori atau root array jika ingin mengimpor beberapa variasi sekaligus.',
    code: `{
  "menu": [
    {
      "name": "Menu Gaya Formal",
      "content": "Selamat datang di layanan resmi {storeName}. Silakan pilih produk melalui menu di bawah.",
      "footer": "{webLink}",
      "buttons": [
        { "type": "reply", "name": "Lihat Katalog", "action": "list" }
      ]
    },
    {
      "name": "Menu Gaya Santai (Draft Nonaktif)",
      "content": "Hai kak! Lagi cari aplikasi premium? Yuk cek katalog {storeName}.",
      "active": false,
      "buttons": [
        { "type": "reply", "name": "Cek Produk", "action": "list" },
        { "type": "reply", "name": "Chat Owner", "action": "owner" }
      ]
    }
  ]
}`,
  },
  group_moderation: {
    title: 'Template Moderasi Grup (Kick, AntiKudeta, Open & Close)',
    subtitle: 'Contoh 9 kategori respon moderasi grup dengan tag mention @{pelakuNumber} dan @{targetNumber}.',
    code: `{
  "kick_anti_kudeta": {
    "name": "Proteksi AntiKudeta Standar",
    "content": "[AntiKudeta] @{pelakuNumber} terdeteksi mencoba mengeluarkan {ownerName} (Owner)",
    "footer": "{storeName} · Proteksi AntiKudeta"
  },
  "kick_bot_not_admin": {
    "name": "Kick: Bot Bukan Admin",
    "content": "Bot belum menjadi admin di grup *{groupName}*, sehingga tidak dapat mengeluarkan anggota.",
    "footer": "{storeName} · Moderasi Grup"
  },
  "kick_success": {
    "name": "Berhasil Kick Anggota",
    "content": "@{targetNumber} berhasil dikeluarkan dari grup *{groupName}* oleh @{pelakuNumber}.",
    "footer": "{storeName} · Moderasi Grup"
  },
  "open_bot_not_admin": {
    "name": "Open: Bot Bukan Admin",
    "content": "Bot belum menjadi admin di grup *{groupName}*, sehingga belum bisa membuka chat grup.",
    "footer": "{storeName} · Moderasi Grup"
  },
  "open_already": {
    "name": "Grup Sudah Terbuka",
    "content": "Kondisi grup *{groupName}* saat ini sudah dalam keadaan terbuka untuk semua anggota.",
    "footer": "{storeName} · Moderasi Grup"
  },
  "open_success": {
    "name": "Berhasil Buka Grup",
    "content": "Grup *{groupName}* berhasil dibuka oleh @{pelakuNumber}. Sekarang semua anggota dapat mengirim pesan.",
    "footer": "{storeName} · Moderasi Grup"
  },
  "close_bot_not_admin": {
    "name": "Close: Bot Bukan Admin",
    "content": "Bot belum menjadi admin di grup *{groupName}*, sehingga belum bisa menutup chat grup.",
    "footer": "{storeName} · Moderasi Grup"
  },
  "close_already": {
    "name": "Grup Sudah Ditutup",
    "content": "Kondisi grup *{groupName}* saat ini sudah dalam keadaan ditutup (hanya admin yang bisa chat).",
    "footer": "{storeName} · Moderasi Grup"
  },
  "close_success": {
    "name": "Berhasil Tutup Grup",
    "content": "Grup *{groupName}* berhasil ditutup oleh @{pelakuNumber}. Sekarang hanya admin yang dapat mengirim pesan.",
    "footer": "{storeName} · Moderasi Grup"
  }
}`,
  },
};

function formatGroupedSampleWithBlankLines(grouped: Record<string, any>): string {
  const keys = Object.keys(grouped);
  if (keys.length === 0) return '{\n}';

  const blocks = keys.map((key, idx) => {
    const formattedVal = JSON.stringify(grouped[key], null, 2)
      .split('\n')
      .map((line, lineIdx) => (lineIdx === 0 ? line : `  ${line}`))
      .join('\n');
    const comma = idx < keys.length - 1 ? ',' : '';
    return `  ${JSON.stringify(key)}: ${formattedVal}${comma}`;
  });

  return `{\n${blocks.join('\n\n')}\n}`;
}

export function buildPublicSample28CategoryJson(): string {
  const sample: Record<string, any> = {
    menu: {
      name: 'Paket Menu Utama',
      content:
        'Halo kak! Selamat datang di {storeName}\n\nSilakan pilih layanan yang ingin Anda pesan melalui tombol interaktif di bawah ini:',
      footer: '{webLink} · Otomatis',
      buttons: [{ type: 'reply', name: '📋 Daftar Produk', action: 'list' }],
    },
    list: {
      name: 'Paket List Katalog',
      content: '*DAFTAR LAYANAN & HARGA {storeName}*\n\n{daftarProduk}\n\nSilakan pilih produk yang tersedia:',
      footer: '{webLink} · Katalog Resmi',
      buttons: [{ role: 'dropdown', name: '📋 Pilih Produk' }],
    },
    carousel: {
      name: 'Paket Carousel Produk',
      content: '*PRODUK TERSEDIA*\nSilakan geser kartu di bawah untuk memilih varian:',
      footer: '{webLink} · Geser Kartu',
      buttons: [
        { role: 'order', name: '🛒 Order' },
        { type: 'reply', name: '📞 Contact Admin', action: 'admin' },
      ],
    },
    invoice: {
      name: 'Paket Invoice QRIS',
      content:
        '*INVOICE PEMBAYARAN QRIS*\nHalo kak, pesanan varian *{varian}* untuk produk *{produkName}* telah diterbitkan!\n\n- *ID Order:* `{orderId}`\n- *Total Bayar:* *Rp {finalPrice}*',
      footer: '{webLink} · Verifikasi Otomatis',
      buttons: [
        { role: 'pay', name: '💳 Bayar Sekarang' },
        { role: 'admin', name: '📞 Hubungi Admin' },
      ],
    },
    confirm_summary: {
      name: 'Paket Ringkasan Order',
      content:
        '*RINCIAN PESANAN*\n- *Produk:* {produkName}\n- *Varian:* {varian}\n- *Harga Normal:* Rp {price}\n\nPilih tombol di bawah untuk pakai promo atau langsung bayar.',
      footer: '{storeName} · Konfirmasi Pesanan',
      buttons: [
        { role: 'promo', name: '🎟️ Pakai Kode Promo' },
        { role: 'direct', name: '⚡ Lanjut Bayar (Normal)' },
      ],
    },
    confirm_promo_input: {
      name: 'Paket Input Kode Promo',
      content: '*MASUKKAN KODE PROMO*\nKetik kode promo Anda atau ketik *BATAL* untuk harga normal.',
      footer: '{storeName} · Konfirmasi Pesanan',
    },
    confirm_promo_valid: {
      name: 'Paket Promo Valid',
      content: '*PROMO DITERIMA!*\nKode: *{promoCode}* (-Rp {discount})\nTotal Bayar: *Rp {finalPrice}*',
      footer: '{storeName} · Promo Berhasil',
    },
    confirm_promo_invalid: {
      name: 'Paket Promo Invalid',
      content: 'Kode promo *{promoCode}* tidak dapat digunakan ({reason}). Ketik kode lain atau *BATAL*.',
      footer: '{storeName} · Cek Kode Promo',
    },
    payment_success_dm: {
      name: 'Paket Transaksi Lunas DM',
      content:
        '*PEMBAYARAN LUNAS!*\nTerima kasih kak *{customerName}*, order #{orderId} sebesar *Rp {finalPrice}* telah lunas.',
      footer: '{storeName} · Pembayaran Terverifikasi',
    },
    payment_success_group: {
      name: 'Paket Transaksi Lunas Grup',
      content: 'Pembayaran untuk *{produkName} ({varian})* oleh @{customerNumber} telah *LUNAS*!',
    },
    payment_expired: {
      name: 'Paket Invoice Kedaluwarsa',
      content: 'Waktu pembayaran pesanan *{produkName} ({varian})* (Order #{orderId}) telah berakhir.',
      footer: '{storeName} · Invoice Kedaluwarsa',
    },
    payment_error: {
      name: 'Paket Kendala Gateway',
      content: 'Terjadi kendala saat menerbitkan kode QRIS: {errorMessage}. Silakan hubungi admin.',
      footer: '{storeName} · Layanan Pelanggan',
    },
    order_group_notif: {
      name: 'Paket Alur Order Grup',
      content: 'Halo @{customerNumber}, rincian pesanan *{produkName} ({varian})* telah kami kirim ke DM Anda.',
      footer: '{storeName} · Pesanan WhatsApp',
    },
    stock_empty: {
      name: 'Paket Stok Kosong',
      content: 'Maaf kak @{customerNumber}, stok produk *{produkName} ({varian})* sedang habis.',
      footer: '{storeName} · Status Stok',
    },
    checkout_session_expired: {
      name: 'Paket Sesi Checkout Habis',
      content: 'Sesi pesanan Anda telah berakhir. Silakan pilih varian kembali di katalog {storeName}.',
      footer: '{storeName} · Sesi Berakhir',
    },
    promo_cancelled: {
      name: 'Paket Kupon Dibatalkan',
      content: 'Penggunaan kode promo dibatalkan. Menyiapkan invoice QRIS dengan harga normal (Rp {price})...',
      footer: '{storeName} · Info Kupon',
    },
    contact_owner_empty: {
      name: 'Paket Kontak Owner Kosong',
      content: 'Informasi tentang owner belum diatur pada toko ini.',
      footer: '{storeName} · Informasi Owner',
    },
    contact_admin_empty: {
      name: 'Paket Kontak Admin Kosong',
      content: 'Informasi tentang admin belum diatur pada toko ini.',
      footer: '{storeName} · Layanan Pelanggan',
    },
    expiry_warning_owner: {
      name: 'Paket Peringatan Masa Sewa',
      content:
        '*PERINGATAN MASA SEWA BOT*\nHalo *{ownerName}* (*{storeName}*), sisa masa aktif bot: *{remainingTime}* (berakhir {expiryDate} WIB).',
      footer: '{storeName} Official · Notifikasi Otomatis',
    },
    kick_anti_kudeta: {
      name: 'Paket AntiKudeta Grup',
      content: '[AntiKudeta] @{pelakuNumber} terdeteksi mencoba mengeluarkan {ownerName} (Owner)',
      footer: '{storeName} · Proteksi AntiKudeta',
    },
    kick_bot_not_admin: {
      name: 'Paket Kick: Bot Bukan Admin',
      content:
        '*Bot Bukan Admin*\nBot belum menjadi admin di grup *{groupName}*, sehingga tidak dapat mengeluarkan anggota.\n\nSilakan jadikan nomor bot sebagai admin grup terlebih dahulu.',
      footer: '{storeName} · Moderasi Grup',
    },
    kick_success: {
      name: 'Paket Berhasil Mengeluarkan Anggota',
      content: '@{targetNumber} berhasil dikeluarkan dari grup *{groupName}* oleh @{pelakuNumber}.',
      footer: '{storeName} · Moderasi Grup',
    },
    open_bot_not_admin: {
      name: 'Paket Open: Bot Bukan Admin',
      content:
        '*Bot Bukan Admin*\nBot belum menjadi admin di grup *{groupName}*, sehingga tidak dapat membuka pengaturan chat grup.\n\nSilakan jadikan nomor bot sebagai admin grup terlebih dahulu.',
      footer: '{storeName} · Moderasi Grup',
    },
    open_already: {
      name: 'Paket Open: Grup Sudah Terbuka',
      content: 'Kondisi grup *{groupName}* saat ini sudah dalam keadaan terbuka (semua anggota dapat mengirim pesan).',
      footer: '{storeName} · Moderasi Grup',
    },
    open_success: {
      name: 'Paket Open: Berhasil Buka Grup',
      content: 'Grup *{groupName}* berhasil dibuka oleh @{pelakuNumber}. Sekarang semua anggota dapat mengirim pesan.',
      footer: '{storeName} · Moderasi Grup',
    },
    close_bot_not_admin: {
      name: 'Paket Close: Bot Bukan Admin',
      content:
        '*Bot Bukan Admin*\nBot belum menjadi admin di grup *{groupName}*, sehingga tidak dapat menutup pengaturan chat grup.\n\nSilakan jadikan nomor bot sebagai admin grup terlebih dahulu.',
      footer: '{storeName} · Moderasi Grup',
    },
    close_already: {
      name: 'Paket Close: Grup Sudah Ditutup',
      content: 'Kondisi grup *{groupName}* saat ini sudah dalam keadaan ditutup (hanya admin yang dapat mengirim pesan).',
      footer: '{storeName} · Moderasi Grup',
    },
    close_success: {
      name: 'Paket Close: Berhasil Tutup Grup',
      content: 'Grup *{groupName}* berhasil ditutup oleh @{pelakuNumber}. Sekarang hanya admin yang dapat mengirim pesan.',
      footer: '{storeName} · Moderasi Grup',
    },
  };

  return formatGroupedSampleWithBlankLines(sample);
}
