import React, { useEffect, useState } from 'react';
import {
  Store,
  Save,
  RefreshCw,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Clock,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { BotStatusResponse, StoreInfoConfig } from '../../types/dashboard.types';
import { toDisplayPhone, toOfficialPhone, formatOfficialDisplay } from '../../utils/phoneUtils';
import { validateStoreInfoSubmission } from '../../utils/storeInfoValidation';
import {
  decomposeMilliseconds,
  formatTotalRentalDuration,
  calculateRemainingPercentage,
  formatExpiryDateTimeWIB,
  pad2,
} from '../../utils/durationFormat';

interface TabPengaturanTokoProps {
  storeInfo: StoreInfoConfig;
  setStoreInfo: (val: StoreInfoConfig) => void;
  isSavingConfig: boolean;
  onSave: (data?: StoreInfoConfig) => Promise<boolean> | boolean | void;
  botData?: BotStatusResponse;
  onRefreshBotStatus?: () => Promise<any>;
  showToast: (msg: string) => void;
}

export const TabPengaturanToko: React.FC<TabPengaturanTokoProps> = ({
  storeInfo,
  setStoreInfo,
  isSavingConfig,
  onSave,
  botData,
  onRefreshBotStatus,
  showToast,
}) => {
  // --- State Info Profil Toko ---
  const [formData, setFormData] = useState<StoreInfoConfig>(storeInfo);
  const [showMobilePreview, setShowMobilePreview] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // --- State Masa Sewa & Redeem Token ---
  const [tokenInput, setTokenInput] = useState<string>('');
  const [isSubmittingToken, setIsSubmittingToken] = useState<boolean>(false);
  const [redeemSuccess, setRedeemSuccess] = useState<boolean>(false);
  const [redeemedDetails, setRedeemedDetails] = useState<{
    addedDuration?: string;
    newExpiresAt?: string;
    newDaysRemaining?: number;
    newTotalDays?: number;
  } | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (storeInfo) setFormData(storeInfo);
  }, [storeInfo]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // --- Perhitungan Masa Aktif & Status Sewa ---
  const activeExpiry = redeemedDetails?.newExpiresAt || botData?.expiresAt;
  const expiryTimeMs = activeExpiry ? new Date(activeExpiry).getTime() : NaN;
  const countdown = Number.isFinite(expiryTimeMs)
    ? decomposeMilliseconds(expiryTimeMs - nowMs)
    : decomposeMilliseconds(0);

  const rawStatus = botData?.accountStatus || 'active';
  const botStatus: 'aktif' | 'suspend' | 'expired' =
    rawStatus === 'suspended'
      ? 'suspend'
      : rawStatus === 'expired' || (Number.isFinite(expiryTimeMs) && countdown.expired && !redeemSuccess)
      ? 'expired'
      : 'aktif';

  const totalDurationLabel = formatTotalRentalDuration(
    botData?.createdAt,
    activeExpiry,
    redeemedDetails?.newTotalDays ?? botData?.totalDays
  );
  const percentage = Number.isFinite(expiryTimeMs)
    ? calculateRemainingPercentage(botData?.createdAt, activeExpiry, nowMs)
    : 0;
  const { dateText: formattedExpiry, timeText: formattedExpiryTime } = formatExpiryDateTimeWIB(
    activeExpiry,
    true
  );

  // --- Handler Store Info ---
  const handleFieldChange = (patch: Partial<StoreInfoConfig>) => {
    const next = { ...formData, ...patch };
    setFormData(next);
    setStoreInfo(next);
    if (formError) setFormError(null);
  };

  const handleSaveStoreInfo = async () => {
    const validation = validateStoreInfoSubmission(formData);
    if (!validation.valid || !validation.normalized) {
      const msg =
        validation.error ||
        'Konfigurasi gagal disimpan: Nama Toko, Nama Owner, dan WhatsApp Owner wajib diisi.';
      setFormError(msg);
      showToast(msg);
      return;
    }

    const ok = await onSave(validation.normalized);
    if (ok !== false) {
      setFormError(null);
      setFormData(validation.normalized);
      showToast('Informasi profil toko berhasil disimpan!');
    } else {
      setFormError('Konfigurasi gagal disimpan ke server. Perubahan belum diterapkan.');
    }
  };

  // --- Handler Redeem Token ---
  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (raw.length > 16) {
      raw = raw.slice(0, 16);
    }

    const parts: string[] = [];
    for (let i = 0; i < raw.length; i += 4) {
      parts.push(raw.slice(i, i + 4));
    }
    setTokenInput(parts.join('-'));
  };

  const handleRedeemToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tokenInput.replace(/[^A-Z0-9]/g, '').trim();

    if (!clean) {
      showToast('Silakan masukkan kode token voucher terlebih dahulu');
      return;
    }

    if (clean.length !== 16) {
      showToast('Format token tidak valid. Token harus terdiri dari 16 karakter alfanumerik (XXXX-XXXX-XXXX-XXXX)');
      return;
    }

    setIsSubmittingToken(true);
    try {
      const res = await fetch('/api/bot/redeem-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokenCode: tokenInput }),
      });

      const json = await res.json();

      if (json.success) {
        setRedeemSuccess(true);
        setRedeemedDetails({
          addedDuration: json.data?.addedDuration,
          newExpiresAt: json.data?.newExpiresAt,
          newDaysRemaining: json.data?.newDaysRemaining,
          newTotalDays: json.data?.newTotalDays,
        });
        showToast(json.message || 'Token voucher berhasil digunakan! Masa sewa bertambah.');
        setTokenInput('');
        if (onRefreshBotStatus) {
          await onRefreshBotStatus();
        }
      } else {
        showToast(json.message || 'Gagal menukarkan voucher token.');
      }
    } catch (err: any) {
      showToast('Terjadi kesalahan saat memproses token: ' + err.message);
    } finally {
      setIsSubmittingToken(false);
    }
  };

  const isRequiredComplete = Boolean(
    formData.storeName?.trim() &&
      formData.ownerName?.trim() &&
      formData.ownerNumber?.trim()
  );

  const PreviewCard = (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold text-slate-900">
            Pratinjau Pesan WhatsApp
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-emerald-700">
          Live
        </span>
      </div>

      <div className="bg-[#EFEAE2] p-3 rounded-xl border border-slate-200">
        <div className="bg-white rounded-xl rounded-tl-xs p-3 text-xs space-y-2 text-slate-800 leading-relaxed">
          <p className="font-semibold text-slate-900">
            Halo Kak! Selamat datang di{' '}
            <span className="text-[#0084D1] font-bold">
              {formData.storeName || '[Nama Store]'}
            </span>
            .
          </p>
          <p className="text-[11px] text-slate-600">
            Silakan pilih menu katalog akun premium, layanan SMM, atau top up game yang tersedia.
          </p>

          <div className="pt-2 border-t border-slate-100 space-y-1 font-mono text-[10px] text-slate-600">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-800">Owner:</span>
              <span className="truncate">{formData.ownerName || '-'}</span>
            </div>
            {formData.ownerNumber && (
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-800">Kontak:</span>
                <span className="tabular-nums">{formatOfficialDisplay(formData.ownerNumber)}</span>
              </div>
            )}
            {formData.adminName && (
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-800">CS Admin:</span>
                <span className="truncate">{formData.adminName}</span>
              </div>
            )}
            {formData.webLink && (
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-800">Website:</span>
                <span className="text-[#0084D1] truncate max-w-[160px]">
                  {formData.webLink}
                </span>
              </div>
            )}
          </div>

          <div className="text-[9px] text-slate-400 text-right pt-0.5">
            12:00 ✓✓
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 pb-12">
      {/* Banner Notifikasi Berhasil Redeem Token */}
      {redeemSuccess && (
        <div className="p-4 sm:p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-900">
                Voucher Berhasil Di-Redeem!
              </h4>
              <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                Masa aktif bot WhatsApp toko Anda telah berhasil diperpanjang{' '}
                <span className="font-bold underline">
                  +{redeemedDetails?.addedDuration || 'Durasi Tambahan'}
                </span>
                . Status akun otomatis dipulihkan ke Aktif.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onRefreshBotStatus) {
                onRefreshBotStatus();
              } else {
                window.location.reload();
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors shrink-0 whitespace-nowrap cursor-pointer"
          >
            Perbarui Status
          </button>
        </div>
      )}

      {/* 1. PALING ATAS: STATUS MASA SEWA (3 Kartu Metrik Sejajar) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-stretch">
        {/* Kartu 1: Status Bot */}
        <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Status Sewa Bot
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                botStatus === 'aktif' || redeemSuccess
                  ? 'bg-emerald-50 text-emerald-600'
                  : botStatus === 'suspend'
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              {botStatus === 'aktif' || redeemSuccess ? (
                <ShieldCheck className="w-4 h-4" />
              ) : botStatus === 'suspend' ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  botStatus === 'aktif' || redeemSuccess
                    ? 'bg-emerald-500'
                    : botStatus === 'suspend'
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`}
              />
              <span
                className={`text-base font-bold tracking-tight ${
                  botStatus === 'aktif' || redeemSuccess
                    ? 'text-emerald-700'
                    : botStatus === 'suspend'
                    ? 'text-rose-700'
                    : 'text-amber-700'
                }`}
              >
                {botStatus === 'aktif' || redeemSuccess
                  ? 'Aktif Beroperasi'
                  : botStatus === 'suspend'
                  ? 'Ditangguhkan (Suspend)'
                  : 'Masa Sewa Habis'}
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              {botStatus === 'aktif' || redeemSuccess
                ? 'Bot WhatsApp toko aktif dan siap melayani transaksi pelanggan.'
                : botStatus === 'suspend'
                ? 'Bot dinonaktifkan sementara oleh Master Admin.'
                : 'Masa sewa telah berakhir. Redeem token voucher di bawah untuk memperpanjang.'}
            </p>
          </div>
        </div>

        {/* Kartu 2: Hitung Mundur Masa Aktif */}
        <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Sisa Masa Aktif
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0084D1] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <div
                className={`text-xl sm:text-2xl font-extrabold font-mono tabular-nums leading-none ${
                  countdown.expired ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {countdown.days}
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-1">Hari</div>
            </div>
            <div>
              <div
                className={`text-xl sm:text-2xl font-extrabold font-mono tabular-nums leading-none ${
                  countdown.expired ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {pad2(countdown.hours)}
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-1">Jam</div>
            </div>
            <div>
              <div
                className={`text-xl sm:text-2xl font-extrabold font-mono tabular-nums leading-none ${
                  countdown.expired ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {pad2(countdown.minutes)}
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-1">Menit</div>
            </div>
            <div>
              <div
                className={`text-xl sm:text-2xl font-extrabold font-mono tabular-nums leading-none ${
                  countdown.expired ? 'text-rose-600' : 'text-[#0084D1]'
                }`}
              >
                {pad2(countdown.seconds)}
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-1">Detik</div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>Paket: {totalDurationLabel}</span>
              <span className="font-mono tabular-nums text-slate-700">{percentage}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  percentage > 40
                    ? 'bg-[#0084D1]'
                    : percentage > 15
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Kartu 3: Tanggal Expired */}
        <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Tanggal Expired
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-base sm:text-lg font-bold text-slate-900 block leading-snug">
              {formattedExpiry}
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-600 block">
              {formattedExpiryTime === '-' ? '-' : `Pukul ${formattedExpiryTime}`}
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Pengingat otomatis dikirim sebelum batas waktu sewa berakhir.
          </p>
        </div>
      </section>

      {/* 2. BAGIAN TENGAH: IDENTITAS TOKO & PRATINJAU WHATSAPP */}
      <section className="space-y-4">
        {!isRequiredComplete && (
          <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-600 flex items-center gap-2">
            <Store className="w-4 h-4 text-[#0084D1] shrink-0" />
            <span>
              Lengkapi kolom bertanda <span className="text-rose-500 font-bold">*</span> agar profil toko aktif.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Kolom Kiri: Formulir Identitas Toko */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5">
            {/* Identitas Toko */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                  Identitas Toko
                </h3>
                <span className="text-[11px] text-slate-400">
                  <span className="text-rose-500">*</span> Wajib
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                  <span>Nama Toko / Brand</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.storeName || ''}
                  onChange={(e) => handleFieldChange({ storeName: e.target.value })}
                  placeholder="Contoh: Wanzt Store Digital"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm sm:text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-[#0084D1] focus:ring-2 focus:ring-[#0084D1]/20 focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                    <span>Nama Pemilik (Owner)</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ownerName || ''}
                    onChange={(e) => handleFieldChange({ ownerName: e.target.value })}
                    placeholder="Contoh: Ridwan"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm sm:text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-[#0084D1] focus:ring-2 focus:ring-[#0084D1]/20 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                    <span>WhatsApp Owner</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex rounded-xl border border-slate-300 focus-within:border-[#0084D1] focus-within:ring-2 focus-within:ring-[#0084D1]/20 transition bg-white overflow-hidden">
                    <span className="bg-slate-50 px-3 py-2.5 flex items-center text-slate-600 border-r border-slate-200 text-xs font-mono select-none shrink-0">
                      +62
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={toDisplayPhone(formData.ownerNumber)}
                      onChange={(e) => {
                        const cleanDisplay = toDisplayPhone(e.target.value);
                        handleFieldChange({
                          ownerNumber: cleanDisplay ? toOfficialPhone(cleanDisplay) : '',
                        });
                      }}
                      placeholder="81234567890"
                      className="w-full px-3 py-2.5 text-sm sm:text-xs font-mono font-medium text-slate-900 placeholder-slate-400 focus:outline-none min-w-0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Service & Admin */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                  Customer Service &amp; Admin
                </h3>
                <span className="text-[11px] text-slate-400">Opsional</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800 block">Nama Admin / CS</label>
                  <input
                    type="text"
                    value={formData.adminName || ''}
                    onChange={(e) => handleFieldChange({ adminName: e.target.value })}
                    placeholder="Contoh: CS Ramah"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm sm:text-xs text-slate-900 placeholder-slate-400 focus:border-[#0084D1] focus:ring-2 focus:ring-[#0084D1]/20 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800 block">WhatsApp Admin CS</label>
                  <div className="flex rounded-xl border border-slate-300 focus-within:border-[#0084D1] focus-within:ring-2 focus-within:ring-[#0084D1]/20 transition bg-white overflow-hidden">
                    <span className="bg-slate-50 px-3 py-2.5 flex items-center text-slate-600 border-r border-slate-200 text-xs font-mono select-none shrink-0">
                      +62
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={toDisplayPhone(formData.adminNumber)}
                      onChange={(e) => {
                        const cleanDisplay = toDisplayPhone(e.target.value);
                        handleFieldChange({
                          adminNumber: cleanDisplay ? toOfficialPhone(cleanDisplay) : '',
                        });
                      }}
                      placeholder="82345678901"
                      className="w-full px-3 py-2.5 text-sm sm:text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none min-w-0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Website & Saluran */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                  Website &amp; Saluran
                </h3>
                <span className="text-[11px] text-slate-400">Opsional</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800 block">Website Toko</label>
                <input
                  type="url"
                  value={formData.webLink || ''}
                  onChange={(e) => handleFieldChange({ webLink: e.target.value })}
                  placeholder="https://tokoanda.com"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm sm:text-xs font-mono text-slate-900 placeholder-slate-400 focus:border-[#0084D1] focus:ring-2 focus:ring-[#0084D1]/20 focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800 block">Saluran WhatsApp</label>
                  <input
                    type="url"
                    value={formData.waLink || ''}
                    onChange={(e) => handleFieldChange({ waLink: e.target.value })}
                    placeholder="https://whatsapp.com/channel/..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm sm:text-xs font-mono text-slate-900 placeholder-slate-400 focus:border-[#0084D1] focus:ring-2 focus:ring-[#0084D1]/20 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800 block">Bot Telegram</label>
                  <input
                    type="text"
                    value={formData.telegramBot || ''}
                    onChange={(e) => handleFieldChange({ telegramBot: e.target.value })}
                    placeholder="@namastore_bot"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm sm:text-xs font-mono text-slate-900 placeholder-slate-400 focus:border-[#0084D1] focus:ring-2 focus:ring-[#0084D1]/20 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Toggle Pratinjau khusus Mobile (< lg) */}
            <div className="lg:hidden space-y-3">
              <button
                type="button"
                onClick={() => setShowMobilePreview((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <span className="inline-flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pratinjau Pesan WhatsApp</span>
                </span>
                {showMobilePreview ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {showMobilePreview && PreviewCard}
            </div>

            {formError && (
              <div
                role="alert"
                className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-700 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Tombol Simpan */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                disabled={isSavingConfig}
                onClick={handleSaveStoreInfo}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0084D1] hover:bg-[#0073B7] text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                {isSavingConfig ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Simpan Informasi Toko</span>
              </button>
            </div>
          </div>

          {/* Kolom Kanan Desktop: Pratinjau Pesan WhatsApp */}
          <div className="hidden lg:block lg:col-span-5">
            {PreviewCard}
          </div>
        </div>
      </section>

      {/* 3. PALING BAWAH: PERPANJANG MASA SEWA (REDEEM TOKEN VOUCHER) */}
      <section className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl space-y-5">
        <div className="flex items-start gap-3 pb-3.5 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-[#0084D1]/10 text-[#0084D1] flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Perpanjang Masa Sewa Bot (Redeem Token)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Masukkan 16 karakter kode token voucher lisensi untuk memperpanjang masa aktif bot WhatsApp secara instan.
            </p>
          </div>
        </div>

        <form onSubmit={handleRedeemToken} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-800">
                Kode Token Lisensi
              </label>
              {tokenInput.length > 0 && (
                <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                  {tokenInput.replace(/[^A-Z0-9]/g, '').length}/16 karakter
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={tokenInput}
                onChange={handleTokenChange}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                maxLength={19}
                className="w-full h-12 px-4 font-mono text-sm sm:text-base font-bold tracking-widest text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#0084D1] focus:ring-2 focus:ring-[#0084D1]/20 outline-hidden transition-all placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal"
              />
              {tokenInput && (
                <button
                  type="button"
                  onClick={() => setTokenInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
                >
                  Bersihkan
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#0084D1] shrink-0" />
              <span>Format token terdiri dari 16 karakter alfanumerik (4 blok per 4 karakter).</span>
            </p>
          </div>

          <div className="flex justify-start">
            <button
              type="submit"
              disabled={isSubmittingToken || !tokenInput.trim()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0084D1] hover:bg-[#0073B7] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              {isSubmittingToken ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Token...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Gunakan Token</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Ketentuan Penggunaan Token Lisensi</span>
          </h4>
          <ul className="text-xs text-slate-600 space-y-1 pl-5 list-disc leading-relaxed">
            <li>Setiap token hanya berlaku untuk 1 kali penggunaan.</li>
            <li>Token yang sudah digunakan tidak dapat dipakai kembali oleh toko lain.</li>
            <li>Masa sewa baru langsung ditambahkan otomatis ke sisa masa aktif bot Anda.</li>
          </ul>
        </div>
      </section>
    </div>
  );
};
