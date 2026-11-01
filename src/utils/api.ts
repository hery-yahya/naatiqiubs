/**
 * Pembantu untuk memanggil server (/api/*) dari tampilan.
 * Otomatis menyertakan sandi masuk yang tersimpan di perangkat ini.
 */

const PASSWORD_STORAGE_KEY = 'naatiq_app_password';
export const AUTH_REQUIRED_EVENT = 'naatiq:auth-required';

export function getStoredPassword(): string {
  try {
    return localStorage.getItem(PASSWORD_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredPassword(password: string): void {
  try {
    localStorage.setItem(PASSWORD_STORAGE_KEY, password);
  } catch {
    // penyimpanan browser tidak tersedia; sandi hanya berlaku sampai halaman ditutup
  }
  memoryPassword = password;
}

export function clearStoredPassword(): void {
  try {
    localStorage.removeItem(PASSWORD_STORAGE_KEY);
  } catch {
    // abaikan
  }
  memoryPassword = '';
}

// Cadangan kalau localStorage diblokir browser.
let memoryPassword = '';

function currentPassword(): string {
  return getStoredPassword() || memoryPassword;
}

/* ---------------- Sandi guru (untuk menyimpan/menghapus di Koleksi) ---------------- */

const TEACHER_STORAGE_KEY = 'naatiq_teacher_password';
export const TEACHER_CHANGED_EVENT = 'naatiq:teacher-changed';
let memoryTeacher = '';

export function getTeacherPassword(): string {
  try {
    return localStorage.getItem(TEACHER_STORAGE_KEY) || memoryTeacher;
  } catch {
    return memoryTeacher;
  }
}

export function setTeacherPassword(password: string): void {
  memoryTeacher = password;
  try {
    localStorage.setItem(TEACHER_STORAGE_KEY, password);
  } catch {
    // abaikan
  }
  window.dispatchEvent(new Event(TEACHER_CHANGED_EVENT));
}

export function clearTeacherPassword(): void {
  memoryTeacher = '';
  try {
    localStorage.removeItem(TEACHER_STORAGE_KEY);
  } catch {
    // abaikan
  }
  window.dispatchEvent(new Event(TEACHER_CHANGED_EVENT));
}

/** Kirim permintaan POST JSON ke server dan baca balasannya. */
export async function apiPost(
  path: string,
  body: unknown,
  options: { teacher?: boolean; teacherPassword?: string } = {}
): Promise<{ res: Response; data: any }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const password = currentPassword();
  // Dikodekan agar sandi berhuruf Arab/simbol tetap aman dikirim lewat header.
  if (password) headers['X-App-Password'] = encodeURIComponent(password);
  const teacher = options.teacherPassword ?? (options.teacher ? getTeacherPassword() : '');
  if (teacher) headers['X-Teacher-Password'] = encodeURIComponent(teacher);

  const res = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res
    .json()
    .catch(() => ({ success: false, error: `Server tidak merespons dengan benar (HTTP ${res.status}).` }));

  if (res.status === 401 && data?.code === 'AUTH_REQUIRED') {
    clearStoredPassword();
    window.dispatchEvent(new Event(AUTH_REQUIRED_EVENT));
  }
  if (res.status === 403 && data?.code === 'TEACHER_REQUIRED' && options.teacher && !options.teacherPassword) {
    clearTeacherPassword();
  }
  return { res, data };
}

/** Periksa sandi ke server. */
export async function verifyPassword(password: string): Promise<boolean> {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) return false;
  const data = await res.json().catch(() => null);
  return Boolean(data?.success);
}
