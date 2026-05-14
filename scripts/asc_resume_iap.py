#!/usr/bin/env python3
"""
Resume IAP setup from where we left off.
Subscription group: 22085965
Monthly sub already created: 6768969913  (localization failed, need to add)
"""

import json, time, base64, hashlib, os, sys
from pathlib import Path

import jwt as pyjwt
import requests

try:
    from PIL import Image, ImageDraw, ImageFont
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

# ── Config ────────────────────────────────────────────────────────────────────
KEY_ID     = "P3X76F73BW"
ISSUER_ID  = "7338b935-1bc4-4357-adb3-9fcfe10c9438"
KEY_PATH   = Path("/Users/berkeryaprak/.appstoreconnect/private_keys/AuthKey_P3X76F73BW.p8")
APP_ID     = "6767557874"
BASE_URL   = "https://api.appstoreconnect.apple.com"

# Already created
SG_ID        = "22085965"
MONTHLY_ID   = "6768969913"

MONTHLY_PRODUCT_ID = "com.voxduru.bloomly.premium.monthly"
YEARLY_PRODUCT_ID  = "com.voxduru.bloomly.premium.yearly"

# ── JWT / HTTP helpers ────────────────────────────────────────────────────────
def generate_token() -> str:
    private_key = KEY_PATH.read_text()
    now = int(time.time())
    payload = {"iss": ISSUER_ID, "iat": now, "exp": now + 1200,
               "aud": "appstoreconnect-v1"}
    tok = pyjwt.encode(payload, private_key, algorithm="ES256",
                       headers={"kid": KEY_ID, "typ": "JWT"})
    return tok if isinstance(tok, str) else tok.decode()

def hdrs():
    return {"Authorization": f"Bearer {generate_token()}",
            "Content-Type": "application/json"}

def GET(path, params=None):
    r = requests.get(f"{BASE_URL}{path}", headers=hdrs(), params=params)
    r.raise_for_status()
    return r.json()

def POST(path, body):
    r = requests.post(f"{BASE_URL}{path}", headers=hdrs(), json=body)
    if not r.ok:
        print(f"  [POST {path}] ERROR {r.status_code}: {r.text[:600]}")
        r.raise_for_status()
    return r.json()

def PATCH(path, body):
    r = requests.patch(f"{BASE_URL}{path}", headers=hdrs(), json=body)
    if not r.ok:
        print(f"  [PATCH {path}] ERROR {r.status_code}: {r.text[:600]}")
        r.raise_for_status()
    return r.json()

# ── Step helpers ──────────────────────────────────────────────────────────────
def add_localization(sub_id, locale, name, desc):
    body = {"data": {"type": "subscriptionLocalizations",
                     "attributes": {"locale": locale, "name": name,
                                    "description": desc},
                     "relationships": {"subscription": {
                         "data": {"type": "subscriptions", "id": sub_id}}}}}
    res = POST("/v1/subscriptionLocalizations", body)
    print(f"  Locale {locale} for {sub_id}: {res['data']['id']}")
    return res["data"]["id"]

def create_subscription(sg_id, product_id, name, period, group_level,
                         tr_desc, en_desc):
    body = {"data": {"type": "subscriptions",
                     "attributes": {"name": name, "productId": product_id,
                                    "familySharable": True,
                                    "subscriptionPeriod": period,
                                    "reviewNote": (
                                        "Bloomly Premium gives ad-free gameplay "
                                        "and unlimited levels. "
                                        "Test with Apple sandbox account."),
                                    "groupLevel": group_level},
                     "relationships": {"group": {
                         "data": {"type": "subscriptionGroups", "id": sg_id}}}}}
    res = POST("/v1/subscriptions", body)
    sub_id = res["data"]["id"]
    print(f"  Subscription created: {sub_id}")
    add_localization(sub_id, "tr", name, tr_desc)
    add_localization(sub_id, "en-US", name, en_desc)
    return sub_id

