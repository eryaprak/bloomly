#!/usr/bin/env python3
"""
Final step: set prices, upload review screenshots, check states.
Subscriptions already created:
  monthly: 6768969913
  yearly:  6768970371
"""

import json, time, base64, hashlib, os
from pathlib import Path

import jwt as pyjwt
import requests
try:
    from PIL import Image, ImageDraw, ImageFont
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

KEY_ID     = "P3X76F73BW"
ISSUER_ID  = "7338b935-1bc4-4357-adb3-9fcfe10c9438"
KEY_PATH   = Path("/Users/berkeryaprak/.appstoreconnect/private_keys/AuthKey_P3X76F73BW.p8")
BASE_URL   = "https://api.appstoreconnect.apple.com"

MONTHLY_ID = "6768969913"
YEARLY_ID  = "6768970371"
SG_ID      = "22085965"

def token():
    pk = KEY_PATH.read_text()
    now = int(time.time())
    t = pyjwt.encode({"iss": ISSUER_ID, "iat": now, "exp": now+1200,
                       "aud": "appstoreconnect-v1"},
                     pk, algorithm="ES256",
                     headers={"kid": KEY_ID, "typ": "JWT"})
    return t if isinstance(t, str) else t.decode()

def hdrs():
    return {"Authorization": f"Bearer {token()}",
            "Content-Type": "application/json"}

def GET(path, params=None):
    r = requests.get(f"{BASE_URL}{path}", headers=hdrs(), params=params)
    r.raise_for_status()
    return r.json()

def POST(path, body):
    r = requests.post(f"{BASE_URL}{path}", headers=hdrs(), json=body)
    if not r.ok:
        print(f"  POST ERROR {r.status_code}: {r.text[:700]}")
        r.raise_for_status()
    return r.json()

def PATCH(path, body):
    r = requests.patch(f"{BASE_URL}{path}", headers=hdrs(), json=body)
    if not r.ok:
        print(f"  PATCH ERROR {r.status_code}: {r.text[:700]}")
        r.raise_for_status()
    return r.json()

# ── Price setter ──────────────────────────────────────────────────────────────
def set_price(sub_id, target_try, label):
    # Fetch price points filtered by TUR
    pts = GET(f"/v1/subscriptions/{sub_id}/pricePoints",
              {"filter[territory]": "TUR", "limit": 200,
               "fields[subscriptionPricePoints]": "customerPrice,territory"})
    data = pts.get("data", [])
    if not data:
        print(f"  No TUR price points for {label} — skipping")
        return
    best = min(data, key=lambda p:
               abs(float(p["attributes"].get("customerPrice","999999"))-target_try))
    best_price = float(best["attributes"]["customerPrice"])
    best_id    = best["id"]
    print(f"  {label}: best={best_price} TRY (target {target_try}) id={best_id[:30]}…")

    body = {
        "data": {
            "type": "subscriptionPrices",
            "attributes": {
                "startDate": None,
                "preserveCurrentPrice": False
            },
            "relationships": {
                "subscription": {
                    "data": {"type": "subscriptions", "id": sub_id}
                },
                "subscriptionPricePoint": {
                    "data": {"type": "subscriptionPricePoints", "id": best_id}
                },
                "territory": {
                    "data": {"type": "territories", "id": "TUR"}
                }
            }
        }
    }
    p = POST("/v1/subscriptionPrices", body)
    print(f"  Price created: {p['data']['id'][:30]}…")
    return p["data"]["id"]

