import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  Code2,
  Compass,
  Copy,
  Download,
  FileJson,
  Terminal,
} from 'lucide-react';
import { buildPublicSample28CategoryJson, DocsSectionTab } from './docsData';
import { TenantCommandsGuideSection, TenantDashboardGuideSection } from './DocsTenantSections';
import { DocsJsonSection } from './DocsJsonSection';
import { DocsPartnerApiSection } from './DocsPartnerApiSection';

export type { DocsSectionTab } from './docsData';

interface PublicDocumentationPageProps {
  variant?: 'tenant' | 'admin';
}

function getInitialDocsTab(allowPartnerApiDocs: boolean): DocsSectionTab {
  const defaultTab: DocsSectionTab = allowPartnerApiDocs ? 'api' : 'guide';
  if (typeof window === 'undefined') return defaultTab;

  try {
    const params = new URLSearchParams(window.location.search);
    const param = (params.get('tab') || params.get('section') || '').trim().toLowerCase();
    if (param === 'api' && allowPartnerApiDocs) return 'api';
    if (param === 'json') return 'json';
    if (param === 'commands' || param === 'command') return 'commands';
    if (param === 'guide' || param === 'panduan') return 'guide';
  } catch {}

  return defaultTab;
}

function resolvePartnerApiBaseUrl(variant: 'tenant' | 'admin') {
  const viteEnv =
    (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};
  const configuredPartnerBase = (viteEnv.VITE_PARTNER_API_BASE_URL || '').trim().replace(/\/+$/, '');

  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin.replace(/\/+$/, '')
      : variant === 'admin'
      ? 'https://admin.testbot.web.id'
      : 'https://testbot.web.id';

  return configuredPartnerBase || origin;
}