def set_price(sub_id, target_try, label):
    pts_resp = GET(f"/v1/subscriptions/{sub_id}/pricePoints",
                   {"filter[territory]": "TUR", "limit": 200,
                    "fields[subscriptionPricePoints]": "customerPrice,territory"})
    pts = pts_resp.get("data", [])
    if not pts:
        print(f"  WARNING: No TUR price points for {label}")
        return None
    best = min(pts, key=lambda p:
               abs(float(p["attributes"].get("customerPrice", 999999)) - target_try))
    best_price = float(best["attributes"]["customerPrice"])
    best_id    = best["id"]
    print(f"  Price point {label}: {best_price} TRY (target {target_try}) → {best_id}")

    p_body = {"data": {"type": "subscriptionPrices",
                       "attributes": {"preserveCurrentPrice": False, "startDate": None},
                       "relationships": {
                           "subscription": {"data": {"type": "subscriptions",
                                                      "id": sub_id}},
                           "subscriptionPricePoint": {"data": {
                               "type": "subscriptionPricePoints", "id": best_id}}}}}
    p = POST("/v1/subscriptionPrices", p_body)
    print(f"  Price created: {p['data']['id']}")
    return p["data"]["id"]

def make_screenshot():
    path = Path("/tmp/bloomly_iap_review.png")
    if HAS_PIL:
        img = Image.new("RGB", (640, 920), color=(26, 10, 46))
        draw = ImageDraw.Draw(img)
        for y in range(920):
            shade = int(26 + (y/920)*30)
            draw.line([(0,y),(640,y)],
                      fill=(shade, int(shade*0.4), min(255, int(shade*1.8))))
        try:
            fb = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 44)
            fm = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 26)
            fs = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
        except Exception:
            fb = fm = fs = ImageFont.load_default()
        # Header
        draw.rounded_rectangle([50,180,590,300], radius=16,
                                fill=(45,27,92), outline=(180,100,255), width=2)
        draw.text((320,240), "Bloomly Premium", fill=(255,215,0), font=fb, anchor="mm")
        # Monthly
        draw.rounded_rectangle([50,330,590,460], radius=16,
                                fill=(45,27,92), outline=(124,58,237), width=2)
        draw.text((320,370), "Aylik Plan", fill=(200,200,200), font=fm, anchor="mm")
        draw.text((320,420), "49,99 TL / ay", fill=(255,215,0), font=fb, anchor="mm")
        # Yearly
        draw.rounded_rectangle([50,490,590,640], radius=16,
                                fill=(45,27,92), outline=(255,215,0), width=2)
        draw.text((320,530), "Yillik Plan  — En Iyi Deger", fill=(255,215,0),
                  font=fm, anchor="mm")
        draw.text((320,585), "399,99 TL / yil", fill=(255,255,255),
                  font=fb, anchor="mm")
        draw.text((320,630), "%32 tasarruf", fill=(100,255,150), font=fs, anchor="mm")
        # Features
        for i, f in enumerate(["Reklamalarsiz oyun","Sinirsiz seviyeler","Ozel icerikler"]):
            draw.text((320, 680+i*38), f"✓  {f}", fill=(200,200,200), font=fs, anchor="mm")
        img.save(path, "PNG")
    else:
        # 640×920 solid color PNG (minimal valid PNG)
        path.write_bytes(b'\x89PNG\r\n\x1a\n'
                         + b'\x00\x00\x00\rIHDR'
                         + b'\x00\x00\x02\x80'   # width=640
                         + b'\x00\x00\x03\x98'   # height=920
                         + b'\x08\x02\x00\x00\x00\xd9\xd9\xd9\x8e'
                         + b'\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N'
                         + b'\x00\x00\x00\x00IEND\xaeB`\x82')
    print(f"  Screenshot: {path} ({path.stat().st_size} bytes)")
    return path

