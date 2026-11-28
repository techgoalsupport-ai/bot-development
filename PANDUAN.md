# Panduan Lengkap Key Kategori JSON & Placeholder Template Pesan

Dokumen ini merupakan referensi resmi seluruh **Key Kategori JSON** (total 28 kategori aktif + 1 alias kompatibilitas mundur) dan **Daftar Seluruh Placeholder** yang didukung oleh engine bot WhatsApp dan fitur Import/Export JSON pada Dashboard Admin maupun Dashboard Tenant.

---

## Daftar Isi
1. [Aturan Umum Struktur JSON & Perilaku Bot](#1-aturan-umum-struktur-json--perilaku-bot)
2. [Daftar Lengkap 28 Key Kategori JSON & Placeholder yang Didukung](#2-daftar-lengkap-28-key-kategori-json--placeholder-yang-didukung)
3. [Daftar Seluruh Placeholder & Fungsinya](#3-daftar-seluruh-placeholder--fungsinya)
4. [Catatan Teknis Parser Placeholder](#4-catatan-teknis-parser-placeholder)
5. [Contoh Struktur JSON Siap Import](#5-contoh-struktur-json-siap-import)

---

## 1. Aturan Umum Struktur JSON & Perilaku Bot

### 1.1 Field Template per Kategori
Setiap objek template di dalam JSON menggunakan field berikut:

| Field | Wajib | Alias yang Diterima | Keterangan |
| :--- | :--- | :--- | :--- |
| `name` | Opsional | - | Nama template di dashboard (default otomatis: `Paket <kategori>`). |
| `content` | **Ya** | - | Isi utama teks pesan WhatsApp. Tidak boleh kosong. |
| `footer` | Opsional | `footer_text` | Teks footer kecil di bagian bawah pesan interaktif. |
| `buttons` | Opsional | - | Array tombol interaktif WhatsApp. Jika dikosongkan pada kategori bertombol wajib, tombol wajib tetap disuntikkan otomatis. |
| `active` | Opsional | `is_active` | Status aktif template (`true`/`false` atau `1`/`0`). Default mengikuti opsi import (aktif). |

### 1.2 Aturan Footer & Tombol Interaktif
- **Footer Bersyarat**: WhatsApp hanya merender `footer` apabila pesan memiliki minimal **1 tombol interaktif** (`buttons.length > 0`). Apabila pesan tidak memiliki tombol interaktif sama sekali, bot secara otomatis tidak mengirimkan `footer` agar tampilan pesan tetap bersih dan valid.
- **Tombol Wajib (`role`)**: Kategori `list`, `carousel`, `invoice`, dan `confirm_summary` memiliki tombol wajib yang **tipe dan action internalnya dikunci sistem**. Di JSON, cukup tulis `{ "role": "<nama_role>", "name": "<label_kustom>" }` untuk mengganti teks label tombolnya saja.
- **Tipe Tombol Kustom (`type`)**:
  - `reply` (alias: `quick_reply`): Tombol balasan cepat. Mendukung `action`: `list`, `menu`, `owner`, `admin`, atau teks custom via `value`/`output`.
  - `url` (alias: `link`, `cta_url`): Tombol tautan eksternal (`url`).
  - `copy` (alias: `cta_copy`): Tombol salin teks ke clipboard (`value`).
  - `call` (alias: `phone`, `cta_call`): Tombol panggilan telepon (`phone`).
  - `vcard` (alias: `contact`): Tombol kirim kartu kontak (`contactName`, `phone`).
  - `reminder` / `cancel_reminder` (`cta_reminder` / `cta_cancel_reminder`): Tombol pengingat WhatsApp (`value`).

---

## 2. Daftar Lengkap 28 Key Kategori JSON & Placeholder yang Didukung

> **Catatan Penting:** Semua **8 placeholder Identitas Toko** (`{storeName}`, `{ownerName}`, `{ownerNumber}`, `{adminName}`, `{adminNumber}`, `{webLink}`, `{waLink}`, `{telegramBot}`) bersifat **global** dan otomatis tersedia di **seluruh 28 kategori** (baik di `content`, `footer`, maupun label/isi `buttons`). Kolom *Placeholder yang Didukung* di bawah mencantumkan seluruh token kontekstual ditambah token toko yang relevan pada kategori tersebut.

### A. Kategori Utama, Katalog, Kontak, & Sewa (6 Kategori)

| No | Key Kategori JSON | Pemicu (Trigger) | Tombol Wajib (`role`) | Placeholder yang Didukung |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `menu` | Pembeli mengetik `.menu` / `/menu` atau menekan tombol ber-action `menu` | *(Tidak ada)* | `{storeName}`, `{ownerName}`, `{ownerNumber}`, `{adminName}`, `{adminNumber}`, `{webLink}`, `{waLink}`, `{telegramBot}` |
| 2 | `list` | Pembeli mengetik `.list` / `/list` atau menekan tombol ber-action `list` | `dropdown` (`list_dropdown`) | `{daftarProduk}`, `{storeName}`, `{ownerName}`, `{ownerNumber}`, `{adminName}`, `{adminNumber}`, `{webLink}`, `{waLink}`, `{telegramBot}` |
| 3 | `carousel` | Menampilkan kartu slide varian setelah pembeli memilih produk di dropdown List | `order` (`carousel_order`) | `{produkName}`, `{category}`, `{varian}`, `{price}`, `{stock}`, `{storeName}`, `{ownerName}`, `{ownerNumber}`, `{adminName}`, `{adminNumber}`, `{webLink}`, `{waLink}`, `{telegramBot}` |
| 4 | `contact_owner_empty` | Command `.owner` dipicu saat nomor WA Owner belum diisi di Pengaturan Toko | *(Tidak ada)* | `{storeName}`, `{ownerName}`, `{ownerNumber}`, `{adminName}`, `{adminNumber}`, `{webLink}`, `{waLink}`, `{telegramBot}` |
| 5 | `contact_admin_empty` | Command `.admin` / `.contact` dipicu saat nomor WA Admin CS belum diisi di Pengaturan Toko | *(Tidak ada)* | `{storeName}`, `{ownerName}`, `{ownerNumber}`, `{adminName}`, `{adminNumber}`, `{webLink}`, `{waLink}`, `{telegramBot}` |
| 6 | `expiry_warning_owner` | Notifikasi otomatis ke WA Owner menjelang masa aktif sewa bot berakhir | *(Tidak ada)* *(default fallback tombol URL perpanjangan jika tombol kosong)* | `{tenantId}`, `{remainingTime}`, `{expiryDate}`, `{extendUrl}`, `{ownerName}`, `{storeName}`, `{ownerNumber}`, `{adminName}`, `{adminNumber}`, `{webLink}`, `{waLink}`, `{telegramBot}` |

*(Catatan: `invoice` berada pada kelompok Checkout di bawah sehingga total kategori utama + checkout + transaksi + grup berjumlah tepat 28 kategori.)*

### B. Kategori Checkout & Pembayaran QRIS (5 Kategori)

| No | Key Kategori JSON | Pemicu (Trigger) | Tombol Wajib (`role`) | Placeholder yang Didukung |
| :--- | :--- | :--- | :--- | :--- |
| 7 | `confirm_summary` *(alias JSON: `confirmation`)* | Dikirim ke DM pembeli setelah klik tombol `Order` sebelum QRIS dibuat | `promo` (`confirm_promo`), `direct` (`confirm_direct`) | `{produkName}`, `{varian}`, `{category}`, `{price}`, `{total}`, `{customerName}`, `{customerNumber}`, `{storeName}`, `{ownerName}`, `{ownerNumber}`, `{adminName}`, `{adminNumber}`, `{webLink}`, `{waLink}`, `{telegramBot}` |
| 8 | `confirm_promo_input` | Balasan saat pembeli memilih tombol Pakai Kode Promo (batas sesi 3 menit) | *(Tidak ada)* | `{produkName}`, `{varian}`, `{price}`, `{total}`, `{customerName}`, `{customerNumber}`, `{storeName}`, `{ownerName}`, `{ownerNumber}`, `{adminName}`, `{adminNumber}`, `{webLink}`, `{waLink}`, `{telegramBot}` |
| 9 | `confirm_promo_valid` | Konfirmasi diskon saat kode promo valid dan kuota masih tersedia | *(Tidak ada)* | `{produkName}`, `{varian}`, `{price}`, `{promoCode}`, `{discount}`, `{finalPrice}`, `{customerName}`, `{customerNumber}`, `{storeName}`, `{ownerName}`, `{ownerNumber}`, `{adminName}`, `{adminNumber}`, `{webLink}`, `{waLink}`, `{telegramBot}` |
| 10 | `confirm_promo_invalid` | Balasan saat kode promo salah, tidak cocok dengan varian, habis kuota, atau kedaluwarsa | *(Tidak ada)* | `{produkName}`, `{varian}`, `{price}`, `{promoCode}`, `{reason}`, `{errorMessage}`, `{customerName}`, `{customerNumber}`, `{storeName}`, `{ownerName}`, `{ownerNumber}`, `{adminName}`, `{adminNumber}`, `{webLink}`, `{waLink}`, `{telegramBot}` |
| 11 | `invoice` | Bot menerbitkan tagihan QRIS LunasQRIS untuk dibayar pembeli | `pay` (`invoice_pay_url`), `admin` (`invoice_contact_admin`) | `{produkName}`, `{category}`, `{varian}`, `{price}`, `{unikCode}`, `{total}`, `{finalPrice}`, `{discount}`, `{promoCode}`, `{orderId}`, `{paymentUrl}`, `{expiryDate}`, `{customerName}`, `{customerNumber}`, `{invoiceAdminUrl}` *(khusus tombol wajib)*, + seluruh placeholder Identitas Toko |

### C. Kategori Status Transaksi & Sesi Order (8 Kategori)

| No | Key Kategori JSON | Pemicu (Trigger) | Tombol Wajib (`role`) | Placeholder yang Didukung |
| :--- | :--- | :--- | :--- | :--- |
| 12 | `payment_success_dm` | Dikirim ke DM pembeli setelah QRIS lunas & auto-order Xaviera selesai | *(Tidak ada)* | `{orderId}`, `{supplierOrderId}`, `{credentials}`, `{accountEmail}`, `{accountPassword}`, `{supplierStatus}`, `{supplierError}`, `{produkName}`, `{varian}`, `{price}`, `{total}`, `{totalPrice}`, `{finalPrice}`, `{paymentUrl}`, `{paymentExpiry}`, `{customerName}`, `{customerNumber}`, + seluruh placeholder Identitas Toko |
| 13 | `payment_success_group` | Pengumuman pelunasan di grup asal apabila order dimulai dari grup | *(Tidak ada)* | `{orderId}`, `{supplierOrderId}`, `{produkName}`, `{varian}`, `{price}`, `{total}`, `{totalPrice}`, `{finalPrice}`, `{paymentUrl}`, `{customerName}`, `{customerNumber}`, + seluruh placeholder Identitas Toko |
| 14 | `payment_expired` | Dikirim otomatis apabila pembeli tidak membayar hingga batas waktu QRIS habis | *(Tidak ada)* | `{orderId}`, `{produkName}`, `{varian}`, `{price}`, `{total}`, `{paymentUrl}`, `{customerName}`, `{customerNumber}`, + seluruh placeholder Identitas Toko |
| 15 | `payment_error` | Pesan fallback saat gateway LunasQRIS gagal dihubungi atau kuota promo habis saat invoice dibuat | *(Tidak ada)* | `{produkName}`, `{varian}`, `{orderId}`, `{price}`, `{total}`, `{errorMessage}`, `{reason}`, `{customerName}`, `{customerNumber}`, + seluruh placeholder Identitas Toko |
| 16 | `order_group_notif` | Pesan pengarah di grup agar pembeli mengecek DM untuk melanjutkan checkout | *(Tidak ada)* | `{produkName}`, `{varian}`, `{price}`, `{total}`, `{customerName}`, `{customerNumber}`, + seluruh placeholder Identitas Toko |
| 17 | `stock_empty` | Balasan otomatis saat pembeli memilih produk/varian yang stoknya 0 | *(Tidak ada)* | `{produkName}`, `{customerName}`, `{customerNumber}`, + seluruh placeholder Identitas Toko |
| 18 | `checkout_session_expired` | Peringatan saat pembeli membalas setelah sesi input promo 3 menit habis | *(Tidak ada)* | `{produkName}`, `{varian}`, `{price}`, `{total}`, `{customerName}`, `{customerNumber}`, + seluruh placeholder Identitas Toko |
| 19 | `promo_cancelled` | Konfirmasi saat pembeli mengetik `BATAL` di tengah sesi input kode promo | *(Tidak ada)* | `{produkName}`, `{varian}`, `{price}`, `{total}`, `{customerName}`, `{customerNumber}`, + seluruh placeholder Identitas Toko |

### D. Kategori Moderasi & Keamanan Grup (9 Kategori)

| No | Key Kategori JSON | Pemicu (Trigger) | Tombol Wajib (`role`) | Placeholder yang Didukung |
| :--- | :--- | :--- | :--- | :--- |
| 20 | `kick_anti_kudeta` | Dipicu saat admin/pembuat grup mencoba mengeluarkan (`kick`) nomor Owner toko | *(Tidak ada)* | `{pelakuNumber}`, `{pelakuName}`, `{targetNumber}`, `{targetName}`, `{groupName}`, `{ownerName}`, `{ownerNumber}`, + seluruh placeholder Identitas Toko |
| 21 | `kick_bot_not_admin` | Dipicu saat admin menjalankan `.kick` namun nomor bot belum menjadi admin grup | *(Tidak ada)* | `{pelakuNumber}`, `{pelakuName}`, `{targetNumber}`, `{targetName}`, `{groupName}`, + seluruh placeholder Identitas Toko |
| 22 | `kick_success` | Konfirmasi di grup setelah bot berhasil mengeluarkan anggota target | *(Tidak ada)* | `{targetNumber}`, `{targetName}`, `{pelakuNumber}`, `{pelakuName}`, `{groupName}`, + seluruh placeholder Identitas Toko |
| 23 | `open_bot_not_admin` | Dipicu saat admin menjalankan `.open` namun bot belum menjadi admin grup | *(Tidak ada)* | `{pelakuNumber}`, `{pelakuName}`, `{groupName}`, + seluruh placeholder Identitas Toko |
| 24 | `open_already` | Dipicu saat admin menjalankan `.open` padahal grup memang sudah terbuka | *(Tidak ada)* | `{pelakuNumber}`, `{pelakuName}`, `{groupName}`, + seluruh placeholder Identitas Toko |
| 25 | `open_success` | Konfirmasi setelah bot mengubah grup menjadi terbuka untuk semua anggota | *(Tidak ada)* | `{pelakuNumber}`, `{pelakuName}`, `{groupName}`, + seluruh placeholder Identitas Toko |
| 26 | `close_bot_not_admin` | Dipicu saat admin menjalankan `.close` namun bot belum menjadi admin grup | *(Tidak ada)* | `{pelakuNumber}`, `{pelakuName}`, `{groupName}`, + seluruh placeholder Identitas Toko |
| 27 | `close_already` | Dipicu saat admin menjalankan `.close` padahal grup memang sudah ditutup (khusus admin) | *(Tidak ada)* | `{pelakuNumber}`, `{pelakuName}`, `{groupName}`, + seluruh placeholder Identitas Toko |
| 28 | `close_success` | Konfirmasi setelah bot mengubah grup menjadi tertutup (hanya admin bisa kirim pesan) | *(Tidak ada)* | `{pelakuNumber}`, `{pelakuName}`, `{groupName}`, + seluruh placeholder Identitas Toko |

---

## 3. Daftar Seluruh Placeholder & Fungsinya

### 3.1 Placeholder Identitas Toko & Kontak (Global)
Dapat digunakan pada **semua 28 kategori**, baik pada `content`, `footer`, maupun parameter `buttons` (label tombol, `url`, `phone`, `contactName`, `value`).

| Placeholder Utama | Alias yang Dikenali | Fungsi | Contoh Output |
| :--- | :--- | :--- | :--- |
| `{storeName}` | `{namaStore}` | Menampilkan nama toko resmi milik tenant dari Pengaturan Toko. | `Toko Digital Nusantara` |
| `{ownerName}` | `{namaOwner}` | Menampilkan nama pemilik (Owner) toko. Juga dipakai pada pesan proteksi `kick_anti_kudeta` dan pengingat sewa. | `Budi Santoso` |
| `{ownerNumber}` | `{nomerOwner}` | Menampilkan nomor WhatsApp Owner toko (format `628xxx`). | `6281234567890` |
| `{adminName}` | `{namaAdmin}` | Menampilkan nama Admin / Customer Service toko. | `CS Rina` |
| `{adminNumber}` | `{nomerAdmin}`, `{adminMumber}` | Menampilkan nomor WhatsApp Admin CS toko (format `628xxx`). Alias `{adminMumber}` disediakan sebagai toleransi typo. | `6289876543210` |
| `{webLink}` | `{linkWebsite}` | Menampilkan URL website atau landing page toko. | `https://tokoanda.com` |
| `{waLink}` | `{linkSaluran}` | Menampilkan link saluran / komunitas WhatsApp resmi toko. | `https://whatsapp.com/channel/...` |
| `{telegramBot}` | `{botTelegram}` | Menampilkan username atau link bot/akun Telegram toko. | `@tokoanda_bot` |

---

### 3.2 Placeholder Katalog, Produk, Varian, & Harga
Terisi otomatis ketika bot merender katalog (`list`), kartu varian (`carousel`), ringkasan order, maupun transaksi.

| Placeholder Utama | Alias yang Dikenali | Fungsi | Contoh Output |
| :--- | :--- | :--- | :--- |
| `{daftarProduk}` | *(Tidak ada)* | **Khusus kategori `list`**. Menyisipkan daftar lengkap produk aktif dari katalog secara otomatis dengan penomoran dan pengelompokan kategori. | `1. Netflix UHD\n2. Spotify Premium` |
| `{produkName}` | `{productName}` | Menampilkan nama produk / layanan utama yang dipilih pembeli. | `Netflix Premium` |
| `{varian}` | `{variant}` | Menampilkan nama varian / paket / durasi produk yang dipilih. | `1 Bulan Private` |
| `{category}` | `{kategori}` | Menampilkan nama kategori dari produk tersebut di katalog. | `Streaming` |
| `{stock}` | `{stok}` | Menampilkan jumlah sisa stok varian yang tersedia (`> 0`). | `14` |
| `{price}` | `{harga}` | Menampilkan harga jual normal sebelum diskon promo (otomatis terformat pemisah ribuan `id-ID`). | `35.000` |
| `{total}` | `{totalBayar}`, `{totalPrice}` | Menampilkan total nominal yang harus dibayar (termasuk kode unik QRIS apabila transaksi sudah dibuat). | `30.127` |

---

### 3.3 Placeholder Promo, Diskon, Invoice, & Transaksi QRIS
Terisi otomatis selama proses validasi kupon promo, penerbitan tagihan QRIS, hingga notifikasi lunas/kedaluwarsa.

| Placeholder Utama | Alias yang Dikenali | Fungsi | Contoh Output |
| :--- | :--- | :--- | :--- |
| `{promoCode}` | `{kodePromo}` | Menampilkan kode kupon promo yang diinput atau digunakan pembeli (atau `-` jika tanpa promo). | `HEMAT10` |
| `{discount}` | `{potongan}`, `{diskon}` | Menampilkan nominal potongan diskon dalam format ribuan. | `5.000` |
| `{finalPrice}` | `{hargaAkhir}`, `{totalDiskon}` | Menampilkan harga akhir setelah dikurangi potongan kupon promo (sebelum/sesuai nominal transaksi). | `30.000` |
| `{unikCode}` | `{kodeUnik}`, `{feeGateway}` | Menampilkan kode unik / biaya tambahan gateway QRIS. | `127` |
| `{orderId}` | `{order_id}` | Menampilkan ID unik transaksi pada sistem bot & gateway LunasQRIS. | `ORD-M1X2-A3B4` |
| `{supplierOrderId}` | `{xavieraOrderId}` | Menampilkan ID order resmi yang dikembalikan server Xaviera setelah auto-order `POST /v1/products/order` berhasil. | `o_9f8e7d6c` |
| `{credentials}` | `{accountDetails}`, `{akun}`, `{kredensial}`, `{dataAkun}` | **Khusus `payment_success_dm`**. Menampilkan blok lengkap kredensial akun (email, password, atau detail tambahan) dari Xaviera. Bila order otomatis terkendala, otomatis menampilkan pesan panduan menghubungi admin. | `• *Email:* buyer@example.com\n• *Password:* rahasia123` |
| `{accountEmail}` | `{emailAkun}`, `{email}` | **Khusus `payment_success_dm`**. Menampilkan email/username akun dari respons kredensial pertama Xaviera. | `buyer@example.com` |
| `{accountPassword}` | `{passwordAkun}`, `{password}` | **Khusus `payment_success_dm`**. Menampilkan password akun dari respons kredensial pertama Xaviera. | `rahasia123` |
| `{supplierStatus}` | *(Tidak ada)* | Status pemenuhan order otomatis ke Xaviera (`fulfilled`, `failed`, atau `in_progress`). | `fulfilled` |
| `{supplierError}` | `{deliveryError}` | Pesan detail apabila eksekusi auto-order ke Xaviera gagal (misalnya saldo Xaviera tidak cukup). | `Saldo tidak cukup. Butuh Rp 15.000.` |
| `{paymentUrl}` | `{linkPembayaran}`, `{urlPembayaran}` | Menampilkan URL halaman pembayaran QRIS bagi pembeli. Juga dipakai oleh tombol wajib `pay` pada kategori `invoice`. | `https://lunasqris.com/pay/...` |
| `{invoiceAdminUrl}` | *(Tidak ada)* | Token internal untuk tombol wajib `admin` pada kategori `invoice`. Mengarah otomatis ke `https://wa.me/{adminNumber}` (atau `ownerNumber` jika admin kosong). | `https://wa.me/6289876543210` |
| `{reason}` | `{alasan}`, `{alasanBatal}` | Menampilkan alasan penolakan kode promo atau kegagalan transaksi. | `Kuota promo habis` |
| `{errorMessage}` | `{pesanError}`, `{kendala}` | Menampilkan detail pesan kendala saat gateway pembayaran gagal merespons (fallback ke `reason` bila ada). | `Timeout koneksi server QRIS` |

---

### 3.4 Placeholder Pembeli (Customer)
Terisi otomatis dari profil dan nomor WhatsApp pembeli yang berinteraksi dengan bot.

| Placeholder Utama | Alias yang Dikenali | Fungsi | Contoh Output |
| :--- | :--- | :--- | :--- |
| `{customerName}` | `{senderName}`, `{namaPembeli}` | Menampilkan nama tampilan (pushName) WhatsApp pembeli. | `Andi Wijaya` |
| `{customerNumber}` | `{senderNumber}`, `{nomorPembeli}`, `{buyerNumber}` | Menampilkan nomor WhatsApp bersih pembeli (`628xxx`). **Tips:** tulis `@{customerNumber}` untuk men-tag/mention pembeli di grup. | `6285611122233` |

---

### 3.5 Placeholder Moderasi & Keamanan Grup (`kick_*`, `open_*`, `close_*`)
Terisi otomatis saat command `.kick`, `.open`, `.close`, atau deteksi AntiKudeta berjalan di dalam grup WhatsApp.

| Placeholder Utama | Alias yang Dikenali | Fungsi | Contoh Output |
| :--- | :--- | :--- | :--- |
| `{pelakuNumber}` | `{actorNumber}`, `{adminPelaku}` | Menampilkan nomor/ID WA admin yang memicu command atau mencoba meng-kick Owner. Tulis `@{pelakuNumber}` agar otomatis me-mention pelaku di grup. | `6281122334455` |
| `{pelakuName}` | `{actorName}` | Menampilkan nama tampilan (pushName) admin pemicu command. | `Admin Satu` |
| `{targetNumber}` | `{nomerTarget}`, `{nomorTarget}` | Menampilkan nomor/ID WA anggota yang menjadi target `.kick`. Tulis `@{targetNumber}` untuk mention target. | `6287788990011` |
| `{targetName}` | `{namaTarget}` | Menampilkan nama anggota yang dikeluarkan dari grup. | `Member Spam` |
| `{groupName}` | `{namaGrup}` | Menampilkan judul/subjek grup WhatsApp tempat command dijalankan. | `Grup Reseller VIP` |

---

### 3.6 Placeholder Masa Sewa Bot & Unit Tenant (`expiry_warning_owner`, `invoice`)
Digunakan oleh sistem pengingat masa aktif sewa bot kepada Owner dan batas waktu kedaluwarsa.

| Placeholder Utama | Alias yang Dikenali | Fungsi | Contoh Output |
| :--- | :--- | :--- | :--- |
| `{tenantId}` | `{idBot}`, `{idUnit}` | Menampilkan ID unik unit tenant bot yang bersangkutan. | `t_tokopembeli_842` |
| `{remainingTime}` | `{sisaWaktu}`, `{sisaHari}` | Menampilkan sisa durasi masa aktif sewa bot sebelum berakhir. | `2 Hari 5 Jam` |
| `{expiryDate}` | `{waktuKedaluwarsa}`, `{tanggalExpired}`, `{paymentExpiry}` | Menampilkan tanggal dan waktu berakhirnya masa sewa bot (atau masa berlaku kedaluwarsa). | `30 Nov 2026 23:59` |
| `{extendUrl}` | *(Tidak ada)* | Menampilkan tautan langsung (mis. link WA Admin/Partner) untuk melakukan perpanjangan masa sewa bot. | `https://wa.me/628...` |

---

## 4. Catatan Teknis Parser Placeholder

1. **Case-Insensitive**: Parser placeholder tidak membedakan huruf besar dan kecil (contoh `{storeName}` dan `{storename}` sama-sama dikenali), namun penulisan **camelCase standar** tetap sangat disarankan agar konsisten dengan editor dashboard.
2. **Anti-Duplikasi Awalan `Rp`**: Untuk placeholder nominal (`{price}`, `{harga}`, `{total}`, `{totalBayar}`, `{totalPrice}`, `{discount}`, `{potongan}`, `{diskon}`, `{finalPrice}`, `{hargaAkhir}`, `{totalDiskon}`), Anda bebas menulis `Rp {price}` atau hanya `{price}`. Jika menulis `Rp {price}`, parser tidak akan menggandakannya menjadi `Rp Rp 35.000`.
3. **Mention / Tag Anggota Grup**: WhatsApp membutuhkan prefiks `@` sebelum digit nomor agar nama pengguna muncul sebagai tag biru yang dapat diklik. Contoh: `@{customerNumber}`, `@{pelakuNumber}`, `@{targetNumber}`.
4. **Placeholder Tidak Terdefinisi di Konteks**: Apabila sebuah placeholder dipakai di kategori yang tidak menyuplai datanya (misalnya `{orderId}` ditulis di template `menu`), teks `{orderId}` tidak akan terganti. Pastikan hanya memakai placeholder yang tercantum pada kolom dukungan masing-masing kategori di Bagian 2.
5. **Pengiriman Otomatis Kredensial (`payment_success_dm`)**: Ketika status pembayaran QRIS berubah menjadi `paid`, sistem otomatis mengeksekusi `POST /v1/products/order` ke server Xaviera dan menyisipkan hasilnya ke `{credentials}`, `{accountEmail}`, `{accountPassword}`, dan `{supplierOrderId}`. Jika template `payment_success_dm` Anda belum menulis placeholder kredensial sama sekali, sistem tetap akan melampirkan blok detail akun secara otomatis di akhir pesan DM pembeli (kecuali pesan grup `payment_success_group` yang sengaja menyembunyikan data akun demi keamanan).

---

## 5. Contoh Struktur JSON Siap Import

```json
{
  "menu": {
    "name": "Menu Utama Toko",
    "content": "Halo kak! Selamat datang di *{storeName}*.\n\nSilakan pilih layanan melalui tombol di bawah ini:",
    "footer": "{webLink} · Layanan Otomatis 24 Jam",
    "buttons": [
      { "type": "reply", "name": "📋 Daftar Produk", "action": "list" },
      { "type": "reply", "name": "📞 Hubungi Admin", "action": "admin" },
      { "type": "url", "name": "🌐 Website Resmi", "url": "{webLink}" }
    ]
  },

  "invoice": {
    "name": "Invoice QRIS Lengkap",
    "content": "*INVOICE PEMBAYARAN QRIS*\nOrder ID: `{orderId}`\nProduk: *{produkName} ({varian})*\nHarga Normal: Rp {price}\nDiskon ({promoCode}): -Rp {discount}\nTotal Bayar: *Rp {total}*",
    "footer": "{storeName} · Verifikasi Otomatis",
    "buttons": [
      { "role": "pay", "name": "💳 Bayar QRIS Sekarang" },
      { "role": "admin", "name": "💬 Bantuan Admin" }
    ]
  },

  "kick_success": {
    "name": "Kick Anggota Berhasil",
    "content": "@{targetNumber} berhasil dikeluarkan dari grup *{groupName}* oleh @{pelakuNumber}.",
    "footer": "{storeName} · Moderasi Grup"
  }
}
```
