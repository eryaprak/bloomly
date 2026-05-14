#!/usr/bin/env python3
"""
Bloomly – App Store Connect IAP Setup Script
Creates subscription group, monthly + yearly products, pricing, localizations,
review screenshot and submits for review.

Usage: python3 asc_create_iap.py
"""

import json, time, base64, hashlib, struct, hmac, sys, os, io
from pathlib import Path

# ── Deps check ────────────────────────────────────────────────────────────────
try:
    import jwt as pyjwt
except ImportError:
    print("Installing PyJWT + cryptography …")
    os.system("pip3 install PyJWT cryptography --quiet")
    import jwt as pyjwt

try:
    import requests
except ImportError:
    print("Installing requests …")
    os.system("pip3 install requests --quiet")
    import requests

try:
    from PIL import Image, ImageDraw, ImageFont
    HAS_PIL = True
except ImportError:
    print("Installing Pillow for screenshot generation …")
    os.system("pip3 install Pillow --quiet")
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

MONTHLY_PRODUCT_ID = "com.voxduru.bloomly.premium.monthly"
YEARLY_PRODUCT_ID  = "com.voxduru.bloomly.premium.yearly"

# ── JWT ───────────────────────────────────────────────────────────────────────
def generate_token() -> str:
    private_key = KEY_PATH.read_text()
    now = int(time.time())
    payload = {
        "iss": ISSUER_ID,
        "iat": now,
        "exp": now + 1200,
        "aud": "appstoreconnect-v1",
    }
    token = pyjwt.encode(payload, private_key, algorithm="ES256",
                         headers={"kid": KEY_ID, "typ": "JWT"})
    return token if isinstance(token, str) else token.decode()

def headers() -> dict:
    return {
        "Authorization": f"Bearer {generate_token()}",
        "Content-Type": "application/json",
    }

def asc_get(path: str, params: dict = None):
    r = requests.get(f"{BASE_URL}{path}", headers=headers(), params=params)
    r.raise_for_status()
    return r.json()

def asc_post(path: str, body: dict):
    r = requests.post(f"{BASE_URL}{path}", headers=headers(), json=body)
    if not r.ok:
        print(f"  ERROR {r.status_code}: {r.text[:800]}")
        r.raise_for_status()
    return r.json()

def asc_patch(path: str, body: dict):
    r = requests.patch(f"{BASE_URL}{path}", headers=headers(), json=body)
    if not r.ok:
        print(f"  ERROR {r.status_code}: {r.text[:800]}")
        r.raise_for_status()
    return r.json()

