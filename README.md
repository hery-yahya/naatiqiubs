# Nāṭiq (ناطق) — TTS Bahasa Arab Fusha

Aplikasi web untuk mengubah teks Bahasa Arab fusha menjadi suara, dipakai untuk pembelajaran di IUBS.
Suara dibuat oleh **Gemini 3.8 Flash TTS**, dan aplikasinya di-online-kan lewat **Cloudflare Workers**.

---

## Cara memasang di Cloudflare (sekali saja)

Aplikasi ini berjalan sebagai **Cloudflare Worker** (pengaturannya ada di file `wrangler.jsonc`).

Yang dibutuhkan:
- Akun GitHub (repo ini).
- Akun Cloudflare gratis: <https://dash.cloudflare.com/sign-up>
- Kunci API Gemini dari Google AI Studio: <https://aistudio.google.com/apikey>

### Langkah 1 — Hubungkan repo ke Cloudflare
1. Di dashboard Cloudflare buka **Workers & Pages** → **Create application**.
2. Pilih **Import a repository** (Workers), hubungkan GitHub, pilih repo **naatiqiubs**.
3. Nama Worker: **naatiqiubs** (harus sama dengan `name` di `wrangler.jsonc`).

### Langkah 2 — Pengaturan build
| Kolom | Isi |
|---|---|
| Build command | `npm run build` (atau `bun run build`) |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |

Simpan dan tunggu deploy selesai (± 2–3 menit).

### Langkah 3 — Pasang kunci API Gemini
1. Buka Worker **naatiqiubs** → **Settings** → **Variables and Secrets** (bagian *Runtime variables and secrets*).
2. Klik **Add** → jenis **Secret** → nama `GEMINI_API_KEY` → tempel kunci Gemini → **Deploy**.

Pilih jenis **Secret**, bukan *Text*: Secret tetap tersimpan walaupun aplikasi di-deploy ulang dari GitHub.

### Langkah 3b — Pasang sandi masuk (sangat disarankan)
Tanpa sandi, siapa pun yang tahu alamat aplikasi bisa memakai kuota Gemini Anda.
1. Di tempat yang sama (**Settings → Variables and Secrets**) klik **Add**.
2. Key: `APP_PASSWORD` — Value: sandi pilihan Anda — centang **Secret** → **Add variable and deploy**.
3. Bagikan sandi ini kepada guru dan murid. Perangkat yang sudah pernah masuk akan diingat.

Untuk **mengganti sandi**, ubah nilai `APP_PASSWORD` lalu deploy. Semua perangkat akan diminta masuk ulang.
Untuk **membuka tanpa sandi**, hapus `APP_PASSWORD`.

### Langkah 4 — Coba
Buka alamat `https://naatiqiubs.<akun-anda>.workers.dev` (tombol **Visit**). Di pojok kanan atas
harus muncul **"Gemini TTS Terhubung"** (titik hijau). Kalau tertulis **"Kunci API Belum Dipasang"**,
ulangi Langkah 3.

Setiap perubahan yang masuk ke cabang `main` di GitHub otomatis diperbarui oleh Cloudflare.

---

## Kalau muncul pesan error

| Pesan | Artinya | Yang dilakukan |
|---|---|---|
| Kunci API Gemini belum dipasang | `GEMINI_API_KEY` belum ada di Cloudflare | Ulangi Langkah 3 |
| Kunci API Gemini ditolak | Kunci salah ketik / sudah dihapus | Buat kunci baru di AI Studio, ganti di Cloudflare |
| Kuota Gemini API sedang habis (429) | Batas pemakaian tercapai | Tunggu, atau aktifkan billing di proyek Google AI Studio |
| Teks terlalu panjang | Lebih dari 2.000 karakter | Bagi teks menjadi beberapa bagian |
| Gemini tidak bisa memproses teks ini | Isi teks ditolak Gemini | Periksa/persingkat teks |
| Sandi salah atau belum dimasukkan | Sandi diganti atau salah ketik | Masuk ulang dengan sandi terbaru |

Aplikasi **tidak pernah** membuat suara pengganti palsu. Kalau gagal, yang muncul adalah pesan error.

Catatan kuota: tombol **"Bandingkan 3 Gaya"** memakai kuota 3 kali dalam sekali klik.

## Nama suara

Agar familiar bagi murid, suara bawaan Gemini diberi nama Arab (yang dikirim ke Gemini tetap nama aslinya):