# ── Screenshot ────────────────────────────────────────────────────────────────
def make_screenshot():
    path = Path("/tmp/bloomly_iap_review.png")
    if HAS_PIL:
        img = Image.new("RGB", (640, 920), color=(26, 10, 46))
        draw = ImageDraw.Draw(img)
        for y in range(920):
            s = int(26 + (y/920)*30)
            draw.line([(0,y),(640,y)], fill=(s, int(s*0.4), min(255,int(s*1.8))))
        try:
            fb = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 42)
            fm = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 26)
            fs = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
        except Exception:
            fb = fm = fs = ImageFont.load_default()
        draw.rounded_rectangle([50,160,590,280], radius=14,
                                fill=(45,27,92), outline=(180,100,255), width=2)
        draw.text((320,220), "Bloomly Premium", fill=(255,215,0), font=fb, anchor="mm")
        draw.rounded_rectangle([50,310,590,440], radius=14,
                                fill=(45,27,92), outline=(124,58,237), width=2)
        draw.text((320,350), "Aylik Plan", fill=(200,200,200), font=fm, anchor="mm")
        draw.text((320,400), "49,99 TL / ay", fill=(255,215,0), font=fb, anchor="mm")
        draw.rounded_rectangle([50,470,590,630], radius=14,
                                fill=(45,27,92), outline=(255,215,0), width=2)
        draw.text((320,510), "Yillik Plan  (En Iyi Deger)", fill=(255,215,0),
                  font=fm, anchor="mm")
        draw.text((320,565), "399,99 TL / yil", fill=(255,255,255),
                  font=fb, anchor="mm")
        draw.text((320,612), "%32 tasarruf", fill=(100,255,150), font=fs, anchor="mm")
        for i, f in enumerate(["Reklamsiz oyun","Sinirsiz seviyeler","Ozel icerikler"]):
            draw.text((320, 670+i*38), f"+ {f}", fill=(200,200,200), font=fs, anchor="mm")
        img.save(path, "PNG")
        print(f"  Screenshot: {path} ({path.stat().st_size} bytes)")
    else:
        print("  Pillow not available — using app icon as screenshot")
        icon = Path("/Users/berkeryaprak/Projects/bloomly/assets/icon.png")
        if icon.exists():
            import shutil
            shutil.copy(icon, path)
        else:
            path.write_bytes(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR'
                             b'\x00\x00\x02\x80\x00\x00\x03\x98\x08\x02'
                             b'\x00\x00\x00\xd9\xd9\xd9\x8e\x00\x00\x00\x0c'
                             b'IDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18'
                             b'\xd8N\x00\x00\x00\x00IEND\xaeB`\x82')
    return path

def upload_screenshot(sub_id, screenshot_path, label):
    data = screenshot_path.read_bytes()
    md5  = base64.b64encode(hashlib.md5(data).digest()).decode()
    reserve = POST("/v1/subscriptionAppStoreReviewScreenshots",
                   {"data": {"type": "subscriptionAppStoreReviewScreenshots",
                              "attributes": {"fileName": "bloomly_premium_review.png",
                                             "fileSize": len(data)},
                              "relationships": {"subscription": {
                                  "data": {"type": "subscriptions", "id": sub_id}}}}})
    asset_id = reserve["data"]["id"]
    ops      = reserve["data"]["attributes"].get("uploadOperations", [])
    print(f"  Reserved {label}: {asset_id}, {len(ops)} op(s)")
    for op in ops:
        chunk = data[op.get("offset",0): op.get("offset",0)+op.get("length",len(data))]
        resp  = requests.request(op["method"], op["url"],
                                 headers={h["name"]:h["value"]
                                          for h in op.get("requestHeaders",[])},
                                 data=chunk)
        if not resp.ok:
            print(f"  Chunk error: {resp.status_code} {resp.text[:150]}")
    committed = PATCH(f"/v1/subscriptionAppStoreReviewScreenshots/{asset_id}",
                      {"data": {"type": "subscriptionAppStoreReviewScreenshots",
                                "id": asset_id,
                                "attributes": {"uploaded": True,
                                               "sourceFileChecksum": md5}}})
    state = committed["data"]["attributes"].get("assetDeliveryState","?")
    print(f"  Screenshot {label}: {state}")
    return asset_id

def check_state(sub_id, label):
    r = GET(f"/v1/subscriptions/{sub_id}",
            {"fields[subscriptions]": "state,name,productId"})
    a = r["data"]["attributes"]
    st = a.get("state","?")
    print(f"  {label}: state={st}  productId={a.get('productId')}")
    return st

# ── Main ──────────────────────────────────────────────────────────────────────
def run():
    print("\n=== Bloomly IAP – Prices + Screenshots + State Check ===\n")
    results = {
        "subscriptionGroupId": SG_ID,
        "monthly": {"id": MONTHLY_ID, "productId": "com.voxduru.bloomly.premium.monthly"},
        "yearly":  {"id": YEARLY_ID,  "productId": "com.voxduru.bloomly.premium.yearly"},
    }

    # 1. Prices
    print("1. Setting prices (TUR) …")
    set_price(MONTHLY_ID, 49.99,  "monthly")
    set_price(YEARLY_ID,  399.99, "yearly")

    # 2. Review screenshots
    print("\n2. Uploading review screenshots …")
    shot = make_screenshot()
    upload_screenshot(MONTHLY_ID, shot, "monthly")
    upload_screenshot(YEARLY_ID,  shot, "yearly")

    # 3. State check
    print("\n3. Current states …")
    results["monthly"]["state"] = check_state(MONTHLY_ID, "monthly")
    results["yearly"]["state"]  = check_state(YEARLY_ID,  "yearly")

    out = Path("/tmp/bloomly_iap_result.json")
    out.write_text(json.dumps(results, indent=2))
    print(f"\n=== Done → {out} ===\n")
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    run()
