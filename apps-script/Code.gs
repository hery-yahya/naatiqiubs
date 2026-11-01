/**
 * Nāṭiq — Jembatan Koleksi Audio ke Google Drive
 * ============================================================
 * Skrip ini menerima audio MP3 dari aplikasi Nāṭiq (Cloudflare) lalu menyimpannya
 * ke folder Google Drive Anda. Setiap file otomatis bisa dibuka oleh siapa saja yang
 * punya link-nya (cocok dibagikan lewat WhatsApp).
 *
 * CARA PASANG (ringkas — panduan lengkap ada di README repo):
 * 1. Buka https://script.google.com → Proyek baru → hapus isi Code.gs → tempel seluruh file ini.
 * 2. Isi FOLDER_ID dan KUNCI_RAHASIA di bawah, lalu klik Simpan (ikon disket).
 * 3. Deploy → Deployment baru → jenis "Aplikasi web":
 *      - Jalankan sebagai : Saya (akun Anda)
 *      - Yang memiliki akses : Siapa saja
 *    Klik Deploy, izinkan akses, lalu salin "URL aplikasi web" (berakhiran /exec).
 * 4. Di Cloudflare (Worker naatiqiubs → Settings → Variables and Secrets) tambahkan Secret:
 *      DRIVE_SCRIPT_URL   = URL aplikasi web tadi
 *      DRIVE_SCRIPT_TOKEN = KUNCI_RAHASIA yang sama dengan di bawah
 *
 * Kalau skrip ini diubah, lakukan Deploy → Kelola deployment → Edit → Versi: "Versi baru".
 */

// ID folder Google Drive tujuan. Boleh ID-nya saja atau seluruh alamat folder, contoh:
// https://drive.google.com/drive/folders/INI_ID_FOLDERNYA
var FOLDER_ID = 'TEMPEL_ID_FOLDER_DI_SINI';

// Kunci rahasia: buat sendiri, minimal 16 karakter acak (huruf & angka). Jangan dibagikan.
var KUNCI_RAHASIA = 'GANTI_DENGAN_KUNCI_RAHASIA_ANDA';

// ------------------------------------------------------------
// Tidak perlu mengubah apa pun di bawah baris ini.
// ------------------------------------------------------------

var MAX_FILES_IN_LIST = 500;