| Nama di aplikasi | Suara Gemini | Karakter |
|---|---|---|
| Zaid (زيد) | Fenrir | Pria, berwibawa, bass dalam |
| Musa (موسى) | Puck | Pria, ceria, energik |
| Yasir (ياسر) | Charon | Pria, tenang, mendalam |
| Maryam (مريم) | Kore | Wanita, hangat, jernih |
| Zainab (زينب) | Zephyr | Wanita, cerah, elegan |

Riwayat lama yang dibuat sebelum penggantian nama otomatis tampil dengan nama baru.

## Tempo bicara

| Pilihan | Cara kerja | Cocok untuk |
|---|---|---|
| Normal | Kecepatan biasa | Mendengar naskah utuh |
| Lambat | Gemini diminta berbicara pelan dan jelas | Murid pemula |
| Lambat + jeda | Sangat pelan, ada jeda setelah setiap kata (tanda `<short pause>` disisipkan otomatis) | Latihan menyimak dan imla |

Tempo dibuat oleh Gemini saat suara dibuat, jadi setelah mengganti tempo klik **Generate Suara** lagi.

Riwayat menyimpan 30 audio terakhir di browser masing-masing perangkat. Di mode incognito,
riwayat ikut terhapus saat jendela ditutup (itu sifat incognito).

## Mode Dialog (2 tokoh)

Pilih **Dialog** di atas editor, lalu tulis atau tempel naskah dengan format satu giliran per baris:

```
أحمد: السَّلَامُ عَلَيْكُمْ يَا عُمَرُ، كَيْفَ حَالُكَ؟
عمر (بفرح): وَعَلَيْكُمُ السَّلَامُ، أَنَا بِخَيْرٍ وَالْحَمْدُ لِلَّهِ.
```

- **Nama tokoh** terbaca otomatis dari naskah (maksimal 2 tokoh, batas dari Gemini). Pilih suara untuk tiap tokoh.
- **Ekspresi per baris** opsional. Cara termudah: letakkan kursor di sebuah baris (atau ketuk baris di pratinjau),
  lalu ketuk tombol ekspresi (😊 Gembira, 😢 Sedih, 😮 Heran, ❓ Bertanya, 🤫 Berbisik, dan lain-lain).
  Ketuk lagi untuk menghapus. Istilah Arabnya otomatis masuk ke naskah dalam kurung, misalnya `عمر (بفرح): ...`.
  Ekspresi lain bisa diketik di kolom "Ekspresi lain", atau ditulis langsung dalam kurung.
- Baris tanpa `Nama:` dianggap lanjutan baris sebelumnya.
- **Gaya**, **tempo**, dan **ekspresi tambahan** berlaku untuk seluruh dialog.
- **Harakat otomatis** dan **Asisten AI** (buat naskah / ubah ke fusha) menjaga format `Nama: teks`.
- Batas: 60 baris dan 3.000 karakter per dialog.
- Tombol **Bandingkan 3 Gaya** hanya ada di mode Monolog.

### Cara aplikasi memberi arahan ke Gemini

Sesuai saran dokumentasi Gemini TTS, arahan gaya dibuat **singkat dan berbahasa Inggris**
(naskahnya tetap bahasa Arab), misalnya `cheerful and enthusiastic, smiling; speaking slowly and clearly`.
Pada baris dialog yang diberi ekspresi, **ekspresi baris menggantikan gaya umum** agar tidak bertabrakan.
Ekspresi 🤫 Berbisik dan 😄 Tertawa juga diberi tanda khusus Gemini (`<whispering>`, `<laugh>`).

Gemini tetap model AI, jadi hasilnya bisa sedikit berbeda setiap kali dibuat. Kalau satu baris kurang pas,
cukup **Generate ulang**.

## Info pada riwayat dan file unduhan

Setiap audio mencatat: penggalan teks, suara, gaya ekspresi, ekspresi tambahan (kalau diisi),
tempo bicara, serta tanggal dan jam pembuatan.

- **Nama file** contohnya:
  `Naatiq_2026-11-01-0636_Maryam-Wanita_Gembira_Lambat-Jeda_أهلا-وسهلا-بكم.wav`
  atau untuk dialog: `Naatiq_2026-11-01-0940_Dialog-Musa-Yasir_Netral_Normal_أحمد-السلام-عليكم.wav`
  (tanggal di depan supaya file tersusun urut waktu di folder).
