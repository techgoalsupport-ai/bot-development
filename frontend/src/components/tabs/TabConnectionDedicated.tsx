import React, { FormEvent, useState, useEffect } from 'react';
import {
  Smartphone,
  AlertCircle,
  Play,
  Clock,
  Square,
  RotateCcw,
  KeyRound,
  Check,
  Copy,
  ShieldCheck,
  Wifi,
  Terminal,
  Send,
  Eye,
  EyeOff,
  ExternalLink,
  Info,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Server,
  QrCode,
  Wallet,
  Lock,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { BotStatusResponse } from '../../types/dashboard.types';
import { LiveTerminal } from '../terminal/LiveTerminal';

interface TabConnectionDedicatedProps {
  botData: BotStatusResponse;
  phone: string;
  setPhone: (val: string) => void;
  customCode: string;
  setCustomCode: (val: string) => void;
  loading: boolean;
  copied: boolean;
  onStartPairing: (e: FormEvent) => void;
  onConnectSavedSession: () => void;
  onReconnect: () => void;
  onStop: () => void;
  onReset: () => void;
  onCopyCode: () => void;
  isStoreInfoComplete?: boolean;
  // Layanan Xaviera & LunasQRIS props
  xavieraApiKey: string;
  setXavieraApiKey: (val: string) => void;
  xavieraBaseUrl: string;
  setXavieraBaseUrl: (val: string) => void;
  lunasQrisApiKey: string;
  setLunasQrisApiKey: (val: string) => void;
  lunasQrisSecretKey: string;
  setLunasQrisSecretKey: (val: string) => void;
  lunasQrisBaseUrl: string;
  setLunasQrisBaseUrl: (val: string) => void;
  showApiKey: boolean;
  setShowApiKey: React.Dispatch<React.SetStateAction<boolean>>;
  isSavingConfig: boolean;
  syncConfigToServer: (config: any) => Promise<boolean | void> | void;
  showToast: (msg: string) => void;
}

export const TabConnectionDedicated: React.FC<TabConnectionDedicatedProps> = ({
  botData,
  phone,
  setPhone,
  customCode,
  setCustomCode,
  loading,
  copied,
  onStartPairing,
  onConnectSavedSession,
  onReconnect,
  onStop,
  onReset,
  onCopyCode,
  isStoreInfoComplete = true,
  xavieraApiKey,
  setXavieraApiKey,
  xavieraBaseUrl,
  setXavieraBaseUrl,
  lunasQrisApiKey,
  setLunasQrisApiKey,
  lunasQrisSecretKey,
  setLunasQrisSecretKey,
  lunasQrisBaseUrl,
  setLunasQrisBaseUrl,
  showApiKey,
  setShowApiKey,
  isSavingConfig,
  syncConfigToServer,
  showToast,
}) => {
  // --- Telegram States ---
  const [telegramConfig, setTelegramConfig] = useState({
    botToken: '',
    chatId: '',
    notifEnabled: false,
    adminDisabled: false,
    isConfigured: false,
  });
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [showBotToken, setShowBotToken] = useState(false);
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [showPairingGuide, setShowPairingGuide] = useState(false);
  const [showTelegramGuide, setShowTelegramGuide] = useState(false);

  // --- Layanan Xaviera & LunasQRIS Draft States ---
  const [localXavieraKey, setLocalXavieraKey] = useState<string>(xavieraApiKey || '');
  const [localXavieraBaseUrl, setLocalXavieraBaseUrl] = useState<string>(
    xavieraBaseUrl || 'https://xavierastore.com/api/v1'
  );
  const [localLunasKey, setLocalLunasKey] = useState<string>(lunasQrisApiKey || '');
  const [localLunasSecret, setLocalLunasSecret] = useState<string>(lunasQrisSecretKey || '');
  const [localLunasBaseUrl, setLocalLunasBaseUrl] = useState<string>(
    lunasQrisBaseUrl || 'https://lunasqris.com'
  );
  const [savingXaviera, setSavingXaviera] = useState<boolean>(false);
  const [savingLunas, setSavingLunas] = useState<boolean>(false);
  const [showLunasKey, setShowLunasKey] = useState<boolean>(false);
  const [showLunasSecret, setShowLunasSecret] = useState<boolean>(false);
  const [copiedWebhook, setCopiedWebhook] = useState<boolean>(false);
  const [lunasBalance, setLunasBalance] = useState<{
    loading: boolean;
    balance: number | null;
    balanceHold: number | null;
    error: string | null;
    checked: boolean;
  }>({
    loading: false,
    balance: null,
    balanceHold: null,
    error: null,
    checked: false,
  });

  useEffect(() => {
    setLocalXavieraKey(xavieraApiKey || '');
  }, [xavieraApiKey]);

  useEffect(() => {
    if (xavieraBaseUrl) setLocalXavieraBaseUrl(xavieraBaseUrl);
  }, [xavieraBaseUrl]);

  useEffect(() => {
    setLocalLunasKey(lunasQrisApiKey || '');
  }, [lunasQrisApiKey]);

  useEffect(() => {
    setLocalLunasSecret(lunasQrisSecretKey || '');
  }, [lunasQrisSecretKey]);

  useEffect(() => {
    if (lunasQrisBaseUrl) setLocalLunasBaseUrl(lunasQrisBaseUrl);
  }, [lunasQrisBaseUrl]);

  useEffect(() => {
    fetch('/api/bot/telegram/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          setTelegramConfig(data.config);
        }
      })
      .catch(() => {});
  }, []);

  const webhookUrl = `${window.location.origin}/api/lunasqris/webhook`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    showToast('URL Webhook LunasQRIS berhasil disalin');
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleCheckLunasBalance = async () => {
    const keyToCheck = localLunasKey?.trim();
    if (!keyToCheck) {
      showToast('Silakan masukkan API Key LunasQRIS terlebih dahulu.');
      return;
    }

    setLunasBalance((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(
        `/api/lunasqris/balance?apikey=${encodeURIComponent(keyToCheck)}`
      );
      const data = await res.json();
      if (data.success) {
        setLunasBalance({
          loading: false,
          balance: Number(data.balance || 0),
          balanceHold: Number(data.balanceHold || 0),
          error: null,
          checked: true,
        });
        showToast(
          `Saldo LunasQRIS: Rp ${Number(data.balance || 0).toLocaleString('id-ID')}`
        );
      } else {
        setLunasBalance({
          loading: false,
          balance: null,
          balanceHold: null,
          error: data.error || 'API Key LunasQRIS tidak valid',
          checked: true,
        });
        showToast(data.error || 'Gagal memverifikasi API Key LunasQRIS');
      }
    } catch (err: any) {
      setLunasBalance({
        loading: false,
        balance: null,
        balanceHold: null,
        error: err?.message || 'Gagal terhubung ke API LunasQRIS',
        checked: true,
      });
      showToast('Koneksi ke API LunasQRIS gagal');
    }
  };

  const handleSaveXaviera = async () => {
    setSavingXaviera(true);
    try {
      const ok = await syncConfigToServer({
        xavieraApiKey: localXavieraKey,
        xavieraBaseUrl: localXavieraBaseUrl,
      });
      if (ok !== false) {
        setXavieraApiKey(localXavieraKey);
        setXavieraBaseUrl(localXavieraBaseUrl);
        showToast('Konfigurasi Xaviera berhasil disimpan!');
      }
    } catch {
      showToast('Gagal menyimpan konfigurasi Xaviera');
    } finally {
      setSavingXaviera(false);
    }
  };

  const handleSaveLunasQris = async () => {
    setSavingLunas(true);
    try {
      const ok = await syncConfigToServer({
        lunasQrisApiKey: localLunasKey,
        lunasQrisSecretKey: localLunasSecret,
        lunasQrisBaseUrl: localLunasBaseUrl,
      });
      if (ok !== false) {
        setLunasQrisApiKey(localLunasKey);
        setLunasQrisSecretKey(localLunasSecret);
        setLunasQrisBaseUrl(localLunasBaseUrl);
        showToast('Konfigurasi LunasQRIS berhasil disimpan!');
      }
    } catch {
      showToast('Gagal menyimpan konfigurasi LunasQRIS');
    } finally {
      setSavingLunas(false);
    }
  };

  const handleSaveTelegram = async () => {
    setIsSavingTelegram(true);
    try {
      const res = await fetch('/api/bot/telegram/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: telegramConfig.botToken,
          chatId: telegramConfig.chatId,
          notifEnabled: telegramConfig.notifEnabled,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTelegramConfig(data.config);
        showToast('Pengaturan notifikasi Telegram berhasil disimpan!');
      } else {
        showToast('Gagal menyimpan Telegram: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      showToast('Error koneksi: ' + err.message);
    } finally {
      setIsSavingTelegram(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!telegramConfig.botToken || !telegramConfig.chatId) {
      showToast('Isi Bot Token dan Chat ID Telegram terlebih dahulu!');
      return;
    }
    setIsTestingTelegram(true);
    try {
      const res = await fetch('/api/bot/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: telegramConfig.botToken,
          chatId: telegramConfig.chatId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Pesan tes berhasil terkirim ke Telegram!');
      } else {
        showToast('Gagal tes Telegram: ' + (data.error || 'Periksa token & chat ID'));
      }
    } catch (err: any) {
      showToast('Error koneksi: ' + err.message);
    } finally {
      setIsTestingTelegram(false);
    }
  };

  // --- Validasi Pairing Code ---
  const trimmedCode = customCode.trim().toUpperCase();
  const isEmpty = trimmedCode.length === 0;
  const hasSymbol = /[^A-Z0-9]/.test(trimmedCode);
  const isExact8Chars = trimmedCode.length === 8;
  const isValidCode = !isEmpty && !hasSymbol && isExact8Chars;

  // --- State Koneksi & Sesi WhatsApp ---
  const isConnected = botData.status === 'connected';
  const isConnecting = botData.status === 'connecting';
  const isActivelyPairing =
    botData.status === 'waiting_code' || botData.status === 'code_ready';
  const hasSavedSession =
    !isConnected &&
    !isActivelyPairing &&
    Boolean(botData.isRegistered ?? botData.registered);
  const showPairingElements = !isConnected && !hasSavedSession;

  const isSuspended = botData.accountStatus === 'suspended';
  const isExpired = botData.accountStatus === 'expired';
  const isAccountBlocked = isSuspended || isExpired;

  const isXavieraConnected = Boolean(localXavieraKey?.trim());
  const isLunasConnected = Boolean(localLunasKey?.trim());

  const getStatusLabel = () => {
    switch (botData.status) {
      case 'connected':
        return { text: 'Terhubung', color: 'text-emerald-700', dot: 'bg-emerald-500' };
      case 'waiting_code':
      case 'code_ready':
        return { text: 'Menunggu Pairing', color: 'text-[#0084D1]', dot: 'bg-[#0084D1]' };
      case 'connecting':
        return { text: 'Menghubungkan', color: 'text-amber-700', dot: 'bg-amber-500' };
      case 'error':
        return { text: 'Koneksi Error', color: 'text-rose-700', dot: 'bg-rose-500' };
      default:
        return { text: 'Offline', color: 'text-slate-600', dot: 'bg-slate-400' };
    }
  };

  const statusMeta = getStatusLabel();

  return (
    <div className="space-y-5">
      {/* Peringatan Akun Ditangguhkan */}
      {isSuspended && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong className="block text-rose-900">Akses Bot Diblokir</strong>
            Akun ditangguhkan oleh Master Admin. Koneksi bot dinonaktifkan.
          </div>
        </div>
      )}

      {/* Peringatan Masa Sewa Habis */}
      {isExpired && (
        <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong className="block text-slate-900">Masa Sewa Berakhir</strong>
            Perpanjang masa aktif lewat token di menu Pengaturan Toko untuk menghubungkan kembali.
          </div>
        </div>
      )}

      {/* 1. PALING ATAS: HUBUNGKAN WHATSAPP BOT */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-emerald-600" />
              ) : (
                <Smartphone className="w-4 h-4 text-[#0084D1]" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
                Hubungkan WhatsApp Bot
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                  <span className={statusMeta.color}>{statusMeta.text}</span>
                </span>
                {botData.phoneNumber && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-slate-700 font-semibold">
                      +{botData.phoneNumber}
                    </span>
                  </>
                )}
                {hasSavedSession && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-700 font-medium">Sesi tersimpan tersedia</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {botData.user?.name && isConnected && (
            <div className="text-xs text-slate-600 font-medium shrink-0">
              Akun: <strong className="text-slate-900">{botData.user.name}</strong>
            </div>
          )}
        </div>

        {/* KONDISI A: BOT SUDAH TERHUBUNG */}
        {isConnected ? (
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5 text-xs text-emerald-800 bg-emerald-50/70 border border-emerald-200 rounded-xl px-3.5 py-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Bot WhatsApp aktif melayani pelanggan
                {botData.phoneNumber ? ` melalui nomor +${botData.phoneNumber}` : ''}.
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Tombol Hubungkan Ulang di atas (full width) */}
              <button
                type="button"
                onClick={onReconnect}
                disabled={loading || isAccountBlocked}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0084D1] hover:bg-[#0073B7] text-white text-xs font-semibold transition inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Menghubungkan Ulang...' : 'Hubungkan Ulang'}</span>
              </button>

              {/* Baris bawah 2 kolom sejajar: Reset Sesi (kiri) & Hentikan (kanan) */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={onReset}
                  disabled={loading || isAccountBlocked}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Sesi</span>
                </button>

                <button
                  type="button"
                  onClick={onStop}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 transition inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Hentikan</span>
                </button>
              </div>
            </div>
          </div>
        ) : hasSavedSession ? (
          /* KONDISI B: SESI TERSIMPAN TERDETEKSI (Hanya Hubungkan Bot & Reset Sesi) */
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Sesi login WhatsApp yang tersimpan terdeteksi
              {botData.phoneNumber ? (
                <>
                  {' '}
                  untuk nomor{' '}
                  <strong className="font-mono tabular-nums text-slate-900">
                    +{botData.phoneNumber}
                  </strong>
                </>
              ) : null}
              . Anda dapat langsung menyambungkan bot tanpa pairing ulang atau mereset sesi untuk menautkan nomor baru.
            </p>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onConnectSavedSession}
                disabled={loading || isConnecting || isAccountBlocked || !isStoreInfoComplete}
                className="px-4 py-2.5 rounded-xl bg-[#0084D1] hover:bg-[#0073B7] text-white text-xs font-semibold transition inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
              >
                {loading || isConnecting ? (
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>
                  {loading || isConnecting ? 'Menghubungkan...' : 'Hubungkan Bot'}
                </span>
              </button>

              <button
                type="button"
                onClick={onReset}
                disabled={loading || isAccountBlocked}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Sesi</span>
              </button>
            </div>

            {!isStoreInfoComplete && !isAccountBlocked && (
              <p className="text-[11px] text-slate-500">
                Lengkapi seluruh Identitas Utama Toko di Pengaturan Toko agar dapat menghubungkan bot.
              </p>
            )}
          </div>
        ) : (
          /* KONDISI C: TIDAK ADA SESI TERSIMPAN (Tampilkan Form Nomor & Custom Pairing Code) */
          <form onSubmit={onStartPairing} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nomor WhatsApp Bot */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-800">
                  Nomor WhatsApp Bot
                </label>
                <div className="flex rounded-xl border border-slate-300 focus-within:border-[#0084D1] focus-within:ring-2 focus-within:ring-[#0084D1]/20 transition bg-white overflow-hidden">
                  <span className="bg-slate-50 px-3 py-2.5 flex items-center text-slate-600 border-r border-slate-200 text-xs font-mono select-none shrink-0">
                    +62
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="81234567890"
                    disabled={loading}
                    className="w-full px-3 py-2.5 text-sm sm:text-xs font-mono font-medium text-slate-900 placeholder-slate-400 focus:outline-none min-w-0"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Masukkan tanpa angka 0 di depan.
                </p>
              </div>

              {/* Custom Pairing Code */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-800">
                    Custom Pairing Code
                  </label>
                  <span
                    className={`text-[11px] font-mono tabular-nums font-semibold whitespace-nowrap shrink-0 ${
                      hasSymbol
                        ? 'text-rose-600'
                        : isExact8Chars
                        ? 'text-emerald-600'
                        : trimmedCode.length > 0
                        ? 'text-[#0084D1]'
                        : 'text-slate-400'
                    }`}
                  >
                    {hasSymbol ? 'Hapus simbol' : `${trimmedCode.length}/8 karakter`}
                  </span>
                </div>

                <input
                  type="text"
                  maxLength={8}
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: 12AB34CD"
                  disabled={loading}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-sm sm:text-xs font-mono font-bold tracking-widest focus:outline-none focus:ring-2 uppercase transition border ${
                    hasSymbol
                      ? 'bg-rose-50/30 border-rose-400 text-rose-900 focus:border-rose-500 focus:ring-rose-500/20'
                      : isExact8Chars
                      ? 'bg-emerald-50/20 border-emerald-400 text-emerald-900 focus:border-emerald-500 focus:ring-emerald-500/20'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-[#0084D1] focus:ring-[#0084D1]/20'
                  }`}
                />

                <p
                  className={`text-[11px] ${
                    hasSymbol
                      ? 'text-rose-600 font-medium'
                      : isValidCode
                      ? 'text-emerald-600 font-medium'
                      : 'text-slate-400'
                  }`}
                >
                  {hasSymbol
                    ? 'Gunakan huruf & angka saja (A-Z, 0-9), tanpa simbol atau spasi.'
                    : isValidCode
                    ? 'Kode pairing 8 karakter siap digunakan.'
                    : 'Wajib 8 karakter huruf/angka (A-Z, 0-9) tanpa simbol.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <button
                type="submit"
                disabled={
                  loading ||
                  isConnecting ||
                  !isValidCode ||
                  !isStoreInfoComplete ||
                  isAccountBlocked
                }
                className={`flex-1 sm:flex-initial py-2.5 px-5 rounded-xl font-semibold text-xs transition inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 ${
                  isSuspended
                    ? 'bg-rose-100 text-rose-700 border border-rose-200 cursor-not-allowed'
                    : isExpired
                    ? 'bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed'
                    : loading || isConnecting
                    ? 'bg-[#0084D1] text-white opacity-75 cursor-wait'
                    : !isValidCode || !isStoreInfoComplete
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-[#0084D1] hover:bg-[#0073B7] text-white cursor-pointer'
                }`}
              >
                {loading || isConnecting ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>
                  {isSuspended
                    ? 'Akun Ditangguhkan'
                    : isExpired
                    ? 'Masa Sewa Habis'
                    : loading || isConnecting
                    ? 'Menghubungkan...'
                    : isValidCode && isStoreInfoComplete
                    ? `Minta Kode Pairing (${trimmedCode})`
                    : 'Minta Kode Pairing'}
                </span>
              </button>

              {botData.hasSession && (
                <button
                  type="button"
                  onClick={onReset}
                  disabled={loading || isAccountBlocked}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Sesi</span>
                </button>
              )}
            </div>

            {!isStoreInfoComplete && !isAccountBlocked && (
              <p className="text-[11px] text-slate-500">
                Lengkapi seluruh Identitas Utama Toko di Pengaturan Toko agar dapat meminta kode pairing.
              </p>
            )}
          </form>
        )}
      </section>

      {/* 2. DI BAWAHNYA: KODE PAIRING BOT (Hanya muncul bila belum terhubung & tidak ada sesi tersimpan) */}
      {showPairingElements && (
        <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#0084D1]" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                Kode Pairing Bot
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
              {botData.pairingCode ? 'Tersedia' : 'Menunggu'}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 block">
                Masukkan kode ini di WhatsApp ponsel Anda:
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-widest text-slate-900 select-all">
                {botData.pairingCode || customCode || '--------'}
              </div>
            </div>

            <button
              type="button"
              onClick={onCopyCode}
              disabled={!botData.pairingCode && !customCode}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0084D1] hover:bg-[#0073B7] text-white text-xs font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
            </button>
          </div>

          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => setShowPairingGuide((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900 py-1 cursor-pointer"
            >
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Panduan Input di WhatsApp</span>
              </span>
              {showPairingGuide ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showPairingGuide && (
              <ol className="mt-2 space-y-1 list-decimal list-inside leading-relaxed text-slate-600 text-[11px] bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <li>Buka aplikasi WhatsApp di ponsel Anda.</li>
                <li>
                  Buka menu <strong className="text-slate-800">Perangkat Tertaut</strong> &gt;{' '}
                  <strong className="text-slate-800">Tautkan Perangkat</strong>.
                </li>
                <li>
                  Pilih <strong className="text-[#0084D1]">&quot;Tautkan dengan nomor telepon saja&quot;</strong>.
                </li>
                <li>Masukkan 8 karakter kode pairing di atas.</li>
              </ol>
            )}
          </div>
        </section>
      )}

      {/* 3. DI BAWAHNYA: KONEKSI LAYANAN (XAVIERA & LUNASQRIS) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Kiri: Xaviera Store API */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 text-[#0084D1] flex items-center justify-center shrink-0">
                  <Server className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate">
                    Xaviera Store API
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">
                    Katalog akun premium, SMM, dan top up.
                  </p>
                </div>
              </div>

              <span
                className={`text-[11px] font-semibold whitespace-nowrap shrink-0 ${
                  isXavieraConnected ? 'text-emerald-700' : 'text-slate-400'
                }`}
              >
                {isXavieraConnected ? 'Terhubung' : 'Belum Terisi'}
              </span>
            </div>

            <div className="space-y-3.5">
              {/* API Key Xaviera */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                  <span>API Key Xaviera</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex rounded-xl border border-slate-300 focus-within:border-[#0084D1] focus-within:ring-2 focus-within:ring-[#0084D1]/20 transition bg-white overflow-hidden">
                  <div className="bg-slate-50 px-3 py-2 flex items-center text-slate-400 border-r border-slate-200">
                    <KeyRound className="w-4 h-4 text-[#0084D1]" />
                  </div>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={localXavieraKey}
                    onChange={(e) => setLocalXavieraKey(e.target.value)}
                    placeholder="xvs_..."
                    className="w-full px-3 py-2 text-xs font-mono font-medium text-slate-900 placeholder-slate-400 focus:outline-none min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="px-3 text-slate-400 hover:text-slate-600 transition flex items-center justify-center cursor-pointer"
                    title={showApiKey ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Base URL Xaviera */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-800">
                    Base URL
                  </label>
                  {localXavieraBaseUrl !== 'https://xavierastore.com/api/v1' && (
                    <button
                      type="button"
                      onClick={() => {
                        setLocalXavieraBaseUrl('https://xavierastore.com/api/v1');
                        showToast('Base URL Xaviera direset ke default');
                      }}
                      className="text-[11px] text-[#0084D1] hover:underline cursor-pointer font-medium whitespace-nowrap"
                    >
                      Reset Default
                    </button>
                  )}
                </div>
                <div className="relative flex rounded-xl border border-slate-300 focus-within:border-[#0084D1] focus-within:ring-2 focus-within:ring-[#0084D1]/20 transition bg-white overflow-hidden">
                  <div className="bg-slate-50 px-3 py-2 flex items-center text-slate-500 border-r border-slate-200 text-xs font-mono select-none">
                    URL
                  </div>
                  <input
                    type="text"
                    value={localXavieraBaseUrl}
                    onChange={(e) => setLocalXavieraBaseUrl(e.target.value)}
                    placeholder="https://xavierastore.com/api/v1"
                    className="w-full px-3 py-2 text-xs font-mono font-medium text-slate-900 placeholder-slate-400 focus:outline-none min-w-0"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              disabled={savingXaviera || isSavingConfig}
              onClick={handleSaveXaviera}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0084D1] hover:bg-[#0073B7] text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {savingXaviera || isSavingConfig ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Simpan Xaviera</span>
            </button>
          </div>
        </div>

        {/* Kanan: LunasQRIS Payment Gateway */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <QrCode className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate">
                    LunasQRIS Payment Gateway
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">
                    QRIS otomatis dan verifikasi mutasi instan.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCheckLunasBalance}
                  disabled={lunasBalance.loading || !localLunasKey?.trim()}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                    localLunasKey?.trim()
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {lunasBalance.loading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wallet className="w-3.5 h-3.5" />
                  )}
                  <span>Cek Saldo</span>
                </button>

                <span
                  className={`text-[11px] font-semibold whitespace-nowrap ${
                    isLunasConnected ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {isLunasConnected ? 'Terhubung' : 'Belum Terisi'}
                </span>
              </div>
            </div>

            {lunasBalance.checked && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                  lunasBalance.error
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    {lunasBalance.error
                      ? lunasBalance.error
                      : `Hold: Rp ${Number(lunasBalance.balanceHold || 0).toLocaleString('id-ID')}`}
                  </span>
                </div>
                {!lunasBalance.error && (
                  <span className="font-mono tabular-nums font-bold text-sm text-emerald-900 shrink-0">
                    Rp {Number(lunasBalance.balance || 0).toLocaleString('id-ID')}
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Public Key */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                  <span>Public API Key</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex rounded-xl border border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20 transition bg-white overflow-hidden">
                  <div className="bg-slate-50 px-2.5 py-2 flex items-center text-slate-400 border-r border-slate-200">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <input
                    type={showLunasKey ? 'text' : 'password'}
                    value={localLunasKey}
                    onChange={(e) => setLocalLunasKey(e.target.value)}
                    placeholder="pk_live_..."
                    className="w-full px-2.5 py-2 text-xs font-mono font-medium text-slate-900 placeholder-slate-400 focus:outline-none min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLunasKey(!showLunasKey)}
                    className="px-2.5 text-slate-400 hover:text-slate-600 transition flex items-center justify-center cursor-pointer"
                    title={showLunasKey ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showLunasKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Secret Key */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                  <span>Secret Key</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex rounded-xl border border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20 transition bg-white overflow-hidden">
                  <div className="bg-slate-50 px-2.5 py-2 flex items-center text-slate-400 border-r border-slate-200">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <input
                    type={showLunasSecret ? 'text' : 'password'}
                    value={localLunasSecret}
                    onChange={(e) => setLocalLunasSecret(e.target.value)}
                    placeholder="sk_live_..."
                    className="w-full px-2.5 py-2 text-xs font-mono font-medium text-slate-900 placeholder-slate-400 focus:outline-none min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLunasSecret(!showLunasSecret)}
                    className="px-2.5 text-slate-400 hover:text-slate-600 transition flex items-center justify-center cursor-pointer"
                    title={showLunasSecret ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showLunasSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Base URL LunasQRIS */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-800">
                  Base URL LunasQRIS
                </label>
                {localLunasBaseUrl !== 'https://lunasqris.com' && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalLunasBaseUrl('https://lunasqris.com');
                      showToast('Base URL LunasQRIS direset ke default');
                    }}
                    className="text-[11px] text-emerald-700 hover:underline cursor-pointer font-medium whitespace-nowrap"
                  >
                    Reset Default
                  </button>
                )}
              </div>
              <div className="relative flex rounded-xl border border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20 transition bg-white overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 flex items-center text-slate-500 border-r border-slate-200 text-xs font-mono select-none">
                  URL
                </div>
                <input
                  type="text"
                  value={localLunasBaseUrl}
                  onChange={(e) => setLocalLunasBaseUrl(e.target.value)}
                  placeholder="https://lunasqris.com"
                  className="w-full px-3 py-2 text-xs font-mono font-medium text-slate-900 placeholder-slate-400 focus:outline-none min-w-0"
                />
              </div>
            </div>

            {/* Webhook Endpoint */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>Webhook Callback URL</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 select-all overflow-x-auto whitespace-nowrap">
                  {webhookUrl}
                </div>
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="px-3.5 py-2 bg-[#0084D1] hover:bg-[#0073B7] text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  {copiedWebhook ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              disabled={savingLunas || isSavingConfig}
              onClick={handleSaveLunasQris}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0084D1] hover:bg-[#0073B7] text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {savingLunas || isSavingConfig ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Simpan LunasQRIS</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. DI BAGIAN BAWAH: TELEGRAM */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-[#0084D1] border border-sky-100 shrink-0">
              <Send className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                Notifikasi Bot Telegram
              </h3>
              <p className="text-[11px] text-slate-500 truncate">
                Notifikasi transaksi lunas &amp; batal via Telegram.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={telegramConfig.notifEnabled}
              onChange={(e) => setTelegramConfig({ ...telegramConfig, notifEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0084D1]" />
          </label>
        </div>

        {telegramConfig.adminDisabled && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>Notifikasi Telegram sedang dinonaktifkan oleh Master Admin.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800 flex items-center justify-between gap-2">
              <span>Bot Token Telegram</span>
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-[#0084D1] hover:underline inline-flex items-center gap-0.5 shrink-0"
              >
                @BotFather <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </label>
            <div className="flex rounded-xl border border-slate-300 focus-within:border-[#0084D1] focus-within:ring-2 focus-within:ring-[#0084D1]/20 transition bg-white overflow-hidden">
              <input
                type={showBotToken ? 'text' : 'password'}
                value={telegramConfig.botToken}
                onChange={(e) => setTelegramConfig({ ...telegramConfig, botToken: e.target.value })}
                placeholder="123456789:ABCdef..."
                className="w-full px-3 py-2.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none min-w-0"
              />
              <button
                type="button"
                onClick={() => setShowBotToken(!showBotToken)}
                className="px-3 text-slate-400 hover:text-slate-600 transition cursor-pointer shrink-0"
              >
                {showBotToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800 flex items-center justify-between gap-2">
              <span>Telegram Chat ID</span>
              <a
                href="https://t.me/userinfobot"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-[#0084D1] hover:underline inline-flex items-center gap-0.5 shrink-0"
              >
                @userinfobot <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </label>
            <input
              type="text"
              value={telegramConfig.chatId}
              onChange={(e) => setTelegramConfig({ ...telegramConfig, chatId: e.target.value })}
              placeholder="Contoh: 123456789 atau -100..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:border-[#0084D1] focus:ring-2 focus:ring-[#0084D1]/20 focus:outline-none transition"
            />
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowTelegramGuide((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-[#0084D1]" />
            <span>Cara Setup Telegram</span>
            {showTelegramGuide ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {showTelegramGuide && (
            <ol className="mt-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl list-decimal list-inside space-y-1 text-[11px] text-slate-600">
              <li>Buat bot lewat @BotFather (<code className="bg-slate-200 px-1 rounded">/newbot</code>) lalu tempel tokennya.</li>
              <li>Kirim <code className="bg-slate-200 px-1 rounded">/start</code> ke bot Anda, lalu cek Chat ID via @userinfobot.</li>
              <li>Klik Tes Kirim Notifikasi sebelum mengaktifkan toggle.</li>
            </ol>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            disabled={isTestingTelegram || !telegramConfig.botToken || !telegramConfig.chatId}
            onClick={handleTestTelegram}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
          >
            {isTestingTelegram ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 text-[#0084D1]" />
            )}
            <span>Tes Kirim Notifikasi</span>
          </button>

          <button
            type="button"
            disabled={isSavingTelegram}
            onClick={handleSaveTelegram}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#0084D1] hover:bg-[#0073B7] text-white text-xs font-semibold transition disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
          >
            {isSavingTelegram ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Simpan Telegram</span>
          </button>
        </div>
      </section>

      {/* 5. DI BAGIAN PALING BAWAH: TERMINAL */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#0084D1]" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
              Live Socket Terminal
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Baileys Log
          </span>
        </div>
        <LiveTerminal logs={botData.logs} status={botData.status} />
      </section>
    </div>
  );
};