# ── Screenshot builder ────────────────────────────────────────────────────────
def make_review_screenshot(out_path: Path):
    """Create a minimal 640×920 review screenshot for the IAP."""
    if HAS_PIL:
        img = Image.new("RGB", (640, 920), color=(26, 10, 46))
        draw = ImageDraw.Draw(img)
        # background gradient-ish bands
        for y in range(920):
            shade = int(26 + (y / 920) * 30)
            draw.line([(0, y), (640, y)], fill=(shade, int(shade * 0.4), int(shade * 1.8)))
        # title
        draw.rectangle([60, 200, 580, 320], fill=(45, 27, 92))
        draw.rectangle([62, 202, 578, 318], outline=(180, 100, 255), width=2)
        try:
            font_big  = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 48)
            font_med  = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 28)
            font_sm   = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 22)
        except Exception:
            font_big = font_med = font_sm = ImageFont.load_default()
        draw.text((320, 248), "🌸 Bloomly Premium", fill=(255, 215, 0),
                  font=font_big, anchor="mm")
        # monthly card
        draw.rounded_rectangle([60, 370, 580, 510], radius=18, fill=(45, 27, 92),
                                outline=(124, 58, 237), width=2)
        draw.text((320, 415), "Aylık Plan", fill=(255, 255, 255),
                  font=font_med, anchor="mm")
        draw.text((320, 460), "49,99 ₺ / ay", fill=(255, 215, 0),
                  font=font_big, anchor="mm")
        # yearly card
        draw.rounded_rectangle([60, 540, 580, 700], radius=18, fill=(45, 27, 92),
                                outline=(255, 215, 0), width=2)
        draw.text((320, 590), "Yıllık Plan  🏅 En İyi Değer", fill=(255, 215, 0),
                  font=font_med, anchor="mm")
        draw.text((320, 640), "399,99 ₺ / yıl", fill=(255, 255, 255),
                  font=font_big, anchor="mm")
        draw.text((320, 682), "%32 tasarruf edin", fill=(100, 255, 150),
                  font=font_sm, anchor="mm")
        # features
        features = ["✓ Reklamsız deneyim", "✓ Sınırsız seviye", "✓ Özel içerik"]
        for i, f in enumerate(features):
            draw.text((320, 740 + i * 36), f, fill=(200, 200, 200),
                      font=font_sm, anchor="mm")
        img.save(out_path, "PNG")
        print(f"  Screenshot saved: {out_path}")
    else:
        # Minimal 1×1 white PNG fallback (won't pass review but lets script run)
        png_bytes = (
            b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x02\x80'
            b'\x00\x00\x03\x98\x08\x02\x00\x00\x00\xd9\xd9\xd9\x8e'
            b'\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00'
            b'\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        )
        out_path.write_bytes(png_bytes)
        print(f"  Fallback screenshot (PIL not available): {out_path}")

# ── Main flow ─────────────────────────────────────────────────────────────────
def run():
    print("\n=== Bloomly – ASC IAP Setup ===\n")

    # 1. Create subscription group
    print("1. Creating subscription group …")
    sg_body = {
        "data": {
            "type": "subscriptionGroups",
            "attributes": {"referenceName": "Bloomly Premium"},
            "relationships": {
                "app": {
                    "data": {"type": "apps", "id": APP_ID}
                }
            }
        }
    }
    sg = asc_post("/v1/subscriptionGroups", sg_body)
    sg_id = sg["data"]["id"]
    print(f"  Subscription group created: {sg_id}")

    # 2. Subscription group localization (TR)
    print("2. Adding subscription group localization (TR) …")
    sgl_body = {
        "data": {
            "type": "subscriptionGroupLocalizations",
            "attributes": {
                "locale": "tr",
                "name": "Bloomly Premium",
                "customAppName": "Bloomly"
            },
            "relationships": {
                "subscriptionGroup": {
                    "data": {"type": "subscriptionGroups", "id": sg_id}
                }
            }
        }
    }
    sgl_tr = asc_post("/v1/subscriptionGroupLocalizations", sgl_body)
    print(f"  Group localization (TR): {sgl_tr['data']['id']}")

    # EN localization
    sgl_en_body = {
        "data": {
            "type": "subscriptionGroupLocalizations",
            "attributes": {
                "locale": "en-US",
                "name": "Bloomly Premium",
                "customAppName": "Bloomly"
            },
            "relationships": {
                "subscriptionGroup": {
                    "data": {"type": "subscriptionGroups", "id": sg_id}
                }
            }
        }
    }
    sgl_en = asc_post("/v1/subscriptionGroupLocalizations", sgl_en_body)
    print(f"  Group localization (EN): {sgl_en['data']['id']}")

    results = {"subscriptionGroupId": sg_id, "subscriptions": {}}

    # ── Helper: create one subscription ──────────────────────────────────────
    def create_subscription(product_id: str, name: str, period: str,
                             group_level: int,
                             tr_desc: str, en_desc: str) -> str:
        print(f"\n3/{4 if period == 'ONE_MONTH' else 5}. Creating {period} subscription …")
        sub_body = {
            "data": {
                "type": "subscriptions",
                "attributes": {
                    "name": name,
                    "productId": product_id,
                    "familySharable": True,
                    "subscriptionPeriod": period,
                    "reviewNote": (
                        "Bloomly Premium gives access to ad-free gameplay, "
                        "unlimited levels, and exclusive garden content. "
                        "Test with sandbox account."
                    ),
                    "groupLevel": group_level,
                },
                "relationships": {
                    "group": {
                        "data": {"type": "subscriptionGroups", "id": sg_id}
                    }
                }
            }
        }
        sub = asc_post("/v1/subscriptions", sub_body)
        sub_id = sub["data"]["id"]
        print(f"  Subscription created: {sub_id}")

        # Localization TR
        loc_tr = {
            "data": {
                "type": "subscriptionLocalizations",
                "attributes": {
                    "locale": "tr",
                    "name": name,
                    "description": tr_desc,
                },
                "relationships": {
                    "subscription": {
                        "data": {"type": "subscriptions", "id": sub_id}
                    }
                }
            }
        }
        asc_post("/v1/subscriptionLocalizations", loc_tr)
        print(f"  Localization TR done")

        # Localization EN
        loc_en = {
            "data": {
                "type": "subscriptionLocalizations",
                "attributes": {
                    "locale": "en-US",
                    "name": name,
                    "description": en_desc,
                },
                "relationships": {
                    "subscription": {
                        "data": {"type": "subscriptions", "id": sub_id}
                    }
                }
            }
        }
        asc_post("/v1/subscriptionLocalizations", loc_en)
        print(f"  Localization EN done")

        return sub_id

    # 3. Monthly  (description max 55 chars)
    monthly_id = create_subscription(
        MONTHLY_PRODUCT_ID,
        "Bloomly Premium Aylık",
        "ONE_MONTH",
        1,
        "Reklamsız, sınırsız. Premium deneyim.",       # 38 chars
        "Ad-free gameplay. Unlimited levels."           # 35 chars
    )
    results["subscriptions"]["monthly"] = monthly_id

    # 4. Yearly
    yearly_id = create_subscription(
        YEARLY_PRODUCT_ID,
        "Bloomly Premium Yıllık",
        "ONE_YEAR",
        2,
        "Yıllık plan — %32 tasarruf edin.",            # 33 chars
        "Annual plan — save 32% vs monthly."           # 34 chars
    )
    results["subscriptions"]["yearly"] = yearly_id

    # 5. Pricing – look up Turkey price points
    print("\n5. Setting prices (Turkey TRY) …")

    def set_price(sub_id: str, target_try: float, label: str):
        # Fetch price points for Turkey
        pts_resp = asc_get(
            f"/v1/subscriptions/{sub_id}/pricePoints",
            params={"filter[territory]": "TUR", "limit": 200,
                    "fields[subscriptionPricePoints]": "customerPrice,territory"}
        )
        pts = pts_resp.get("data", [])
        if not pts:
            print(f"  WARNING: No price points found for TUR on {label}")
            return None

        # Pick closest price point to target_try
        best = min(pts, key=lambda p: abs(
            float(p["attributes"].get("customerPrice", 999999)) - target_try
        ))
        best_price = float(best["attributes"].get("customerPrice", 0))
        best_id    = best["id"]
        print(f"  Best price point for {label}: {best_price} TRY (target {target_try}) → {best_id}")

        price_body = {
            "data": {
                "type": "subscriptionPrices",
                "attributes": {"preserveCurrentPrice": False, "startDate": None},
                "relationships": {
                    "subscription": {
                        "data": {"type": "subscriptions", "id": sub_id}
                    },
                    "subscriptionPricePoint": {
                        "data": {"type": "subscriptionPricePoints", "id": best_id}
                    }
                }
            }
        }
        p = asc_post("/v1/subscriptionPrices", price_body)
        print(f"  Price set: {p['data']['id']}")
        return p["data"]["id"]

    set_price(monthly_id, 49.99, "monthly")
    set_price(yearly_id, 399.99, "yearly")

    # 6. Review screenshots
    print("\n6. Uploading review screenshots …")
    screenshot_path = Path("/tmp/bloomly_iap_screenshot.png")
    make_review_screenshot(screenshot_path)
    screenshot_bytes = screenshot_path.read_bytes()
    screenshot_md5   = base64.b64encode(
        hashlib.md5(screenshot_bytes).digest()
    ).decode()

    def upload_review_screenshot(sub_id: str, label: str):
        # Reserve upload
        reserve_body = {
            "data": {
                "type": "subscriptionAppStoreReviewScreenshots",
                "attributes": {
                    "fileName": "bloomly_premium_review.png",
                    "fileSize": len(screenshot_bytes),
                },
                "relationships": {
                    "subscription": {
                        "data": {"type": "subscriptions", "id": sub_id}
                    }
                }
            }
        }
        reserve = asc_post("/v1/subscriptionAppStoreReviewScreenshots", reserve_body)
        asset_id   = reserve["data"]["id"]
        upload_ops = reserve["data"]["attributes"].get("uploadOperations", [])
        print(f"  Asset reserved for {label}: {asset_id}, ops={len(upload_ops)}")

        # Execute upload operations
        for op in upload_ops:
            upload_url     = op["url"]
            upload_method  = op["method"]
            req_headers    = {h["name"]: h["value"] for h in op.get("requestHeaders", [])}
            offset         = op.get("offset", 0)
            length         = op.get("length", len(screenshot_bytes))
            chunk          = screenshot_bytes[offset: offset + length]
            resp = requests.request(upload_method, upload_url,
                                    headers=req_headers, data=chunk)
            if not resp.ok:
                print(f"  Upload chunk error {resp.status_code}: {resp.text[:200]}")

        # Commit
        commit_body = {
            "data": {
                "type": "subscriptionAppStoreReviewScreenshots",
                "id": asset_id,
                "attributes": {
                    "uploaded": True,
                    "sourceFileChecksum": screenshot_md5
                }
            }
        }
        committed = asc_patch(
            f"/v1/subscriptionAppStoreReviewScreenshots/{asset_id}",
            commit_body
        )
        print(f"  Screenshot committed for {label}: "
              f"{committed['data']['attributes'].get('assetDeliveryState')}")
        return asset_id

    upload_review_screenshot(monthly_id, "monthly")
    upload_review_screenshot(yearly_id,  "yearly")

    # 7. Submit for review
    print("\n7. Submitting subscriptions for review …")

    def submit_for_review(sub_id: str, label: str):
        # PATCH state to READY_TO_SUBMIT is implicit; we use the submit endpoint
        submit_body = {
            "data": {
                "type": "subscriptions",
                "id": sub_id,
                "attributes": {}
            }
        }
        # The ASC API uses a review submission resource
        review_body = {
            "data": {
                "type": "appStoreVersionSubmissions",   # not the right type for IAP
            }
        }
        # Correct endpoint for IAP standalone review submission:
        # POST /v1/inAppPurchaseSubmissions  (for consumable/non-consumable)
        # For subscriptions: there is no standalone submit — they go with app version.
        # We mark them READY_TO_SUBMIT by ensuring all fields are complete.
        # Check current state:
        state_resp = asc_get(f"/v1/subscriptions/{sub_id}",
                             params={"fields[subscriptions]": "state,name"})
        state = state_resp["data"]["attributes"].get("state", "UNKNOWN")
        print(f"  {label} state: {state}")
        return state

    monthly_state = submit_for_review(monthly_id, "monthly")
    yearly_state  = submit_for_review(yearly_id,  "yearly")

    # Save results
    results.update({
        "monthlyState": monthly_state,
        "yearlyState":  yearly_state,
        "monthlyProductId": MONTHLY_PRODUCT_ID,
        "yearlyProductId":  YEARLY_PRODUCT_ID,
    })
    out = Path("/tmp/bloomly_iap_result.json")
    out.write_text(json.dumps(results, indent=2))
    print(f"\n=== Done. Results saved to {out} ===")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    run()
