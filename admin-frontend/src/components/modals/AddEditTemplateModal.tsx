import React, { useState, useEffect } from 'react';
import {
  X,
  LayoutTemplate,
  Sparkles,
  Check,
  AlertCircle,
  Lock,
  Plus,
  Edit2,
  Trash2,
  MousePointerClick,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  MessageTemplate,
  TemplateCategory,
  WhatsAppButton,
  WhatsAppButtonType,
  QuickReplyTriggerAction,
} from '../../types/admin.types.ts';
import {
  getDefaultButtonsForCategory,
  mergeMandatoryButtonsForCategory,
  getSuggestedFooterForCategory,
} from '../../utils/templateButtons.ts';

interface AddEditTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (templateData: {
    id?: number;
    name: string;
    category: TemplateCategory;
    content: string;
    footer_text?: string;
    buttons?: WhatsAppButton[];
    is_active: number;
  }) => Promise<{ success: boolean; error?: string }>;
  templateToEdit?: MessageTemplate | null;
}

const CATEGORY_OPTIONS: { id: TemplateCategory; label: string; desc: string }[] = [
  { id: 'menu', label: 'Command Menu', desc: 'Respon menu awal / list opsi perintah bot' },
  { id: 'list', label: 'Command List', desc: 'Respon katalog daftar menu produk / varian' },
  { id: 'carousel', label: 'Command Carousel', desc: 'Respon kartu slide produk unggulan' },
  { id: 'invoice', label: 'Invoice Pembayaran', desc: 'Format rincian tagihan QRIS otomatis' },
  { id: 'confirm_summary', label: 'Konfirmasi: Ringkasan Order', desc: 'Format pesan order summary awal di DM pembeli' },
  { id: 'confirm_promo_input', label: 'Konfirmasi: Input Promo', desc: 'Format instruksi saat pembeli klik pakai kupon promo' },
  { id: 'confirm_promo_valid', label: 'Konfirmasi: Promo Valid', desc: 'Format notifikasi diskon saat kupon promo berhasil' },
  { id: 'confirm_promo_invalid', label: 'Konfirmasi: Promo Invalid', desc: 'Format penolakan kupon saat kupon promo ditolak' },
  { id: 'payment_success_dm', label: 'Transaksi: Lunas (DM)', desc: 'Pesan lunas otomatis dikirim ke DM pembeli' },
  { id: 'payment_success_group', label: 'Transaksi: Lunas (Grup)', desc: 'Pengumuman lunas di grup transaksi WhatsApp' },
  { id: 'payment_expired', label: 'Transaksi: Kedaluwarsa', desc: 'Notifikasi invoice QRIS habis waktu pembayaran' },
  { id: 'payment_error', label: 'Transaksi: Kendala Gateway', desc: 'Pesan saat pembuatan QRIS gateway error' },
  { id: 'order_group_notif', label: 'Notifikasi: Alur Order Grup', desc: 'Petunjuk ke pembeli saat checkout dimulai dari grup' },
  { id: 'stock_empty', label: 'Notifikasi: Stok Kosong', desc: 'Pemberitahuan stok produk habis / restock' },
  { id: 'checkout_session_expired', label: 'Notifikasi: Sesi Checkout Habis', desc: 'Peringatan sesi interaksi transaksi kedaluwarsa 3 menit' },
  { id: 'promo_cancelled', label: 'Notifikasi: Kupon Dibatalkan', desc: 'Konfirmasi pembeli membatalkan kupon via kata BATAL' },
  { id: 'contact_owner_empty', label: 'Kontak: Owner Belum Diatur', desc: 'Balasan bot saat kontak owner toko belum diatur' },
  { id: 'contact_admin_empty', label: 'Kontak: Admin Belum Diatur', desc: 'Balasan bot saat kontak CS/admin toko belum diatur' },
  { id: 'expiry_warning_owner', label: 'Peringatan: Masa Sewa Bot', desc: 'Notifikasi WhatsApp masa sewa bot tenant akan berakhir' },
  { id: 'kick_anti_kudeta', label: 'Grup: Kudeta Grup (AntiKudeta)', desc: 'Peringatan saat admin grup mencoba mengeluarkan Owner via command Kick' },
  { id: 'kick_bot_not_admin', label: 'Grup Kick: Bot Bukan Admin', desc: 'Balasan saat command Kick dipicu namun bot belum menjadi admin grup' },
  { id: 'kick_success', label: 'Grup Kick: Berhasil Mengeluarkan', desc: 'Konfirmasi setelah bot berhasil mengeluarkan anggota dari grup' },
  { id: 'open_bot_not_admin', label: 'Grup Open: Bot Bukan Admin', desc: 'Balasan saat command Open dipicu namun bot belum menjadi admin grup' },
  { id: 'open_already', label: 'Grup Open: Sudah Terbuka', desc: 'Informasi saat command Open dipicu padahal grup sudah terbuka' },
  { id: 'open_success', label: 'Grup Open: Berhasil Dibuka', desc: 'Konfirmasi setelah bot berhasil membuka grup untuk semua anggota' },
  { id: 'close_bot_not_admin', label: 'Grup Close: Bot Bukan Admin', desc: 'Balasan saat command Close dipicu namun bot belum menjadi admin grup' },
  { id: 'close_already', label: 'Grup Close: Sudah Ditutup', desc: 'Informasi saat command Close dipicu padahal grup sudah ditutup' },
  { id: 'close_success', label: 'Grup Close: Berhasil Ditutup', desc: 'Konfirmasi setelah bot berhasil menutup grup hanya untuk admin' },
];

