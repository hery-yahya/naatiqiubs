import { json, PagesContext, readJson } from '../gemini';
import { callDriveScript, KoleksiError, koleksiErrorResponse, requireTeacher } from '../koleksi';

/** Batas ukuran audio yang dikirim ke Drive (base64). ± 11 MB MP3 ≈ 20+ menit suara. */
const MAX_BASE64_CHARS = 15_000_000;

// POST /api/koleksi/list — daftar audio di Koleksi (semua yang sudah masuk aplikasi).
export const list = async ({ env }: PagesContext): Promise<Response> => {
  try {
    const data = await callDriveScript(env, { action: 'list' });
    return json({
      success: true,
      folderName: data.folderName,
      folderUrl: data.folderUrl,
      folders: Array.isArray(data.folders) ? data.folders : [],
      items: Array.isArray(data.items) ? data.items : [],
    });
  } catch (err) {
    return koleksiErrorResponse(err);
  }
};

// POST /api/koleksi/guru — periksa sandi guru (untuk tombol "Masuk sebagai guru").
export const teacherCheck = async ({ request, env }: PagesContext): Promise<Response> => {
  try {
    await requireTeacher(request, env);
    return json({ success: true });
  } catch (err) {
    return koleksiErrorResponse(err);
  }
};

// POST /api/koleksi/save — simpan MP3 ke Google Drive (khusus guru).
export const save = async ({ request, env }: PagesContext): Promise<Response> => {
  try {
    await requireTeacher(request, env);
    const body = await readJson(request);
    const base64 = typeof body.base64 === 'string' ? body.base64.replace(/\s+/g, '') : '';
    if (!base64) throw new KoleksiError('NO_AUDIO', 'Audio kosong.', 400);
    if (base64.length > MAX_BASE64_CHARS) throw new KoleksiError('TOO_LARGE', 'Audio terlalu besar untuk disimpan.', 413);
    if (!/^[A-Za-z0-9+/]+=*$/.test(base64)) throw new KoleksiError('BAD_AUDIO', 'Data audio rusak.', 400);

    const data = await callDriveScript(env, {
      action: 'save',
      base64,
      mimeType: 'audio/mpeg',
      fileName: typeof body.fileName === 'string' ? body.fileName.slice(0, 150) : 'Naatiq.mp3',
      folder: typeof body.folder === 'string' ? body.folder.slice(0, 80) : '',
      description: typeof body.description === 'string' ? body.description.slice(0, 4000) : '',
    });
    return json({ success: true, item: data.item });
  } catch (err) {
    return koleksiErrorResponse(err);
  }
};

// POST /api/koleksi/delete — pindahkan audio ke Sampah Google Drive (khusus guru).
export const remove = async ({ request, env }: PagesContext): Promise<Response> => {
  try {
    await requireTeacher(request, env);
    const body = await readJson(request);
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!id || !/^[A-Za-z0-9_-]{5,200}$/.test(id)) throw new KoleksiError('NO_ID', 'File tidak dikenali.', 400);
    await callDriveScript(env, { action: 'delete', id });
    return json({ success: true, id });
  } catch (err) {
    return koleksiErrorResponse(err);
  }
};
