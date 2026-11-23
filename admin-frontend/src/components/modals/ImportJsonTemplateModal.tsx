import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  FileJson,
  Upload,
  AlertCircle,
  AlertTriangle,
  Check,
  Lock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { TemplateCategory, WhatsAppButton } from '../../types/admin.types.ts';
import {
  ALL_IMPORTABLE_CATEGORIES,
  buildSampleMultiCategoryJson,
  mergeMandatoryButtonsForCategory,
} from '../../utils/templateButtons.ts';

interface ImportJsonTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (payload: {
    jsonText: string;
    mode: 'append' | 'replace_category';
  }) => Promise<{
    success: boolean;
    importedCount?: number;
    warnings?: string[];
    error?: string;
  }>;
}

interface ParsedPreviewItem {
  category: TemplateCategory;
  name: string;
  content: string;
  footer_text: string;
  buttons: WhatsAppButton[];
  warnings: string[];
}

export const ImportJsonTemplateModal: React.FC<ImportJsonTemplateModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [jsonText, setJsonText] = useState<string>(() => buildSampleMultiCategoryJson());
  const [mode, setMode] = useState<'append' | 'replace_category'>('append');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const parsedResult = useMemo<{
    items: ParsedPreviewItem[];
    error: string | null;
    warnings: string[];
  }>(() => {
    const raw = jsonText.trim();
    if (!raw) {
      return { items: [], error: 'Silakan tempel atau unggah JSON paket template.', warnings: [] };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err: any) {
      return {
        items: [],
        error: `Syntax JSON tidak valid: ${err?.message || 'Periksa koma atau tanda kutip'}`,
        warnings: [],
      };
    }

    const items: ParsedPreviewItem[] = [];
    const warnings: string[] = [];

    const parseEntry = (rawCat: string, entry: any, label: string) => {
      if (!entry || typeof entry !== 'object') {
        throw new Error(`Isi ${label} harus berupa objek JSON.`);
      }
      const normalizedCat = (
        rawCat === 'confirmation' ? 'confirm_summary' : rawCat
      ).trim() as TemplateCategory;

      if (!ALL_IMPORTABLE_CATEGORIES.includes(normalizedCat)) {
        throw new Error(`Kategori "${rawCat}" pada ${label} tidak valid.`);
      }

      const content = typeof entry.content === 'string' ? entry.content.trim() : '';
      if (!content) {
        throw new Error(`Field "content" pada kategori "${normalizedCat}" wajib diisi.`);
      }

      const rawButtons: WhatsAppButton[] = Array.isArray(entry.buttons) ? entry.buttons : [];
      const itemWarnings: string[] = [];

      for (const rb of rawButtons) {
        if (rb && typeof rb === 'object' && rb.mandatoryRole) {
          const checkMerged = mergeMandatoryButtonsForCategory(normalizedCat, [rb as WhatsAppButton]);
          const official = checkMerged.find((m) => m.mandatoryRole === rb.mandatoryRole);
          if (
            official &&
            ((rb.type && rb.type !== official.type) ||
              (rb.output && String(rb.output).trim() !== official.output))
          ) {
            const msg = `[${normalizedCat}] Tombol wajib "${rb.mandatoryRole}" dikunci sistem ke tipe "${official.type}" (${official.output}); hanya nama "${rb.name || official.name}" yang dipakai.`;
            itemWarnings.push(msg);
            warnings.push(msg);
          }
        }
      }

      const mergedButtons = mergeMandatoryButtonsForCategory(normalizedCat, rawButtons);
      items.push({
        category: normalizedCat,
        name:
          typeof entry.name === 'string' && entry.name.trim()
            ? entry.name.trim()
            : `Paket ${normalizedCat}`,
        content,
        footer_text: typeof entry.footer_text === 'string' ? entry.footer_text.trim() : '',
        buttons: mergedButtons,
        warnings: itemWarnings,
      });
    };

    try {
      if (Array.isArray(parsed)) {
        parsed.forEach((item, idx) => {
          const cat = String(item?.category || '').trim();
          if (!cat) {
            throw new Error(`Item indeks #${idx + 1} wajib memiliki field "category".`);
          }
          parseEntry(cat, item, `item #${idx + 1}`);
        });
      } else if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, any>;
        if (typeof obj.category === 'string' && typeof obj.content === 'string') {
          parseEntry(obj.category, obj, `kategori "${obj.category}"`);
        } else {
          for (const [key, val] of Object.entries(obj)) {
            if (Array.isArray(val)) {
              val.forEach((sub, idx) => parseEntry(key, sub, `kategori "${key}" #${idx + 1}`));
            } else {
              parseEntry(key, val, `kategori "${key}"`);
            }
          }
        }
      } else {
        return { items: [], error: 'Root JSON harus berupa objek kategori atau array.', warnings: [] };
      }

      if (items.length === 0) {
        return { items: [], error: 'Tidak ada paket template ditemukan di dalam JSON.', warnings: [] };
      }
      return { items, error: null, warnings };
    } catch (err: any) {
      return {
        items: [],
        error: err?.message || 'Struktur JSON tidak sesuai.',
        warnings: [],
      };
    }
  }, [jsonText]);

  if (!isOpen) return null;

  const handleLoadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setJsonText(reader.result);
        setSubmitError(null);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = async () => {
    if (parsedResult.error || parsedResult.items.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await onImport({ jsonText, mode });
      if (res.success) {
        onClose();
      } else {
        setSubmitError(res.error || 'Gagal mengimpor paket template.');
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Terjadi kesalahan saat mengimpor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 text-[#0084D1] flex items-center justify-center">
              <FileJson className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Import Paket Template via JSON (Multi-Kategori)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tempel atau unggah file JSON (setiap kategori dipisah baris kosong / Enter) untuk membuat banyak template sekaligus.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Mode & Helper Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-700">Mode Import:</span>
              <button
                type="button"
                onClick={() => setMode('append')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                  mode === 'append'
                    ? 'bg-[#0084D1] text-white border-[#0084D1]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Tambahkan Baru (Simpan Lama)
              </button>
              <button
                type="button"
                onClick={() => setMode('replace_category')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                  mode === 'replace_category'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Timpa Kategori Sama
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleLoadFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => {
                  setJsonText(buildSampleMultiCategoryJson());
                  setSubmitError(null);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-sky-50 text-slate-700 hover:text-[#0084D1] border border-slate-200 text-[11px] font-semibold transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0084D1]" />
                <span>Contoh 19 Kategori</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Pilih File .json</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Editor JSON */}
            <div className="space-y-2 flex flex-col">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800">
                  Isi JSON Paket Template
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {jsonText.split('\n').length} baris
                </span>
              </div>
              <textarea
                rows={16}
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  setSubmitError(null);
                }}
                spellCheck={false}
                placeholder='{\n  "menu": { ... },\n\n  "list": { ... }\n}'
                className="w-full flex-1 p-3 text-[11px] font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-[#0084D1] focus:ring-1 focus:ring-[#0084D1] transition leading-relaxed"
              />
            </div>

            {/* Live Preview Hasil Parsing & Normalisasi Tombol Wajib */}
            <div className="space-y-2 flex flex-col">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800">
                  Pratinjau &amp; Validasi ({parsedResult.items.length} kategori siap import)
                </label>
                {!parsedResult.error && parsedResult.items.length > 0 && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    JSON Valid
                  </span>
                )}
              </div>

              {parsedResult.error ? (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{parsedResult.error}</span>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {parsedResult.warnings.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Normalisasi Tombol Wajib Otomatis:</span>
                      </div>
                      {parsedResult.warnings.map((w, i) => (
                        <p key={i} className="leading-relaxed">
                          {w}
                        </p>
                      ))}
                    </div>
                  )}

                  {parsedResult.items.map((item, idx) => (
                    <div
                      key={`${item.category}-${idx}`}
                      className="p-3 bg-slate-50/70 border border-slate-200/90 rounded-xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-[#0084D1] border border-sky-200 shrink-0">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-slate-600 line-clamp-2 whitespace-pre-wrap">
                        {item.content}
                      </p>
                      {item.footer_text && (
                        <p className="text-[10px] font-mono text-slate-500 truncate">
                          Footer: {item.footer_text}
                        </p>
                      )}
                      {item.buttons.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {item.buttons.map((b) => (
                            <span
                              key={b.id}
                              className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${
                                b.mandatory
                                  ? 'bg-amber-50 text-amber-800 border-amber-200 font-semibold'
                                  : 'bg-white text-slate-700 border-slate-200'
                              }`}
                            >
                              {b.mandatory && <Lock className="w-2.5 h-2.5 text-amber-600" />}
                              <span>{b.name}</span>
                              <span className="font-mono text-slate-400">({b.type})</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-slate-500">
            Tombol wajib sistem otomatis dipertahankan &amp; dinormalisasi saat disimpan.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={submitting || Boolean(parsedResult.error) || parsedResult.items.length === 0}
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0084D1] hover:bg-[#0073B7] rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengimpor...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Import {parsedResult.items.length} Paket</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