export const PublicDocumentationPage: React.FC<PublicDocumentationPageProps> = ({
  variant = 'tenant',
}) => {
  const allowPartnerApiDocs = variant === 'admin';
  const [subTab, setSubTabState] = useState<DocsSectionTab>(() =>
    getInitialDocsTab(allowPartnerApiDocs),
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const setSubTab = (next: DocsSectionTab) => {
    const safeNext: DocsSectionTab =
      !allowPartnerApiDocs && next === 'api' ? 'guide' : next;
    setSubTabState(safeNext);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', safeNext);
        url.searchParams.delete('section');
        url.hash = '';
        window.history.replaceState({}, '', `${url.pathname}${url.search}`);
      } catch {}
    }
  };

  useEffect(() => {
    if (!allowPartnerApiDocs && subTab === 'api') {
      setSubTabState('guide');
    }
    const onPopState = () => {
      setSubTabState(getInitialDocsTab(allowPartnerApiDocs));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [allowPartnerApiDocs, subTab]);

  const baseUrl = useMemo(() => resolvePartnerApiBaseUrl(variant), [variant]);

  const dashboardHref = useMemo(() => {
    if (typeof window === 'undefined') return '/';
    if (variant === 'admin' && window.location.pathname.startsWith('/admin/')) {
      return '/admin/';
    }
    return '/';
  }, [variant]);

  const handleCopy = (id: string, text: string, notice: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    showToast(notice);
    window.setTimeout(() => {
      setCopiedKey((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  const handleDownloadFullSampleJson = () => {
    const sampleJson = buildPublicSample28CategoryJson();
    const blob = new Blob([sampleJson], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'contoh-template-pesan-28-kategori.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast('Contoh file JSON 28 kategori berhasil diunduh.');
  };

  const tabOptions: {
    id: DocsSectionTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = allowPartnerApiDocs
    ? [
        { id: 'api', label: 'REST API Partner', icon: Code2 },
        { id: 'json', label: 'JSON Template (28 Kategori)', icon: FileJson },
        { id: 'commands', label: 'Command WA & Telegram', icon: Terminal },
        { id: 'guide', label: 'Panduan Dashboard Tenant', icon: Compass },
      ]
    : [
        { id: 'guide', label: 'Panduan Dashboard & Bot', icon: Compass },
        { id: 'commands', label: 'Command WA & Telegram', icon: Terminal },
        { id: 'json', label: 'Template Pesan (28 Kategori)', icon: FileJson },
      ];

  const headerMeta = useMemo(() => {
    switch (subTab) {
      case 'api':
        return {
          title: 'Dokumentasi REST API Partner & Reseller',
          subtitle:
            'Panduan lengkap integrasi server-to-server untuk membuat akun bot WhatsApp tenant dan mencetak token perpanjangan otomatis menggunakan API Key Partner.',
          stats: '2 endpoint POST · 60 req/menit · Admin Host',
        };
      case 'json':
        return {
          title: 'Dokumentasi Template Pesan Bot (28 Kategori & Format JSON)',
          subtitle:
            'Penjelasan lengkap cara kustomisasi respon bot di dashboard, format teks & mention WhatsApp, kamus placeholder dinamis, tombol wajib checkout, dan 28 kategori respon.',
          stats: '28 kategori · 7 tipe tombol · 6 peran wajib',
        };
      case 'commands':
        return {
          title: 'Daftar Command Bot WhatsApp, Moderasi Grup, & Telegram',
          subtitle:
            'Panduan lengkap 8 prefix resmi, command katalog pembeli, command admin grup (.hidetag, Kick + AntiKudeta, Open & Close), serta setup notifikasi Bot Telegram.',
          stats: '8 prefix resmi · 4 command grup admin · Telegram notif',
        };
      case 'guide':
      default:
        return {
          title: 'Panduan Lengkap Penggunaan Dashboard & Bot Toko',
          subtitle:
            'Langkah demi langkah dari login pertama, koneksi WhatsApp Pairing Code, integrasi Xaviera & LunasQRIS, whitelist grup, pengaturan profit, hingga alur transaksi pelanggan.',
          stats: '5 langkah setup · 10 menu dashboard · Alur QRIS otomatis',
        };
    }
  }, [subTab]);

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] text-slate-800 font-sans antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-lg flex items-center gap-2"
        >
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 3-Zone Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 h-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-6">
          {/* Zone 1: Brand Wordmark */}
          <a
            href={dashboardHref}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0084D1] text-white flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap shrink-0">
              {allowPartnerApiDocs ? 'Dokumentasi Partner' : 'Dokumentasi Tenant'}
            </span>
          </a>

          {/* Zone 2: Concise Anchor Nav Links */}
          <nav
            aria-label="Navigasi Bagian Dokumentasi"
            className="hidden md:flex items-center gap-6 min-w-0"
          >
            {subTab === 'guide' && (
              <>
                <a
                  href="#guide-quickstart"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0 transition-colors"
                >
                  Setup Awal
                </a>
                <a
                  href="#guide-menus"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0 transition-colors"
                >
                  Menu Dashboard
                </a>
                <a
                  href="#guide-checkout"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0 transition-colors"
                >
                  Alur Transaksi
                </a>
              </>
            )}
            {subTab === 'commands' && (
              <>
                <a
                  href="#cmd-prefix"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0 transition-colors"
                >
                  Prefix Resmi
                </a>
                <a
                  href="#cmd-customer"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0 transition-colors"
                >
                  Command Pembeli
                </a>
                <a
                  href="#cmd-group-admin"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0 transition-colors"
                >
                  Moderasi Grup
                </a>
                <a
                  href="#cmd-telegram"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0 transition-colors"
                >
                  Bot Telegram
                </a>
              </>
            )}
            {subTab === 'json' && (
              <>
                <a
                  href="#json-placeholder"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0 transition-colors"
                >
                  Placeholder
                </a>
                <a
                  href="#json-kategori"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0 transition-colors"
                >
                  28 Kategori
                </a>
                <a
                  href="#json-contoh"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0 transition-colors"
                >
                  Contoh JSON
                </a>
              </>
            )}
            {subTab === 'api' && allowPartnerApiDocs && (
              <>
                <a
                  href="#api-endpoint"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0 transition-colors"
                >
                  Endpoint
                </a>
                <a
                  href="#api-workflow"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0 transition-colors"
                >
                  Alur Webhook
                </a>
                <a
                  href="#api-errors"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0 transition-colors"
                >
                  Kode Error
                </a>
              </>
            )}
          </nav>

          {/* Zone 3: Single Primary Action */}
          <a
            href={dashboardHref}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0084D1] hover:bg-[#0073B7] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <span>Buka Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Main Documentation Body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Page Header & Tab Switcher */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight max-w-3xl">
                {headerMeta.title}
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                {headerMeta.subtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {subTab === 'json' && (
                <button
                  type="button"
                  onClick={handleDownloadFullSampleJson}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#0084D1]" />
                  <span>Unduh Contoh 28 Kategori (.json)</span>
                </button>
              )}
              {subTab === 'api' && allowPartnerApiDocs && (
                <button
                  type="button"
                  onClick={() =>
                    handleCopy('base-url-copy', baseUrl, 'Base URL berhasil disalin.')
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedKey === 'base-url-copy' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#0084D1]" />
                  )}
                  <span>Salin Base URL</span>
                </button>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label="Pilih Bagian Dokumentasi"
              className="inline-flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-xl w-full lg:w-fit overflow-x-auto scrollbar-none"
            >
              {tabOptions.map((tab) => {
                const Icon = tab.icon;
                const isActive = subTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSubTab(tab.id)}
                    className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap">
              {headerMeta.stats}
            </p>
          </div>
        </div>

        {/* Section Content */}
        {subTab === 'guide' && <TenantDashboardGuideSection onNavigateTab={setSubTab} />}

        {subTab === 'commands' && <TenantCommandsGuideSection onNavigateTab={setSubTab} />}

        {subTab === 'json' && (
          <DocsJsonSection
            isAdminVariant={allowPartnerApiDocs}
            copiedKey={copiedKey}
            onCopy={handleCopy}
            onDownloadSampleJson={handleDownloadFullSampleJson}
          />
        )}

        {subTab === 'api' && allowPartnerApiDocs && (
          <DocsPartnerApiSection
            baseUrl={baseUrl}
            copiedKey={copiedKey}
            onCopy={handleCopy}
          />
        )}
      </main>
    </div>
  );
};
