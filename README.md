# Nāṭiq (ناطق) — TTS Bahasa Arab Fusha

Aplikasi web untuk mengubah teks Bahasa Arab fusha menjadi suara, dipakai untuk pembelajaran di IUBS.
Suara dibuat oleh **Gemini 3.8 Flash TTS**, dan aplikasinya di-online-kan lewat **Cloudflare Pages**.

---

## Cara memasang di Cloudflare (sekali saja)

Yang dibutuhkan:
- Akun GitHub (repo ini).
- Akun Cloudflare gratis: <https://dash.cloudflare.com/sign-up>
- Kunci API Gemini dari Google AI Studio: <https://aistudio.google.com/apikey>

### Langkah 1 — Buat proyek Pages
1. Masuk ke dashboard Cloudflare.
2. Buka menu **Workers & Pages** → **Create** → pilih tab **Pages** → **Import an existing Git repository**.
3. Hubungkan akun GitHub, lalu pilih repo **naatiqiubs**.

### Langkah 2 — Isi pengaturan build
| Kolom | Isi |
|---|---|
| Framework preset | **None** (atau Vite) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | biarkan kosong |

Klik **Save and Deploy**. Tunggu sampai selesai (± 1–3 menit).

### Langkah 3 — Pasang kunci API Gemini
1. Buka proyek Pages Anda → **Settings** → **Variables and Secrets**.
2. Klik **Add** → pilih jenis **Secret**.
3. Nama: `GEMINI_API_KEY` — Nilai: tempel kunci API Gemini Anda.
4. Simpan untuk lingkungan **Production** (dan **Preview** bila perlu).
5. Buka tab **Deployments** → pada deploy teratas klik **⋯** → **Retry deployment**,
   supaya kunci yang baru dipasang ikut terbaca.

### Langkah 4 — Coba
Buka alamat `https://<nama-proyek>.pages.dev`. Di pojok kanan atas harus muncul status
**"Gemini TTS Terhubung"** (titik hijau). Kalau tertulis **"Kunci API Belum Dipasang"**,
ulangi Langkah 3.

Setiap kali ada perubahan yang di-upload ke GitHub, Cloudflare otomatis memperbarui aplikasinya.

---

## Kalau muncul pesan error

| Pesan | Artinya | Yang dilakukan |
|---|---|---|
| Kunci API Gemini belum dipasang | `GEMINI_API_KEY` belum ada di Cloudflare | Ulangi Langkah 3 |
| Kunci API Gemini ditolak | Kunci salah ketik / sudah dihapus | Buat kunci baru di AI Studio, ganti di Cloudflare |
| Kuota Gemini API sedang habis (429) | Batas pemakaian tercapai | Tunggu, atau aktifkan billing di proyek Google AI Studio |
| Teks terlalu panjang | Lebih dari 2.000 karakter | Bagi teks menjadi beberapa bagian |
| Gemini tidak bisa memproses teks ini | Isi teks ditolak Gemini | Periksa/persingkat teks |

Aplikasi **tidak pernah** membuat suara pengganti palsu. Kalau gagal, yang muncul adalah pesan error.

Catatan kuota: tombol **"Bandingkan 3 Gaya"** memakai kuota 3 kali dalam sekali klik.

---

## Susunan file (untuk yang ingin tahu)

```
functions/api/        ← "server" yang berjalan di Cloudflare (memanggil Gemini)
  status.ts             cek apakah kunci API sudah terpasang
  tts/generate.ts       teks → suara (1 gaya)
  tts/compare-all.ts    teks → suara (3 gaya sekaligus)
  ai/tashkeel.ts        beri harakat otomatis
  ai/generate-script.ts buat naskah dari topik
  ai/enhance-fusha.ts   ubah teks Indonesia/Inggris/'amiyah ke fusha
server/gemini.ts      ← kode bersama: cara memanggil Gemini + pesan error
src/                  ← tampilan aplikasi (React)
```

Kunci API hanya disimpan di Cloudflare dan tidak pernah dikirim ke browser pengguna.

## Untuk pengembang (opsional)

```bash
npm install
cp .dev.vars.example .dev.vars   # isi GEMINI_API_KEY
npm run preview                  # build + jalankan Cloudflare Pages secara lokal
```

`npm run dev` hanya menjalankan tampilan; fitur suara butuh `npm run preview`.
