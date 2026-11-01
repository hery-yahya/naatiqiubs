/**
 * Koleksi Audio: penyimpanan di Google Drive lewat Google Apps Script.
 *
 * Cloudflare tidak menyimpan audio apa pun; ia hanya meneruskan permintaan ke
 * aplikasi web Apps Script milik sekolah (DRIVE_SCRIPT_URL) beserta kunci rahasia.
 */

import { readSecretHeader, secretMatches } from './auth';
import { Env, json } from './gemini';

export const TEACHER_HEADER = 'X-Teacher-Password';

export function isKoleksiConfigured(env: Env): boolean {
  return Boolean((env.DRIVE_SCRIPT_URL || '').trim() && (env.DRIVE_SCRIPT_TOKEN || '').trim());
}

export function isTeacherPasswordSet(env: Env): boolean {
  return Boolean((env.TEACHER_PASSWORD || '').trim());
}

export class KoleksiError extends Error {
  constructor(public code: string, message: string, public httpStatus: number) {
    super(message);
  }
}

export function koleksiErrorResponse(err: unknown): Response {
  if (err instanceof KoleksiError) {
    return json({ success: false, code: err.code, error: err.message }, err.httpStatus);
  }
  console.error('Koleksi error:', err);
  return json({ success: false, code: 'KOLEKSI_ERROR', error: 'Terjadi kesalahan pada Koleksi Audio.' }, 500);
}

/** Pastikan permintaan membawa sandi guru yang benar. */
export async function requireTeacher(request: Request, env: Env): Promise<void> {
  const expected = (env.TEACHER_PASSWORD || '').trim();
  if (!expected) {
    throw new KoleksiError(
      'TEACHER_NOT_SET',
      'Sandi guru belum dipasang. Tambahkan Secret TEACHER_PASSWORD di Cloudflare.',
      503
    );
  }
  const given = readSecretHeader(request, TEACHER_HEADER);
  if (!given || !(await secretMatches(expected, given))) {
    await new Promise((r) => setTimeout(r, 600));
    throw new KoleksiError('TEACHER_REQUIRED', 'Sandi guru salah atau belum dimasukkan.', 403);
  }
}

/** Kirim perintah ke Apps Script dan kembalikan balasannya. */
export async function callDriveScript(env: Env, payload: Record<string, unknown>): Promise<any> {
  if (!isKoleksiConfigured(env)) {
    throw new KoleksiError(
      'KOLEKSI_NOT_CONFIGURED',
      'Koleksi Audio belum diatur. Pasang DRIVE_SCRIPT_URL dan DRIVE_SCRIPT_TOKEN di Cloudflare (lihat README).',
      503
    );
  }
  let res: Response;
  try {
    res = await fetch((env.DRIVE_SCRIPT_URL || '').trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...payload, token: (env.DRIVE_SCRIPT_TOKEN || '').trim() }),
      redirect: 'follow',
    });
  } catch {
    throw new KoleksiError('SCRIPT_UNREACHABLE', 'Google Apps Script tidak bisa dihubungi. Coba lagi sebentar lagi.', 502);
  }

  const text = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    // Biasanya halaman login/izin Google: deployment belum "Siapa saja" atau URL salah.
    throw new KoleksiError(
      'SCRIPT_NOT_PUBLIC',
      'Apps Script tidak membalas dengan benar. Pastikan URL berakhiran /exec dan deployment diatur "Yang memiliki akses: Siapa saja".',
      502
    );
  }
  if (!data?.success) {
    const code = String(data?.code || 'SCRIPT_ERROR');
    const message =
      code === 'BAD_TOKEN'
        ? 'Kunci rahasia tidak cocok. Samakan DRIVE_SCRIPT_TOKEN di Cloudflare dengan KUNCI_RAHASIA di Apps Script.'
        : String(data?.error || 'Apps Script menolak permintaan.');
    const status = code === 'NOT_FOUND' || code === 'NOT_IN_COLLECTION' ? 404 : code === 'NO_AUDIO' ? 400 : 502;
    throw new KoleksiError(code, message, status);
  }
  return data;
}
