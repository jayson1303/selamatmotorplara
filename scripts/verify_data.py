import json

with open('data/seed-products.json', encoding='utf-8') as f:
    products = json.load(f)

print(f"Total products in seed-products.json: {len(products)}")
missing_images = 0
zero_prices = 0
zero_sims = 0

for p in products:
    name = p.get('namaMotor', '')
    sheet = p.get('sheet', '')
    folder = p.get('folder', '')
    warna = p.get('warna', [])
    sim = p.get('simulasiKredit', [])
    price = p.get('hargaCashAsuransi', 0)
    
    has_missing_img = (not warna or len(warna) == 0 or 'logo.png' in warna[0].get('foto', ''))
    if has_missing_img:
        missing_images += 1
        print(f"Missing image: {name} (sheet: '{sheet}') -> folder: '{folder}'")
    if price == 0:
        zero_prices += 1
        print(f"Zero price: {name} (sheet: '{sheet}')")
    if not sim:
        zero_sims += 1
        print(f"Zero simulations: {name} (sheet: '{sheet}')")

print(f"Summary: Missing images: {missing_images}, Zero prices: {zero_prices}, Zero sims: {zero_sims}")
