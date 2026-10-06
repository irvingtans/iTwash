# iT Wash — Cloudflare Workers production

## Status pekerjaan

- Aplikasi memakai React/Vinext dengan Worker server dan aset browser. Deploy ke **Workers**, bukan GitHub Pages atau Pages static upload.
- Tampilan, routes, harga, fitur invoice, autentikasi PIN, dan SQL aplikasi tidak diubah.
- Database `itwash-production` sudah dibuat pada akun Cloudflare pengguna. Binding: `DB`.
- Database ID: `a21b08bc-46f7-4cfa-8838-ae2ae9c69d53`.
- Schema dari keenam migration asli sudah diterapkan ke database baru melalui D1 Console. `d1_migrations` mencatat keenam nama migration, sehingga Wrangler tidak mengulanginya. Verifikasi: 6 migration, 20 kolom jobs, 0 transaksi.
- Database baru KOSONG. Data pelanggan, transaksi, dan pengaturan PIN pada hosting lama belum dipindahkan. Source GitHub tidak memuat data tersebut. Jangan menganggap deployment baru sebagai pengganti data lama sebelum migrasi data diverifikasi.
- ID akun/database bukan password. PIN dan token tidak disimpan di konfigurasi ini.

## File yang perlu masuk GitHub

Gunakan paket update Cloudflare yang disertakan, ekstrak dan upload ISINYA ke root repository `irvingtans/iTwash`. Pertahankan folder `scripts/`. Jangan upload ZIP sebagai satu file, jangan hapus source lain.

File utama baru: `wrangler.cloudflare.json`, `scripts/cloudflare.mjs`, panduan ini. File yang diperbarui: `package.json`, `vite.config.ts`, `.gitignore`, `README.md`. `.env.example` hanya memuat nama variabel kosong.

## Klik di Cloudflare Dashboard

1. Buka akun **Irvingtans@icloud.com's Account**.
2. Pilih **Compute → Workers & Pages → Create application → Connect GitHub**. Jangan pilih “Upload your static files” atau “Continue to Pages”.
3. Hubungkan akun GitHub `irvingtans`. Pada izin GitHub pilih **Only select repositories → iTwash**, lalu setujui sendiri izin yang diminta. Jangan memberikan akses ke semua repository bila tidak diperlukan.
4. Pilih repository **irvingtans/iTwash**, branch **main**, lanjutkan konfigurasi.
5. Isi pengaturan berikut:

| Pengaturan | Nilai |
| --- | --- |
| Worker / project name | `itwash` |
| Production branch | `main` |
| Root directory | `/` (folder yang berisi package.json) |
| Build command | `npm ci && npm run build:cloudflare` |
| Deploy command | `npm run deploy:cloudflare` |
| Build variable | `NODE_VERSION` = `22.16.0` |
| Non-production / preview branch builds | Nonaktifkan untuk konfigurasi database produksi ini |

Tidak ada “output directory” statis yang perlu diisi. Script deploy menggunakan `dist/server/wrangler.json` hasil build, dengan aset dari `dist/client`.

6. Periksa **Build API token**. Deploy command menjalankan migration D1 sebelum upload. Token perlu izin akun **Workers Scripts: Edit** dan **D1: Edit** untuk akun ini. Token otomatis Cloudflare dapat belum mencakup D1. Di **My Profile → API Tokens**, edit token build yang dipilih untuk menambahkan **Account → D1 → Edit**, atau pilih token build khusus dengan izin tersebut di **Worker → Settings → Build → API token**. Jangan kirim token ke chat atau masukkan ke GitHub. Jika D1 ditolak, deploy berhenti; tambahkan izin lalu Retry build.
7. Klik **Deploy**. Bila ada pengaturan PIN belum diisi, area admin akan tetap terkunci sampai langkah berikut selesai.
8. Buka Worker **itwash → Settings → Variables and Secrets → Add**. Pilih tipe **Secret** dan tambahkan tiga nama ini SATU PER SATU. Isi nilainya sendiri:

| Secret runtime | Fungsi |
| --- | --- |
| `STAFF_PIN` | Akses karyawan |
| `CUSTOMERS_PIN` | Akses data pelanggan dari area karyawan |
| `OWNER_PIN` | Akses owner |

Gunakan 4–8 angka, dengan PIN berbeda per bagian. Nilai tidak dicantumkan dalam source. Klik **Save / Deploy** jika diminta. PIN yang kelak diganti lewat dashboard owner disimpan sebagai hash di D1 dan mengalahkan nilai fallback secret.

9. Periksa **Worker → Bindings**: nama variabel `DB`, tipe D1, database `itwash-production`. Konfigurasi file sudah memasang binding ini; jangan membuat binding dengan nama lain.
10. Buka alamat `workers.dev` yang ditampilkan Dashboard. Uji halaman utama, login staff dan owner, input cucian contoh, cek status, pembayaran, serta invoice sebelum dipakai operasional. Hapus/void transaksi uji melalui fitur aplikasi bila diperlukan.
11. Untuk domain sendiri: **Settings → Domains & Routes → Add → Custom Domain**. Ini opsional; alamat workers.dev cukup untuk mulai menggunakan aplikasi.

Push berikutnya ke main akan memicu build dan deploy. Build saja tidak menulis ke database. Production deploy menerapkan hanya migration yang belum tercatat sebelum menerbitkan Worker. Jangan menjalankan deploy produksi dari branch preview; preview memerlukan Worker dan D1 terpisah.

