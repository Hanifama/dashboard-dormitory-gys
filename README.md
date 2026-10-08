# GYS Dormitory Energy — Energy Dormitory Management System

Prototype frontend internal milik **PT. Garuda Yamato Steel** (GYS),
perusahaan manufaktur baja, untuk sistem manajemen energi asrama karyawan.
dibangun murni dengan **HTML + Tailwind CSS + Vanilla JavaScript**
(tanpa React / Vue / Angular / Bootstrap / backend / API).

Tema visual: **Eco Energy / Natural Technology** — hijau emerald &
forest yang lembut, modern, dan nyaman dipandang lama.

## Cara menjalankan

Tidak perlu build step. Cukup buka file-nya di browser:

- Mulai dari `login.html` (kredensial apa pun bisa masuk — prototype),
  lalu otomatis diarahkan ke `index.html`.
- Direkomendasikan: jalankan server statis dari folder ini:

```bash
# salah satu:
npx serve .
python -m http.server 8080
php -S localhost:8080
```

Lalu buka URL yang tampil di browser.

> Tailwind, Chart.js, Lucide, dan font dimuat dari CDN,
> jadi butuh koneksi internet saat pertama dibuka.

## Struktur

```text
dashboard/
├── login.html          # Halaman login + SSO (prototype)
├── index.html          # Dashboard: statistik, meter, energi, token, payment, alert, transaksi
├── dormitories.html      # Dormitory compounds + live counts
├── buildings.html        # Buildings per dormitory + live counts
├── floors.html           # Floors per building + occupancy
├── rooms.html            # Rooms + occupant + meter + capacity
├── employees.html      # Karyawan + tab detail (info, kamar, riwayat, transaksi)
├── meters.html         # Smart meter + connect/disconnect/recharge + riwayat penggantian
├── dcu.html            # DCU & IoT + meter terkoneksi + communication log
├── tokens.html         # Token 20 digit + resend + copy
├── transactions.html   # Transaksi pembelian energi + filter
├── payments.html       # Pembayaran + rekonsiliasi + admin fee
├── tariffs.html        # Tarif + tambah tarif + riwayat tarif
├── notifications.html  # Alarm + kategori + channel + threshold
├── reports.html        # 7 laporan + filter + export PDF/Excel/CSV
├── users.html          # Users CRUD + email + role + pagination
├── roles.html          # Roles & Access: CRUD + live user/access counts + Edit Access
├── access-menu.html    # Access Settings (deep-linked, not in sidebar) + save persists
├── audit-log.html      # Audit log + filter + sort + pagination + export CSV
├── settings.html       # System configuration (9 tab)
├── assets/
│   ├── js/
│   │   ├── data.js       # Seluruh dummy data terpusat & konsisten antar halaman
│   │   └── dashboard.js  # Table engine, modal generik, chart, tab, toast, theme
│   └── images/
│       └── favicon.svg
└── README.md
```

## Pola interaksi (tanpa backend)

- Sidebar 5 grup sesuai struktur menu, collapse di desktop, drawer di mobile
- Setiap halaman tabel: Tambah Data, search, filter, Export (CSV/Excel/PDF),
  aksi View / Edit / Delete (icon + tooltip), konfirmasi hapus, toast
- Modal generik untuk detail, form tambah/edit, dan konfirmasi
- Summary card kompak terisi otomatis dari data (`data-stat`)
- Chart konsumsi Daily/Weekly/Monthly + date picker (Chart.js)
- Dark / light mode tersimpan di `localStorage`
- Semua angka konsisten: kamar ↔ karyawan ↔ meter ↔ DCU ↔ token ↔ transaksi

## Catatan

Seluruh data adalah **dummy/static** untuk presentasi. v2.0 — prototype TOR.
Halaman `monitoring.html`, `energy.html`, `devices.html`, `analytics.html`
dari versi sebelumnya sudah dilebur ke struktur menu baru.
