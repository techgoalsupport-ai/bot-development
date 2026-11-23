import { useState, FormEvent } from 'react';
import {
  WhatsAppButton,
  WhatsAppButtonType,
  QuickReplyTriggerAction,
  ResponseConfigKey,
  ResponseExtrasMap,
} from '../types/dashboard.types';
import {
  getDefaultButtonsForResponse,
  mergeMandatoryButtons,
} from '../utils/responseConfig';

export function useButtonModal(
  menuButtons: WhatsAppButton[],
  setMenuButtons: React.Dispatch<React.SetStateAction<WhatsAppButton[]>>,
  responseExtras: ResponseExtrasMap,
  setResponseExtras: React.Dispatch<React.SetStateAction<ResponseExtrasMap>>,
  onSaveButtons: (
    targetKey: ResponseConfigKey,
    updatedButtons: WhatsAppButton[],
    updatedExtras?: ResponseExtrasMap
  ) => void,
  showToast: (msg: string) => void
) {
  const [isAddButtonModalOpen, setIsAddButtonModalOpen] = useState(false);
  const [editingButtonId, setEditingButtonId] = useState<string | null>(null);
  const [editingTargetKey, setEditingTargetKey] = useState<ResponseConfigKey>('menu');
  const [editingButtonMandatory, setEditingButtonMandatory] = useState<boolean>(false);
  const [modalBtnType, setModalBtnType] = useState<WhatsAppButtonType>('quick_reply');
  const [modalBtnName, setModalBtnName] = useState('');

  // Dedicated inputs per type
  const [quickReplyOutput, setQuickReplyOutput] = useState('');
  const [quickReplyAction, setQuickReplyAction] = useState<QuickReplyTriggerAction>('unknown');
  const [urlOutput, setUrlOutput] = useState('https://');
  const [copyOutput, setCopyOutput] = useState('');
  const [reminderOutput, setReminderOutput] = useState('');
  const [cancelReminderOutput, setCancelReminderOutput] = useState('');
  const [callTarget, setCallTarget] = useState('');
  const [callPhone, setCallPhone] = useState('');

  const getButtonsForKey = (key: ResponseConfigKey): WhatsAppButton[] => {
    if (key === 'menu') return menuButtons;
    const raw = responseExtras[key]?.buttons;
    return mergeMandatoryButtons(
      key,
      Array.isArray(raw) ? raw : getDefaultButtonsForResponse(key)
    );
  };

  const commitButtonsForKey = (key: ResponseConfigKey, nextButtons: WhatsAppButton[]) => {
    if (key === 'menu') {
      setMenuButtons(nextButtons);
      onSaveButtons('menu', nextButtons);
      return;
    }

    const merged = mergeMandatoryButtons(key, nextButtons);
    const current = responseExtras[key] || {
      includeMedia: key === 'carousel',
      selectedPicture: '',
      buttons: [],
    };
    const nextExtras: ResponseExtrasMap = {
      ...responseExtras,
      [key]: {
        ...current,
        includeMedia: key === 'carousel' ? true : key === 'invoice' ? false : Boolean(current.includeMedia),
        buttons: merged,
      },
    };
    setResponseExtras(nextExtras);
    onSaveButtons(key, merged, nextExtras);
  };

  const handleOpenAddButtonModal = (targetKey: ResponseConfigKey = 'menu') => {
    setEditingTargetKey(targetKey);
    setEditingButtonId(null);
    setEditingButtonMandatory(false);
    setModalBtnType('quick_reply');
    setModalBtnName('');
    setQuickReplyOutput('');
    setQuickReplyAction('unknown');
    setUrlOutput('https://');
    setCopyOutput('');
    setReminderOutput('');
    setCancelReminderOutput('');
    setCallTarget('');
    setCallPhone('');
    setIsAddButtonModalOpen(true);
  };

  const handleEditButton = (btn: WhatsAppButton, targetKey: ResponseConfigKey = 'menu') => {
    setEditingTargetKey(targetKey);
    setEditingButtonId(btn.id);
    setEditingButtonMandatory(Boolean(btn.mandatory));
    setModalBtnType(btn.type);
    setModalBtnName(btn.name);
    setQuickReplyOutput('');
    setQuickReplyAction(btn.triggerAction || 'unknown');
    setUrlOutput('https://');
    setCopyOutput('');
    setReminderOutput('');
    setCancelReminderOutput('');
    setCallTarget('');
    setCallPhone('');

    if (btn.type === 'quick_reply') {
      setQuickReplyOutput(btn.output || '');
    } else if (btn.type === 'cta_url') {
      const out = btn.output || '';
      setUrlOutput(
        out.startsWith('http://') || out.startsWith('https://') || out.includes('{')
          ? out
          : `https://${out}`
      );
    } else if (btn.type === 'cta_copy') {
      setCopyOutput(btn.output || '');
    } else if (btn.type === 'vcard' || btn.type === 'cta_call') {
      if (btn.callTargetName) setCallTarget(btn.callTargetName);
      if (btn.callPhoneNumber) setCallPhone(btn.callPhoneNumber);
      if (!btn.callTargetName && !btn.callPhoneNumber && btn.output.includes('(')) {
        const match = btn.output.match(/^(.*?)\s*\((.*?)\)$/);
        if (match) {
          setCallTarget(match[1].trim());
          setCallPhone(match[2].trim());
        } else {
          setCallTarget('Admin Store');
          setCallPhone(btn.output.replace(/[^0-9+]/g, ''));
        }
      }
    } else if (btn.type === 'cta_reminder') {
      setReminderOutput(btn.output || '');
    } else if (btn.type === 'cta_cancel_reminder') {
      setCancelReminderOutput(btn.output || '');
    }
    setIsAddButtonModalOpen(true);
  };

  const handleSaveButton = (e: FormEvent) => {
    e.preventDefault();
    if (!modalBtnName.trim()) {
      showToast('Nama tombol wajib diisi.');
      return;
    }

    const currentList = getButtonsForKey(editingTargetKey);

    // Jika sedang mengedit tombol wajib sistem, hanya izinkan mengubah nama tampilannya
    if (editingButtonId && editingButtonMandatory) {
      const updatedButtons = currentList.map((btn) =>
        btn.id === editingButtonId
          ? {
              ...btn,
              name: modalBtnName.trim(),
            }
          : btn
      );
      commitButtonsForKey(editingTargetKey, updatedButtons);
      setIsAddButtonModalOpen(false);
      setEditingButtonId(null);
      setEditingButtonMandatory(false);
      showToast(`Nama tombol wajib "${modalBtnName.trim()}" berhasil diperbarui!`);
      return;
    }

    let finalOutput = '';
    if (modalBtnType === 'quick_reply') {
      if (!quickReplyOutput.trim()) {
        showToast('Output respon balasan wajib diisi.');
        return;
      }
      finalOutput = quickReplyOutput.trim();
    } else if (modalBtnType === 'cta_url') {
      const cleanUrl = urlOutput.trim();
      const hasUrlPlaceholder = cleanUrl.includes('{') && cleanUrl.includes('}');
      if (!hasUrlPlaceholder && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        showToast('Output cta_url wajib diisi dengan URL valid (diawali https:// atau placeholder {webLink}).');
        return;
      }
      finalOutput = cleanUrl;
    } else if (modalBtnType === 'cta_copy') {
      if (!copyOutput.trim()) {
        showToast('Teks yang akan disalin wajib diisi.');
        return;
      }
      finalOutput = copyOutput.trim();
    } else if (modalBtnType === 'vcard' || modalBtnType === 'cta_call') {
      if (!callTarget.trim()) {
        showToast('Nama kontak vCard wajib diisi (misal: Admin Store, Owner, atau {adminName}).');
        return;
      }
      const hasPhonePlaceholder = callPhone.includes('{') && callPhone.includes('}');
      const cleanPhone = callPhone.replace(/[^0-9+]/g, '');
      if (!hasPhonePlaceholder && (!cleanPhone || cleanPhone.length < 8)) {
        showToast('Nomor WhatsApp kontak vCard tidak valid (minimal 8 digit atau placeholder {ownerNumber}).');
        return;
      }
      finalOutput = `${callTarget.trim()} (${callPhone.trim()})`;
    } else if (modalBtnType === 'cta_reminder') {
      if (!reminderOutput.trim()) {
        showToast('Judul atau ID pengingat wajib diisi.');
        return;
      }
      finalOutput = reminderOutput.trim();
    } else if (modalBtnType === 'cta_cancel_reminder') {
      if (!cancelReminderOutput.trim()) {
        showToast('ID pengingat yang dibatalkan wajib diisi.');
        return;
      }
      finalOutput = cancelReminderOutput.trim();
    }

    const isContactBtn = modalBtnType === 'vcard' || modalBtnType === 'cta_call';

    if (editingButtonId) {
      const updatedButtons = currentList.map((btn) => {
        if (btn.id === editingButtonId) {
          return {
            ...btn,
            type: modalBtnType,
            name: modalBtnName.trim(),
            output: finalOutput,
            triggerAction: modalBtnType === 'quick_reply' ? quickReplyAction : undefined,
            callTargetName: isContactBtn ? callTarget.trim() : undefined,
            callPhoneNumber: isContactBtn ? callPhone.trim() : undefined,
            mandatory: false,
            mandatoryRole: undefined,
          };
        }
        return btn;
      });
      commitButtonsForKey(editingTargetKey, updatedButtons);
      setIsAddButtonModalOpen(false);
      setEditingButtonId(null);
      setEditingButtonMandatory(false);
      showToast(`Tombol "${modalBtnName.trim()}" berhasil diperbarui & disimpan!`);
    } else {
      const newBtn: WhatsAppButton = {
        id: 'btn-' + Date.now(),
        type: modalBtnType,
        name: modalBtnName.trim(),
        output: finalOutput,
        triggerAction: modalBtnType === 'quick_reply' ? quickReplyAction : undefined,
        callTargetName: isContactBtn ? callTarget.trim() : undefined,
        callPhoneNumber: isContactBtn ? callPhone.trim() : undefined,
        mandatory: false,
      };
      const updatedButtons = [...currentList, newBtn];
      commitButtonsForKey(editingTargetKey, updatedButtons);
      setIsAddButtonModalOpen(false);
      showToast(`Tombol "${newBtn.name}" berhasil ditambahkan & disimpan!`);
    }
  };

  const handleDeleteButton = (id: string, targetKey: ResponseConfigKey = 'menu') => {
    const currentList = getButtonsForKey(targetKey);
    const targetBtn = currentList.find((b) => b.id === id);
    if (targetBtn?.mandatory) {
      showToast('Tombol wajib sistem tidak dapat dihapus. Anda hanya dapat mengubah namanya.');
      return;
    }

    const updatedButtons = currentList.filter((b) => b.id !== id);
    commitButtonsForKey(targetKey, updatedButtons);
    showToast('Tombol berhasil dihapus & disimpan.');
  };

  return {
    isAddButtonModalOpen,
    setIsAddButtonModalOpen,
    editingButtonId,
    setEditingButtonId,
    editingTargetKey,
    editingButtonMandatory,
    setEditingButtonMandatory,
    modalBtnType,
    setModalBtnType,
    modalBtnName,
    setModalBtnName,
    quickReplyAction,
    setQuickReplyAction,
    quickReplyOutput,
    setQuickReplyOutput,
    urlOutput,
    setUrlOutput,
    copyOutput,
    setCopyOutput,
    reminderOutput,
    setReminderOutput,
    cancelReminderOutput,
    setCancelReminderOutput,
    callTarget,
    setCallTarget,
    callPhone,
    setCallPhone,
    handleOpenAddButtonModal,
    handleEditButton,
    handleSaveButton,
    handleDeleteButton,
  };
}
