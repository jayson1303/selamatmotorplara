import os
import json
import re
import pandas as pd

excel_path = 'Pricelist/PL JULI 2026 DP BESAR.xls'
xl = pd.ExcelFile(excel_path)

foto_base = 'Foto Produk'
foto_dirs = [f for f in os.listdir(foto_base) if os.path.isdir(os.path.join(foto_base, f))]

def clean_key(s):
    s = s.upper()
    for drop in ['ALL NEW', 'ALL', 'SPORTY', 'DELUXE', 'NEW', ' ']:
        s = s.replace(drop, '')
    return re.sub(r'[^A-Z0-9]', '', s)

# Map sheets to photo folders
folder_map = {}
for sheet in xl.sheet_names:
    s_key = clean_key(sheet)
    best_match = None
    for fd in foto_dirs:
        fd_key = clean_key(fd)
        if s_key == fd_key:
            best_match = fd
            break
    if not best_match:
        for fd in foto_dirs:
            fd_key = clean_key(fd)
            if s_key in fd_key or fd_key in s_key:
                best_match = fd
                break
    folder_map[sheet] = best_match

products = []
for sheet in xl.sheet_names:
    df = xl.parse(sheet, header=None)
    raw_name = str(df.iloc[0, 2]).strip() if pd.notna(df.iloc[0, 2]) else sheet
    raw_price = df.iloc[1, 2] if pd.notna(df.iloc[1, 2]) else 0
    try:
        price_otr = int(float(raw_price))
    except:
        price_otr = 0

    tenor_cols = {}
    for c in range(1, 10):
        val = df.iloc[4, c]
        if pd.notna(val) and isinstance(val, (int, float)):
            tenor_cols[c] = int(val)

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

    upper = sheet.upper()
    if 'ADV' in upper: cat = 'ADV Series'
    elif 'BEAT' in upper: cat = 'Beat Series'
    elif 'PCX' in upper: cat = 'PCX Series'
    elif 'VARIO' in upper: cat = 'Vario Series'
    elif 'SCOOPY' in upper: cat = 'Scoopy Series'
    elif 'STYLO' in upper: cat = 'Stylo Series'
    elif 'GENIO' in upper: cat = 'Genio Series'
    elif 'SUPRA' in upper or 'SUPTA' in upper: cat = 'Supra Series'
    elif 'REVO' in upper: cat = 'Revo Series'
    elif 'CBR' in upper: cat = 'CBR Series'
    elif 'CB150R' in upper or 'CB150X' in upper or ('CB150' in upper and 'VERZA' not in upper): cat = 'CB150 Series'
    elif 'CRF' in upper: cat = 'CRF/Off-Road Series'
    elif 'VERZA' in upper: cat = 'CB Verza Series'
    elif 'FORZA' in upper: cat = 'Forza Series'
    else: cat = 'Beat Series'

    # Gather images for matched folder
    folder = folder_map.get(sheet)
    warna_list = []
    if folder:
        folder_path = os.path.join(foto_base, folder)
        files = os.listdir(folder_path)
        png_files = [f for f in files if f.lower().endswith('.png')]
        chosen_files = png_files if png_files else files
        for idx, fn in enumerate(chosen_files[:4]):
            rel_path = f"assets/products/{folder}/{fn}".replace('\\', '/')
            color_name = f"Varian {idx + 1}"
            warna_list.append({
                "nama": color_name,
                "foto": rel_path
            })

    if not warna_list:
        warna_list.append({
            "nama": "Standar",
            "foto": "assets/img/logo/logo.png"
        })

    name_clean = raw_name.replace('ALL NEW ', '').replace('ALL ', '')
    desc = f"Honda {name_clean} hadir dengan performa responsif, efisiensi bahan bakar maksimal, dan fitur canggih masa kini. Sangat nyaman dan pas untuk kebutuhan berkendara Anda di Palabuhanratu dan sekitarnya."

    products.append({
        "id": re.sub(r'[^a-z0-9]+', '-', sheet.lower()).strip('-'),
        "namaMotor": f"Honda {name_clean}",
        "kategori": cat,
        "hargaCashAsuransi": price_otr,
        "deskripsiSingkat": desc,
        "warna": warna_list,
        "simulasiKredit": simulasi,
        "sheet": sheet,
        "folder": folder
    })

os.makedirs('data', exist_ok=True)
with open('data/seed-products.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print(f"Generated data/seed-products.json with {len(products)} products!")
