/**
 * Konfigurasi Terpusat Kontak Master Admin
 *
 * File ini menyimpan nomor WhatsApp resmi Master Admin.
 * Jika sewaktu-waktu Anda ingin mengganti nomor WhatsApp Master Admin,
 * Anda cukup mengubah konstanta MASTER_ADMIN_PHONE di file ini!
 */

// Format lokal atau internasional (contoh: '08000000000' atau '6280000000000')
export const MASTER_ADMIN_PHONE = "08000000000";

/**
 * Mengubah nomor telepon menjadi format internasional angka bersih (diawali 62)
 * Contoh: '08000000000' -> '628000000000'
 */
export function getMasterAdminCleanPhone(
  phone: string = MASTER_ADMIN_PHONE,
): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("0")) {
    return "62" + digits.slice(1);
  }
  if (digits.startsWith("8")) {
    return "62" + digits;
  }
  return digits;
}

/**
 * Menghasilkan tautan langsung WhatsApp ke Master Admin
 * Contoh: 'https://wa.me/628000000000'
 */
export function getMasterAdminWaLink(
  customMessage?: string,
  phoneOverride?: string,
): string {
  const cleanPhone = getMasterAdminCleanPhone(
    phoneOverride || MASTER_ADMIN_PHONE,
  );
  const base = `https://wa.me/${cleanPhone}`;
  if (customMessage) {
    return `${base}?text=${encodeURIComponent(customMessage)}`;
  }
  return base;
}
