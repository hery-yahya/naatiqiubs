/**
 * Sandi masuk aplikasi.
 *
 * Satu sandi bersama disimpan sebagai Secret "APP_PASSWORD" di Cloudflare.
 * Tampilan mengirim sandi lewat header "X-App-Password" pada setiap permintaan ke /api/*.
 */

import { Env, json } from './gemini';

export const PASSWORD_HEADER = 'X-App-Password';

export function isPasswordRequired(env: Env): boolean {
  return Boolean((env.APP_PASSWORD || '').trim());
}

async function sha256(text: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return new Uint8Array(digest);
}

/** Bandingkan sandi tanpa membocorkan informasi lewat lama waktu proses. */
export async function passwordMatches(env: Env, candidate: string): Promise<boolean> {
  const expected = (env.APP_PASSWORD || '').trim();
  if (!expected) return true;
  const [a, b] = await Promise.all([sha256(expected), sha256(candidate.trim())]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function authRequiredResponse(): Response {
  return json(
    {
      success: false,
      code: 'AUTH_REQUIRED',
      error: 'Sandi salah atau belum dimasukkan. Silakan masuk kembali.',
    },
    401
  );
}

/**
 * Periksa sandi pada permintaan. Mengembalikan null kalau boleh lanjut,
 * atau balasan 401 kalau sandi salah/tidak ada.
 */
export async function checkAuth(request: Request, env: Env): Promise<Response | null> {
  if (!isPasswordRequired(env)) return null;
  const raw = request.headers.get(PASSWORD_HEADER) || '';
  let given = raw;
  try {
    given = decodeURIComponent(raw);
  } catch {
    // bukan teks terkode; pakai apa adanya
  }
  if (given && (await passwordMatches(env, given))) return null;
  // Perlambat sedikit agar menebak sandi berkali-kali jadi tidak praktis.
  await delay(600);
  return authRequiredResponse();
}
