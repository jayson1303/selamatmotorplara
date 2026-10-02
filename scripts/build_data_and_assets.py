import os
import shutil
import json
import re
import pandas as pd

# 1. Ensure Target Directories exist
os.makedirs('assets/img/logo', exist_ok=True)
os.makedirs('assets/img/hero', exist_ok=True)
os.makedirs('assets/img/about', exist_ok=True)
os.makedirs('assets/img/testimonials', exist_ok=True)
os.makedirs('assets/products', exist_ok=True)
os.makedirs('data', exist_ok=True)

# 2. Copy Logos
for fn in ['logo-transparent.png', 'logo.png', 'logo.jpg']:
    src = os.path.join('logo', fn)
    if os.path.exists(src):
        shutil.copy(src, os.path.join('assets/img/logo', fn))

# 3. Copy Hero Background
hero_bg_src = 'background index atas/WhatsApp Image 2026-07-03 at 18.31.30.jpeg'
if os.path.exists(hero_bg_src):
    shutil.copy(hero_bg_src, 'assets/img/hero/hero-bg.jpg')
    print("Copied hero background to assets/img/hero/hero-bg.jpg")

# 4. Copy Promo Banner
if os.path.exists('promo/promo-banner.jpg'):
    shutil.copy('promo/promo-banner.jpg', 'assets/img/hero/promo-banner.jpg')
elif os.path.exists('promo/WhatsApp Image 2026-08-31 at 17.04.24.jpeg'):
    shutil.copy('promo/WhatsApp Image 2026-08-31 at 17.04.24.jpeg', 'assets/img/hero/promo-banner.jpg')

# 5. Copy About Us Image
about_src = 'tentang kami/b7ccf3a6-d35b-483f-a1e2-38e27818d57a(1).jpg'
if os.path.exists(about_src):
    shutil.copy(about_src, 'assets/img/about/about.jpg')
    print("Copied about image to assets/img/about/about.jpg")