- **Di dalam file WAV** tersimpan label judul, suara, dan keterangan lengkap (termasuk teks utuh).
  Label ini tampil di pemutar musik seperti VLC, dan di Properties/Info file.

## Unduh MP3 atau WAV

Setiap audio (di pemutar, riwayat, dan perbandingan) punya dua tombol unduh:

| Format | Ukuran | Cocok untuk |
|---|---|---|
| **MP3** (64 kbps) | ± 6x lebih kecil (1 menit ≈ 0,5 MB) | Dibagikan lewat WhatsApp, diputar di HP |
| **WAV** | Besar (1 menit ≈ 2,9 MB) | Kualitas asli, untuk disunting |

MP3 dibuat langsung di browser, jadi **tidak memakai kuota Gemini** dan tidak membebani server.
Label judul, tokoh/suara, dan keterangan lengkap ikut tersimpan di dalam file MP3 (ID3).

Encoder MP3 memakai [lamejs](https://github.com/zhuker/lamejs), port JavaScript dari
[LAME](https://lame.sourceforge.io) (lisensi LGPL). File aslinya disimpan tanpa diubah di `public/vendor/`.

## Koleksi Audio (Google Drive)

Guru menyimpan audio ke **folder Google Drive sekolah**, lalu murid mendengarkan lewat link
(bisa dibuka siapa saja yang menerima link, tanpa sandi aplikasi). Di aplikasi ada tab **Koleksi**
berisi daftar audio, tombol **Putar**, **Salin link**, **WhatsApp**, dan **Hapus** (khusus guru).

- **Menyimpan & menghapus** hanya untuk guru (perlu **sandi guru**).
- **Melihat daftar Koleksi** di aplikasi perlu sandi aplikasi biasa.
- Audio disimpan sebagai **MP3** (dengan label judul/tokoh/keterangan), bisa dikelompokkan per **folder/kelas**.
- **Judul bawaan** saat menyimpan sama dengan nama file unduhan (dipisah spasi), misalnya
  `Naatiq 2026-11-01-1441 Zaid-Pria Formal-Berita Normal مرحبا بكم في درس`. Judul bisa diubah sebelum disimpan.
- **Hapus** = file dipindah ke **Sampah Google Drive** (masih bisa dipulihkan dari Drive selama 30 hari).
- Tidak memakai kartu kredit: penyimpanan memakai kuota Google Drive Anda (gratis 15 GB).

### Cara memasang Koleksi Audio (sekali saja, ± 10 menit)

**A. Siapkan folder Google Drive**
1. Buka <https://drive.google.com> dengan akun sekolah, buat folder baru, misalnya `Koleksi Nāṭiq`.
2. Buka folder itu. Salin **ID folder** dari alamat di browser:
   `https://drive.google.com/drive/folders/`**`1AbC...xyz`** ← bagian setelah `folders/`.

**B. Pasang skrip Apps Script**
1. Buka <https://script.google.com> → **Proyek baru**. Beri nama, misalnya `Nāṭiq Koleksi`.
2. Hapus semua isi `Code.gs`, lalu **tempel seluruh isi** file [`apps-script/Code.gs`](apps-script/Code.gs) dari repo ini.
3. Di bagian atas skrip, isi:
   - `FOLDER_ID` = ID folder dari langkah A.
   - `KUNCI_RAHASIA` = kata rahasia buatan Anda, minimal 16 huruf/angka acak (contoh: `naatiq7Xq2mP9vLk4Rz`).
4. Klik **Simpan** (ikon disket).
5. Klik **Deploy → Deployment baru** → ikon roda gigi → pilih **Aplikasi web**:
   - **Jalankan sebagai:** Saya
   - **Yang memiliki akses:** Siapa saja
6. Klik **Deploy** → **Izinkan akses** → pilih akun Google → (kalau muncul peringatan "Google belum memverifikasi
   aplikasi ini", klik **Lanjutan** → **Buka Nāṭiq Koleksi (tidak aman)** — ini aman karena skripnya milik Anda sendiri)
   → **Izinkan**.
7. Salin **URL aplikasi web** (berakhiran `/exec`).

**C. Pasang di Cloudflare** (Worker `naatiqiubs` → Settings → Variables and Secrets → Add, jenis **Secret**):

| Key | Value |
|---|---|
| `DRIVE_SCRIPT_URL` | URL aplikasi web dari langkah B.7 |
| `DRIVE_SCRIPT_TOKEN` | `KUNCI_RAHASIA` yang sama persis dengan di skrip |
| `TEACHER_PASSWORD` | sandi guru (berbeda dari sandi aplikasi; jangan dibagikan ke murid) |

Setelah deploy selesai, buka aplikasi → tab **Koleksi**. Masuk sebagai guru dengan sandi guru,
lalu di Studio buat audio dan klik **Simpan ke Koleksi**.

**Uji folder tanpa aplikasi:** di editor Apps Script, pilih fungsi **`cekFolder`** di toolbar atas, lalu klik **Jalankan**.
Buka **Log eksekusi**: kalau tertulis `BERHASIL: folder ditemukan`, skrip sudah bisa melihat folder Anda.

**Kalau skrip diubah nanti:** Deploy → **Kelola deployment** → ikon pensil → Versi: **Versi baru** → Deploy
(URL tetap sama, tidak perlu mengubah Cloudflare).

| Pesan error | Yang dilakukan |
|---|---|
| Koleksi Audio belum diatur | Pasang `DRIVE_SCRIPT_URL` dan `DRIVE_SCRIPT_TOKEN` di Cloudflare |
| Kunci rahasia tidak cocok | Samakan `DRIVE_SCRIPT_TOKEN` dengan `KUNCI_RAHASIA` di skrip |
| Apps Script tidak membalas dengan benar | Pastikan URL berakhiran `/exec` dan akses "Siapa saja" |
| FOLDER_ID belum diisi / Folder tidak ditemukan | Periksa `FOLDER_ID`; pastikan folder milik (atau dibagikan sebagai Editor ke) akun pembuat skrip; lalu buat **Versi baru** deployment. Uji dengan fungsi `cekFolder` (lihat di bawah) |
| Sandi guru belum dipasang | Tambahkan `TEACHER_PASSWORD` di Cloudflare |

## Rencana pengembangan

- [x] Langkah 1 — Online di Cloudflare, pesan error jelas, tanpa audio palsu
- [x] Langkah 2 — Sandi masuk, tempo Lambat / Lambat + jeda, riwayat di IndexedDB
- [x] Langkah 3 — Info tempo & ekspresi di riwayat dan file unduhan
- [x] Langkah 4 — **Dialog dua tokoh** (tetap ada mode Monolog), ekspresi per baris
- [x] Langkah 5 — Ekspresi lebih konsisten (arahan Gemini singkat)
- [x] Langkah 6 — **Unduh MP3** (selain WAV), dibuat di browser
- [x] Langkah 7 — **Koleksi Audio** di Google Drive (guru menyimpan, murid mendengarkan lewat link)

---

## Susunan file (untuk yang ingin tahu)

```
wrangler.jsonc        ← pengaturan Cloudflare Worker
server/worker.ts      ← pintu masuk: /api/* ke server, sisanya ke tampilan
server/gemini.ts      ← cara memanggil Gemini + pesan error
server/auth.ts        ← pemeriksaan sandi masuk (APP_PASSWORD)
server/koleksi.ts     ← jembatan ke Google Apps Script + sandi guru
apps-script/Code.gs   ← skrip Google Apps Script (ditempel di script.google.com)
server/routes/        ← fungsi server (memanggil Gemini)
  status.ts             cek apakah kunci API & sandi sudah terpasang
  login.ts              periksa sandi dari layar masuk
  koleksi.ts            daftar / simpan / hapus audio di Koleksi (Google Drive)
  tts-generate.ts       teks → suara (1 gaya)
  tts-compare-all.ts    teks → suara (3 gaya sekaligus)
  tts-dialog.ts         dialog 2 tokoh → satu audio
  ai-tashkeel.ts        beri harakat otomatis
  ai-generate-script.ts buat naskah dari topik
  ai-enhance-fusha.ts   ubah teks Indonesia/Inggris/'amiyah ke fusha
src/                  ← tampilan aplikasi (React)
```

Kunci API hanya disimpan di Cloudflare dan tidak pernah dikirim ke browser pengguna.

## Untuk pengembang (opsional)

```bash
npm install
cp .dev.vars.example .dev.vars   # isi GEMINI_API_KEY
npm run preview                  # build + jalankan Worker secara lokal
```

`npm run dev` hanya menjalankan tampilan; fitur suara butuh `npm run preview`.
