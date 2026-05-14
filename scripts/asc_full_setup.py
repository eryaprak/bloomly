import time, json, base64, hashlib
from pathlib import Path
import jwt as pyjwt, requests
from PIL import Image, ImageDraw, ImageFont

KEY_ID='P3X76F73BW'; ISSUER='7338b935-1bc4-4357-adb3-9fcfe10c9438'
KEY=Path('/Users/berkeryaprak/.appstoreconnect/private_keys/AuthKey_P3X76F73BW.p8').read_text()
BASE='https://api.appstoreconnect.apple.com'

MONTHLY_ID = '6768969913'
YEARLY_ID  = '6768970371'

def tok():
    now=int(time.time())
    t=pyjwt.encode({'iss':ISSUER,'iat':now,'exp':now+1200,'aud':'appstoreconnect-v1'},
                   KEY, algorithm='ES256', headers={'kid':KEY_ID,'typ':'JWT'})
    return t if isinstance(t,str) else t.decode()

def hdrs():
    return {'Authorization': 'Bearer ' + tok(), 'Content-Type': 'application/json'}

def GET(p, params=None):
    r=requests.get(BASE+p, headers=hdrs(), params=params)
    if not r.ok: print('  GET ERR '+str(r.status_code)+': '+r.text[:200])
    return r.json()

def POST(p, body):
    r=requests.post(BASE+p, headers=hdrs(), json=body)
    if not r.ok: print('  POST '+p+' ERR '+str(r.status_code)+': '+r.text[:500])
    return r

def PATCH(p, body):
    r=requests.patch(BASE+p, headers=hdrs(), json=body)
    if not r.ok: print('  PATCH '+p+' ERR '+str(r.status_code)+': '+r.text[:500])
    return r

def set_price(sub_id, territory, target, label):
    pts = GET('/v1/subscriptions/'+sub_id+'/pricePoints',
              {'filter[territory]':territory,'limit':200,
               'fields[subscriptionPricePoints]':'customerPrice'})['data']
    best = min(pts, key=lambda p: abs(float(p['attributes']['customerPrice'])-target))
    best_id = best['id']
    cp = best['attributes']['customerPrice']
    body = {'data':{'type':'subscriptionPrices',
                    'attributes':{'startDate':None,'preserveCurrentPrice':False},
                    'relationships':{
                        'subscription':{'data':{'type':'subscriptions','id':sub_id}},
                        'subscriptionPricePoint':{'data':{'type':'subscriptionPricePoints','id':best_id}}
                    }}}
    r = POST('/v1/subscriptionPrices', body)
    if r.ok:
        print('  Price set '+label+' '+territory+': '+str(cp))
    return r.ok

def setup_availability_and_prices(sub_id, try_price, usa_target, label):
    # Check if availability already exists
    avail_check = GET('/v1/subscriptions/'+sub_id+'/subscriptionAvailability')
    if 'data' in avail_check and avail_check['data']:
        print('  '+label+': availability already set')
    else:
        terr_data = GET('/v1/territories', {'limit':200})['data']
        all_terr = [{'type':'territories','id':t['id']} for t in terr_data]
        body = {'data':{'type':'subscriptionAvailabilities',
                        'attributes':{'availableInNewTerritories':True},
                        'relationships':{
                            'subscription':{'data':{'type':'subscriptions','id':sub_id}},
                            'availableTerritories':{'data':all_terr}
                        }}}
        r = POST('/v1/subscriptionAvailabilities', body)
        if r.ok:
            print('  '+label+': availability created')
        else:
            print('  '+label+': availability error - '+r.text[:200])

    # Check existing prices
    existing = GET('/v1/subscriptions/'+sub_id+'/prices',
                   {'fields[subscriptionPrices]':'territory'})['data']
    existing_terr = set()
    for p in existing:
        t = p.get('relationships',{}).get('territory',{}).get('data',{})
        if t: existing_terr.add(t.get('id',''))
    print('  '+label+': existing price territories: '+str(existing_terr))

    if 'TUR' not in existing_terr:
        set_price(sub_id, 'TUR', try_price, label)
    else:
        print('  '+label+': TUR price already set')

    if 'USA' not in existing_terr:
        set_price(sub_id, 'USA', usa_target, label)
    else:
        print('  '+label+': USA price already set')

print('=== Step 1: Availability + Prices ===')
setup_availability_and_prices(MONTHLY_ID, 49.99, 1.29, 'monthly')
setup_availability_and_prices(YEARLY_ID, 399.99, 10.49, 'yearly')

# Step 2: Review screenshot
print()
print('=== Step 2: Review Screenshots ===')