# 6. Copy Testimonials Images and generate seed-testimonials.json
testi_files = sorted([f for f in os.listdir('testimoni') if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
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
    info = testi_data[idx] if idx < len(testi_data) else {"name": f"Konsumen {idx+1}", "rating": 5, "comment": "Pelayanan sangat memuaskan, proses cepat dan ramah!"}
    testimonials_seed.append({
        "id": f"testi-{idx+1}",
        "nama": info["name"],
        "rating": info["rating"],
        "komentar": info["comment"],
        "foto": f"assets/img/testimonials/{dst_name}"
    })

with open('data/seed-testimonials.json', 'w', encoding='utf-8') as f:
    json.dump(testimonials_seed, f, indent=2, ensure_ascii=False)
print(f"Generated data/seed-testimonials.json with {len(testimonials_seed)} testimonials!")

# 7. Copy Product Photos
foto_dirs = [f for f in os.listdir('Foto Produk') if os.path.isdir(os.path.join('Foto Produk', f))]
for fd in foto_dirs:
    src_dir = os.path.join('Foto Produk', fd)
    dst_dir = os.path.join('assets/products', fd)
    os.makedirs(dst_dir, exist_ok=True)
    for fn in os.listdir(src_dir):
        s_file = os.path.join(src_dir, fn)
        d_file = os.path.join(dst_dir, fn)
        if os.path.isfile(s_file):
            shutil.copy2(s_file, d_file)

print(f"Copied all product photos across {len(foto_dirs)} folders to assets/products/")

# 8. Parse Excel Pricelist and map all 46 folders
excel_path = 'Pricelist/PL JULI 2026 DP BESAR.xls'
xl = pd.ExcelFile(excel_path)

mapping = {
    'ALL BEAT CBS': ('BEAT SPORTY CBS', 'Honda BeAT Sporty CBS', 'Beat Series'),
    'ALL BEAT ISS': ('BEAT SPORTY CBS ISS DELUXE', 'Honda BeAT Sporty Deluxe', 'Beat Series'),
    'ALL BEAT STREET': ('BEAT STREET', 'Honda BeAT Street', 'Beat Series'),
    'ALL NEW BEAT CBS': ('BEAT SPORTY CBS', 'Honda All New BeAT CBS', 'Beat Series'),
    'ALL NEW BEAT ISS': ('BEAT SPORTY CBS ISS DELUXE', 'Honda All New BeAT Deluxe (ISS)', 'Beat Series'),
    'ALL NEW BEAT SMARTKEY': ('BEAT SPORTY DELUXE SMARTKEY', 'Honda All New BeAT Smart Key', 'Beat Series'),
    'ALL NEW BEAT STREET': ('BEAT STREET', 'Honda All New BeAT Street', 'Beat Series'),
    'ALL NEW GENIO CBS': ('GENIO CBS (BK)', 'Honda Genio CBS', 'Genio Series'),
    'ALL NEW GENIO CBS SP': ('GENIO CBS (PH, PD)', 'Honda Genio CBS Special', 'Genio Series'),
    'ALL NEW GENIO CBS ISS': ('GENIO CBS ISS', 'Honda Genio CBS-ISS', 'Genio Series'),
    'ALL NEW SCOOPY FASHION': ('SCOOPY FASHION', 'Honda All New Scoopy Fashion', 'Scoopy Series'),
    'ALL NEW SCOOPY PRESTIGE': ('SCOOPY STYLISH&PRESTIGE', 'Honda All New Scoopy Prestige', 'Scoopy Series'),
    'ALL NEW SCOOPY STYLISH': ('SCOOPY STYLISH&PRESTIGE', 'Honda All New Scoopy Stylish', 'Scoopy Series'),
    'ALL NEW VARIO 125 CBS': ('VARIO 125 CBS', 'Honda All New Vario 125 CBS', 'Vario Series'),
    'ALL NEW VARIO 125 CBS ISS': ('VARIO 125 CBS ISS', 'Honda All New Vario 125 CBS-ISS', 'Vario Series'),
    'ALL NEW VARIO 125 STREET': ('VARIO 125 STREET', 'Honda All New Vario 125 Street', 'Vario Series'),
    'ALL NEW VARIO 160 CBS': ('VARIO EVO 160 CBS', 'Honda All New Vario 160 CBS', 'Vario Series'),
    'ALL NEW VARIO 160 CBS NITRO': ('VARIO EVO 160 CBS NITRO', 'Honda All New Vario 160 CBS Nitro', 'Vario Series'),
    'ALL NEW VARIO 160 ABS': ('VARIO EVO 160 ABS', 'Honda All New Vario 160 ABS', 'Vario Series'),
    'ALL NEW STYLO CBS': ('STYLO 160 CBS', 'Honda Stylo 160 CBS', 'Stylo Series'),
    'ALL NEW STYLO ABS': ('STYLO 160 ABS', 'Honda Stylo 160 ABS', 'Stylo Series'),
    'ALL NEW STYLO ABS SE': ('STYLO 160 ABS SE', 'Honda Stylo 160 ABS Special Edition', 'Stylo Series'),
    'ALL NEW PCX CBS 160': ('PCX 160 CBS', 'Honda PCX 160 CBS', 'PCX Series'),
    'ALL NEW PCX ABS 160': ('PCX 160 ABS', 'Honda PCX 160 ABS', 'PCX Series'),
    'ALL NEW PCX ABS 160 ROADSYNCE': ('PCX 160 ABS ROADSYNC', 'Honda PCX 160 ABS RoadSync', 'PCX Series'),
    'ALL NEW ADV CBS 160': ('ADV 160 CBS', 'Honda ADV 160 CBS', 'ADV Series'),
    'ALL NEW ADV ABS 160': ('ADV 160 ABS', 'Honda ADV 160 ABS', 'ADV Series'),
    'ALL NEW ADV ABS 160 ROADSYNCE': ('ADV 160 ABS ROADSYNC', 'Honda ADV 160 ABS RoadSync', 'ADV Series'),
    'ALL NEW REVO FIT': ('REVO FIT', 'Honda Revo Fit', 'Revo Series'),
    'ALL NEW REVO X': ('REVO X', 'Honda Revo X', 'Revo Series'),
    'ALL NEW SUPRA X 125 SW': ('SUPRA X 125 SPOKE', 'Honda Supra X 125 Spoke (SW)', 'Supra Series'),
    'ALL NEW SUPRA X CW': ('SUPRA X 125 CW', 'Honda Supra X 125 Cast Wheel (CW)', 'Supra Series'),
    'ALL NEW SUPRA GTR SPORTY': ('NEW SUPRA X GTR 150 SPORTY', 'Honda Supra GTR 150 Sporty', 'Supra Series'),
    'ALL NEW SUPTA GTR EXLUSIVE': ('NEW SUPRA X GTR 150 EXCLUSIVE', 'Honda Supra GTR 150 Exclusive', 'Supra Series'),
    'ALL NEW CB VERZA SP': ('CB 150 VERZA SP ', 'Honda CB150 Verza Spoke', 'CB Verza Series'),
    'ALL NEW CB VERZA CW': ('CB 150 VERZA CW', 'Honda CB150 Verza Cast Wheel', 'CB Verza Series'),
    'ALL NEW CB150R STD': ('CB150R STD', 'Honda CB150R Streetfire STD', 'CB150 Series'),
    'ALL NEW CB150R SE': ('CB150R SE', 'Honda CB150R Streetfire Special Edition', 'CB150 Series'),
    'ALL NEW CB150X STD': ('CB150X STD ', 'Honda CB150X STD', 'CB150 Series'),
    'ALL NEW CB150X SP': ('CB150X SE', 'Honda CB150X Special Edition', 'CB150 Series'),
    'ALL NEW CRF 150 L': ('CRF 150', 'Honda CRF 150L', 'CRF/Off-Road Series'),
    'ALL NEW CBR 150 STD BK': ('CBR150R STD (BK)', 'Honda CBR 150R STD Black', 'CBR Series'),
    'ALL NEW CBR 150 STD MH-RD': ('CBR150R STD (MH)(RD)', 'Honda CBR 150R STD Racing Red', 'CBR Series'),
    'ALL NEW CBR 150 ABS BK': ('CBR150R ABS (BK)', 'Honda CBR 150R ABS Black', 'CBR Series'),
    'ALL NEW CBR 150 ABS RD': ('CBR150R ABS (RD)', 'Honda CBR 150R ABS Racing Red', 'CBR Series'),
    'ALL NEW FORZA 250': ('FORZA', 'Honda Forza 250', 'Forza Series')
}

products = []
for folder, (sheet, display_name, cat) in mapping.items():
    df = xl.parse(sheet, header=None)
    
    # 1. Cash Price OTR
    raw_price = df.iloc[1, 2] if pd.notna(df.iloc[1, 2]) else 0
    try:
        price_otr = int(float(raw_price))
    except:
        price_otr = 0

    # 2. Tenor Columns
    tenor_cols = {}
    for c in range(1, 10):
        val = df.iloc[4, c]
        if pd.notna(val) and isinstance(val, (int, float)):
            tenor_cols[c] = int(val)

    # 3. Credit Simulations
    simulasi = []
    for r in range(5, len(df)):
        dp_val = df.iloc[r, 0]
        if pd.isna(dp_val) or not isinstance(dp_val, (int, float)) or dp_val < 100000:
            break
        dp = int(dp_val)
        for c, tenor in tenor_cols.items():
            cicilan_val = df.iloc[r, c]
            if pd.notna(cicilan_val) and isinstance(cicilan_val, (int, float)):
                simulasi.append({
                    "dp": dp,
                    "tenor": tenor,
                    "cicilan": int(cicilan_val)
                })

    # Asuransi Cash
    asuransi_cash_map = {
        'REVO FIT': 600000, 'REVO X': 650000, 'SUPRA X 125 SPOKE': 700000, 'SUPRA X 125 CW': 750000,
        'NEW SUPRA X GTR 150 SPORTY': 900000, 'NEW SUPRA X GTR 150 EXCLUSIVE': 900000,
        'BEAT SPORTY CBS': 650000, 'BEAT SPORTY CBS ISS DELUXE': 700000, 'BEAT SPORTY DELUXE SMARTKEY': 700000,
        'BEAT STREET': 700000, 'GENIO CBS (BK)': 700000, 'GENIO CBS (PH, PD)': 700000, 'GENIO CBS ISS': 700000,
        'SCOOPY FASHION': 850000, 'SCOOPY STYLISH&PRESTIGE': 850000, 'VARIO 125 CBS': 800000,
        'VARIO 125 CBS ISS': 900000, 'VARIO 125 STREET': 900000, 'VARIO EVO 160 CBS': 950000,
        'VARIO EVO 160 CBS NITRO': 950000, 'VARIO EVO 160 ABS': 1050000, 'STYLO 160 CBS': 1000000,
        'STYLO 160 ABS': 1100000, 'STYLO 160 ABS SE': 1150000, 'PCX 160 CBS': 1100000,
        'PCX 160 ABS': 1250000, 'PCX 160 ABS ROADSYNC': 1350000, 'ADV 160 CBS': 1200000,
        'ADV 160 ABS': 1300000, 'ADV 160 ABS ROADSYNC': 1350000, 'CB 150 VERZA SP ': 850000,
        'CB 150 VERZA CW': 850000, 'CB150R STD': 1050000, 'CB150R SE': 1100000,
        'CB150X STD ': 1100000, 'CB150X SE': 1100000, 'CRF 150': 1250000,
        'CBR150R STD (BK)': 1250000, 'CBR150R STD (MH)(RD)': 1250000,
        'CBR150R ABS (BK)': 1350000, 'CBR150R ABS (RD)': 1350000, 'FORZA': 2500000
    }
    asuransi_cash = asuransi_cash_map.get(sheet, 700000)
    if 'SCOOPY STYLISH' in folder:
        asuransi_cash = 875000
    total_cash_asuransi = price_otr + asuransi_cash

    # 4. Color Variants & Photos
    color_map = {
        'ALL BEAT CBS': {
            'WhatsApp Image 2026-07-02 at 10.43.05.png': 'Hard Rock Black (Hitam Glossy)',
            'WhatsApp Image 2026-07-02 at 10.43.06 (1).png': 'Funk Red Black (Merah Hitam)',
            'WhatsApp Image 2026-07-02 at 10.43.06.png': 'Dance White Black (Putih Hitam)'
        },
        'ALL BEAT ISS': {
            'WhatsApp Image 2026-07-02 at 10.45.14 (1).png': 'Deluxe Black (Hitam Doff)',
            'WhatsApp Image 2026-07-02 at 10.45.14.png': 'Deluxe Dark Silver (Silver Doff)'
        },
        'ALL BEAT STREET': {
            'WhatsApp Image 2026-07-02 at 10.48.15.png': 'Street Black (Hitam Doff)',
            'WhatsApp Image 2026-07-02 at 10.48.16 (1).png': 'Street Brown (Cokelat Doff)',
            'WhatsApp Image 2026-07-02 at 10.48.16.png': 'Street Silver (Silver Doff)'
        },
        'ALL NEW ADV ABS 160': {
            'WhatsApp Image 2026-07-03 at 19.45.57 (1).png': 'Tough Matte Green (Hijau Doff)',
            'WhatsApp Image 2026-07-03 at 19.45.57 (2).png': 'Tough Matte Black (Hitam Doff)',
            'WhatsApp Image 2026-07-03 at 19.45.57 (3).png': 'Tough Matte Brown (Cokelat Doff)'
        },
        'ALL NEW ADV ABS 160 ROADSYNCE': {
            'WhatsApp Image 2026-07-03 at 19.45.58.png': 'RoadSync Matte Silver (Silver Titanium)'
        },
        'ALL NEW ADV CBS 160': {
            'WhatsApp Image 2026-07-03 at 19.45.56 (2).png': 'Dynamic Red (Merah)',
            'WhatsApp Image 2026-07-03 at 19.45.56 (3).png': 'Dynamic Black (Hitam)',
            'WhatsApp Image 2026-07-03 at 19.45.57.png': 'Dynamic White (Putih)'
        },
        'ALL NEW BEAT CBS': {
            'WhatsApp Image 2026-07-02 at 10.43.31 (1).png': 'Funk Red Black (Merah Hitam)',
            'WhatsApp Image 2026-07-02 at 10.43.31 (2).png': 'Techno Blue Black (Biru Hitam)',
            'WhatsApp Image 2026-07-02 at 10.43.31.png': 'Hard Rock Black (Hitam Glossy)'
        },
        'ALL NEW BEAT ISS': {
            'WhatsApp Image 2026-07-02 at 10.45.38 (1).png': 'Deluxe Matte Burgundy (Burgundy/Violet)',
            'WhatsApp Image 2026-07-02 at 10.45.38.png': 'Deluxe Matte Blue (Biru Doff)'
        },
        'ALL NEW BEAT SMARTKEY': {
            'WhatsApp Image 2026-07-02 at 10.46.32 (1).png': 'Deluxe Matte Blue (Biru Doff)',
            'WhatsApp Image 2026-07-02 at 10.46.32.png': 'Deluxe Matte Brown (Cokelat Doff)',
            'WhatsApp Image 2026-07-02 at 10.46.33.png': 'Deluxe Matte Black (Hitam Doff)'
        },
        'ALL NEW BEAT STREET': {
            'WhatsApp Image 2026-07-02 at 10.48.43 (1).png': 'Street Brown (Cokelat Doff)',
            'WhatsApp Image 2026-07-02 at 10.48.43 (2).png': 'Street Black (Hitam Doff)',
            'WhatsApp Image 2026-07-02 at 10.48.43.png': 'Street Silver (Silver)'
        },
        'ALL NEW CB VERZA CW': {
            'WhatsApp Image 2026-07-03 at 19.46.03 (1).png': 'Macho Matte Black (Hitam Doff)',
            'WhatsApp Image 2026-07-03 at 19.46.03.png': 'Bold Red (Merah Glossy)'
        },
        'ALL NEW CB VERZA SP': {
            'WhatsApp Image 2026-07-03 at 19.46.04.png': 'Macho Matte Black (Hitam Doff)'
        },
        'ALL NEW CB150R SE': {
            'WhatsApp Image 2026-07-03 at 19.46.04 (1).png': 'Fury Matte Red (Merah Doff)',
            'WhatsApp Image 2026-07-03 at 19.46.05 (1).png': 'Raptor Matte Black (Hitam Doff)',
            'WhatsApp Image 2026-07-03 at 19.46.05 (2).png': 'Armored Matte Grey (Abu-Abu Doff)'
        },
        'ALL NEW CB150R STD': {
            'WhatsApp Image 2026-07-03 at 19.46.05.png': 'Stinger Red Black (Merah Hitam)',
            'WhatsApp Image 2026-07-03 at 19.46.06.png': 'Macho Black (Hitam Glossy)'
        },
        'ALL NEW CB150X SP': {
            'WhatsApp Image 2026-07-03 at 19.46.07 (2).png': 'Volcano Matte Black (Hitam Doff Special)'
        },
        'ALL NEW CB150X STD': {
            'WhatsApp Image 2026-07-03 at 19.46.07 (1).png': 'Amazon Green (Hijau Doff)',
            'WhatsApp Image 2026-07-03 at 19.46.07.png': 'Mandala Red (Merah)',
            'WhatsApp Image 2026-07-03 at 19.46.08.png': 'Sahara Matte Brown (Cokelat Doff)'
        },
        'ALL NEW CBR 150 ABS BK': {
            'WhatsApp Image 2026-07-03 at 19.57.25 (1).png': 'Dominator Matte Black (Hitam Doff)'
        },
        'ALL NEW CBR 150 ABS RD': {
            'WhatsApp Image 2026-07-03 at 19.57.25 (2).png': 'Honda Racing Red (Merah Balap)'
        },
        'ALL NEW CBR 150 STD BK': {
            'WhatsApp Image 2026-07-03 at 19.46.18.png': 'Victory Black Red (Hitam Merah)'
        },
        'ALL NEW CBR 150 STD MH-RD': {
            'WhatsApp Image 2026-07-03 at 19.46.31.png': 'Honda Racing Red (Merah Balap)',
            'WhatsApp Image 2026-07-03 at 19.57.25.png': 'Honda Tricolor (Merah Putih Biru)'
        },
        'ALL NEW CRF 150 L': {
            'WhatsApp Image 2026-07-03 at 19.46.08 (1).png': 'Extreme Black (Hitam)',
            'WhatsApp Image 2026-07-03 at 19.46.09.png': 'Extreme White (Putih)',
            'WhatsApp Image 2026-07-03 at 19.46.12.png': 'Extreme Red (Merah)',
            'WhatsApp Image 2026-07-03 at 19.46.15.png': 'Extreme Green (Hijau)'
        },
        'ALL NEW FORZA 250': {
            'WhatsApp Image 2026-07-03 at 19.45.58 (1).png': 'Mat Gunpowder Black Metallic (Hitam Doff)',
            'WhatsApp Image 2026-07-03 at 19.45.58 (2).png': 'Pearl Smoky Gray (Abu-Abu Mutiara)',
            'WhatsApp Image 2026-07-03 at 19.45.59 (1).png': 'Indigo Blue Metallic (Biru Metalik)',
            'WhatsApp Image 2026-07-03 at 19.45.59.png': 'Candy Syrah Wine Red (Merah Anggur)'
        },
        'ALL NEW GENIO CBS': {
            'WhatsApp Image 2026-07-02 at 10.52.19.png': 'Radiant Black (Hitam Glossy)'
        },
        'ALL NEW GENIO CBS ISS': {
            'WhatsApp Image 2026-07-02 at 10.49.57 (1).png': 'Fabulous Matte Black (Hitam Doff)',
            'WhatsApp Image 2026-07-02 at 10.49.57.png': 'Fabulous Matte Brown (Cokelat Doff)',
            'WhatsApp Image 2026-07-02 at 10.49.58.png': 'Fabulous Matte Green (Hijau Doff)'
        },
        'ALL NEW GENIO CBS SP': {
            'WhatsApp Image 2026-07-02 at 10.51.13 (1).png': 'Radiant Silver Black (Silver Hitam)',
            'WhatsApp Image 2026-07-02 at 10.51.13.png': 'Radiant Blue Black (Biru Hitam)'
        },
        'ALL NEW PCX ABS 160': {
            'WhatsApp Image 2026-07-03 at 19.45.54 (2).png': 'Wonderful White (Putih Mutiara)',
            'WhatsApp Image 2026-07-03 at 19.45.55 (1).png': 'Imperial Matte Blue (Biru Doff)',
            'WhatsApp Image 2026-07-03 at 19.45.55 (2).png': 'Brilliant Black (Hitam Glossy)',
            'WhatsApp Image 2026-07-03 at 19.45.55.png': 'Majestic Matte Red (Merah Doff)'
        },
        'ALL NEW PCX ABS 160 ROADSYNCE': {
            'WhatsApp Image 2026-07-03 at 19.45.56 (1).png': 'RoadSync Burgundy Red (Merah Marun)',
            'WhatsApp Image 2026-07-03 at 19.45.56.png': 'RoadSync Burnt Titanium (Silver Titanium)'
        },
        'ALL NEW PCX CBS 160': {
            'WhatsApp Image 2026-07-03 at 19.45.53 (1).png': 'Marvelous Matte Silver (Silver Doff)',
            'WhatsApp Image 2026-07-03 at 19.45.53.png': 'Magnificent Red (Merah Glossy)',
            'WhatsApp Image 2026-07-03 at 19.45.54 (1).png': 'Brilliant Black (Hitam Glossy)',
            'WhatsApp Image 2026-07-03 at 19.45.54.png': 'Wonderful White (Putih Mutiara)'
        },
        'ALL NEW REVO FIT': {
            'WhatsApp Image 2026-07-03 at 19.45.59 (2).png': 'Galaxy Blue (Biru)',
            'WhatsApp Image 2026-07-03 at 19.46.00.png': 'Raving Red (Merah)'
        },
        'ALL NEW REVO X': {
            'WhatsApp Image 2026-07-03 at 19.46.00 (1).png': 'Quantum Black (Hitam)',
            'WhatsApp Image 2026-07-03 at 19.46.00 (2).png': 'Attractive Red (Merah)'
        },
        'ALL NEW SCOOPY FASHION': {
            'WhatsApp Image 2026-07-02 at 10.53.35 (1).png': 'Fashion Black (Hitam)',
            'WhatsApp Image 2026-07-02 at 10.53.35 (2).png': 'Fashion Brown (Cokelat Krem)',
            'WhatsApp Image 2026-07-02 at 10.53.35.png': 'Fashion Blue (Biru Tosca)',
            'WhatsApp Image 2026-07-02 at 10.53.36.png': 'Fashion Red (Merah)'
        },
        'ALL NEW SCOOPY PRESTIGE': {
            'WhatsApp Image 2026-07-02 at 10.56.44 (1).png': 'Prestige Black (Hitam Doff)',
            'WhatsApp Image 2026-07-02 at 10.56.44 (2).png': 'Prestige Red (Merah Doff)',
            'WhatsApp Image 2026-07-02 at 10.56.44.png': 'Prestige White (Putih Mutiara)'
        },
        'ALL NEW SCOOPY STYLISH': {
            'WhatsApp Image 2026-07-02 at 10.55.20 (2).png': 'Stylish Red (Merah Doff)',
            'WhatsApp Image 2026-07-02 at 10.55.20(1).png': 'Stylish Beige (Krem / Beige)',
            'WhatsApp Image 2026-07-02 at 10.55.20.png': 'Stylish Green (Hijau Doff)'
        },
        'ALL NEW STYLO ABS': {
            'WhatsApp Image 2026-07-02 at 11.10.51 (1).png': 'Royal Matte Black (Hitam Doff)',
            'WhatsApp Image 2026-07-02 at 11.10.51.png': 'Royal Matte White (Putih Doff)',
            'WhatsApp Image 2026-07-02 at 11.10.52.png': 'Royal Green (Hijau Doff)'
        },
        'ALL NEW STYLO ABS SE': {
            'WhatsApp Image 2026-07-02 at 11.11.37.png': 'Royal Special Edition Red (Merah Doff SE)'
        },
        'ALL NEW STYLO CBS': {
            'WhatsApp Image 2026-07-02 at 11.09.38 (1).png': 'Glam Beige (Beige / Krem)',
            'WhatsApp Image 2026-07-02 at 11.09.38 (2).png': 'Glam Black (Hitam Glossy)',
            'WhatsApp Image 2026-07-02 at 11.09.38.png': 'Glam Red (Merah Glossy)'
        },
        'ALL NEW SUPRA GTR SPORTY': {
            'WhatsApp Image 2026-07-03 at 19.46.01 (3).png': 'Spartan Red (Merah Hitam)',
            'WhatsApp Image 2026-07-03 at 19.46.02 (2).png': 'Gun Black (Hitam Abu)'
        },
        'ALL NEW SUPRA X 125 SW': {
            'WhatsApp Image 2026-07-03 at 19.46.01.png': 'Quantum Black (Hitam Merah SW)'
        },
        'ALL NEW SUPRA X CW': {
            'WhatsApp Image 2026-07-03 at 19.46.01 (1).png': 'Energetic Red (Merah Hitam CW)',
            'WhatsApp Image 2026-07-03 at 19.46.01 (2).png': 'Golden Matte Black (Hitam Emas CW)'
        },
        'ALL NEW SUPTA GTR EXLUSIVE': {
            'WhatsApp Image 2026-07-03 at 19.46.02 (1).png': 'Exclusive Matte Red (Merah Doff)',
            'WhatsApp Image 2026-07-03 at 19.46.02.png': 'Exclusive Matte Black (Hitam Doff)'
        },
        'ALL NEW VARIO 125 CBS': {
            'WhatsApp Image 2026-07-02 at 10.57.51 (1).png': 'Sporty Black (Hitam Glossy)',
            'WhatsApp Image 2026-07-02 at 10.57.51.png': 'Sporty Blue (Biru Tosca)',
            'WhatsApp Image 2026-07-02 at 10.57.52.png': 'Sporty Red (Merah Hitam)'
        },
        'ALL NEW VARIO 125 CBS ISS': {
            'WhatsApp Image 2026-07-02 at 10.59.00 (1).png': 'Advance Matte Blue (Biru Doff)',
            'WhatsApp Image 2026-07-02 at 10.59.00.png': 'Advance Matte Red (Merah Doff)',
            'WhatsApp Image 2026-07-02 at 10.59.01.png': 'Advance Matte Black (Hitam Doff)'
        },
        'ALL NEW VARIO 125 STREET': {
            'IMG_202607185_094805202.png': 'Street Matte White (Putih Doff)',
            'WhatsApp Image 2026-07-02 at 11.00.07.png': 'Street Matte Blue (Biru Doff)',
            'WhatsApp Image 2026-07-02 at 11.00.08.png': 'Street Matte Black (Hitam Doff)'
        },
        'ALL NEW VARIO 160 ABS': {
            'WhatsApp Image 2026-07-02 at 11.08.06 (1).png': 'Grande Matte Black (Hitam Doff)',
            'WhatsApp Image 2026-07-02 at 11.08.06 (2).png': 'Active Matte Red (Merah Doff)',
            'WhatsApp Image 2026-07-02 at 11.08.06.png': 'Grande Matte Blue (Biru Doff)',
            'WhatsApp Image 2026-07-02 at 11.08.07.png': 'Grande Matte White (Putih Doff)'
        },
        'ALL NEW VARIO 160 CBS': {
            'WhatsApp Image 2026-07-02 at 11.04.57 (1).png': 'Active Matte Blue (Biru Doff)',
            'WhatsApp Image 2026-07-02 at 11.04.57.png': 'Active Matte Red (Merah Doff)'
        },
        'ALL NEW VARIO 160 CBS NITRO': {
            'WhatsApp Image 2026-07-02 at 11.06.51 (1).png': 'Active Matte Black Nitro (Hitam Nitro)',
            'WhatsApp Image 2026-07-02 at 11.06.51.png': 'Active Matte Yellow Nitro (Kuning Nitro)'
        }
    }

    folder_path = os.path.join('Foto Produk', folder)
    warna_list = []
    if os.path.exists(folder_path):
        files = os.listdir(folder_path)
        png_files = sorted([f for f in files if f.lower().endswith('.png')])
        chosen_files = png_files if png_files else sorted([f for f in files if f.lower().endswith(('.jpg', '.jpeg'))])
        folder_colors = color_map.get(folder, {})
        for idx, fn in enumerate(chosen_files):
            rel_path = f"assets/products/{folder}/{fn}".replace('\\', '/')
            color_name = folder_colors.get(fn, f"Varian {idx + 1}")
            warna_list.append({
                "nama": color_name,
                "foto": rel_path
            })

    if not warna_list:
        warna_list.append({
            "nama": "Standar",
            "foto": "assets/img/logo/logo.png"
        })

    # 5. Clean ID & Description
    prod_id = re.sub(r'[^a-z0-9]+', '-', folder.lower()).strip('-')
    desc = f"{display_name} hadir dengan desain modern, mesin bertenaga dan irit bahan bakar, serta kenyamanan berkendara optimal untuk sehari-hari. Bergaransi resmi Astra Honda Motor dengan kemudahan servis di dealer resmi ANDRASELAMATMOTOR."

    products.append({
        "id": prod_id,
        "namaMotor": display_name,
        "kategori": cat,
        "hargaOtr": price_otr,
        "hargaAsuransi": asuransi_cash,
        "hargaTotalCashAsuransi": total_cash_asuransi,
        "hargaCashAsuransi": price_otr,
        "deskripsiSingkat": desc,
        "warna": warna_list,
        "simulasiKredit": simulasi,
        "folder": folder,
        "sheet": sheet
    })

with open('data/seed-products.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print(f"SUCCESS: Generated data/seed-products.json with {len(products)} products!")
