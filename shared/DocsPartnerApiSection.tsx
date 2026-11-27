import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  KeyRound,
  ShieldCheck,
  Webhook,
} from 'lucide-react';
import type { ApiEndpointId, ApiLangId } from './docsData';

interface DocsPartnerApiSectionProps {
  baseUrl: string;
  copiedKey: string | null;
  onCopy: (id: string, text: string, notice: string) => void;
}

export const DocsPartnerApiSection: React.FC<DocsPartnerApiSectionProps> = ({
  baseUrl,
  copiedKey,
  onCopy,
}) => {
  const [apiEndpoint, setApiEndpoint] = useState<ApiEndpointId>('create_tenant');
  const [apiLang, setApiLang] = useState<ApiLangId>('curl');

  const apiCodeSnippet = useMemo(() => {
    const endpointPath =
      apiEndpoint === 'create_tenant'
        ? '/api/v1/partner/tenants/create'
        : '/api/v1/partner/tokens/create';
    const fullUrl = `${baseUrl}${endpointPath}`;

    const payloadJson =
      apiEndpoint === 'create_tenant'
        ? `{
  "duration_value": 30,
  "duration_unit": "days",
  "store_name": "Toko Pembeli",
  "owner_name": "Budi",
  "owner_phone": "628123456789"
}`
        : `{
  "amount": 30,
  "unit": "days"
}`;

    if (apiLang === 'curl') {
      return `curl -X POST "${fullUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: wzp_GANTI_DENGAN_API_KEY_ANDA" \\
  -d '${payloadJson}'`;
    }

    if (apiLang === 'nodejs') {
      return `const response = await fetch("${fullUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.PARTNER_API_KEY
  },
  body: JSON.stringify(${payloadJson.replace(/\n/g, '\n  ')})
});

const result = await response.json();
if (!response.ok) {
  throw new Error(result.message || result.error);
}
console.log(result.data);`;
    }

    if (apiLang === 'php') {
      return `<?php
$ch = curl_init("${fullUrl}");
$payload = json_encode(${
        apiEndpoint === 'create_tenant'
          ? '[\n    "duration_value" => 30,\n    "duration_unit" => "days",\n    "store_name" => "Toko Pembeli",\n    "owner_name" => "Budi",\n    "owner_phone" => "628123456789"\n]'
          : '[\n    "amount" => 30,\n    "unit" => "days"\n]'
      });

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => [
        "Content-Type: application/json",
        "x-api-key: wzp_GANTI_DENGAN_API_KEY_ANDA"
    ],
]);

$result = curl_exec($ch);
curl_close($ch);
echo $result;`;
    }

    return `import os
import requests

url = "${fullUrl}"
headers = {
    "Content-Type": "application/json",
    "x-api-key": os.environ["PARTNER_API_KEY"]
}
payload = ${
      apiEndpoint === 'create_tenant'
        ? `{
    "duration_value": 30,
    "duration_unit": "days",
    "store_name": "Toko Pembeli",
    "owner_name": "Budi",
    "owner_phone": "628123456789"
}`
        : `{
    "amount": 30,
    "unit": "days"
}`
    }

response = requests.post(url, json=payload, headers=headers, timeout=15)
response.raise_for_status()
print(response.json())`;
  }, [apiEndpoint, apiLang, baseUrl]);

  const apiSuccessResponseJson =
    apiEndpoint === 'create_tenant'
      ? `{
  "success": true,
  "message": "Akun tenant bot WhatsApp berhasil dibuat otomatis.",
  "data": {
    "tenant_id": "t_tokopembeli_842",
    "username": "tenant_4910",
    "password": "pass_9281",
    "store_name": "Toko Pembeli",
    "duration_value": 30,
    "duration_unit": "days",
    "duration_label": "30 Hari",
    "days_active": 30,
    "expires_at": "2026-12-27T08:00:00.000Z",
    "guide": "Login ke dashboard menggunakan username & password di atas, lalu lengkapi profil toko dan sambungkan nomor WhatsApp bot."
  }
}`
      : `{
  "success": true,
  "message": "Token lisensi perpanjangan 30 Hari berhasil dibuat.",
  "data": {
    "token_code": "1211-XUEB-30DA-ODHR",
    "amount": 30,
    "unit": "days",
    "duration_label": "30 Hari",
    "status": "available",
    "created_at": "2026-11-27 15:00",
    "guide": "Pembeli dapat menukarkan kode token ini di menu Management Bot pada dashboard toko mereka."
  }
}`;

  const apiErrorExampleJson = `{
  "success": false,
  "error": "INVALID_DURATION",
  "message": "Durasi harus berupa angka bulat positif lebih dari 0."
}`;

  return (
    <div className="space-y-6">
      {/* 01. Otentikasi, Base URL & Pemisahan Domain */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            01. Persiapan Partner, Otentikasi API Key, &amp; Aturan Domain
          </h2>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-3xl">
            Partner REST API digunakan oleh server reseller/mitra untuk menerbitkan akun bot WhatsApp tenant baru atau mencetak kode token perpanjangan masa sewa secara otomatis setelah pembeli membayar di website mitra.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-4 border-t border-slate-100 text-xs">
          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#0084D1] shrink-0" />
              <span>Cara Mendapat API Key</span>
            </h3>
            <p className="text-slate-600 leading-relaxed">
              API Key (berawalan <code className="font-mono text-slate-800">wzp_...</code>) diterbitkan oleh Master Admin melalui tab <strong>Partner API</strong>. Kunci mentah hanya tampil 1 kali saat dibuat dan disimpan terenkripsi SHA-256 di server.
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900">Base URL &amp; Isolasi Domain</h3>
            <code className="block font-mono text-slate-800 break-all">{baseUrl}</code>
            <p className="text-slate-600 leading-relaxed">
              Endpoint <code className="font-mono">/api/v1/partner/*</code> wajib ditembak ke domain <strong>Admin Host</strong>. Request ke domain dashboard tenant publik mengembalikan HTTP <code className="font-mono">404</code>.
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900">Header Wajib Request</h3>
            <p className="text-slate-600 leading-relaxed">
              Sertakan <code className="font-mono text-slate-800">Content-Type: application/json</code> serta salah satu header otentikasi:{' '}
              <code className="font-mono text-slate-800">x-api-key: wzp_...</code> atau{' '}
              <code className="font-mono text-slate-800">Authorization: Bearer wzp_...</code>.
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900">Rate Limit &amp; Monitoring Header</h3>
            <p className="text-slate-600 leading-relaxed">
              Maksimal <span className="font-mono tabular-nums font-bold text-slate-900">60</span> request per menit (sliding window) per API Key. Sisa kuota dikirim via header{' '}
              <code className="font-mono text-slate-800">X-RateLimit-Remaining</code>, dan batas terlampaui mengembalikan header <code className="font-mono text-slate-800">Retry-After</code>.
            </p>
          </div>
        </div>
      </section>

      {/* 02. Explorer Endpoint Interaktif */}
      <section
        id="api-endpoint"
        className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-6 scroll-mt-20"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              02. Spesifikasi Lengkap Endpoint Partner API
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih endpoint untuk melihat parameter JSON, alias field yang didukung, spesifikasi data respon, serta contoh kode 4 bahasa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setApiEndpoint('create_tenant')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                apiEndpoint === 'create_tenant'
                  ? 'bg-[#0084D1] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Buat Akun Tenant
            </button>
            <button
              type="button"
              onClick={() => setApiEndpoint('create_token')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                apiEndpoint === 'create_token'
                  ? 'bg-[#0084D1] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Buat Token Perpanjangan
            </button>
          </div>
        </div>

        {/* Body Parameters */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-slate-900">
              A. Parameter Body Request (JSON)
            </h3>
            <code className="text-xs font-mono font-bold text-[#0084D1]">
              {apiEndpoint === 'create_tenant'
                ? 'POST /api/v1/partner/tenants/create'
                : 'POST /api/v1/partner/tokens/create'}
            </code>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[660px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4 whitespace-nowrap">Field</th>
                    <th className="py-3 px-4 whitespace-nowrap">Tipe &amp; Status</th>
                    <th className="py-3 px-4 whitespace-nowrap">Default</th>
                    <th className="py-3 px-4">Keterangan, Alias, &amp; Aturan Validasi</th>
                  </tr>
                </thead>
                {apiEndpoint === 'create_tenant' ? (
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">duration_value</td>
                      <td className="py-3 px-4 whitespace-nowrap">integer · Opsional</td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">30</td>
                      <td className="py-3 px-4">
                        Angka bulat positif (<span className="font-mono tabular-nums">1 - 3650</span>). Mendukung alias <code className="font-mono">amount</code> atau <code className="font-mono">duration_days</code> (jika memakai <code className="font-mono">duration_days</code>, unit otomatis diasumsikan <code className="font-mono">&quot;days&quot;</code>).
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">duration_unit</td>
                      <td className="py-3 px-4 whitespace-nowrap">string · Opsional</td>
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">&quot;days&quot;</td>
                      <td className="py-3 px-4">
                        Satuan waktu sewa: <code className="font-mono">minutes</code>, <code className="font-mono">hours</code>, <code className="font-mono">days</code>, <code className="font-mono">weeks</code>, atau <code className="font-mono">months</code>. Mendukung alias <code className="font-mono">unit</code>.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">store_name</td>
                      <td className="py-3 px-4 whitespace-nowrap">string · Opsional</td>
                      <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">&quot;&quot;</td>
                      <td className="py-3 px-4">Nama toko penyewa. Boleh dikosongkan dan nanti dilengkapi pembeli saat setup pertama di dashboard.</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">owner_name</td>
                      <td className="py-3 px-4 whitespace-nowrap">string · Opsional</td>
                      <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">&quot;&quot;</td>
                      <td className="py-3 px-4">Nama pemilik toko (juga digunakan untuk placeholder <code className="font-mono">{'{ownerName}'}</code> &amp; AntiKudeta).</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">owner_phone</td>
                      <td className="py-3 px-4 whitespace-nowrap">string · Opsional</td>
                      <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">&quot;&quot;</td>
                      <td className="py-3 px-4">Nomor WhatsApp pemilik format internasional (contoh: <code className="font-mono">628123456789</code>).</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">username</td>
                      <td className="py-3 px-4 whitespace-nowrap">string · Opsional</td>
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">auto-generate</td>
                      <td className="py-3 px-4">Username login dashboard tenant. Kosongkan agar server menghasilkan username acak unik (menghindari error <code className="font-mono">409 USERNAME_ALREADY_EXISTS</code>).</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">password</td>
                      <td className="py-3 px-4 whitespace-nowrap">string · Opsional</td>
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">auto-generate</td>
                      <td className="py-3 px-4">Password login dashboard tenant. Disarankan kosongkan agar server membuat password acak aman lalu dikembalikan di respon <code className="font-mono">201</code>.</td>
                    </tr>
                  </tbody>
                ) : (
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">amount</td>
                      <td className="py-3 px-4 whitespace-nowrap">integer · Opsional</td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">30</td>
                      <td className="py-3 px-4">
                        Jumlah durasi tambahan pada voucher sekali pakai (<span className="font-mono tabular-nums">1 - 3650</span>). Mendukung alias <code className="font-mono">duration_value</code> atau <code className="font-mono">duration_days</code>.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">unit</td>
                      <td className="py-3 px-4 whitespace-nowrap">string · Opsional</td>
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">&quot;days&quot;</td>
                      <td className="py-3 px-4">
                        Satuan waktu token: <code className="font-mono">minutes</code>, <code className="font-mono">hours</code>, <code className="font-mono">days</code>, atau <code className="font-mono">months</code>. Mendukung alias <code className="font-mono">duration_unit</code>.{' '}
                        <strong>Penting:</strong> satuan <code className="font-mono">weeks</code> tidak tersedia untuk pembuatan token dan akan memicu HTTP <code className="font-mono">400 INVALID_DURATION</code>.
                      </td>
                    </tr>
                  </tbody>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* Code Examples & Response */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
          <div className="space-y-3 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900">B. Contoh Request Multi-Bahasa</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                {(
                  [
                    { id: 'curl', label: 'cURL' },
                    { id: 'nodejs', label: 'Node.js' },
                    { id: 'php', label: 'PHP' },
                    { id: 'python', label: 'Python' },
                  ] as { id: ApiLangId; label: string }[]
                ).map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => setApiLang(lang.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      apiLang === lang.id
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-slate-900 text-slate-100 overflow-hidden border border-slate-800">
              <div className="flex items-center justify-between gap-2 px-4 py-2 bg-slate-950/60 border-b border-slate-800">
                <span className="text-[11px] font-mono text-slate-400 truncate">
                  {apiEndpoint === 'create_tenant'
                    ? 'POST /api/v1/partner/tenants/create'
                    : 'POST /api/v1/partner/tokens/create'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onCopy(
                      `api-req-${apiEndpoint}-${apiLang}`,
                      apiCodeSnippet,
                      'Contoh request API berhasil disalin.',
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-sans font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors whitespace-nowrap"
                >
                  {copiedKey === `api-req-${apiEndpoint}-${apiLang}` ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>
                    {copiedKey === `api-req-${apiEndpoint}-${apiLang}` ? 'Tersalin' : 'Salin'}
                  </span>
                </button>
              </div>
              <pre className="p-4 font-mono text-xs leading-relaxed overflow-x-auto">
                {apiCodeSnippet}
              </pre>
            </div>
          </div>

          <div className="space-y-3 min-w-0">
            <span className="block text-xs font-bold text-slate-900">
              C. Contoh Respon Sukses (HTTP 201 Created)
            </span>
            <div className="rounded-xl bg-slate-900 text-emerald-300 overflow-hidden border border-slate-800">
              <div className="flex items-center justify-between gap-2 px-4 py-2 bg-slate-950/60 border-b border-slate-800">
                <span className="text-[11px] font-mono text-slate-400">
                  application/json · HTTP 201 · X-RateLimit-Remaining
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onCopy(
                      `api-res-${apiEndpoint}`,
                      apiSuccessResponseJson,
                      'Contoh respon JSON berhasil disalin.',
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-sans font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors whitespace-nowrap"
                >
                  {copiedKey === `api-res-${apiEndpoint}` ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>
                    {copiedKey === `api-res-${apiEndpoint}` ? 'Tersalin' : 'Salin'}
                  </span>
                </button>
              </div>
              <pre className="p-4 font-mono text-xs leading-relaxed overflow-x-auto">
                {apiSuccessResponseJson}
              </pre>
            </div>
          </div>
        </div>

        {/* Field Output Description */}
        <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
          <h3 className="font-bold text-slate-900">
            D. Penjelasan Field Data Respon (<code className="font-mono">data.*</code>)
          </h3>
          {apiEndpoint === 'create_tenant' ? (
            <p className="text-slate-600 leading-relaxed">
              Simpan <code className="font-mono text-slate-800">tenant_id</code> sebagai referensi di sistem Anda. Kirimkan <code className="font-mono text-slate-800">username</code> dan <code className="font-mono text-slate-800">password</code> ke pembeli agar mereka bisa masuk ke dashboard bot. Nilai <code className="font-mono text-slate-800">expires_at</code> memakai format ISO-8601 UTC.
            </p>
          ) : (
            <p className="text-slate-600 leading-relaxed">
              Kirimkan <code className="font-mono text-slate-800">token_code</code> (status awal <code className="font-mono">&quot;available&quot;</code>) beserta <code className="font-mono text-slate-800">duration_label</code> ke pembeli. Pembeli menukarkan kode tersebut di dashboard toko mereka pada menu <strong>Pengaturan Toko -&gt; Redeem Token Perpanjangan</strong>. Setiap kode hanya dapat dipakai satu kali.
            </p>
          )}
        </div>
      </section>

      {/* 03. Alur Integrasi Webhook & Keamanan */}
      <section
        id="api-workflow"
        className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 scroll-mt-20"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0084D1]/10 text-[#0084D1] flex items-center justify-center shrink-0">
            <Webhook className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              03. Panduan Alur Integrasi Website Reseller &amp; Keamanan Produksi
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-3xl">
              Rekomendasi arsitektur saat menghubungkan payment gateway website Anda (Midtrans, Xendit, Tripay, LunasQRIS) dengan Partner API agar bebas duplikasi akun maupun kebocoran API Key.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 pt-4 border-t border-slate-100 text-xs">
          <div className="space-y-1.5">
            <span className="font-mono tabular-nums font-bold text-[#0084D1]">Tahap 01</span>
            <h3 className="font-bold text-slate-900">Pembeli Bayar di Web Mitra</h3>
            <p className="text-slate-600 leading-relaxed">
              Pembeli memilih paket bot baru (misal 30 Hari) atau paket perpanjangan dan menyelesaikan pembayaran di web Anda.
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="font-mono tabular-nums font-bold text-[#0084D1]">Tahap 02</span>
            <h3 className="font-bold text-slate-900">Verifikasi &amp; Cek Idempotency</h3>
            <p className="text-slate-600 leading-relaxed">
              Saat menerima webhook <em>Paid</em> di backend Anda, pastikan status order belum pernah diproses agar callback ganda dari gateway tidak membuat akun dobel.
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="font-mono tabular-nums font-bold text-[#0084D1]">Tahap 03</span>
            <h3 className="font-bold text-slate-900">Panggil API Server-to-Server</h3>
            <p className="text-slate-600 leading-relaxed">
              Server backend Anda memanggil <code className="font-mono">/tenants/create</code> atau <code className="font-mono">/tokens/create</code> dengan timeout minimal 15 detik serta menangani HTTP <code className="font-mono">429</code> memakai <code className="font-mono">Retry-After</code>.
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="font-mono tabular-nums font-bold text-[#0084D1]">Tahap 04</span>
            <h3 className="font-bold text-slate-900">Simpan &amp; Kirim ke Pembeli</h3>
            <p className="text-slate-600 leading-relaxed">
              Simpan <code className="font-mono">tenant_id</code> / <code className="font-mono">token_code</code> ke database order Anda dan kirim kredensial login atau kode voucher secara otomatis ke pembeli.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Kewajiban Keamanan API Key:</strong> Simpan kunci <code className="font-mono text-slate-900">wzp_...</code> hanya di file <code className="font-mono">.env</code> backend server Anda. Jangan pernah memanggil Partner API langsung dari kode browser React/Vue/JavaScript publik karena pengunjung dapat menyalin API Key Anda lewat tab Network browser.
          </p>
        </div>
      </section>

      {/* 04. Kode Status HTTP & Penanganan Error */}
      <section
        id="api-errors"
        className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 scroll-mt-20"
      >
        <div>
          <h2 className="text-base font-bold text-slate-900">
            04. Matriks Lengkap Kode Status HTTP &amp; Penanganan Error
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Setiap respon gagal mengembalikan format JSON seragam berisi <code className="font-mono text-slate-700">success: false</code>, <code className="font-mono text-slate-700">error</code>, dan <code className="font-mono text-slate-700">message</code>.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <div className="lg:col-span-2 border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[580px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4 whitespace-nowrap">HTTP</th>
                    <th className="py-3 px-4 whitespace-nowrap">Kode Error</th>
                    <th className="py-3 px-4">Penyebab &amp; Solusi Penanganan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-2.5 px-4 font-mono tabular-nums font-bold text-emerald-700 whitespace-nowrap">201</td>
                    <td className="py-2.5 px-4 font-mono whitespace-nowrap">- (Sukses)</td>
                    <td className="py-2.5 px-4">Tenant baru atau token berhasil dibuat. Data lengkap berada di objek <code className="font-mono">data</code>.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">400</td>
                    <td className="py-2.5 px-4 font-mono whitespace-nowrap">INVALID_DURATION</td>
                    <td className="py-2.5 px-4">Nilai durasi bukan integer <span className="font-mono tabular-nums">1-3650</span> atau memakai <code className="font-mono">weeks</code> pada endpoint <code className="font-mono">/tokens/create</code>.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">401</td>
                    <td className="py-2.5 px-4 font-mono whitespace-nowrap">UNAUTHORIZED</td>
                    <td className="py-2.5 px-4">Header <code className="font-mono">x-api-key</code> maupun <code className="font-mono">Authorization: Bearer</code> belum dikirim.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">401</td>
                    <td className="py-2.5 px-4 font-mono whitespace-nowrap">INVALID_API_KEY</td>
                    <td className="py-2.5 px-4">API Key salah ketik, tidak terdaftar, atau telah dicabut/dihapus oleh Master Admin.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">403</td>
                    <td className="py-2.5 px-4 font-mono whitespace-nowrap">API_KEY_SUSPENDED</td>
                    <td className="py-2.5 px-4">API Key mitra sedang berstatus suspend. Hubungi pengelola untuk mengaktifkan kembali.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">404</td>
                    <td className="py-2.5 px-4 font-mono whitespace-nowrap">NOT_FOUND</td>
                    <td className="py-2.5 px-4">URL salah atau request ditembak ke domain tenant alih-alih domain <strong>Admin Host</strong> resmi.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">409</td>
                    <td className="py-2.5 px-4 font-mono whitespace-nowrap">USERNAME_ALREADY_EXISTS</td>
                    <td className="py-2.5 px-4">Field custom <code className="font-mono">username</code> sudah dipakai tenant lain. Kosongkan field agar auto-generate.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">429</td>
                    <td className="py-2.5 px-4 font-mono whitespace-nowrap">RATE_LIMIT_EXCEEDED</td>
                    <td className="py-2.5 px-4">Melebihi batas 60 req/menit (atau spam key invalid per IP). Tunggu sesuai detik di header <code className="font-mono">Retry-After</code>.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">500</td>
                    <td className="py-2.5 px-4 font-mono whitespace-nowrap">CREATE_TENANT_FAILED / CREATE_TOKEN_FAILED</td>
                    <td className="py-2.5 px-4">Kesalahan internal server saat menyimpan data tenant/token. Aman dicoba ulang bila sebelumnya gagal total.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2.5">
            <span className="block text-xs font-bold text-slate-900">
              Format JSON Respon Error
            </span>
            <pre className="p-4 rounded-xl bg-slate-900 text-rose-300 font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800">
              {apiErrorExampleJson}
            </pre>
            <p className="text-xs text-slate-600 leading-relaxed pt-1">
              Semua aktivitas pembuatan tenant dan token melalui API Key tercatat di tab <strong>Partner API -&gt; Log Aktivitas</strong> pada dashboard Master Admin untuk memudahkan audit mitra.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
