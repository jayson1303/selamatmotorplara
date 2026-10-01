# SELAMATMOTORPLARA

Website dealer sepeda motor Honda Palabuhanratu. Situs statis HTML, CSS, dan JavaScript dengan katalog produk, simulasi kredit, dan dashboard admin.

## Firebase

- Project ID: `selamatmotorplara-cb4d4`
- Firestore location: `asia-southeast2` (Jakarta)
- Authentication: Email/Password, akun admin `andra@admin.com`
- Koleksi/dokumen yang digunakan: `products`, `testimonials`, `settings/contact`, `settings/waTemplate`, `hero/main`, dan `about/main`.

Lengkapi `apiKey`, `authDomain`, `storageBucket`, `messagingSenderId`, dan `appId` di `js/firebase-config.js` menggunakan Firebase Console → Project settings → Your apps. Nilainya belum tersedia di project ini, jadi koneksi Firestore, Storage, dan Authentication belum aktif hingga konfigurasi tersebut ditambahkan. Jangan menggunakan kredensial project lama atau menyimpan password admin di source code.

Deploy rules dari `firestore.rules` dan `storage.rules`. Konten publik dapat dibaca pengunjung; operasi tulis hanya tersedia untuk user Firebase Authentication dengan email `andra@admin.com`.

## Admin

Buka `/admin/login.html`. Halaman dashboard memakai Firebase Authentication untuk login, session, proteksi halaman, dan logout. Aktifkan provider Email/Password di Firebase Console dan gunakan akun admin yang sudah dibuat di project tersebut.

## Kontak

- WhatsApp: <https://wa.me/6285715787494>
- TikTok: <https://www.tiktok.com/@andraselamatmotorplara?_r=1&_t=ZS-9A67WanIVXD>
- Facebook: <https://www.facebook.com/share/14tu7EkBkFd/>
- Instagram: <https://www.instagram.com/el_premmm?stkn=MW5paHpodGdqMDI5MQ==>
