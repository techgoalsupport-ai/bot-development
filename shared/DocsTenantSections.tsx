import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Terminal,
  Users,
  Wallet,
  MessageSquareCode,
  Send,
} from 'lucide-react';
import type { DocsSectionTab } from './docsData';

interface TenantGuideProps {
  onNavigateTab: (tab: DocsSectionTab) => void;
}

export const TenantDashboardGuideSection: React.FC<TenantGuideProps> = ({ onNavigateTab }) => {
  return (
    <div className="space-y-6">
      {/* 01. Ringkasan Persiapan Awal (Quick Start) */}
      <section
        id="guide-quickstart"
        className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 scroll-mt-20"
      >
        <div>
          <h2 className="text-base font-bold text-slate-900">
            01. Langkah Persiapan Awal (Dari Login Pertama Hingga Bot Aktif)
          </h2>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-3xl">
            Ikuti 5 langkah berurutan di bawah ini agar toko Anda siap menerima pesanan otomatis 24 jam via WhatsApp dan QRIS.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="space-y-1.5">
            <span className="font-mono tabular-nums font-bold text-[#0084D1]">Langkah 01</span>
            <h3 className="font-bold text-slate-900">Lengkapi Profil Toko</h3>
            <p className="text-slate-600 leading-relaxed">
              Buka menu <strong>Pengaturan Toko</strong>. Wajib isi Nama Toko, Nama Owner, dan WhatsApp Owner (awal <code className="font-mono">628...</code>). Tambahkan juga Admin CS &amp; Link Website.
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="font-mono tabular-nums font-bold text-[#0084D1]">Langkah 02</span>
            <h3 className="font-bold text-slate-900">Tautkan Nomor Bot</h3>
            <p className="text-slate-600 leading-relaxed">
              Masuk ke <strong>Koneksi &amp; Layanan</strong>. Masukkan nomor WhatsApp khusus bot, minta kode pairing 8 digit, lalu tautkan di aplikasi WhatsApp HP Anda.
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="font-mono tabular-nums font-bold text-[#0084D1]">Langkah 03</span>
            <h3 className="font-bold text-slate-900">Isi Kunci API Layanan</h3>
            <p className="text-slate-600 leading-relaxed">
              Di menu yang sama, tempel <strong>Xaviera API Key</strong> (katalog &amp; stok) dan <strong>LunasQRIS API &amp; Secret Key</strong> (pembayaran QRIS otomatis). Opsional: aktifkan Telegram Bot.
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="font-mono tabular-nums font-bold text-[#0084D1]">Langkah 04</span>
            <h3 className="font-bold text-slate-900">Atur Whitelist Grup</h3>
            <p className="text-slate-600 leading-relaxed">
              Buka <strong>Management group</strong>, klik Muat Ulang, lalu aktifkan toggle grup target. Nyalakan mode <strong>Grup Only</strong> agar bot aman dari spam chat pribadi.
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="font-mono tabular-nums font-bold text-[#0084D1]">Langkah 05</span>
            <h3 className="font-bold text-slate-900">Atur Profit &amp; Respon</h3>
            <p className="text-slate-600 leading-relaxed">
              Tetapkan margin untung di <strong>Aplikasi Premium</strong> dan pilih gaya pesan di <strong>Respon Bot</strong>. Bot langsung siap melayani command <code className="font-mono">.menu</code> &amp; <code className="font-mono">.list</code>.
            </p>
          </div>
        </div>
      </section>

      {/* 02. Panduan Lengkap Tiap Menu Sidebar Dashboard */}
      <section
        id="guide-menus"
        className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-6 scroll-mt-20"
      >
        <div>
          <h2 className="text-base font-bold text-slate-900">
            02. Penjelasan Lengkap Setiap Menu Dashboard Tenant
          </h2>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-3xl">
            Setiap menu di bilah sisi kiri memiliki fungsi spesifik. Pelajari fungsi serta pengaturan penting di tiap halaman agar tidak ada fitur yang terlewat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 text-xs">
          {/* Menu 1 */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">A. Pengaturan Toko</h3>
            <p className="text-slate-600 leading-relaxed">
              Pusat identitas toko sekaligus pemantauan masa aktif sewa bot Anda.
            </p>
            <ul className="space-y-1.5 text-slate-600 list-disc pl-4 leading-relaxed">
              <li>
                <strong>Data Wajib Toko:</strong> Nama Toko, Nama Owner, dan Nomor WhatsApp Owner wajib valid. Nomor Owner dipakai untuk fitur <code className="font-mono">.owner</code>, pengingat masa sewa otomatis, serta sistem <strong>AntiKudeta</strong> jika ada yang mencoba mengeluarkan Owner di grup.
              </li>
              <li>
                <strong>Kontak Tambahan &amp; Tautan:</strong> Nomor Admin CS (<code className="font-mono">adminNumber</code>), Link Website (<code className="font-mono">webLink</code>), Link Saluran WA (<code className="font-mono">waLink</code>), dan Username Bot Telegram (<code className="font-mono">telegramBot</code>) otomatis menggantikan placeholder pada pesan bot.
              </li>
              <li>
                <strong>Masa Sewa &amp; Redeem Token:</strong> Menampilkan hitung mundur masa aktif hingga jam kedaluwarsa WIB. Untuk memperpanjang sewa, masukkan kode voucher (misal format <code className="font-mono">XXXX-XXXX-XXXX-XXXX</code>) pada kolom Redeem Token tanpa memutus koneksi WhatsApp.
              </li>
            </ul>
          </div>

          {/* Menu 2 */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">B. Koneksi &amp; Layanan</h3>
            <p className="text-slate-600 leading-relaxed">
              Menggabungkan kontrol koneksi WhatsApp Bot, integrasi Xaviera API, LunasQRIS, dan notifikasi Telegram.
            </p>
            <ul className="space-y-1.5 text-slate-600 list-disc pl-4 leading-relaxed">
              <li>
                <strong>Pairing Code WhatsApp:</strong> Gunakan nomor khusus bot (hindari nomor utama pribadi). Anda bisa mengisi <em>Custom Pairing Code</em> 8 karakter huruf/angka atau membiarkannya kosong agar dibuat otomatis.
              </li>
              <li>
                <strong>Kontrol Sesi &amp; Live Terminal:</strong> Tombol <em>Reconnect</em> menyambung ulang tanpa pairing ulang, <em>Stop</em> menjeda bot sementara, dan <em>Reset Sesi</em> menghapus data login WA lama bila ingin berganti nomor. Pantau aktivitas pesan masuk secara langsung melalui Live Terminal.
              </li>
              <li>
                <strong>Xaviera API &amp; LunasQRIS:</strong> Simpan API Key Xaviera untuk mengambil daftar produk dan memproses order stok, serta API Key + Secret Key LunasQRIS agar QRIS dinamis otomatis terbentuk dan terverifikasi lunas.
              </li>
              <li>
                <strong>Notifikasi Telegram Bot:</strong> Sambungkan Bot Token dan Chat ID untuk menerima laporan penjualan lunas dan kendala secara real-time di Telegram.
              </li>
            </ul>
          </div>

          {/* Menu 3 */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">C. Management group</h3>
            <p className="text-slate-600 leading-relaxed">
              Mengontrol grup mana saja yang diizinkan menjalankan bot serta keamanan chat pribadi.
            </p>
            <ul className="space-y-1.5 text-slate-600 list-disc pl-4 leading-relaxed">
              <li>
                <strong>Whitelist Grup:</strong> Secara bawaan, bot <strong>tidak merespon</strong> grup mana pun sebelum diaktifkan di halaman ini. Setelah memasukkan nomor bot ke grup, klik <em>Muat Ulang</em> lalu aktifkan sakelar grup tersebut.
              </li>
              <li>
                <strong>Mode Grup Only (Direkomendasikan ON):</strong> Saat aktif, bot hanya merespon perintah katalog di grup whitelist dan mengabaikan chat DM asing sehingga risiko spam/blokir WA jauh lebih rendah. Khusus kelanjutan checkout tombol <strong>Order</strong> dari grup tetap dikirim rapi ke DM pembeli.
              </li>
            </ul>
          </div>

          {/* Menu 4 */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">D. Aplikasi Premium, SMM, &amp; TopUp</h3>
            <p className="text-slate-600 leading-relaxed">
              Mengatur katalog jualan, perhitungan profit, serta promo voucher diskon pelanggan.
            </p>
            <ul className="space-y-1.5 text-slate-600 list-disc pl-4 leading-relaxed">
              <li>
                <strong>Margin Keuntungan Umum:</strong> Pilih penambahan untung berbasis nominal tetap (<code className="font-mono">Rp</code>) atau persentase (<code className="font-mono">%</code>) dari harga modal.
              </li>
              <li>
                <strong>Harga Custom per-Varian:</strong> Anda dapat memberi margin khusus pada varian tertentu saja agar produk unggulan lebih kompetitif tanpa mengubah aturan margin global.
              </li>
              <li>
                <strong>Kupon Promo:</strong> Buat kode voucher (contoh: <code className="font-mono">HEMAT10</code>), atur nilai diskon, batas kuota, target varian, dan tanggal kedaluwarsa. Sistem otomatis menjaga batas diskon agar margin tidak merugi.
              </li>
            </ul>
          </div>

          {/* Menu 5 */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">E. Respon Bot (28 Kategori Pesan)</h3>
            <p className="text-slate-600 leading-relaxed">
              Kustomisasi penuh teks, gambar header, footer, dan tombol interaktif pada seluruh 9 sub-tab respon bot.
            </p>
            <ul className="space-y-1.5 text-slate-600 list-disc pl-4 leading-relaxed">
              <li>
                <strong>9 Sub-Tab Lengkap:</strong> Meliputi <em>Menu</em>, <em>List</em>, <em>Carousel</em>, <em>Invoice</em>, <em>Confirmation</em>, <em>Transaksi</em>, <em>Notifikasi</em>, <em>Kontak</em>, dan <em>Grup</em> (total 28 kondisi pesan).
              </li>
              <li>
                <strong>Pilih Template Siap Pakai:</strong> Di setiap sub-tab tersedia tombol <strong>Pilih Template</strong> untuk langsung menerapkan paket kalimat &amp; tombol buatan Master Admin dalam 1 klik.
              </li>
              <li>
                <strong>Tombol Wajib Checkout:</strong> Pada List, Carousel, Invoice, dan Confirmation terdapat tombol wajib sistem (seperti <em>Pilih Produk</em>, <em>Order</em>, <em>Bayar Sekarang</em>) yang fungsinya dikunci agar alur pembayaran tidak rusak, namun label namanya bebas diubah.
              </li>
            </ul>
          </div>

          {/* Menu 6 */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">F. Saldo &amp; Transaksi, Keamanan Akun, &amp; Laporan</h3>
            <p className="text-slate-600 leading-relaxed">
              Pantau arus kas penjualan, amankan akun dashboard, dan hubungi pengelola platform jika ada kendala.
            </p>
            <ul className="space-y-1.5 text-slate-600 list-disc pl-4 leading-relaxed">
              <li>
                <strong>Saldo &amp; Transaksi:</strong> Cek saldo Xaviera dan LunasQRIS secara langsung (tersedia tombol sembunyikan saldo), grafik omzet serta profit bersih harian/bulanan, filter status transaksi, dan tombol <strong>Download CSV</strong> untuk rekap pembukuan.
              </li>
              <li>
                <strong>Keamanan Akun:</strong> Ubah username atau kata sandi login dashboard Anda secara berkala.
              </li>
              <li>
                <strong>Laporan Masalah:</strong> Kirim tiket keluhan atau permintaan bantuan beserta screenshot lampiran langsung ke Master Admin dan pantau balasannya secara real-time.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 03. Alur Transaksi Pelanggan End-to-End */}
      <section
        id="guide-checkout"
        className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 scroll-mt-20"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              03. Alur Checkout Pelanggan dari Awal Hingga Lunas
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Memahami urutan pesan yang diterima pembeli membantu Anda menata template respon dengan tepat.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('commands')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5 text-[#0084D1]" />
              <span>Lihat Daftar Command</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('json')}
              className="px-3.5 py-2 rounded-xl bg-[#0084D1] hover:bg-[#0073B7] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Lihat 28 Kategori Template</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4 whitespace-nowrap">Tahap</th>
                  <th className="py-3 px-4 whitespace-nowrap">Aksi Pembeli</th>
                  <th className="py-3 px-4 whitespace-nowrap">Kategori Pesan Dipakai</th>
                  <th className="py-3 px-4">Respon &amp; Perilaku Otomatis Bot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3 px-4 font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">01</td>
                  <td className="py-3 px-4">Ketik <code className="font-mono font-semibold">.menu</code> atau <code className="font-mono font-semibold">.list</code></td>
                  <td className="py-3 px-4 font-mono text-[#0084D1] whitespace-nowrap">menu / list</td>
                  <td className="py-3 px-4">Bot mengirim sambutan atau daftar katalog beserta tombol dropdown <strong>Pilih Produk</strong>.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">02</td>
                  <td className="py-3 px-4">Pilih produk dari dropdown</td>
                  <td className="py-3 px-4 font-mono text-[#0084D1] whitespace-nowrap">carousel</td>
                  <td className="py-3 px-4">Bot menampilkan kartu geser tiap varian produk lengkap dengan harga jual, stok, dan tombol <strong>Order</strong>.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">03</td>
                  <td className="py-3 px-4">Tekan tombol Order</td>
                  <td className="py-3 px-4 font-mono text-[#0084D1] whitespace-nowrap">order_group_notif · confirm_summary</td>
                  <td className="py-3 px-4">Bila di grup, bot memberi info cek DM lalu mengirim ringkasan order ke DM pembeli (pilihan <strong>Pakai Kode Promo</strong> atau <strong>Lanjut Bayar</strong>). Bila stok 0, bot membalas <code className="font-mono">stock_empty</code>.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">04</td>
                  <td className="py-3 px-4">Input kupon / pilih Lanjut Bayar</td>
                  <td className="py-3 px-4 font-mono text-[#0084D1] whitespace-nowrap">confirm_promo_* · promo_cancelled</td>
                  <td className="py-3 px-4">Bot memvalidasi kupon promo (batas tunggu 3 menit). Pembeli juga dapat mengetik <code className="font-mono">BATAL</code> atau <code className="font-mono">BAYAR</code> untuk langsung ke harga normal.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">05</td>
                  <td className="py-3 px-4">Scan &amp; bayar QRIS</td>
                  <td className="py-3 px-4 font-mono text-[#0084D1] whitespace-nowrap">invoice</td>
                  <td className="py-3 px-4">Bot mengirim tagihan QRIS beserta link pembayaran. Jika gagal terbit, mengirim <code className="font-mono">payment_error</code>.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">06</td>
                  <td className="py-3 px-4">Pembayaran terkonfirmasi lunas</td>
                  <td className="py-3 px-4 font-mono text-[#0084D1] whitespace-nowrap">payment_success_dm · payment_success_group</td>
                  <td className="py-3 px-4">Bot mengirim bukti lunas &amp; detail pesanan ke DM pembeli, mengumumkan di grup asal, dan mengirim notifikasi ke Telegram pemilik toko. Jika melewati batas waktu, mengirim <code className="font-mono">payment_expired</code>.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 04. FAQ & Kendala Umum */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            04. Pertanyaan Umum &amp; Solusi Cepat (Troubleshooting)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Panduan singkat mengatasi kendala operasional sehari-hari.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100 text-xs">
          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0084D1] shrink-0" />
              <span>Mengapa bot diam saat dipanggil di grup?</span>
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Periksa 3 hal: (1) Status WhatsApp Bot harus <strong>Online</strong> di Koneksi &amp; Layanan, (2) Grup tersebut harus sudah diaktifkan pada menu <strong>Management group</strong>, dan (3) Pastikan menggunakan prefix resmi seperti <code className="font-mono">.menu</code> / <code className="font-mono">.list</code> (kecuali command <code className="font-mono">kick</code>/<code className="font-mono">open</code>/<code className="font-mono">close</code> yang boleh tanpa prefix).
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#0084D1] shrink-0" />
              <span>Mengapa bot diam saat dipanggil di Chat Pribadi (DM)?</span>
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Cek apakah sakelar <strong>Grup Only</strong> sedang dalam posisi <strong>ON</strong> di menu Management group. Jika ON, bot memang sengaja mengabaikan pesan katalog di DM untuk menjaga keamanan nomor dari laporan spam.
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-[#0084D1] shrink-0" />
              <span>Apakah bot langsung memproses stok jika pembeli bayar?</span>
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Ya. Pastikan saldo akun Xaviera Anda mencukupi sebelum pembeli melakukan checkout, dan pastikan API Key Xaviera maupun LunasQRIS sudah tersimpan valid pada menu Koneksi &amp; Layanan.
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#0084D1] shrink-0" />
              <span>Bagaimana cara ganti nomor WhatsApp bot ke nomor baru?</span>
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Masuk ke menu <strong>Koneksi &amp; Layanan</strong>, klik <strong>Stop</strong> lalu <strong>Reset Sesi</strong> agar sesi perangkat tertaut sebelumnya dibersihkan, kemudian masukkan nomor WhatsApp bot baru dan lakukan Pairing Code ulang.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export const TenantCommandsGuideSection: React.FC<TenantGuideProps> = ({ onNavigateTab }) => {
  return (
    <div className="space-y-6">
      {/* 01. Aturan Prefix & Cakupan Respon */}
      <section
        id="cmd-prefix"
        className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 scroll-mt-20"
      >
        <div>
          <h2 className="text-base font-bold text-slate-900">
            01. Daftar Prefix Resmi &amp; Aturan Pemicu Command
          </h2>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-3xl">
            Untuk mencegah bot menyela obrolan santai di grup, seluruh command utama pelanggan dan hidetag wajib diawali salah satu dari 8 karakter prefix resmi berikut.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-slate-100 text-xs">
          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900">8 Prefix yang Didukung</h3>
            <p className="font-mono text-sm font-bold text-[#0084D1] tracking-widest">
              / &nbsp; . &nbsp; ! &nbsp; ? &nbsp; # &nbsp; $ &nbsp; % &nbsp; &amp;
            </p>
            <p className="text-slate-600 leading-relaxed">
              Semua prefix berfungsi sama, misalnya <code className="font-mono">.menu</code>, <code className="font-mono">/menu</code>, <code className="font-mono">!list</code>, maupun <code className="font-mono">#h</code>. Tidak sensitif huruf besar/kecil.
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900">Pengecualian Command Grup</h3>
            <p className="text-slate-600 leading-relaxed">
              Khusus command moderasi admin grup (<code className="font-mono">Kick</code>, <code className="font-mono">Open</code>, dan <code className="font-mono">Close</code>) dapat dipicu <strong>tanpa prefix</strong> (contoh: <code className="font-mono">open</code>) maupun <strong>dengan prefix</strong> (contoh: <code className="font-mono">.open</code>).
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900">Syarat Keamanan Grup</h3>
            <p className="text-slate-600 leading-relaxed">
              Command admin grup hanya berjalan di <strong>grup yang di-whitelist</strong> dan harus dikirim oleh <strong>Admin / Pembuat Grup</strong>. Jika anggota biasa mengirimnya, bot diam total.
            </p>
          </div>
        </div>
      </section>

      {/* 02. Command Pelanggan & Checkout */}
      <section
        id="cmd-customer"
        className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 scroll-mt-20"
      >
        <div>
          <h2 className="text-base font-bold text-slate-900">
            02. Command Pelanggan (Katalog, Kontak, &amp; Checkout DM)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Perintah yang bisa digunakan oleh seluruh pembeli di grup whitelist maupun di DM (jika mode Grup Only OFF).
          </p>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4 whitespace-nowrap">Perintah / Kata Kunci</th>
                  <th className="py-3 px-4 whitespace-nowrap">Lokasi Chat</th>
                  <th className="py-3 px-4 whitespace-nowrap">Template Terkait</th>
                  <th className="py-3 px-4">Fungsi &amp; Respon Bot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">.menu / /menu</td>
                  <td className="py-3 px-4 whitespace-nowrap">Grup Whitelist &amp; DM*</td>
                  <td className="py-3 px-4 font-mono text-[#0084D1] whitespace-nowrap">menu</td>
                  <td className="py-3 px-4">Menampilkan sambutan utama toko lengkap dengan gambar (opsional) dan tombol interaktif.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">.list / /list</td>
                  <td className="py-3 px-4 whitespace-nowrap">Grup Whitelist &amp; DM*</td>
                  <td className="py-3 px-4 font-mono text-[#0084D1] whitespace-nowrap">list · carousel</td>
                  <td className="py-3 px-4">Menampilkan daftar produk dan tombol dropdown <strong>Pilih Produk</strong> untuk melihat varian Carousel.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">.owner</td>
                  <td className="py-3 px-4 whitespace-nowrap">Grup Whitelist &amp; DM*</td>
                  <td className="py-3 px-4 font-mono text-[#0084D1] whitespace-nowrap">contact_owner_empty</td>
                  <td className="py-3 px-4">Mengirimkan kartu kontak (vCard) WhatsApp Owner. Jika belum diatur, mengirim pesan fallback.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">.admin / .contact / .kontak</td>
                  <td className="py-3 px-4 whitespace-nowrap">Grup Whitelist &amp; DM*</td>
                  <td className="py-3 px-4 font-mono text-[#0084D1] whitespace-nowrap">contact_admin_empty</td>
                  <td className="py-3 px-4">Mengirimkan kartu kontak (vCard) Customer Service / Admin toko.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">promo / bayar / lanjut bayar / normal</td>
                  <td className="py-3 px-4 whitespace-nowrap">DM (Saat Sesi Checkout)</td>
                  <td className="py-3 px-4 font-mono text-[#0084D1] whitespace-nowrap">confirm_promo_input · invoice</td>
                  <td className="py-3 px-4">Alternatif teks manual jika pembeli mengetik alih-alih menekan tombol pada pesan ringkasan order.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">&lt;KODE_PROMO&gt; / BATAL</td>
                  <td className="py-3 px-4 whitespace-nowrap">DM (Saat Menunggu Promo)</td>
                  <td className="py-3 px-4 font-mono text-[#0084D1] whitespace-nowrap">confirm_promo_valid / invalid · promo_cancelled</td>
                  <td className="py-3 px-4">Menerapkan kode promo ke invoice atau mengetik <code className="font-mono">BATAL</code> untuk melanjutkan pembayaran dengan harga normal.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-[11px] text-slate-500">
          *Chat Pribadi (DM) untuk command <code className="font-mono">.menu</code>, <code className="font-mono">.list</code>, <code className="font-mono">.owner</code>, dan <code className="font-mono">.admin</code> hanya merespon apabila mode <strong>Grup Only = OFF</strong> di menu Management group.
        </p>
      </section>

      {/* 03. Command Khusus Admin Grup */}
      <section
        id="cmd-group-admin"
        className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 scroll-mt-20"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              03. Command Moderasi &amp; Pengumuman Khusus Admin Grup
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hanya aktif di grup whitelist dan hanya dieksekusi bila pengirim adalah Admin atau Pembuat Grup.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('json')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <MessageSquareCode className="w-3.5 h-3.5 text-[#0084D1]" />
            <span>Kustomisasi Pesan di Respon Bot (Grup)</span>
          </button>
        </div>

        <div className="space-y-5 pt-3 border-t border-slate-100 text-xs">
          {/* A. Hide Tag */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">
              A. Hide Tag (<code className="font-mono text-[#0084D1]">.hidetag</code>, <code className="font-mono text-[#0084D1]">.ht</code>, <code className="font-mono text-[#0084D1]">.h</code>)
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Mengirim pengumuman ke seluruh anggota grup dengan notifikasi mention tersembunyi tanpa memenuhi layar dengan daftar panjang <code className="font-mono">@nomor</code>.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div>
                <p className="font-bold text-slate-900 mb-1">Cara 1: Tulis Teks Langsung</p>
                <p className="text-slate-600">
                  Ketik <code className="font-mono text-slate-800">.h Promo Netflix hari ini diskon 20%!</code> di dalam grup. Bot meneruskan teks Anda dengan mention semua anggota.
                </p>
              </div>
              <div>
                <p className="font-bold text-slate-900 mb-1">Cara 2: Reply Pesan atau Media</p>
                <p className="text-slate-600">
                  Balas (reply) foto, video, dokumen, stiker, audio, atau teks apa pun dengan mengetik <code className="font-mono text-slate-800">.h</code> (atau <code className="font-mono text-slate-800">.h caption baru</code>). Jika dikirim tanpa teks dan tanpa reply, bot diam.
                </p>
              </div>
            </div>
          </div>

          {/* B. Kick & AntiKudeta */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">
              B. Kick Anggota (<code className="font-mono text-[#0084D1]">Kick</code>, <code className="font-mono text-[#0084D1]">kick</code>, <code className="font-mono text-[#0084D1]">.kick</code>) &amp; Proteksi AntiKudeta
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Mengeluarkan anggota dari grup melalui <strong>Reply pesan target</strong> atau <strong>@mention target</strong> (contoh: <code className="font-mono">.kick @62812xxx</code> atau balas chat target lalu ketik <code className="font-mono">kick</code>).
            </p>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-4 whitespace-nowrap">Skenario / Kondisi</th>
                      <th className="py-2.5 px-4 whitespace-nowrap">Template Respon</th>
                      <th className="py-2.5 px-4">Tindakan Otomatis Bot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">Dipicu non-admin / tanpa target / target bot sendiri</td>
                      <td className="py-2.5 px-4 font-mono text-slate-400 whitespace-nowrap">- (Diam)</td>
                      <td className="py-2.5 px-4">Bot mengabaikan sepenuhnya tanpa balasan untuk mencegah penyalahgunaan.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">Bot belum menjadi Admin Grup</td>
                      <td className="py-2.5 px-4 font-mono text-[#0084D1] whitespace-nowrap">kick_bot_not_admin</td>
                      <td className="py-2.5 px-4">Bot membalas pemberitahuan agar nomor bot dijadikan admin grup terlebih dahulu.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">Target anggota biasa / admin lain</td>
                      <td className="py-2.5 px-4 font-mono text-[#0084D1] whitespace-nowrap">kick_success</td>
                      <td className="py-2.5 px-4">Bot mengeluarkan anggota target dari grup dan mengirim konfirmasi mention pelaku &amp; target.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-rose-700">AntiKudeta: Admin biasa me-kick Owner</td>
                      <td className="py-2.5 px-4 font-mono text-[#0084D1] whitespace-nowrap">kick_anti_kudeta</td>
                      <td className="py-2.5 px-4">Bot mengirim pesan AntiKudeta (mention pelaku &amp; Owner) lalu <strong>mengeluarkan admin pelaku</strong> dari grup!</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-rose-700">AntiKudeta: Pembuat Grup me-kick Owner</td>
                      <td className="py-2.5 px-4 font-mono text-[#0084D1] whitespace-nowrap">kick_anti_kudeta</td>
                      <td className="py-2.5 px-4">Bot mengirim pesan AntiKudeta, <strong>mengeluarkan nomor Owner</strong> dari grup, lalu <strong>bot otomatis keluar dari grup tersebut</strong>.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* C. Open & Close Grup */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">
              C. Buka &amp; Tutup Chat Grup (<code className="font-mono text-[#0084D1]">Open</code> / <code className="font-mono text-[#0084D1]">Close</code> / <code className="font-mono text-[#0084D1]">.open</code> / <code className="font-mono text-[#0084D1]">.close</code>)
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Mengubah pengaturan izin kirim pesan grup antara mode terbuka (semua anggota dapat mengirim pesan) dan mode tertutup (hanya admin yang dapat mengirim pesan). Hanya cocok dengan kata persis <code className="font-mono">open</code> atau <code className="font-mono">close</code> sehingga kalimat obrolan biasa seperti <em>&quot;open order&quot;</em> tidak akan terpicu.
            </p>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-4 whitespace-nowrap">Kondisi Grup</th>
                      <th className="py-2.5 px-4 whitespace-nowrap">Template Open</th>
                      <th className="py-2.5 px-4 whitespace-nowrap">Template Close</th>
                      <th className="py-2.5 px-4">Perilaku Bot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">Bot belum Admin Grup</td>
                      <td className="py-2.5 px-4 font-mono text-[#0084D1] whitespace-nowrap">open_bot_not_admin</td>
                      <td className="py-2.5 px-4 font-mono text-[#0084D1] whitespace-nowrap">close_bot_not_admin</td>
                      <td className="py-2.5 px-4">Bot menginformasikan bahwa nomor bot perlu diangkat menjadi admin grup lebih dulu.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">Status grup sudah sama</td>
                      <td className="py-2.5 px-4 font-mono text-[#0084D1] whitespace-nowrap">open_already</td>
                      <td className="py-2.5 px-4 font-mono text-[#0084D1] whitespace-nowrap">close_already</td>
                      <td className="py-2.5 px-4">Misal admin mengetik <code className="font-mono">close</code> saat grup memang sudah ditutup: bot memberi kabar bahwa kondisi grup sudah sesuai.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">Pengaturan berhasil diubah</td>
                      <td className="py-2.5 px-4 font-mono text-[#0084D1] whitespace-nowrap">open_success</td>
                      <td className="py-2.5 px-4 font-mono text-[#0084D1] whitespace-nowrap">close_success</td>
                      <td className="py-2.5 px-4">Bot memperbarui izin kirim pesan grup di WhatsApp dan mengirim konfirmasi dengan mention admin pelaku.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 04. Panduan Bot Telegram Notifikasi */}
      <section
        id="cmd-telegram"
        className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 scroll-mt-20"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0084D1]/10 text-[#0084D1] flex items-center justify-center shrink-0">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              04. Integrasi Bot Telegram (Notifikasi Real-Time Penjualan)
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-3xl">
              Bot Telegram pada dashboard tenant berfungsi sebagai monitor transaksi real-time: setiap order QRIS yang lunas (beserta Order ID, produk, varian, total bayar, waktu lunas, dan nomor pembeli tersensor) maupun gangguan transaksi langsung dikirim ke chat Telegram atau grup tim Anda.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-slate-100 text-xs">
          <div className="space-y-1.5">
            <span className="font-mono tabular-nums font-bold text-[#0084D1]">01 · Buat Bot Token</span>
            <h3 className="font-bold text-slate-900">Via @BotFather di Telegram</h3>
            <p className="text-slate-600 leading-relaxed">
              Buka <code className="font-mono">@BotFather</code>, kirim <code className="font-mono">/newbot</code>, beri nama &amp; username berakhiran <code className="font-mono">bot</code>. Salin token HTTP API (contoh: <code className="font-mono">7123456:AAF...</code>) lalu buka chat bot Anda dan tekan tombol <strong>START</strong>.
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="font-mono tabular-nums font-bold text-[#0084D1]">02 · Ambil Chat ID</span>
            <h3 className="font-bold text-slate-900">Akun Pribadi atau Grup Tim</h3>
            <p className="text-slate-600 leading-relaxed">
              Untuk notifikasi pribadi, cek ID angka Anda melalui <code className="font-mono">@userinfobot</code> (contoh: <code className="font-mono">123456789</code>). Untuk grup Telegram, masukkan bot Anda ke grup lalu gunakan ID grup yang diawali tanda minus (contoh: <code className="font-mono">-1001987654321</code>).
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="font-mono tabular-nums font-bold text-[#0084D1]">03 · Tes &amp; Simpan</span>
            <h3 className="font-bold text-slate-900">Di Menu Koneksi &amp; Layanan</h3>
            <p className="text-slate-600 leading-relaxed">
              Tempel Bot Token &amp; Chat ID, aktifkan toggle notifikasi, lalu klik tombol <strong>Tes Koneksi</strong>. Jika muncul pesan <em>&quot;chat not found&quot;</em>, artinya Anda belum menekan <strong>START</strong> di bot tersebut atau bot belum dimasukkan ke grup target.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
