import { CommandsConfig } from '../types/bot.types.ts';
import { generateDaftarProdukText, getSingleSelectSections } from '../services/xavieraService.ts';
import { resolvePlaceholders } from '../services/placeholderHelper.ts';
import {
  getResponseExtraConfig,
  convertButtonToNativeFlow,
  loadImageBufferForResponse,
} from '../services/responseConfigHelper.ts';
import {
  markMessageAsBotSent,
  markOutgoingTextAsBotSent,
} from '../handlers/botSentTracker.ts';

export async function sendListInteractiveMessage(
  sock: any,
  config: CommandsConfig,
  remoteJid: string,
  quotedMsg?: any,
  addLog?: (type: 'info' | 'success' | 'warning' | 'error' | 'code', msg: string) => void
): Promise<void> {
  if (!sock) return;

  // Ambil sections dan daftar produk secara dinamis langsung dari API Xaviera sesuai kategori
  const sectionsData = await getSingleSelectSections(config);

  // Siapkan teks respon lengkap dengan seluruh daftar produk
  const daftarProdukText = await generateDaftarProdukText(config);

  // Jika daftar produk kosong dari API, kirim pesan informasi jujur dan jangan kirim katalog palsu
  if (!daftarProdukText && sectionsData.length === 0) {
    const emptyMsg = `Halo kak! Saat ini katalog produk belum tersedia atau sedang dalam pembaruan dari server pusat. Silakan hubungi admin kami untuk informasi produk dan stok.`;
    markOutgoingTextAsBotSent(remoteJid, emptyMsg);
    const emptyRes = await sock.sendMessage(
      remoteJid,
      { text: emptyMsg },
      quotedMsg ? { quoted: quotedMsg } : undefined
    );
    markMessageAsBotSent(emptyRes?.key?.id);
    if (addLog) {
      addLog('warning', `⚠️ Daftar produk kosong dari API Xaviera (API Key tidak valid / belum ada produk). Pesan pemberitahuan terkirim ke ${remoteJid}.`);
    }
    return;
  }

  let rawResponseText = config.listOutputText?.trim() || '';

  if (rawResponseText) {
    if (rawResponseText.includes('{daftarProduk}')) {
      rawResponseText = rawResponseText.replace(/\{daftarProduk\}/g, daftarProdukText);
    }
  } else {
    rawResponseText = `Halo kak! Berikut daftar produk aplikasi yang tersedia di {storeName}:\n\n${daftarProdukText}\n\nKetik nama produk yang ingin Anda pesan.`;
  }

  // Terapkan seluruh placeholder dinamis ({storeName}, {ownerName}, {webLink}, dll.)
  const responseText = resolvePlaceholders(rawResponseText, config);
  const rawFooter = config.listFooterText || '{webLink} • Pilih Produk';
  const footerText = resolvePlaceholders(rawFooter, config);

  const listExtra = getResponseExtraConfig(config, 'list');
  const listButtons = listExtra.buttons || [];
  const dropdownBtn = listButtons.find((b) => b.mandatoryRole === 'list_dropdown');
  const dropdownName =
    resolvePlaceholders(dropdownBtn?.name || '📋 Pilih Produk', config).trim() || '📋 Pilih Produk';
  const customNativeFlow = listButtons
    .filter((b) => b.mandatoryRole !== 'list_dropdown')
    .map((b) => convertButtonToNativeFlow(b, config))
    .filter(Boolean);

  const imageInput = loadImageBufferForResponse(sock, config, 'list', addLog);

  const mappedSections = sectionsData.map((sec) => ({
    title: sec.title,
    rows: sec.rows.map((row) => ({
      title: row.title,
      description: row.description || `Tampilkan varian ${row.title}`,
      rowId: row.rowId || row.id || `prod_select:${row.title}`,
    })),
  }));

  markOutgoingTextAsBotSent(remoteJid, responseText);

  try {
    if (imageInput || customNativeFlow.length > 0) {
      const nativeFlowPayload = [
        {
          text: dropdownName,
          sections: mappedSections,
        },
        ...customNativeFlow,
      ];

      const sent = await sock.sendMessage(
        remoteJid,
        imageInput
          ? {
              image: imageInput,
              caption: responseText,
              footer: footerText,
              nativeFlow: nativeFlowPayload,
            }
          : {
              text: responseText,
              footer: footerText,
              nativeFlow: nativeFlowPayload,
            },
        quotedMsg ? { quoted: quotedMsg } : undefined
      );
      markMessageAsBotSent(sent?.key?.id);
    } else {
      const sent = await sock.sendMessage(
        remoteJid,
        {
          text: responseText,
          footer: footerText,
          buttonText: dropdownName,
          sections: mappedSections,
        },
        quotedMsg ? { quoted: quotedMsg } : undefined
      );
      markMessageAsBotSent(sent?.key?.id);
    }

    if (addLog) {
      addLog('success', `✅ Berhasil mengirim pesan LIST dropdown Single Select (${dropdownName}) ke ${remoteJid}`);
    }
  } catch (err: any) {
    if (addLog) {
      addLog('warning', `Pengiriman dropdown LIST gagal (${err?.message || err}). Mengirim fallback sections/text...`);
    }
    try {
      const fallbackList = await sock.sendMessage(
        remoteJid,
        {
          text: responseText,
          footer: footerText,
          buttonText: dropdownName,
          sections: mappedSections,
        },
        quotedMsg ? { quoted: quotedMsg } : undefined
      );
      markMessageAsBotSent(fallbackList?.key?.id);
    } catch {
      try {
        const textPayload = imageInput
          ? { image: imageInput, caption: footerText ? `${responseText}\n\n_${footerText}_` : responseText }
          : { text: footerText ? `${responseText}\n\n_${footerText}_` : responseText };
        const fallbackSent = await sock.sendMessage(
          remoteJid,
          textPayload,
          quotedMsg ? { quoted: quotedMsg } : undefined
        );
        markMessageAsBotSent(fallbackSent?.key?.id);
        if (addLog) {
          addLog('success', `✅ Berhasil membalas command LIST (fallback text) ke ${remoteJid}`);
        }
      } catch (fallbackErr: any) {
        if (addLog) {
          addLog('error', `Gagal mengirim respon LIST: ${fallbackErr?.message || fallbackErr}`);
        }
      }
    }
  }
}
