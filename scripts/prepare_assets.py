import os
import shutil

# 1. Create target directories
os.makedirs('assets/img/logo', exist_ok=True)
os.makedirs('assets/img/hero', exist_ok=True)
os.makedirs('assets/img/about', exist_ok=True)
os.makedirs('assets/img/testimonials', exist_ok=True)
os.makedirs('assets/products', exist_ok=True)

# 2. Copy Logos
if os.path.exists('logo/logo-transparent.png'):
    shutil.copy('logo/logo-transparent.png', 'assets/img/logo/logo-transparent.png')
if os.path.exists('logo/logo.png'):
    shutil.copy('logo/logo.png', 'assets/img/logo/logo.png')
if os.path.exists('logo/WhatsApp Image 2026-08-31 at 17.03.41.jpeg'):
    shutil.copy('logo/WhatsApp Image 2026-08-31 at 17.03.41.jpeg', 'assets/img/logo/logo.jpg')

# 3. Copy Hero Background & Promo
if os.path.exists('background index atas/WhatsApp Image 2026-07-03 at 18.31.30.jpeg'):
    shutil.copy('background index atas/WhatsApp Image 2026-07-03 at 18.31.30.jpeg', 'assets/img/hero/hero-bg.jpg')
if os.path.exists('promo/promo-banner.jpg'):
    shutil.copy('promo/promo-banner.jpg', 'assets/img/hero/promo-banner.jpg')
elif os.path.exists('promo/WhatsApp Image 2026-08-31 at 17.04.24.jpeg'):
    shutil.copy('promo/WhatsApp Image 2026-08-31 at 17.04.24.jpeg', 'assets/img/hero/promo-banner.jpg')

# 4. Copy About
if os.path.exists('tentang kami/b7ccf3a6-d35b-483f-a1e2-38e27818d57a(1).jpg'):
    shutil.copy('tentang kami/b7ccf3a6-d35b-483f-a1e2-38e27818d57a(1).jpg', 'assets/img/about/about.jpg')

# 5. Copy Testimonials
testi_files = sorted(os.listdir('testimoni'))
testi_data = [
    {"name": "Budi Santoso", "rating": 5, "comment": "Pelayanan di ANDRASELAMATMOTOR sangat ramah dan proses kredit cepat tanpa ribet! Sehari langsung acc dan motor diantar ke rumah."},
    {"name": "Siti Nurhaliza", "rating": 5, "comment": "Beli Honda Scoopy baru disini dapat promo DP termurah se-Palabuhanratu. Salesnya sangat membantu dan komunikatif via WhatsApp."},
    {"name": "Ahmad Fauzi", "rating": 5, "comment": "Alhamdulillah ambil Honda PCX 160 prosesnya sangat cepat dan transparan. Unit datang tepat waktu dan surat-surat aman."},
    {"name": "Dewi Sartika", "rating": 5, "comment": "Rekomendasi dealer Honda terbaik di Palabuhanratu! Pelayanan aftersales juga memuaskan. Sukses selalu ANDRASELAMATMOTOR!"},
    {"name": "Rian Hidayat", "rating": 5, "comment": "DP ringan angsuran pas di kantong. Terima kasih mas sales sudah dibantu prosesnya sampai tuntas."},
    {"name": "Endang Supriatna", "rating": 5, "comment": "Mantap pisan pelayananna, dealer resmi terpercaya di Palabuhanratu. Rekomen buat warga Sukabumi dan sekitarnya."},
    {"name": "Fitri Handayani", "rating": 5, "comment": "Proses mudah, syarat cuma KTP dan KK, langsung diproses cepat. Motor BeAT-nya mulus pisan."},
    {"name": "Deni Setiawan", "rating": 5, "comment": "Puas sekali ambil CRF 150 disini. Diskon menarik dan bonus helm jaket lengkap!"}
]

testimonials_seed = []
for idx, fn in enumerate(testi_files):
    src = os.path.join('testimoni', fn)
    dst_name = f"testi-{idx+1}.jpg"
    dst = os.path.join('assets/img/testimonials', dst_name)
    shutil.copy(src, dst)
    info = testi_data[idx] if idx < len(testi_data) else {"name": f"Konsumen {idx+1}", "rating": 5, "comment": "Pelayanan sangat memuaskan dan proses cepat!"}
    testimonials_seed.append({
        "id": f"testi-{idx+1}",
        "nama": info["name"],
        "rating": info["rating"],
        "komentar": info["comment"],
        "foto": f"assets/img/testimonials/{dst_name}"
    })

import json
with open('data/seed-testimonials.json', 'w', encoding='utf-8') as f:
    json.dump(testimonials_seed, f, indent=2, ensure_ascii=False)

# 6. Copy Product Photos
foto_dirs = [f for f in os.listdir('Foto Produk') if os.path.isdir(os.path.join('Foto Produk', f))]
for fd in foto_dirs:
    src_dir = os.path.join('Foto Produk', fd)
    dst_dir = os.path.join('assets/products', fd)
    if not os.path.exists(dst_dir):
        shutil.copytree(src_dir, dst_dir)

print("Assets organized successfully!")