const AVAILABLE_PLACEHOLDERS = [
  { tag: '{storeName}', desc: 'Nama Toko' },
  { tag: '{ownerName}', desc: 'Nama Owner' },
  { tag: '{ownerNumber}', desc: 'No. WA Owner' },
  { tag: '{adminName}', desc: 'Nama CS/Admin' },
  { tag: '{adminNumber}', desc: 'No. CS/Admin' },
  { tag: '{customerName}', desc: 'Nama Pembeli' },
  { tag: '{customerNumber}', desc: 'No. WA Pembeli' },
  { tag: '{pelakuNumber}', desc: 'No. WA Admin Pelaku (Mention)' },
  { tag: '{pelakuName}', desc: 'Nama Admin Pelaku' },
  { tag: '{targetNumber}', desc: 'No. WA Target Kick (Mention)' },
  { tag: '{targetName}', desc: 'Nama Target Kick' },
  { tag: '{groupName}', desc: 'Nama Grup WhatsApp' },
  { tag: '{orderId}', desc: 'ID Pesanan' },
  { tag: '{supplierOrderId}', desc: 'ID Order Supplier Xaviera' },
  { tag: '{credentials}', desc: 'Blok Kredensial Akun Lengkap (Email & Password)' },
  { tag: '{accountEmail}', desc: 'Email / Username Akun Hasil Order' },
  { tag: '{accountPassword}', desc: 'Password Akun Hasil Order' },
  { tag: '{totalPrice}', desc: 'Total Harga Lunas' },
  { tag: '{paymentMethod}', desc: 'Metode Bayar' },
  { tag: '{paymentUrl}', desc: 'Link Bayar LunasQRIS' },
  { tag: '{detailItems}', desc: 'Rincian Item' },
  { tag: '{paymentExpiry}', desc: 'Waktu Kadaluarsa' },
  { tag: '{produkName}', desc: 'Nama Produk' },
  { tag: '{varian}', desc: 'Varian Produk' },
  { tag: '{price}', desc: 'Harga Normal' },
  { tag: '{unikCode}', desc: 'Kode Unik QRIS' },
  { tag: '{promoCode}', desc: 'Kode Promo' },
  { tag: '{discount}', desc: 'Nominal Diskon' },
  { tag: '{finalPrice}', desc: 'Total Bayar Akhir' },
  { tag: '{reason}', desc: 'Penyebab Gagal/Batal' },
  { tag: '{errorMessage}', desc: 'Pesan Error Gateway' },
  { tag: '{webLink}', desc: 'Link Website' },
  { tag: '{tenantId}', desc: 'ID Tenant Bot' },
  { tag: '{remainingTime}', desc: 'Sisa Waktu Sewa' },
  { tag: '{expiryDate}', desc: 'Tanggal Kedaluwarsa' },
];