## Perintah alternatif jika memakai Terminal

Jalankan dari folder source dengan Node.js 22.13+:

```sh
npm ci
npx wrangler login
npm run build:cloudflare
npm run check:cloudflare
npm run deploy:cloudflare
npx wrangler secret put STAFF_PIN --config wrangler.cloudflare.json
npx wrangler secret put CUSTOMERS_PIN --config wrangler.cloudflare.json
npx wrangler secret put OWNER_PIN --config wrangler.cloudflare.json
```

Perintah secret meminta nilai secara interaktif. Jangan menulis nilainya di command line, source, screenshot, atau commit. `check:cloudflare` hanya dry-run. `deploy:cloudflare` benar-benar menjalankan migration remote dan menerbitkan Worker. Untuk migration tanpa deploy: `npm run db:migrate:cloudflare`.

CLI bisa menggunakan login OAuth. CI eksternal seperti GitHub Actions memerlukan `CLOUDFLARE_API_TOKEN` dan `CLOUDFLARE_ACCOUNT_ID` dalam secret CI; **tidak diperlukan sebagai secret runtime aplikasi**. Workers Builds menyediakan autentikasi lewat pilihan Build API token. Tidak ada API key QRIS yang dibutuhkan oleh fitur yang saat ini sudah dibuat; integrasi API QRIS belum diimplementasikan.

## Pengujian yang sudah dilakukan

- TypeScript check dan `npm run build:cloudflare`: berhasil.
- Wrangler deployment dry-run dengan binding D1 produksi: berhasil; tidak menerbitkan Worker.
- Enam migration dijalankan pada D1 lokal kosong; schema cocok dengan aplikasi.
- Server hasil build lokal: halaman utama, pelanggan, admin, owner, karyawan, data pelanggan dan logo merespons; API privat tanpa sesi mengembalikan 401.
- D1 produksi baru: schema sudah diverifikasi, belum ada data pelanggan.
- Pembuatan Worker, sambungan GitHub, runtime secrets, dan pengujian URL publik baru harus dikonfirmasi sesudah langkah Dashboard selesai.

## Data dari hosting lama

Konfigurasi ini bukan salinan database lama. Jika riwayat lama harus tetap ada, gunakan ekspor resmi dari hosting lama ke saluran privat, verifikasi schema/migration ledger, lalu impor ke D1 yang telah disiapkan. Jangan mengunggah dump database ke GitHub atau menyalin state `.wrangler/`. Jangan menjalankan ulang migration `0005_reset_owner_pin.sql` pada database lama: migration tersebut memang mereset override PIN owner dan sesi owner satu kali.

## Referensi

- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/
- https://developers.cloudflare.com/d1/reference/migrations/
- https://developers.cloudflare.com/workers/configuration/secrets/

Versi dependency yang sudah dikunci tetap digunakan; tidak ada upgrade framework sebagai bagian pekerjaan ini.

## Dynamic QRIS (InterActive)

The application uses the official Create Invoice and Check Invoice APIs. NMID alone is insufficient: request Open API activation, APIKEY, and mID from InterActive for the existing IT WASH merchant (NMID ID1025433287535).

In Cloudflare → Workers & Pages → itwash → Settings → Variables and Secrets, add **Secret** values `QRIS_API_KEY` and `QRIS_MID` from the activation email, then deploy. Never paste credentials into GitHub, source code, screenshots, or chat. These are runtime secrets, not build variables. Without both values, existing static QRIS remains available and automatic verification is disabled.

Ask InterActive to configure this webhook URL for the merchant:

`https://itwash.irvingtans.workers.dev/api/qris/webhook`

The documented webhook has no signature. The application never trusts its payment status: it looks up the stored provider invoice and verifies it with the authenticated provider API. Unknown invoices do not trigger provider calls. Status checks are throttled to once per minute per invoice; the cashier can also press **Cek pembayaran QRIS**. UI refreshes only read the local database and never continuously poll InterActive.

Apply migration `0006_dynamic_qris.sql` through the normal deploy command before publishing code; do not recreate D1 or replay old migrations. The table retains provider invoices and payment reconciliation state. Amount edits and manual payments are blocked while a generated QR is active. After expiry, the cashier must verify the old invoice is unpaid before another QR or payment method is allowed. Provider errors do not mark orders paid or unlock them prematurely. A lost generation response is locked for its 30 minute lifetime; reopening the payment dialog recovers any persisted invoice.

A provider-confirmed payment updates revenue once; pickup remains a separate staff action. Conflicting/late receipts are flagged **Perlu rekonsiliasi owner** instead of overwriting another payment. Staff/owner see verified receipts from the past 24 hours. Review unresolved items against the InterActive merchant dashboard; do not ask customers to pay again merely because verification timed out. Voiding a sale does not refund a QRIS payment.

Validate locally with `node scripts/test-qris.mjs` and `npm run build:cloudflare`. Tests use an in-memory database and fake provider responses. A successful build does **not** prove live merchant activation. InterActive production scans move real funds; obtain the owner's explicit approval before any real-money test. Verify Open API activation, correct merchant/amount, verification, notifications, and paid invoice behavior during the owner's first authorized live payment.

Official provider documentation: https://qris.id/api-doc/create-invoice.php and https://qris.id/api-doc/check-invoice.php and https://qris.id/api-doc/webhook.php