def make_screenshot():
    path = Path('/tmp/bloomly_review.png')
    img = Image.new('RGB', (640, 920), color=(26, 10, 46))
    draw = ImageDraw.Draw(img)
    for y in range(920):
        s = int(26 + (y/920)*30)
        draw.line([(0,y),(640,y)], fill=(s, int(s*0.4), min(255,int(s*1.9))))
    try:
        fb = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 42)
        fm = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 26)
        fs = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 20)
    except Exception:
        fb = fm = fs = ImageFont.load_default()
    draw.rounded_rectangle([50,150,590,270], radius=14, fill=(45,27,92), outline=(180,100,255), width=2)
    draw.text((320,210), 'Bloomly Premium', fill=(255,215,0), font=fb, anchor='mm')
    draw.rounded_rectangle([50,300,590,430], radius=14, fill=(45,27,92), outline=(124,58,237), width=2)
    draw.text((320,340), 'Aylik Plan', fill=(200,200,200), font=fm, anchor='mm')
    draw.text((320,392), '49,99 TL / ay', fill=(255,215,0), font=fb, anchor='mm')
    draw.rounded_rectangle([50,460,590,620], radius=14, fill=(45,27,92), outline=(255,215,0), width=2)
    draw.text((320,500), 'Yillik Plan - En Iyi Deger', fill=(255,215,0), font=fm, anchor='mm')
    draw.text((320,558), '399,99 TL / yil', fill=(255,255,255), font=fb, anchor='mm')
    draw.text((320,605), '%32 tasarruf', fill=(100,255,150), font=fs, anchor='mm')
    for i, f in enumerate(['+ Reklamsiz oyun','+ Sinirsiz seviyeler','+ Ozel icerikler']):
        draw.text((320, 660+i*38), f, fill=(200,200,200), font=fs, anchor='mm')
    img.save(path, 'PNG')
    print('  Screenshot: '+str(path)+' ('+str(path.stat().st_size)+' bytes)')
    return path

def upload_screenshot(sub_id, shot_path, label):
    data = shot_path.read_bytes()
    md5 = base64.b64encode(hashlib.md5(data).digest()).decode()
    # Check if already uploaded
    existing = GET('/v1/subscriptions/'+sub_id,
                   {'fields[subscriptions]':'appStoreReviewScreenshot',
                    'include':'appStoreReviewScreenshot'})
    inc = existing.get('included', [])
    if inc:
        st = inc[0]['attributes'].get('assetDeliveryState','?')
        print('  '+label+': screenshot already uploaded state='+str(st))
        return inc[0]['id']

    reserve = POST('/v1/subscriptionAppStoreReviewScreenshots',
                   {'data':{'type':'subscriptionAppStoreReviewScreenshots',
                             'attributes':{'fileName':'bloomly_premium_review.png','fileSize':len(data)},
                             'relationships':{'subscription':{'data':{'type':'subscriptions','id':sub_id}}}}})
    if not reserve.ok:
        print('  '+label+': screenshot reserve failed')
        return None
    asset_id = reserve.json()['data']['id']
    ops = reserve.json()['data']['attributes'].get('uploadOperations', [])
    print('  '+label+': reserved '+asset_id+', '+str(len(ops))+' ops')
    for op in ops:
        offset = op.get('offset',0); length = op.get('length',len(data))
        chunk = data[offset:offset+length]
        resp = requests.request(op['method'], op['url'],
                                headers={h['name']:h['value'] for h in op.get('requestHeaders',[])},
                                data=chunk)
        if not resp.ok:
            print('  Upload chunk ERR '+str(resp.status_code)+': '+resp.text[:100])
    committed = PATCH('/v1/subscriptionAppStoreReviewScreenshots/'+asset_id,
                      {'data':{'type':'subscriptionAppStoreReviewScreenshots','id':asset_id,
                               'attributes':{'uploaded':True,'sourceFileChecksum':md5}}})
    if committed.ok:
        state = committed.json()['data']['attributes'].get('assetDeliveryState','?')
        print('  '+label+': screenshot committed ('+str(state)+')')
        return asset_id
    return None

shot = make_screenshot()
upload_screenshot(MONTHLY_ID, shot, 'monthly')
upload_screenshot(YEARLY_ID, shot, 'yearly')

# Step 3: Check final states
print()
print('=== Step 3: Final States ===')
results = {}
for sub_id, label in [(MONTHLY_ID,'monthly'), (YEARLY_ID,'yearly')]:
    r = GET('/v1/subscriptions/'+sub_id,
            {'fields[subscriptions]':'state,name,productId'})
    a = r['data']['attributes']
    st = a.get('state')
    pid = a.get('productId')
    print('  '+label+': state='+str(st)+' product='+str(pid))
    results[label] = {'id': sub_id, 'productId': pid, 'state': st}

out = Path('/tmp/bloomly_iap_final.json')
out.write_text(json.dumps({
    'subscriptionGroupId': '22085965',
    'subscriptions': results
}, indent=2))
print()
print('Results -> '+str(out))
print(out.read_text())