def upload_review_screenshot(sub_id, screenshot_path, label):
    data = screenshot_path.read_bytes()
    md5  = base64.b64encode(hashlib.md5(data).digest()).decode()

    reserve_body = {"data": {"type": "subscriptionAppStoreReviewScreenshots",
                              "attributes": {"fileName": "bloomly_premium_review.png",
                                             "fileSize": len(data)},
                              "relationships": {"subscription": {
                                  "data": {"type": "subscriptions", "id": sub_id}}}}}
    reserve = POST("/v1/subscriptionAppStoreReviewScreenshots", reserve_body)
    asset_id = reserve["data"]["id"]
    ops      = reserve["data"]["attributes"].get("uploadOperations", [])
    print(f"  Reserved {label}: {asset_id}, {len(ops)} upload op(s)")

    for op in ops:
        url    = op["url"]
        method = op["method"]
        req_hdr= {h["name"]: h["value"] for h in op.get("requestHeaders", [])}
        offset = op.get("offset", 0)
        length = op.get("length", len(data))
        chunk  = data[offset: offset+length]
        resp   = requests.request(method, url, headers=req_hdr, data=chunk)
        if not resp.ok:
            print(f"  Upload chunk error {resp.status_code}: {resp.text[:200]}")

    commit = PATCH(f"/v1/subscriptionAppStoreReviewScreenshots/{asset_id}",
                   {"data": {"type": "subscriptionAppStoreReviewScreenshots",
                             "id": asset_id,
                             "attributes": {"uploaded": True,
                                            "sourceFileChecksum": md5}}})
    state = commit["data"]["attributes"].get("assetDeliveryState", "?")
    print(f"  Screenshot committed {label}: {state}")
    return asset_id

def check_state(sub_id, label):
    resp  = GET(f"/v1/subscriptions/{sub_id}",
                {"fields[subscriptions]": "state,name,productId"})
    attrs = resp["data"]["attributes"]
    print(f"  {label}: state={attrs.get('state')} product={attrs.get('productId')}")
    return attrs.get("state")

# ── Run ───────────────────────────────────────────────────────────────────────
def run():
    print("\n=== Bloomly IAP Resume ===\n")

    results = {
        "subscriptionGroupId": SG_ID,
        "subscriptions": {"monthly": MONTHLY_ID}
    }

    # A. Add localizations for the already-created monthly subscription
    print("A. Adding localizations to existing monthly subscription …")
    add_localization(MONTHLY_ID, "tr",    "Bloomly Premium Aylik",
                     "Reklamsiz, sinirsiz. Premium deneyim.")
    add_localization(MONTHLY_ID, "en-US", "Bloomly Premium Monthly",
                     "Ad-free gameplay. Unlimited levels.")

    # B. Create yearly subscription
    print("\nB. Creating yearly subscription …")
    yearly_id = create_subscription(
        SG_ID,
        YEARLY_PRODUCT_ID,
        "Bloomly Premium Yillik",
        "ONE_YEAR",
        2,
        "Yillik plan - %32 tasarruf edin.",   # 33 chars
        "Annual plan - save 32% vs monthly."   # 34 chars
    )
    results["subscriptions"]["yearly"] = yearly_id

    # C. Pricing
    print("\nC. Setting Turkey prices …")
    set_price(MONTHLY_ID, 49.99, "monthly")
    set_price(yearly_id,  399.99, "yearly")

    # D. Review screenshots
    print("\nD. Uploading review screenshots …")
    shot = make_screenshot()
    upload_review_screenshot(MONTHLY_ID, shot, "monthly")
    upload_review_screenshot(yearly_id,  shot, "yearly")

    # E. Check states
    print("\nE. Checking states …")
    ms = check_state(MONTHLY_ID, "monthly")
    ys = check_state(yearly_id,  "yearly")
    results["monthlyState"] = ms
    results["yearlyState"]  = ys

    out = Path("/tmp/bloomly_iap_result.json")
    out.write_text(json.dumps(results, indent=2))
    print(f"\n=== Complete. Results → {out} ===")
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    run()
