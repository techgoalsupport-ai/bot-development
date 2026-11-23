import React from 'react';
import {
  Check,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  ExternalLink,
  PhoneCall,
  Copy,
  UserCheck,
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp,
  Upload,
  LayoutTemplate,
  Lock,
} from 'lucide-react';
import {
  ResponseConfigKey,
  ResponseExtraConfig,
  WhatsAppButton,
} from '../../types/dashboard.types';

export interface MediaGalleryPickerProps {
  label: string;
  description?: string;
  selectedPicture: string;
  onSelectPicture: (pic: string) => void;
  availablePictures: string[];
  setAvailablePictures: (pics: string[]) => void;
  showToast: (msg: string) => void;
  embedded?: boolean;
}

export const MediaGalleryPicker: React.FC<MediaGalleryPickerProps> = ({
  label,
  selectedPicture,
  onSelectPicture,
  availablePictures,
  setAvailablePictures,
  showToast,
  embedded = false,
}) => {
  const [isUploading, setIsUploading] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/media/pictures');
      const data = await res.json();
      if (data.pictures) {
        setAvailablePictures(data.pictures);
        showToast('Daftar foto diperbarui');
      }
    } catch {
      showToast('Gagal memuat foto');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      showToast('Gunakan file gambar format JPG, PNG, atau WEBP');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Ukuran foto maksimal 10 MB');
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await fetch('/api/media/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              data: base64Data,
            }),
          });
          const resData = await res.json();
          if (resData.success) {
            setAvailablePictures(resData.pictures);
            if (resData.filename) {
              onSelectPicture(resData.filename);
            }
            showToast('Foto berhasil diunggah!');
          } else {
            showToast(resData.error || 'Gagal mengunggah foto');
          }
        } catch {
          showToast('Koneksi upload gagal');
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploading(false);
      showToast('Gagal membaca file gambar');
    }
  };

  const handleDelete = async (pic: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(pic);
    try {
      const res = await fetch(`/api/media/${encodeURIComponent(pic)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setAvailablePictures(data.pictures);
        if (selectedPicture === pic) {
          const nextPic = data.pictures.length > 0 ? data.pictures[0] : '';
          onSelectPicture(nextPic);
        }
        showToast('Foto berhasil dihapus');
      } else {
        showToast(data.error || 'Gagal menghapus foto');
      }
    } catch {
      showToast('Gagal menghapus foto');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div
      className={
        embedded
          ? 'space-y-3 pt-3 border-t border-slate-200/70'
          : 'space-y-3 p-3 sm:p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/90'
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-11 h-11 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
            {selectedPicture ? (
              <img
                src={`/api/media/view?name=${encodeURIComponent(selectedPicture)}`}
                alt={selectedPicture}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-4 h-4 text-slate-300" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            {!embedded && (
              <h4 className="text-xs font-semibold text-slate-800 truncate">{label}</h4>
            )}
            <p className="text-[11px] font-medium text-slate-500">
              {selectedPicture ? 'Foto terpilih:' : 'Belum ada foto dipilih'}
            </p>
            {selectedPicture && (
              <p className="text-[11px] font-mono text-slate-700 truncate">
                {selectedPicture}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            aria-expanded={isGalleryOpen}
            onClick={() => setIsGalleryOpen((prev) => !prev)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-[#0084D1] bg-white rounded-lg border border-slate-200 hover:border-sky-300 transition cursor-pointer active:scale-[0.98] whitespace-nowrap"
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#0084D1]" />
            <span>
              {isGalleryOpen
                ? 'Tutup Galeri'
                : `${selectedPicture ? 'Ganti Foto' : 'Pilih Foto'} (${availablePictures.length})`}
            </span>
            {isGalleryOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0084D1] hover:bg-[#0073b7] rounded-lg transition cursor-pointer shadow-2xs disabled:opacity-50 active:scale-[0.98] whitespace-nowrap"
          >
            {isUploading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            <span>{isUploading ? 'Mengunggah...' : 'Upload'}</span>
          </button>
        </div>
      </div>

      {isGalleryOpen && (
        <div className="space-y-2.5 pt-2.5 border-t border-slate-200/70">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-600">
              Galeri Foto ({availablePictures.length})
            </span>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Muat ulang daftar foto"
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-[#0084D1] bg-white rounded-lg border border-slate-200 hover:border-sky-300 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {availablePictures.length === 0 ? (
            <div className="text-center py-4 px-3 bg-white rounded-xl border border-dashed border-slate-200">
              <ImageIcon className="w-5 h-5 text-slate-300 mx-auto mb-1" />
              <p className="text-xs text-slate-600 font-medium">Belum ada foto di galeri.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Gunakan tombol Upload untuk menambahkan foto JPG, PNG, atau WEBP.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {availablePictures.map((pic) => {
                const isSelected = selectedPicture === pic;
                return (
                  <div
                    key={pic}
                    className={`group relative rounded-xl border overflow-hidden transition bg-white ${
                      isSelected
                        ? 'border-[#0084D1] ring-2 ring-[#0084D1]/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectPicture(pic)}
                      aria-label={`Pilih foto ${pic}`}
                      className="block w-full text-left cursor-pointer focus:outline-none"
                    >
                      <div className="relative w-full h-20 bg-slate-100 overflow-hidden">
                        <img
                          src={`/api/media/view?name=${encodeURIComponent(pic)}`}
                          alt={pic}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-1.5 left-1.5 bg-[#0084D1] text-white p-1 rounded-md shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="px-1.5 py-1 bg-white border-t border-slate-100 text-center">
                        <p className="text-[10px] font-mono text-slate-600 truncate">
                          {pic}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      aria-label={`Hapus foto ${pic}`}
                      title="Hapus foto ini"
                      disabled={isDeleting === pic}
                      onClick={(e) => handleDelete(pic, e)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-white/95 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition shadow-xs opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                    >
                      {isDeleting === pic ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export interface VariableTagItem {
  tag: string;
  tone?: 'default' | 'amber' | 'emerald' | 'rose';
}

interface CollapsibleVariableChipsProps {
  tags: Array<string | VariableTagItem>;
  onInsert: (tag: string) => void;
  compact?: boolean;
  label?: string;
}

export const CollapsibleVariableChips: React.FC<CollapsibleVariableChipsProps> = ({
  tags,
  onInsert,
  compact = false,
  label = 'Sisipkan Variabel',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const getToneClasses = (tone: VariableTagItem['tone']) => {
    switch (tone) {
      case 'amber':
        return {
          btn: 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200 font-medium',
          icon: 'text-amber-600',
        };
      case 'emerald':
        return {
          btn: 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200 font-medium',
          icon: 'text-emerald-600',
        };
      case 'rose':
        return {
          btn: 'bg-rose-50 text-rose-800 hover:bg-rose-100 border-rose-200 font-medium',
          icon: 'text-rose-600',
        };
      default:
        return {
          btn: 'bg-slate-50 text-slate-700 hover:bg-sky-50 hover:text-[#0084D1] border-slate-200 hover:border-sky-300',
          icon: 'text-[#0084D1]',
        };
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-600 font-medium transition cursor-pointer ${
          compact ? 'px-2 py-1 text-[10.5px]' : 'px-2.5 py-1 text-[11px]'
        }`}
      >
        <Plus className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-[#0084D1]`} />
        <span>{label}</span>
        <span className="text-[10px] font-mono text-slate-400">({tags.length})</span>
        {isOpen ? (
          <ChevronUp className="w-3 h-3 text-slate-400" />
        ) : (
          <ChevronDown className="w-3 h-3 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {tags.map((item) => {
            const tag = typeof item === 'string' ? item : item.tag;
            const tone = typeof item === 'string' ? 'default' : item.tone;
            const styles = getToneClasses(tone);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onInsert(tag)}
                className={`inline-flex items-center gap-1 rounded-md font-mono border transition cursor-pointer ${
                  compact ? 'px-2 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]'
                } ${styles.btn}`}
              >
                <Plus className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} ${styles.icon}`} />
                <span>{tag}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface ResponsePhotoToggleProps {
  title: string;
  subtitle?: string;
  includeMedia: boolean;
  onToggleMedia: (val: boolean) => void;
  selectedPicture: string;
  onSelectPicture: (pic: string) => void;
  availablePictures: string[];
  setAvailablePictures: (pics: string[]) => void;
  showToast: (msg: string) => void;
}

export const ResponsePhotoToggle: React.FC<ResponsePhotoToggleProps> = ({
  title,
  subtitle = 'Kirim foto dari galeri bersama respon pesan ini.',
  includeMedia,
  onToggleMedia,
  selectedPicture,
  onSelectPicture,
  availablePictures,
  setAvailablePictures,
  showToast,
}) => {
  return (
    <div className="p-3 sm:p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/90 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-xs font-semibold text-slate-800 block">
            {title}
          </span>
          <span className="text-[11px] text-slate-500 block">
            {subtitle}
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={includeMedia}
          aria-label={title}
          onClick={() => onToggleMedia(!includeMedia)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0084D1] ${
            includeMedia ? 'bg-[#0084D1]' : 'bg-slate-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
              includeMedia ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {includeMedia && (
        <MediaGalleryPicker
          embedded
          label={title}
          selectedPicture={selectedPicture}
          onSelectPicture={onSelectPicture}
          availablePictures={availablePictures}
          setAvailablePictures={setAvailablePictures}
          showToast={showToast}
        />
      )}
    </div>
  );
};

export function getButtonTypeBadge(btn: WhatsAppButton) {
  switch (btn.type) {
    case 'cta_url':
      return {
        label: 'CTA Link',
        icon: <ExternalLink className="w-3 h-3 text-[#0084D1]" />,
        color: 'bg-sky-50 text-[#0084D1] border-sky-200',
      };
    case 'cta_copy':
      return {
        label: 'CTA Salin',
        icon: <Copy className="w-3 h-3 text-purple-600" />,
        color: 'bg-purple-50 text-purple-700 border-purple-200',
      };
    case 'vcard':
    case 'cta_call':
      return {
        label: 'Kontak',
        icon: <UserCheck className="w-3 h-3 text-emerald-600" />,
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'cta_reminder':
      return {
        label: 'Reminder',
        icon: <Bell className="w-3 h-3 text-amber-600" />,
        color: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    case 'cta_cancel_reminder':
      return {
        label: 'Batal Reminder',
        icon: <BellOff className="w-3 h-3 text-rose-600" />,
        color: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    case 'quick_reply':
    default:
      return {
        label: 'Quick Reply',
        icon: <PhoneCall className="w-3 h-3 text-slate-600" />,
        color: 'bg-slate-100 text-slate-700 border-slate-200',
      };
  }
}

interface ResponseButtonsSectionProps {
  responseKey: ResponseConfigKey;
  buttons: WhatsAppButton[];
  subtitle?: string;
  onAddButton: (targetKey: ResponseConfigKey) => void;
  onEditButton: (btn: WhatsAppButton, targetKey: ResponseConfigKey) => void;
  onDeleteButton: (id: string, targetKey: ResponseConfigKey) => void;
}

export const ResponseButtonsSection: React.FC<ResponseButtonsSectionProps> = ({
  responseKey,
  buttons,
  subtitle = 'Tombol aksi interaktif yang ikut dikirim pada respon ini.',
  onAddButton,
  onEditButton,
  onDeleteButton,
}) => {
  return (
    <div className="pt-3 border-t border-slate-100 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-xs font-semibold text-slate-800">
            Tombol Interaktif ({buttons.length})
          </h3>
          <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => onAddButton(responseKey)}
          className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[#0084D1] hover:bg-[#0073b7] transition cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Tombol</span>
        </button>
      </div>

      {buttons.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400">
          Belum ada tombol interaktif untuk respon ini.
        </div>
      ) : (
        <div className="space-y-2">
          {buttons.map((btn, index) => {
            const badge = getButtonTypeBadge(btn);
            const isMandatory = Boolean(btn.mandatory);
            return (
              <div
                key={btn.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition shadow-2xs gap-3 ${
                  isMandatory
                    ? 'border-amber-200/90 bg-amber-50/30'
                    : 'border-slate-200/90 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center font-mono text-[11px] font-semibold shrink-0">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-slate-900 truncate">
                        {btn.name}
                      </span>
                      {isMandatory && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-200">
                          <Lock className="w-2.5 h-2.5 text-amber-600" />
                          Wajib
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border ${badge.color}`}
                      >
                        {badge.icon}
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                      {btn.output}
                      {isMandatory ? ' (hanya nama dapat diubah)' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onEditButton(btn, responseKey)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#0084D1] hover:bg-sky-50 transition cursor-pointer"
                    title={isMandatory ? 'Ubah nama tombol wajib' : 'Edit tombol'}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {!isMandatory && (
                    <button
                      type="button"
                      onClick={() => onDeleteButton(btn.id, responseKey)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Hapus tombol"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface ResponseAccordionCardProps {
  indexNumber: number;
  title: string;
  description: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  responseKey: ResponseConfigKey;
  extraConfig: ResponseExtraConfig;
  availablePictures: string[];
  setAvailablePictures: (pics: string[]) => void;
  onUpdateExtra: (patch: Partial<ResponseExtraConfig>) => void;
  textValue: string;
  onChangeText: (val: string) => void;
  textRows?: number;
  textPlaceholder?: string;
  variableTags: Array<string | VariableTagItem>;
  onInsertVariable: (tag: string) => void;
  footerLabel: string;
  footerValue: string;
  onChangeFooter: (val: string) => void;
  footerPlaceholder: string;
  footerVariableTags?: Array<string | VariableTagItem>;
  onInsertFooterVariable?: (tag: string) => void;
  onOpenTemplate: () => void;
  onResetDefault: () => void;
  onAddButton: (targetKey: ResponseConfigKey) => void;
  onEditButton: (btn: WhatsAppButton, targetKey: ResponseConfigKey) => void;
  onDeleteButton: (id: string, targetKey: ResponseConfigKey) => void;
  showToast: (msg: string) => void;
}

export const ResponseAccordionCard: React.FC<ResponseAccordionCardProps> = ({
  indexNumber,
  title,
  description,
  isExpanded,
  onToggleExpand,
  responseKey,
  extraConfig,
  availablePictures,
  setAvailablePictures,
  onUpdateExtra,
  textValue,
  onChangeText,
  textRows = 4,
  textPlaceholder,
  variableTags,
  onInsertVariable,
  footerLabel,
  footerValue,
  onChangeFooter,
  footerPlaceholder,
  footerVariableTags = ['{storeName}', '{webLink}', '{ownerNumber}', '{adminNumber}'],
  onInsertFooterVariable,
  onOpenTemplate,
  onResetDefault,
  onAddButton,
  onEditButton,
  onDeleteButton,
  showToast,
}) => {
  const buttons = Array.isArray(extraConfig.buttons) ? extraConfig.buttons : [];
  const includeMedia = Boolean(extraConfig.includeMedia);
  const selectedPicture = extraConfig.selectedPicture || '';

  return (
    <div
      className={`rounded-xl border transition-colors ${
        isExpanded
          ? 'border-[#0084D1]/40 bg-white shadow-2xs'
          : 'border-slate-200/90 bg-slate-50/40 hover:bg-white'
      }`}
    >
      {/* Header Accordion (Option A) */}
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={onToggleExpand}
        className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
              isExpanded
                ? 'bg-[#0084D1] text-white'
                : 'bg-slate-200/80 text-slate-700'
            }`}
          >
            {indexNumber}
          </span>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
              {title}
            </h4>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-medium text-slate-500 tabular-nums">
            <span className={includeMedia ? 'text-[#0084D1] font-semibold' : 'text-slate-400'}>
              Foto: {includeMedia ? 'ON' : 'OFF'}
            </span>
            <span aria-hidden="true" className="text-slate-300">
              /
            </span>
            <span>Tombol: {buttons.length}</span>
          </div>
          <div className="p-1 rounded-lg bg-slate-100 text-slate-500">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
      </button>

      {/* Body Accordion */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-3 border-t border-slate-100 space-y-4">
          {/* 1. Saklar & Galeri Foto Per-Respon */}
          <ResponsePhotoToggle
            title={`Kirim Foto pada ${title}`}
            includeMedia={includeMedia}
            onToggleMedia={(val) => onUpdateExtra({ includeMedia: val })}
            selectedPicture={selectedPicture}
            onSelectPicture={(pic) => onUpdateExtra({ selectedPicture: pic })}
            availablePictures={availablePictures}
            setAvailablePictures={setAvailablePictures}
            showToast={showToast}
          />

          {/* 2. Teks Pesan + Template + Reset */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-800">
                Teks Pesan
              </label>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onOpenTemplate}
                  className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-[#0084D1] text-[#0084D1] hover:text-white border border-sky-200 hover:border-transparent text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-95"
                >
                  <LayoutTemplate className="w-3.5 h-3.5" />
                  <span>Pilih Template</span>
                </button>
                <button
                  type="button"
                  onClick={onResetDefault}
                  className="whitespace-nowrap text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Reset Default
                </button>
              </div>
            </div>

            <textarea
              rows={textRows}
              value={textValue}
              onChange={(e) => onChangeText(e.target.value)}
              placeholder={textPlaceholder}
              className="w-full bg-slate-50/60 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0084D1] focus:ring-2 focus:ring-[#0084D1]/15 transition font-mono leading-relaxed"
            />

            <CollapsibleVariableChips
              tags={variableTags}
              onInsert={onInsertVariable}
            />
          </div>

          {/* 3. Teks Footer */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-800 block">
              {footerLabel}
            </label>
            <input
              type="text"
              value={footerValue}
              onChange={(e) => onChangeFooter(e.target.value)}
              placeholder={footerPlaceholder}
              className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0084D1] focus:ring-2 focus:ring-[#0084D1]/15 transition"
            />
            {onInsertFooterVariable && (
              <CollapsibleVariableChips
                compact
                label="Variabel Footer"
                tags={footerVariableTags}
                onInsert={onInsertFooterVariable}
              />
            )}
          </div>

          {/* 4. Tombol Interaktif Per-Respon */}
          <ResponseButtonsSection
            responseKey={responseKey}
            buttons={buttons}
            onAddButton={onAddButton}
            onEditButton={onEditButton}
            onDeleteButton={onDeleteButton}
          />
        </div>
      )}
    </div>
  );
};
