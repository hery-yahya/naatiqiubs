/** Pembantu berbagi link (salin & WhatsApp). */

import { fill } from './i18n';

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Cadangan untuk browser lama / tanpa izin papan klip
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

/** Buka WhatsApp dengan pesan berisi judul + link. */
export function shareToWhatsApp(template: string, title: string, url: string): void {
  const text = fill(template, { title, url });
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}

/** Judul tampilan dari nama file Drive (tanpa .mp3). */
export function displayName(fileName: string): string {
  return fileName.replace(/\.(mp3|wav|m4a|ogg)$/i, '');
}