const FOOTER_PLACEHOLDERS = [
  { tag: '{storeName}', desc: 'Nama Toko' },
  { tag: '{webLink}', desc: 'Link Website' },
  { tag: '{ownerName}', desc: 'Nama Owner' },
  { tag: '{adminName}', desc: 'Nama Admin' },
];

const BUTTON_TYPE_LABELS: Record<WhatsAppButtonType, string> = {
  quick_reply: 'Quick Reply',
  cta_url: 'Buka Link (URL)',
  cta_copy: 'Salin Teks (Copy)',
  vcard: 'Kirim Kontak (vCard)',
  cta_call: 'Panggilan Telepon',
  cta_reminder: 'Pasang Pengingat',
  cta_cancel_reminder: 'Batal Pengingat',
};

const TRIGGER_ACTION_OPTIONS: { value: QuickReplyTriggerAction; label: string }[] = [
  { value: 'unknown', label: 'Tanpa Aksi Bot (Teks Saja)' },
  { value: 'list', label: 'Picu Command List Produk' },
  { value: 'menu', label: 'Picu Command Menu Utama' },
  { value: 'owner', label: 'Kirim Kontak Owner' },
  { value: 'admin', label: 'Kirim Kontak Admin' },
];

export const AddEditTemplateModal: React.FC<AddEditTemplateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  templateToEdit,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('menu');
  const [content, setContent] = useState('');
  const [footerText, setFooterText] = useState('');
  const [buttons, setButtons] = useState<WhatsAppButton[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State editor tombol inline di dalam modal template
  const [isBtnEditorOpen, setIsBtnEditorOpen] = useState(false);
  const [editingBtnId, setEditingBtnId] = useState<string | null>(null);
  const [editingMandatory, setEditingMandatory] = useState(false);
  const [btnType, setBtnType] = useState<WhatsAppButtonType>('quick_reply');
  const [btnName, setBtnName] = useState('');
  const [btnOutput, setBtnOutput] = useState('');
  const [btnTriggerAction, setBtnTriggerAction] = useState<QuickReplyTriggerAction>('unknown');
  const [btnCallTargetName, setBtnCallTargetName] = useState('');
  const [btnCallPhoneNumber, setBtnCallPhoneNumber] = useState('');
  const [showVariables, setShowVariables] = useState(false);

  const isEditMode = !!templateToEdit;

  useEffect(() => {
    if (!isOpen) return;
    if (templateToEdit) {
      const cat = templateToEdit.category === 'confirmation' ? 'confirm_summary' : templateToEdit.category;
      setName(templateToEdit.name);
      setCategory(cat);
      setContent(templateToEdit.content);
      setFooterText(templateToEdit.footer_text || '');
      const initialBtns =
        Array.isArray(templateToEdit.buttons) && templateToEdit.buttons.length > 0
          ? mergeMandatoryButtonsForCategory(cat, templateToEdit.buttons)
          : getDefaultButtonsForCategory(cat);
      setButtons(initialBtns);
      setIsActive(templateToEdit.is_active === 1);
    } else {
      setName('');
      setCategory('menu');
      setContent('');
      setFooterText(getSuggestedFooterForCategory('menu'));
      setButtons(getDefaultButtonsForCategory('menu'));
      setIsActive(true);
    }
    setIsBtnEditorOpen(false);
    setEditingBtnId(null);
    setShowVariables(false);
    setError(null);
  }, [templateToEdit, isOpen]);

  if (!isOpen) return null;

  const handleCategoryChange = (newCat: TemplateCategory) => {
    setCategory(newCat);
    if (!isEditMode && !footerText.trim()) {
      setFooterText(getSuggestedFooterForCategory(newCat));
    } else if (!isEditMode) {
      setFooterText(getSuggestedFooterForCategory(newCat));
    }
    setButtons((prev) => {
      const onlyCustom = prev.filter((b) => !b.mandatory);
      return mergeMandatoryButtonsForCategory(newCat, onlyCustom);
    });
    setIsBtnEditorOpen(false);
    setEditingBtnId(null);
  };

  const handleInsertPlaceholder = (tag: string) => {
    setContent((prev) => prev + tag);
  };

  const handleInsertFooterPlaceholder = (tag: string) => {
    setFooterText((prev) => prev + tag);
  };

  const handleOpenAddButton = () => {
    setEditingBtnId(null);
    setEditingMandatory(false);
    setBtnType('quick_reply');
    setBtnName('');
    setBtnOutput('');
    setBtnTriggerAction('unknown');
    setBtnCallTargetName('');
    setBtnCallPhoneNumber('');
    setIsBtnEditorOpen(true);
  };

  const handleOpenEditButton = (btn: WhatsAppButton) => {
    setEditingBtnId(btn.id);
    setEditingMandatory(Boolean(btn.mandatory));
    setBtnType(btn.type);
    setBtnName(btn.name);
    setBtnOutput(btn.output || '');
    setBtnTriggerAction(btn.triggerAction || 'unknown');
    setBtnCallTargetName(btn.callTargetName || '');
    setBtnCallPhoneNumber(btn.callPhoneNumber || '');
    setIsBtnEditorOpen(true);
  };

  const handleSaveButtonEditor = () => {
    if (!btnName.trim()) {
      setError('Nama tombol wajib diisi.');
      return;
    }

    if (editingBtnId) {
      setButtons((prev) =>
        mergeMandatoryButtonsForCategory(
          category,
          prev.map((b) => {
            if (b.id !== editingBtnId) return b;
            if (b.mandatory) {
              return { ...b, name: btnName.trim() };
            }
            return {
              ...b,
              type: btnType,
              name: btnName.trim(),
              output: btnType === 'vcard' ? btnCallPhoneNumber.trim() : btnOutput.trim() || btnName.trim(),
              triggerAction: btnType === 'quick_reply' ? btnTriggerAction : undefined,
              callTargetName: btnType === 'vcard' ? btnCallTargetName.trim() : undefined,
              callPhoneNumber:
                btnType === 'vcard' || btnType === 'cta_call' ? btnCallPhoneNumber.trim() : undefined,
            };
          }),
        ),
      );
    } else {
      const newBtn: WhatsAppButton = {
        id: `tpl_btn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: btnType,
        name: btnName.trim(),
        output:
          btnType === 'vcard'
            ? btnCallPhoneNumber.trim()
            : btnOutput.trim() || (btnType === 'cta_url' ? '{webLink}' : btnName.trim()),
        triggerAction: btnType === 'quick_reply' ? btnTriggerAction : undefined,
        callTargetName: btnType === 'vcard' ? btnCallTargetName.trim() : undefined,
        callPhoneNumber:
          btnType === 'vcard' || btnType === 'cta_call' ? btnCallPhoneNumber.trim() : undefined,
        mandatory: false,
      };
      setButtons((prev) => mergeMandatoryButtonsForCategory(category, [...prev, newBtn]));
    }

    setError(null);
    setIsBtnEditorOpen(false);
    setEditingBtnId(null);
  };

  const handleDeleteButton = (btnId: string) => {
    setButtons((prev) =>
      mergeMandatoryButtonsForCategory(
        category,
        prev.filter((b) => b.id !== btnId || b.mandatory),
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Silakan masukkan nama template.');
      return;
    }
    if (!content.trim()) {
      setError('Isi pesan template tidak boleh kosong.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const finalButtons = mergeMandatoryButtonsForCategory(category, buttons);
      const res = await onSubmit({
        id: templateToEdit?.id,
        name: name.trim(),
        category,
        content: content.trim(),
        footer_text: footerText.trim(),
        buttons: finalButtons,
        is_active: isActive ? 1 : 0,
      });

      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'Gagal menyimpan template.');
      }
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 text-[#0084D1] flex items-center justify-center">
              <LayoutTemplate className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {isEditMode ? 'Edit Paket Template Respon' : 'Tambah Paket Template Respon Baru'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Buat 1 paket lengkap (Pesan + Footer + Tombol Interaktif) siap pakai untuk tenant
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

        {/* Form Isi */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Nama Template */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nama Paket Template <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Paket Menu Modern Lengkap + Tombol CS"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-[#0084D1] focus:ring-1 focus:ring-[#0084D1] transition"
            />
          </div>

          {/* Kategori Fungsi Template */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Fungsi Template (Kategori Respon) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {CATEGORY_OPTIONS.map((opt) => {
                const isSelected = category === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleCategoryChange(opt.id)}
                    className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#0084D1] bg-sky-50/70 text-[#0084D1]'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#0084D1]" />}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Isi Pesan Template */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Isi Pesan Template <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {content.length} karakter
              </span>
            </div>
            <textarea
              required
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ketik draf pesan template di sini..."
              className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-[#0084D1] focus:ring-1 focus:ring-[#0084D1] transition leading-relaxed"
            />
          </div>

          {/* Sisipkan Variabel Placeholder Cepat (Collapsible) */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowVariables((prev) => !prev)}
              aria-expanded={showVariables}
              className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-left hover:bg-slate-100/70 transition cursor-pointer"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-[#0084D1] shrink-0" />
                <span className="text-xs font-semibold text-slate-700 truncate">
                  Sisipkan Variabel Pesan
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500 shrink-0">
                  {AVAILABLE_PLACEHOLDERS.length}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0084D1] whitespace-nowrap shrink-0">
                <span>{showVariables ? 'Tutup' : 'Pilih'}</span>
                {showVariables ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </span>
            </button>
            {showVariables && (
              <div className="px-3.5 pb-3 pt-1.5 border-t border-slate-200/70 bg-white flex flex-wrap gap-1.5">
                {AVAILABLE_PLACEHOLDERS.map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => handleInsertPlaceholder(item.tag)}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-[#0084D1] border border-slate-200 text-[10px] font-mono transition cursor-pointer"
                    title={item.desc}
                  >
                    {item.tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer Template */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800">
                Footer Pesan Paket (Opsional)
              </label>
              <span className="text-[10px] text-slate-400">Diterapkan otomatis bersama pesan</span>
            </div>
            <input
              type="text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="Contoh: {storeName} • Layanan Otomatis 24 Jam"
              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#0084D1]"
            />
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] text-slate-500 mr-1">Variabel Footer:</span>
              {FOOTER_PLACEHOLDERS.map((fp) => (
                <button
                  key={fp.tag}
                  type="button"
                  onClick={() => handleInsertFooterPlaceholder(fp.tag)}
                  className="px-2 py-0.5 rounded-md bg-white hover:bg-sky-50 text-slate-600 hover:text-[#0084D1] border border-slate-200 text-[10px] font-mono cursor-pointer transition"
                  title={fp.desc}
                >
                  {fp.tag}
                </button>
              ))}
            </div>
          </div>

          {/* Builder Tombol Interaktif Paket */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MousePointerClick className="w-4 h-4 text-[#0084D1]" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Tombol Interaktif Paket ({buttons.length})
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Tombol wajib hanya bisa diubah namanya; tombol kustom bebas ditambah/hapus.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenAddButton}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0084D1] hover:bg-[#0073B7] text-white text-[11px] font-semibold transition cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Tombol</span>
              </button>
            </div>

            {buttons.length === 0 ? (
              <div className="text-center py-4 bg-white border border-dashed border-slate-200 rounded-xl text-[11px] text-slate-400">
                Belum ada tombol interaktif pada paket ini. Klik "Tambah Tombol" jika ingin menyertakan tombol.
              </div>
            ) : (
              <div className="space-y-2">
                {buttons.map((btn) => (
                  <div
                    key={btn.id}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border bg-white ${
                      btn.mandatory ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 truncate">{btn.name}</span>
                        {btn.mandatory && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                            <Lock className="w-2.5 h-2.5" />
                            Wajib
                          </span>
                        )}
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-50 text-[#0084D1] border border-sky-100">
                          {BUTTON_TYPE_LABELS[btn.type] || btn.type}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                        {btn.mandatory
                          ? `Aksi terkunci (${btn.output})`
                          : btn.type === 'vcard'
                            ? `${btn.callTargetName || 'Kontak'} (${btn.callPhoneNumber || btn.output})`
                            : btn.output}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditButton(btn)}
                        className="p-1.5 text-slate-500 hover:text-[#0084D1] hover:bg-sky-50 rounded-lg transition cursor-pointer"
                        title={btn.mandatory ? 'Ubah Nama Tombol Wajib' : 'Edit Tombol'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!btn.mandatory && (
                        <button
                          type="button"
                          onClick={() => handleDeleteButton(btn.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus Tombol"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Inline Editor Form Tombol */}
            {isBtnEditorOpen && (
              <div className="p-3 bg-white border border-sky-200 rounded-xl space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#0084D1]">
                    {editingMandatory
                      ? 'Ubah Nama Tombol Wajib (Tipe & Aksi Terkunci)'
                      : editingBtnId
                        ? 'Edit Tombol Kustom'
                        : 'Tambah Tombol Kustom Baru'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsBtnEditorOpen(false)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>

                {!editingMandatory && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      Tipe Tombol
                    </label>
                    <select
                      value={btnType}
                      onChange={(e) => setBtnType(e.target.value as WhatsAppButtonType)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0084D1]"
                    >
                      <option value="quick_reply">Quick Reply (Balas / Pemicu Command)</option>
                      <option value="cta_url">Buka Link URL (cta_url)</option>
                      <option value="cta_copy">Salin Teks (cta_copy)</option>
                      <option value="vcard">Kirim Kontak WhatsApp (vCard)</option>
                      <option value="cta_call">Telepon Langsung (cta_call)</option>
                      <option value="cta_reminder">Pasang Pengingat (cta_reminder)</option>
                      <option value="cta_cancel_reminder">Batal Pengingat (cta_cancel_reminder)</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    Nama / Label Tombol <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={btnName}
                    onChange={(e) => setBtnName(e.target.value)}
                    placeholder="Contoh: 🛒 Pesan Sekarang"
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0084D1]"
                  />
                </div>

                {!editingMandatory && btnType === 'quick_reply' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        Aksi Pemicu Bot
                      </label>
                      <select
                        value={btnTriggerAction}
                        onChange={(e) => setBtnTriggerAction(e.target.value as QuickReplyTriggerAction)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0084D1]"
                      >
                        {TRIGGER_ACTION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        Payload ID Output
                      </label>
                      <input
                        type="text"
                        value={btnOutput}
                        onChange={(e) => setBtnOutput(e.target.value)}
                        placeholder="Misal: .list / info_promo"
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0084D1]"
                      />
                    </div>
                  </div>
                )}

                {!editingMandatory && (btnType === 'vcard' || btnType === 'cta_call') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {btnType === 'vcard' && (
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                          Nama Kontak (vCard)
                        </label>
                        <input
                          type="text"
                          value={btnCallTargetName}
                          onChange={(e) => setBtnCallTargetName(e.target.value)}
                          placeholder="Contoh: {adminName}"
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0084D1]"
                        />
                      </div>
                    )}
                    <div className={btnType === 'cta_call' ? 'sm:col-span-2' : ''}>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        Nomor WhatsApp / Telepon
                      </label>
                      <input
                        type="text"
                        value={btnCallPhoneNumber}
                        onChange={(e) => setBtnCallPhoneNumber(e.target.value)}
                        placeholder="Contoh: {adminNumber} atau 628xxx"
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0084D1]"
                      />
                    </div>
                  </div>
                )}

                {!editingMandatory &&
                  btnType !== 'quick_reply' &&
                  btnType !== 'vcard' &&
                  btnType !== 'cta_call' && (
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        {btnType === 'cta_url'
                          ? 'Target URL (Mendukung {webLink}, {paymentUrl}, dll.)'
                          : btnType === 'cta_copy'
                            ? 'Teks yang Disalin'
                            : 'ID Pengingat'}
                      </label>
                      <input
                        type="text"
                        value={btnOutput}
                        onChange={(e) => setBtnOutput(e.target.value)}
                        placeholder={btnType === 'cta_url' ? 'https://... atau {webLink}' : 'Nilai output...'}
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0084D1]"
                      />
                    </div>
                  )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsBtnEditorOpen(false)}
                    className="px-3 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveButtonEditor}
                    className="px-3 py-1 text-[11px] font-semibold text-white bg-[#0084D1] hover:bg-[#0073B7] rounded-lg cursor-pointer"
                  >
                    Terapkan Tombol
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Status Aktif */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800">Status Keaktifan</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Jika aktif, paket template dapat dipilih oleh seluruh penyewa bot di dashboard toko.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              aria-label="Status Keaktifan Template"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                isActive ? 'bg-[#0084D1]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Tombol Aksi */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer whitespace-nowrap shrink-0"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#0084D1] hover:bg-[#0073B7] rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>{isEditMode ? 'Simpan Perubahan' : 'Buat Paket Template'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

