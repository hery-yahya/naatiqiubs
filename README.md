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

## Info pada riwayat dan file unduhan

Setiap audio mencatat: penggalan teks, suara, gaya ekspresi, ekspresi tambahan (kalau diisi),
tempo bicara, serta tanggal dan jam pembuatan.

- **Nama file** contohnya:
  `Naatiq_2026-11-01_0636_Kore-Wanita_Gembira_Lambat-Jeda_أهلا-وسهلا-بكم.wav`
  atau untuk dialog: `Naatiq_2026-11-01_0940_Dialog-Puck-Charon_Netral_Normal_أحمد-السلام-عليكم.wav`
  (tanggal di depan supaya file tersusun urut waktu di folder).
- **Di dalam file WAV** tersimpan label judul, suara, dan keterangan lengkap (termasuk teks utuh).
  Label ini tampil di pemutar musik seperti VLC, dan di Properties/Info file.

## Rencana pengembangan

- [x] Langkah 1 — Online di Cloudflare, pesan error jelas, tanpa audio palsu
- [x] Langkah 2 — Sandi masuk, tempo Lambat / Lambat + jeda, riwayat di IndexedDB
- [x] Langkah 3 — Info tempo & ekspresi di riwayat dan file unduhan
- [x] Langkah 4 — **Dialog dua tokoh** (tetap ada mode Monolog), ekspresi per baris
- [ ] **Unduh MP3** — selain WAV, ukuran file lebih kecil untuk dibagikan lewat WhatsApp
- [ ] **Koleksi Audio** — audio disimpan di Cloudflare sehingga bisa dibuka dari perangkat mana pun
      (guru membuat, murid mendengarkan dari HP masing-masing)

---

## Susunan file (untuk yang ingin tahu)

```
wrangler.jsonc        ← pengaturan Cloudflare Worker
server/worker.ts      ← pintu masuk: /api/* ke server, sisanya ke tampilan
server/gemini.ts      ← cara memanggil Gemini + pesan error
server/auth.ts        ← pemeriksaan sandi masuk (APP_PASSWORD)
server/routes/        ← fungsi server (memanggil Gemini)
  status.ts             cek apakah kunci API & sandi sudah terpasang
  login.ts              periksa sandi dari layar masuk
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
