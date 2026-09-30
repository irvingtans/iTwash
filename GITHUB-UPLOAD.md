# Upload iT Wash ke GitHub

Paket ini berisi source terbaru, termasuk pilihan logo iT Wash/iTworks dan invoice custom. Desain, fitur, dan data website aktif tidak diubah.

## Cara termudah: GitHub Desktop

1. Ekstrak `itwash-github-ready.zip`.
2. Di GitHub Desktop pilih **File → Add Local Repository**, lalu pilih folder `itwash` hasil ekstrak.
3. Jika folder belum menjadi repository Git, pilih **create a repository here**. Pastikan folder repository yang dipilih berisi `package.json`, `app/`, dan `.gitignore`.
4. Buat commit pertama dari file yang tersedia, lalu pilih **Publish repository**.
5. Gunakan nama `itwash` dan aktifkan **Keep this code private**, lalu publikasikan.

Jangan mengunggah ZIP sebagai satu file ke GitHub: GitHub tidak otomatis mengekstraknya menjadi source repository. Gunakan folder hasil ekstrak agar file tersembunyi seperti `.gitignore` dan `.env.example` ikut tersimpan.

## Alternatif: Terminal

Buat repository GitHub kosong bernama `itwash`, tanpa menambahkan README, license, atau gitignore otomatis. Buka Terminal di folder `itwash` hasil ekstrak, lalu jalankan:

```sh
git init
git add .
git commit -m "Initial iT Wash source"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/itwash.git
git push -u origin main
```

Ganti `YOUR_USERNAME` dengan username GitHub Anda. Masuk melalui autentikasi GitHub yang diminta; jangan menaruh token/password di source atau URL remote.

## Menjalankan source

Lihat `README.md` untuk penyiapan Node.js, environment lokal, dan database D1. `package.json` serta `package-lock.json` disertakan. Instal dependency dengan `npm ci`. Salin `.env.example` ke `.env` dan isi PIN sendiri sebelum menggunakan area admin.

## Isi paket

- Semua source aplikasi, komponen, logo, QRIS, script, dan migration database.
- `.gitignore` dan `.env.example` tanpa kredensial asli.
- Dua file di `build/` tetap disertakan karena merupakan source yang dibutuhkan aplikasi.
- Tidak menyertakan `node_modules/`, `.next/`, `dist/`, cache, log, `.git/`, `.env`, database lokal, atau data pelanggan/transaksi.

Repository GitHub menyimpan source; upload ini tidak memindahkan database produksi dan tidak otomatis menerbitkan website ke GitHub Pages. Aplikasi memerlukan runtime Worker dan D1, bukan hosting HTML statis saja.
