import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Check,
  Copy,
  AlertTriangle,
  RefreshCw,
  LayoutTemplate,
  Lock,
} from 'lucide-react';
import { WhatsAppButton } from '../../types/dashboard.types';

export type BotCommandCategory =
  | 'menu'
  | 'list'
  | 'carousel'
  | 'invoice'
  | 'confirm_summary'
  | 'confirm_promo_input'
  | 'confirm_promo_valid'
  | 'confirm_promo_invalid'
  | 'confirmation'
  | 'payment_success_dm'
  | 'payment_success_group'
  | 'payment_expired'
  | 'payment_error'
  | 'order_group_notif'
  | 'stock_empty'
  | 'checkout_session_expired'
  | 'promo_cancelled'
  | 'contact_owner_empty'
  | 'contact_admin_empty'
  | 'expiry_warning_owner'
  | 'kick_anti_kudeta'
  | 'kick_bot_not_admin'
  | 'kick_success'
  | 'open_bot_not_admin'
  | 'open_already'
  | 'open_success'
  | 'close_bot_not_admin'
  | 'close_already'
  | 'close_success';

export interface TemplatePackageResult {
  content: string;
  footer_text?: string;
  buttons?: WhatsAppButton[];
}

interface TemplateItem {
  id: number;
  name: string;
  category: BotCommandCategory;
  content: string;
  footer_text?: string;
  buttons?: WhatsAppButton[];
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: BotCommandCategory;
  categoryLabel: string;
  currentContent?: string;
  onSelectTemplate: (template: TemplatePackageResult) => void;
  showToast?: (msg: string) => void;
}

export const TemplatePickerModal: React.FC<TemplatePickerModalProps> = ({
  isOpen,
  onClose,
  category,
  categoryLabel,
  onSelectTemplate,
  showToast,
}) => {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [confirmOverwriteTemplate, setConfirmOverwriteTemplate] = useState<TemplateItem | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bot/templates?category=${encodeURIComponent(category)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.templates)) {
        setTemplates(data.templates);
      } else {
        setError(data.error || 'Gagal memuat template.');
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      setConfirmOverwriteTemplate(null);
    }
  }, [isOpen, category]);

  if (!isOpen) return null;

  // Selalu tampilkan popup konfirmasi sebelum menerapkan paket template (Pesan + Footer + Tombol)
  const handleRequestApplyTemplate = (template: TemplateItem) => {
    setConfirmOverwriteTemplate(template);
  };

  const handleConfirmOverwrite = () => {
    if (confirmOverwriteTemplate) {
      onSelectTemplate({
        content: confirmOverwriteTemplate.content,
        footer_text: confirmOverwriteTemplate.footer_text,
        buttons: Array.isArray(confirmOverwriteTemplate.buttons)
          ? confirmOverwriteTemplate.buttons
          : [],
      });
      if (showToast) {
        showToast(`Paket template "${confirmOverwriteTemplate.name}" berhasil diterapkan!`);
      }
      setConfirmOverwriteTemplate(null);
      onClose();
    }
  };

  const handleCopyText = (template: TemplateItem, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(template.content);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 text-[#0084D1] flex items-center justify-center">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Pilih Paket Template {categoryLabel}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Paket siap pakai (teks pesan, footer &amp; tombol) khusus{' '}
                <span className="font-semibold text-[#0084D1]">{categoryLabel}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchTemplates}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-[#0084D1] hover:bg-sky-50 rounded-lg transition cursor-pointer"
              title="Refresh Template"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Popup Konfirmasi Sederhana Sebelum Mengganti Paket Template */}
        {confirmOverwriteTemplate && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-start gap-3 shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-amber-900">
                Konfirmasi Terapkan Paket Template {categoryLabel}
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                Menerapkan paket <span className="font-semibold">"{confirmOverwriteTemplate.name}"</span> akan
                mengganti Teks Pesan, Teks Footer, dan daftar Tombol Kustom Anda saat ini (tombol wajib sistem tetap terjaga). Lanjutkan?
              </p>
              <div className="flex items-center gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={handleConfirmOverwrite}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                >
                  Ya, Ganti Sekarang
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmOverwriteTemplate(null)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-800 text-xs font-semibold hover:bg-amber-100/50 transition cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Template List */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="h-16 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0084D1] flex items-center justify-center mx-auto mb-3">
                <LayoutTemplate className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Belum Ada Template untuk Kategori Ini
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Admin Utama belum menambahkan template aktif khusus fungsi {categoryLabel}. Anda tetap dapat menyusun teks secara manual pada form.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {templates.map((tpl) => {
                const tplButtons = Array.isArray(tpl.buttons) ? tpl.buttons : [];
                return (
                  <div
                    key={tpl.id}
                    className="bg-white border border-slate-200/90 hover:border-sky-300 rounded-2xl p-4 transition-all shadow-2xs flex flex-col justify-between group space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Sparkles className="w-4 h-4 text-[#0084D1] shrink-0" />
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {tpl.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleCopyText(tpl, e)}
                          className="p-1.5 text-slate-400 hover:text-[#0084D1] hover:bg-sky-50 rounded-lg transition cursor-pointer"
                          title="Salin teks template"
                        >
                          {copiedId === tpl.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRequestApplyTemplate(tpl)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-[#0084D1] text-[#0084D1] hover:text-white border border-sky-200 hover:border-transparent text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Gunakan</span>
                        </button>
                      </div>
                    </div>

                    {/* Preview Monospace Pesan */}
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                      {tpl.content}
                    </div>

                    {/* Preview Footer & Tombol Paket */}
                    {(tpl.footer_text || tplButtons.length > 0) && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        {tpl.footer_text && (
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-600">Footer:</span>
                            <span className="font-mono text-slate-700 truncate">{tpl.footer_text}</span>
                          </div>
                        )}
                        {tplButtons.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-slate-600 mr-0.5">
                              Tombol ({tplButtons.length}):
                            </span>
                            {tplButtons.map((b, i) => (
                              <span
                                key={b.id || i}
                                className={`inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-md border ${
                                  b.mandatory
                                    ? 'bg-amber-50 text-amber-800 border-amber-200 font-semibold'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 font-medium'
                                }`}
                              >
                                {b.mandatory && <Lock className="w-2.5 h-2.5 text-amber-600 shrink-0" />}
                                <span className="truncate max-w-[160px]">{b.name}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            {templates.length} paket template {categoryLabel} tersedia
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 font-semibold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
