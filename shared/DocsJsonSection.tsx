import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Lock,
  Search,
} from 'lucide-react';
import {
  CATEGORY_REFERENCE_ROWS,
  CategoryGroupFilter,
  JSON_EXAMPLE_SNIPPETS,
  JsonExampleId,
  PLACEHOLDER_GLOSSARY_GROUPS,
} from './docsData';

interface DocsJsonSectionProps {
  isAdminVariant: boolean;
  copiedKey: string | null;
  onCopy: (id: string, text: string, notice: string) => void;
  onDownloadSampleJson: () => void;
}

export const DocsJsonSection: React.FC<DocsJsonSectionProps> = ({
  isAdminVariant,
  copiedKey,
  onCopy,
  onDownloadSampleJson,
}) => {
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryGroup, setCategoryGroup] = useState<CategoryGroupFilter>('all');
  const [glossaryGroupId, setGlossaryGroupId] = useState<string>('store');
  const [jsonExampleTab, setJsonExampleTab] = useState<JsonExampleId>('minimal');

  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    return CATEGORY_REFERENCE_ROWS.filter((row) => {
      if (categoryGroup !== 'all' && row.group !== categoryGroup) return false;
      if (!q) return true;
      return (
        row.category.toLowerCase().includes(q) ||
        row.label.toLowerCase().includes(q) ||
        row.trigger.toLowerCase().includes(q) ||
        row.mandatoryRoles.some((r) => r.toLowerCase().includes(q)) ||
        row.placeholders.some((p) => p.toLowerCase().includes(q))
      );
    });
  }, [categoryGroup, categorySearch]);

  const activeGlossaryGroup = useMemo(
    () => PLACEHOLDER_GLOSSARY_GROUPS.find((g) => g.id === glossaryGroupId) || PLACEHOLDER_GLOSSARY_GROUPS[0],
    [glossaryGroupId],
  );

  return (
    <div className="space-y-6">
      {/* 01. Cara Kerja di Dashboard Tenant vs Master Admin */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              01. Cara Pakai Template Pesan &amp; Aturan Import JSON
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-3xl">
              Sistem menyediakan <strong>28 kategori respon bot</strong> yang terbagi menjadi 9 sub-tab di menu <strong>Respon Bot</strong>.{' '}
              {isAdminVariant
                ? 'Master Admin dapat mengelola sekaligus mengimpor paket template massal melalui file JSON ringkas.'
                : 'Tenant cukup memilih paket dari tombol Pilih Template atau mengedit isi pesan secara visual tanpa perlu menulis JSON.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onDownloadSampleJson}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#0084D1]" />
            <span>Unduh Contoh 28 Kategori (.json)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-slate-100 text-xs">
          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900">Untuk Tenant (Dashboard Toko)</h3>
            <p className="text-slate-600 leading-relaxed">
              Buka menu <strong>Respon Bot</strong>, pilih sub-tab yang diinginkan (<em>Menu</em>, <em>List</em>, <em>Carousel</em>, <em>Invoice</em>, <em>Confirmation</em>, <em>Transaksi</em>, <em>Notifikasi</em>, <em>Kontak</em>, atau <em>Grup</em>), lalu klik <strong>Pilih Template</strong> atau edit langsung dengan chip variabel 1-klik.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900">Import Mode Append (Tambahkan Baru)</h3>
            <p className="text-slate-600 leading-relaxed">
              Menambahkan template baru dari file JSON tanpa menghapus template lama di Master Admin. Jika isi (kategori, nama, konten, footer, dan tombol) identik, sistem melewatinya otomatis agar tidak duplikat.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900">Import Mode Replace (Timpa Kategori)</h3>
            <p className="text-slate-600 leading-relaxed">
              Menghapus template lama hanya pada kategori yang tercantum di file JSON lalu menggantinya dengan versi baru. Kategori lain yang tidak ditulis di JSON tetap utuh dan aman.
            </p>
          </div>
        </div>
      </section>

      {/* 02. Kamus Placeholder & Panduan Formatting WhatsApp */}
      <section
        id="json-placeholder"
        className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 scroll-mt-20"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              02. Format Teks WhatsApp, Mention, &amp; Kamus Placeholder Dinamis
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Variabel dalam kurung kurawal seperti <code className="font-mono text-slate-800">{'{storeName}'}</code> otomatis diganti data asli saat bot mengirim pesan. Tidak sensitif huruf besar/kecil.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Kelompok Placeholder"
            className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0"
          >
            {PLACEHOLDER_GLOSSARY_GROUPS.map((grp) => (
              <button
                key={grp.id}
                type="button"
                role="tab"
                aria-selected={glossaryGroupId === grp.id}
                onClick={() => setGlossaryGroupId(grp.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  glossaryGroupId === grp.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {grp.title}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900">Gaya Teks Native WhatsApp</h3>
            <p className="text-slate-600 leading-relaxed">
              Gunakan <code className="font-mono">*tebal*</code>, <code className="font-mono">_miring_</code>, <code className="font-mono">~coret~</code>, <code className="font-mono">`kode`</code>, dan <code className="font-mono">\n</code> di JSON untuk baris baru.
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900">Membuat @Mention Asli di Grup</h3>
            <p className="text-slate-600 leading-relaxed">
              Tulis <code className="font-mono">@{'{customerNumber}'}</code>, <code className="font-mono">@{'{pelakuNumber}'}</code>, atau <code className="font-mono">@{'{targetNumber}'}</code>. Bot otomatis menyertakan tag JID agar pengguna mendapat notifikasi mention.
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900">Anti-Dobel Awalan Rp</h3>
            <p className="text-slate-600 leading-relaxed">
              Placeholder harga (<code className="font-mono">{'{price}'}</code>, <code className="font-mono">{'{total}'}</code>, <code className="font-mono">{'{finalPrice}'}</code>, <code className="font-mono">{'{discount}'}</code>) berformat angka ribuan. Tulis <code className="font-mono">Rp {'{price}'}</code> dengan aman tanpa takut menjadi ganda.
            </p>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-900">{activeGlossaryGroup.title}</span>
            <span className="text-slate-500">{activeGlossaryGroup.description}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-4 whitespace-nowrap">Placeholder Utama</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Alias yang Didukung</th>
                  <th className="py-2.5 px-4">Keterangan</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Contoh Output</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {activeGlossaryGroup.items.map((item) => (
                  <tr key={item.token} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-[#0084D1] whitespace-nowrap">{item.token}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">{item.aliases}</td>
                    <td className="py-2.5 px-4 text-slate-600">{item.meaning}</td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-800 whitespace-nowrap">{item.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 03. Struktur Root JSON & Properti Template */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            03. Struktur Root JSON &amp; Properti Objek Template
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            File JSON mendukung format ringkas terbaru maupun format lama (<code className="font-mono text-slate-800">footer_text</code>, <code className="font-mono text-slate-800">is_active</code>, <code className="font-mono text-slate-800">quick_reply</code>, <code className="font-mono text-slate-800">output</code>). Anda tidak perlu menulis <code className="font-mono text-slate-800">id</code> secara manual.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-800">A. Objek Per-Kategori (Direkomendasikan)</p>
            <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto">
{`{
  "menu": { "name": "...", "content": "..." },
  "kick_success": { "name": "...", "content": "..." }
}`}
            </pre>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-800">B. Multi-Varian Dalam 1 Kategori</p>
            <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto">
{`{
  "menu": [
    { "name": "Menu 1", "content": "..." },
    { "name": "Menu 2", "content": "..." }
  ]
}`}
            </pre>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-800">C. Array Datar dengan Field category</p>
            <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto">
{`[
  { "category": "menu", "name": "...", "content": "..." },
  { "category": "open_success", "name": "...", "content": "..." }
]`}
            </pre>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h3 className="text-xs font-bold text-slate-900">Spesifikasi Properti Objek Template</h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4 whitespace-nowrap">Field</th>
                    <th className="py-3 px-4 whitespace-nowrap">Alias Lama</th>
                    <th className="py-3 px-4 whitespace-nowrap">Tipe &amp; Status</th>
                    <th className="py-3 px-4 whitespace-nowrap">Default</th>
                    <th className="py-3 px-4">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">content</td>
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">-</td>
                    <td className="py-3 px-4 whitespace-nowrap">string · <span className="font-semibold text-rose-600">Wajib</span></td>
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">-</td>
                    <td className="py-3 px-4">Isi utama pesan WhatsApp. Mendukung formatting WhatsApp, baris baru (<code className="font-mono">\n</code>), dan placeholder dinamis.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">name</td>
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">-</td>
                    <td className="py-3 px-4 whitespace-nowrap">string · Opsional</td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">Paket &lt;category&gt;</td>
                    <td className="py-3 px-4">Judul paket template yang tampil di katalog Master Admin maupun jendela Pilih Template Tenant.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">footer</td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">footer_text</td>
                    <td className="py-3 px-4 whitespace-nowrap">string · Opsional</td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">&quot;&quot; (kosong)</td>
                    <td className="py-3 px-4">Teks kecil di bawah badan pesan. Dapat diisi placeholder seperti <code className="font-mono">{'{storeName}'}</code>.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">buttons</td>
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">-</td>
                    <td className="py-3 px-4 whitespace-nowrap">array · Opsional</td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">Tombol bawaan</td>
                    <td className="py-3 px-4">Daftar tombol interaktif. Pada kategori bertombol wajib (<code className="font-mono">list</code>, <code className="font-mono">carousel</code>, <code className="font-mono">invoice</code>, <code className="font-mono">confirm_summary</code>), sistem menyisipkan tombol wajib default bila dikosongkan.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">active</td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">is_active</td>
                    <td className="py-3 px-4 whitespace-nowrap">boolean · Opsional</td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">true</td>
                    <td className="py-3 px-4">Atur <code className="font-mono">false</code> bila template ingin disimpan sebagai draft dan belum ditampilkan ke tenant.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 04. Spesifikasi Tombol Interaktif */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            04. Spesifikasi Tombol Interaktif (<code className="font-mono text-sm">buttons</code>)
          </h2>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Dua jenis tombol di array <code className="font-mono text-slate-800">buttons</code>: <strong>Tombol Kustom</strong> (<code className="font-mono text-slate-800">type</code>) dan <strong>Tombol Wajib Sistem</strong> (<code className="font-mono text-slate-800">role</code> untuk mengganti label nama).
          </p>
        </div>

        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-slate-900">A. 7 Jenis Tombol Kustom (<code className="font-mono">type</code>)</h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4 whitespace-nowrap">type (Singkat)</th>
                    <th className="py-3 px-4 whitespace-nowrap">Alias Lama</th>
                    <th className="py-3 px-4 whitespace-nowrap">Field Data</th>
                    <th className="py-3 px-4">Contoh JSON Singkat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">reply</td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">quick_reply</td>
                    <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">name, action / value</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-800">
                      {'{ "type": "reply", "name": "Lihat Katalog", "action": "list" }'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">url</td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">cta_url / link</td>
                    <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">name, url (atau value)</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-800">
                      {'{ "type": "url", "name": "Website", "url": "{webLink}" }'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">copy</td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">cta_copy</td>
                    <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">name, value (atau text)</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-800">
                      {'{ "type": "copy", "name": "Salin Promo", "value": "DISKON50" }'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">call</td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">cta_call / phone</td>
                    <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">name, phone</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-800">
                      {'{ "type": "call", "name": "Telepon CS", "phone": "{adminNumber}" }'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">vcard</td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">contact</td>
                    <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">name, contactName, phone</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-800">
                      {'{ "type": "vcard", "name": "Kontak Admin", "contactName": "{adminName}", "phone": "{adminNumber}" }'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">cta_reminder</td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">reminder</td>
                    <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">name, value (opsional)</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-800">
                      {'{ "type": "cta_reminder", "name": "Ingatkan Nanti", "value": "promo_reminder" }'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">cta_cancel_reminder</td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">cancel_reminder</td>
                    <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">name, value (opsional)</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-800">
                      {'{ "type": "cta_cancel_reminder", "name": "Batal Pengingat", "value": "promo_reminder" }'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-2.5">
          <h3 className="text-xs font-bold text-slate-900">
            B. Pilihan <code className="font-mono">action</code> Khusus Tombol <code className="font-mono">type: &quot;reply&quot;</code>
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-4 whitespace-nowrap">action</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">Output Otomatis</th>
                    <th className="py-2.5 px-4">Perilaku Bot Saat Tombol Ditekan Pembeli</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">list</td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">.list</td>
                    <td className="py-2.5 px-4">Memicu Command List untuk menampilkan daftar katalog produk toko.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">menu</td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">.menu</td>
                    <td className="py-2.5 px-4">Memicu Command Menu untuk menampilkan pesan menu utama.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">owner</td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">contact_owner</td>
                    <td className="py-2.5 px-4">Mengirimkan kartu vCard kontak Owner toko.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">admin</td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">contact_admin</td>
                    <td className="py-2.5 px-4">Mengirimkan kartu vCard kontak Customer Service / Admin.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">unknown / kosong</td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">value / slug name</td>
                    <td className="py-2.5 px-4">Mengirim teks balasan cepat tanpa memicu respon lanjutan dari bot.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <h3 className="text-xs font-bold text-slate-900">
              C. 6 Tombol Wajib Sistem (<code className="font-mono">role</code>)
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Pada kategori alur checkout (<code className="font-mono text-slate-800">list</code>, <code className="font-mono text-slate-800">carousel</code>, <code className="font-mono text-slate-800">invoice</code>, <code className="font-mono text-slate-800">confirm_summary</code>), tombol wajib ini dikunci agar alur QRIS selalu valid. Bila menginginkan label default, tidak perlu ditulis di JSON (otomatis disisipkan). Untuk mengganti teks labelnya saja, cukup tulis <code className="font-mono text-slate-800">{'{ "role": "...", "name": "Nama Baru" }'}</code>.
          </p>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-4 whitespace-nowrap">role</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">Alias Lama</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">Kategori</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">Label Default</th>
                    <th className="py-2.5 px-4">Fungsi Terkunci Sistem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">dropdown</td>
                    <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">list_dropdown</td>
                    <td className="py-2.5 px-4 font-mono text-slate-800 whitespace-nowrap">list</td>
                    <td className="py-2.5 px-4 whitespace-nowrap">📋 Pilih Produk</td>
                    <td className="py-2.5 px-4">Membuka menu dropdown daftar produk (<code className="font-mono">single_select_dropdown</code>).</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">order</td>
                    <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">carousel_order</td>
                    <td className="py-2.5 px-4 font-mono text-slate-800 whitespace-nowrap">carousel</td>
                    <td className="py-2.5 px-4 whitespace-nowrap">🛒 Order</td>
                    <td className="py-2.5 px-4">Memulai checkout varian yang dipilih (<code className="font-mono">order_var:&#123;produkName&#125;|&#123;varian&#125;</code>).</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">pay</td>
                    <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">invoice_pay_url</td>
                    <td className="py-2.5 px-4 font-mono text-slate-800 whitespace-nowrap">invoice</td>
                    <td className="py-2.5 px-4 whitespace-nowrap">💳 Bayar Sekarang</td>
                    <td className="py-2.5 px-4">Membuka halaman pembayaran QRIS dinamis (<code className="font-mono">&#123;paymentUrl&#125;</code>).</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">admin</td>
                    <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">invoice_contact_admin</td>
                    <td className="py-2.5 px-4 font-mono text-slate-800 whitespace-nowrap">invoice</td>
                    <td className="py-2.5 px-4 whitespace-nowrap">📞 Hubungi Admin</td>
                    <td className="py-2.5 px-4">Membuka chat WhatsApp admin toko jika ada kendala pembayaran (<code className="font-mono">&#123;invoiceAdminUrl&#125;</code>).</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">promo</td>
                    <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">confirm_promo</td>
                    <td className="py-2.5 px-4 font-mono text-slate-800 whitespace-nowrap">confirm_summary</td>
                    <td className="py-2.5 px-4 whitespace-nowrap">🎟️ Pakai Kode Promo</td>
                    <td className="py-2.5 px-4">Masuk ke tahap input kode voucher diskon (<code className="font-mono">checkout_promo</code>).</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">direct</td>
                    <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">confirm_direct</td>
                    <td className="py-2.5 px-4 font-mono text-slate-800 whitespace-nowrap">confirm_summary</td>
                    <td className="py-2.5 px-4 whitespace-nowrap">⚡ Lanjut Bayar (Normal)</td>
                    <td className="py-2.5 px-4">Langsung menerbitkan invoice QRIS tanpa kode promo (<code className="font-mono">checkout_direct</code>).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 05. Referensi Lengkap 28 Kategori */}
      <section
        id="json-kategori"
        className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 scroll-mt-20"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              05. Referensi 28 Kategori Template &amp; Placeholder Valid
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Menampilkan <span className="font-mono tabular-nums font-semibold text-slate-700">{filteredCategories.length}</span> dari{' '}
              <span className="font-mono tabular-nums font-semibold text-slate-700">{CATEGORY_REFERENCE_ROWS.length}</span> kategori respon bot yang didukung penuh oleh server.
            </p>
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Cari kategori atau placeholder..."
              className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#0084D1] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          {(
            [
              { id: 'all', label: 'Semua (28)' },
              { id: 'utama', label: 'Utama & Kontak (6)' },
              { id: 'checkout', label: 'Checkout & Invoice (5)' },
              { id: 'transaksi', label: 'Transaksi & Notif (8)' },
              { id: 'grup', label: 'Moderasi Grup (9)' },
            ] as { id: CategoryGroupFilter; label: string }[]
          ).map((grp) => (
            <button
              key={grp.id}
              type="button"
              onClick={() => setCategoryGroup(grp.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                categoryGroup === grp.id
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {grp.label}
            </button>
          ))}
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4 whitespace-nowrap">#</th>
                  <th className="py-3 px-4 whitespace-nowrap">Key Kategori JSON</th>
                  <th className="py-3 px-4 whitespace-nowrap">Tombol Wajib (role)</th>
                  <th className="py-3 px-4">Kapan Dipicu Bot</th>
                  <th className="py-3 px-4">Placeholder yang Didukung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Tidak ada kategori atau placeholder yang cocok dengan &quot;{categorySearch}&quot;.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((row, index) => (
                    <tr key={row.category} className="hover:bg-slate-50/70 transition-colors align-top">
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-400 whitespace-nowrap">
                        {String(index + 1).padStart(2, '0')}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <code className="font-mono font-bold text-[#0084D1]">{row.category}</code>
                        <div className="text-[11px] text-slate-500 mt-0.5">{row.label}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-800 whitespace-nowrap">
                        {row.mandatoryRoles.length > 0 ? row.mandatoryRoles.join(', ') : '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs leading-relaxed">
                        {row.trigger}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-800 leading-relaxed">
                        {row.placeholders.join(' · ')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 06. Contoh File JSON Siap Pakai */}
      <section
        id="json-contoh"
        className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 scroll-mt-20"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              06. Contoh File JSON Siap Pakai
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {JSON_EXAMPLE_SNIPPETS[jsonExampleTab].subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
            {(
              [
                { id: 'minimal', label: '1. Format Ringkas' },
                { id: 'full_buttons', label: '2. Tombol & Role' },
                { id: 'multi_array', label: '3. Multi-Varian' },
                { id: 'group_moderation', label: '4. Moderasi Grup' },
              ] as { id: JsonExampleId; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setJsonExampleTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  jsonExampleTab === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-slate-900 text-slate-100 overflow-hidden border border-slate-800">
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-950/60 border-b border-slate-800">
            <span className="text-xs font-mono text-slate-300 truncate">
              {JSON_EXAMPLE_SNIPPETS[jsonExampleTab].title}
            </span>
            <button
              type="button"
              onClick={() =>
                onCopy(
                  `json-${jsonExampleTab}`,
                  JSON_EXAMPLE_SNIPPETS[jsonExampleTab].code,
                  'Contoh JSON template berhasil disalin.',
                )
              }
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors whitespace-nowrap"
            >
              {copiedKey === `json-${jsonExampleTab}` ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedKey === `json-${jsonExampleTab}` ? 'Tersalin' : 'Salin JSON'}</span>
            </button>
          </div>
          <pre className="p-4 font-mono text-xs leading-relaxed overflow-x-auto">
            {JSON_EXAMPLE_SNIPPETS[jsonExampleTab].code}
          </pre>
        </div>
      </section>
    </div>
  );
};
