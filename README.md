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

Aplikasi **tidak pernah** membuat suara pengganti palsu. Kalau gagal, yang muncul adalah pesan error.

Catatan kuota: tombol **"Bandingkan 3 Gaya"** memakai kuota 3 kali dalam sekali klik.

---

## Susunan file (untuk yang ingin tahu)

```
wrangler.jsonc        ← pengaturan Cloudflare Worker
server/worker.ts      ← pintu masuk: /api/* ke server, sisanya ke tampilan
server/gemini.ts      ← cara memanggil Gemini + pesan error
server/routes/        ← fungsi server (memanggil Gemini)
  status.ts             cek apakah kunci API sudah terpasang
  tts-generate.ts       teks → suara (1 gaya)
  tts-compare-all.ts    teks → suara (3 gaya sekaligus)
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