function doGet() {
  return ContentService.createTextOutput('Nāṭiq Koleksi: skrip aktif. Gunakan dari aplikasi Nāṭiq.');
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!KUNCI_RAHASIA || KUNCI_RAHASIA.indexOf('GANTI_') === 0 || String(body.token || '') !== KUNCI_RAHASIA) {
      return reply_({ success: false, code: 'BAD_TOKEN', error: 'Kunci rahasia salah atau belum diisi di Apps Script.' });
    }
    var root = getRoot_();
    switch (body.action) {
      case 'ping':
        return reply_({ success: true, folderName: root.getName(), folderUrl: root.getUrl() });
      case 'save':
        return reply_(save_(root, body));
      case 'list':
        return reply_(list_(root));
      case 'delete':
        return reply_(remove_(root, body));
      default:
        return reply_({ success: false, code: 'BAD_ACTION', error: 'Perintah tidak dikenal.' });
    }
  } catch (err) {
    return reply_({ success: false, code: 'SCRIPT_ERROR', error: String((err && err.message) || err) });
  }
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Ambil ID folder dari FOLDER_ID (boleh berupa alamat lengkap, misalnya .../folders/ID?hl=ID). */
function folderId_() {
  var raw = String(FOLDER_ID || '').trim();
  var fromUrl = raw.match(/folders\/([-\w]{10,})/);
  if (fromUrl) return fromUrl[1];
  var idParam = raw.match(/[?&]id=([-\w]{10,})/);
  if (idParam) return idParam[1];
  return raw.replace(/[?#].*$/, '').replace(/[^-\w]/g, '');
}

function getRoot_() {
  if (!FOLDER_ID || FOLDER_ID.indexOf('TEMPEL_') === 0) {
    throw new Error('FOLDER_ID belum diisi di Apps Script.');
  }
  var id = folderId_();
  try {
    return DriveApp.getFolderById(id);
  } catch (err) {
    var who = '';
    try {
      who = Session.getEffectiveUser().getEmail();
    } catch (e2) {
      // abaikan
    }
    throw new Error(
      'Folder Drive tidak ditemukan (ID: ' + id + '). Pastikan folder itu milik/dibagikan ke akun ' +
        (who || 'pembuat skrip') +
        ' sebagai Editor, lalu buat "Versi baru" di Deploy > Kelola deployment.'
    );
  }
}

/**
 * Uji cepat dari editor Apps Script: pilih fungsi "cekFolder" di toolbar, lalu klik Jalankan.
 * Hasilnya muncul di "Log eksekusi".
 */
function cekFolder() {
  var folder = getRoot_();
  Logger.log('BERHASIL: folder ditemukan -> "' + folder.getName() + '" (' + folder.getUrl() + ')');
  Logger.log('Akun skrip: ' + Session.getEffectiveUser().getEmail());
  if (!KUNCI_RAHASIA || KUNCI_RAHASIA.indexOf('GANTI_') === 0) {
    Logger.log('PERHATIAN: KUNCI_RAHASIA belum diganti.');
  }
}

/** Bersihkan nama agar aman dipakai sebagai nama file/folder. */
function cleanName_(name, maxLen) {
  return String(name || '')
    .replace(/[\\/]/g, ' - ')
    .replace(/[:*?"<>|\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+(\.[a-z0-9]{2,4})$/i, '$1')
    .trim()
    .slice(0, maxLen || 120);
}

/** Ambil subfolder (dibuat kalau belum ada). Nama kosong = folder utama. */
function getSubfolder_(root, name) {
  var clean = cleanName_(name, 80);
  if (!clean) return root;
  var it = root.getFoldersByName(clean);
  if (it.hasNext()) return it.next();
  return root.createFolder(clean);
}

function save_(root, body) {
  if (!body.base64) return { success: false, code: 'NO_AUDIO', error: 'Audio kosong.' };
  var fileName = cleanName_(body.fileName, 150) || 'Naatiq.mp3';
  if (!/\.mp3$/i.test(fileName)) fileName += '.mp3';
  var folder = getSubfolder_(root, body.folder);
  var bytes = Utilities.base64Decode(body.base64);
  var blob = Utilities.newBlob(bytes, body.mimeType || 'audio/mpeg', fileName);
  var file = folder.createFile(blob);
  if (body.description) file.setDescription(String(body.description).slice(0, 4000));
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (err) {
    // Kebijakan akun bisa melarang berbagi publik; file tetap tersimpan.
  }
  return { success: true, item: toItem_(file, folder === root ? '' : folder.getName()) };
}

function toItem_(file, folderName) {
  var id = file.getId();
  return {
    id: id,
    name: file.getName(),
    folder: folderName,
    url: 'https://drive.google.com/file/d/' + id + '/view?usp=sharing',
    previewUrl: 'https://drive.google.com/file/d/' + id + '/preview',
    created: file.getDateCreated().getTime(),
    size: file.getSize(),
    description: file.getDescription() || '',
  };
}

function isAudio_(file) {
  var type = String(file.getMimeType() || '');
  return type.indexOf('audio/') === 0 || /\.(mp3|wav|m4a|ogg)$/i.test(file.getName());
}

function list_(root) {
  var items = [];
  var folders = [];
  var files = root.getFiles();
  while (files.hasNext() && items.length < MAX_FILES_IN_LIST) {
    var f = files.next();
    if (isAudio_(f)) items.push(toItem_(f, ''));
  }
  var subs = root.getFolders();
  while (subs.hasNext()) {
    var sub = subs.next();
    var subName = sub.getName();
    folders.push(subName);
    var subFiles = sub.getFiles();
    while (subFiles.hasNext() && items.length < MAX_FILES_IN_LIST) {
      var sf = subFiles.next();
      if (isAudio_(sf)) items.push(toItem_(sf, subName));
    }
  }
  items.sort(function (a, b) {
    return b.created - a.created;
  });
  folders.sort();
  return { success: true, folderName: root.getName(), folderUrl: root.getUrl(), folders: folders, items: items };
}

/** Pindahkan file ke Sampah (masih bisa dipulihkan dari Google Drive selama 30 hari). */
function remove_(root, body) {
  var id = String(body.id || '');
  if (!id) return { success: false, code: 'NO_ID', error: 'File tidak disebutkan.' };
  var file;
  try {
    file = DriveApp.getFileById(id);
  } catch (err) {
    return { success: false, code: 'NOT_FOUND', error: 'File tidak ditemukan.' };
  }
  if (!isInside_(file, root)) {
    return { success: false, code: 'NOT_IN_COLLECTION', error: 'File ini bukan bagian dari Koleksi.' };
  }
  file.setTrashed(true);
  return { success: true, id: id };
}

/** Pastikan file berada di folder Koleksi atau salah satu subfolder langsungnya. */
function isInside_(file, root) {
  var rootId = root.getId();
  var parents = file.getParents();
  while (parents.hasNext()) {
    var p = parents.next();
    if (p.getId() === rootId) return true;
    var grand = p.getParents();
    while (grand.hasNext()) {
      if (grand.next().getId() === rootId) return true;
    }
  }
  return false;
}
