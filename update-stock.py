"""Live stock for Pointe & Print: reads every colour's Ralawise SKU from products.js, asks Ralawise's
public stock service how many of each size are in their warehouse, and writes stock.json for the site.
Runs every hour on GitHub Actions (.github/workflows/stock.yml in the live repo); plain Python, no packages.
usage: python update-stock.py"""
import json, re, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

API = 'https://shop.ralawise.com/services/productservice/Variants?code='
norm = lambda s: re.sub(r'[\s/.]', '', s.replace(' yrs', '')).upper().replace('XXS', '2XS')[:5]   # same rule as the site (Ralawise cuts some codes to 5, e.g. 2XL3X)

def fetch(sku):
    for code in (sku, sku if sku.endswith('_COLOUR') else sku + '_COLOUR'):   # one-size items need the _COLOUR form
        for attempt in range(3):
            try:
                req = urllib.request.Request(API + code, headers={'User-Agent': 'Mozilla/5.0 (PointeAndPrint stock check)'})
                j = json.load(urllib.request.urlopen(req, timeout=30))
                break
            except Exception:
                time.sleep(2 + attempt * 3); j = None
        if j and j.get('Success') and j.get('Data'):
            out = {}
            for v in j['Data']:
                nxt = v.get('NextAvailable') or ''
                out[norm(v['SizeCode'])] = [int(v.get('Stock') or 0), nxt if re.match(r'\d\d/\d\d/\d{4}$', nxt) else '', 1 if v.get('IsRalaDeal') else 0]
            return sku, out
    return sku, None

t = open('products.js', encoding='utf-8').read()
products = json.loads(t[t.index('['):t.rindex(']') + 1])
skus = sorted({s for p in products for c in p['colours'] for s in c.get('sku', [])})
with ThreadPoolExecutor(6) as ex: res = dict(ex.map(fetch, skus))
missing = [s for s, v in res.items() if v is None]
stock = {s: v for s, v in res.items() if v is not None}
# keep the last known figures for anything that failed this time, so one bad hour doesn't blank a size
try:
    old = json.load(open('stock.json', encoding='utf-8'))['stock']
    for s in missing:
        if s in old: stock[s] = old[s]
except Exception: pass
json.dump({'updated': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'stock': stock},
          open('stock.json', 'w', encoding='utf-8'), separators=(',', ':'))
print(f'{len(stock)} of {len(skus)} colours updated; failed: {missing}')
