"""Validate the expansion; build review sheets without altering source PNGs.

Requires Pillow. Run from any working directory: python expansion/validate.py
Use --sheets to also refresh full-size (1:1), 64 px and 32 px contact sheets.
Framing exceptions are reported separately from PNG/data integrity failures.
"""
from collections import Counter
import hashlib
import json
import math
from pathlib import Path
import re
import sys
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parent
REVIEW=ROOT/'review'
def read(name):return json.loads((ROOT/name).read_text())
def write(name,value):(ROOT/name).write_text(json.dumps(value,indent=2)+'\n')
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def checker(size,tile=16):
    im=Image.new('RGB',size,'#eeeeee');d=ImageDraw.Draw(im)
    for y in range(0,size[1],tile):
        for x in range(0,size[0],tile):
            if (x//tile+y//tile)%2:d.rectangle((x,y,x+tile-1,y+tile-1),fill='#d0d0d0')
    return im

def sheets(rows):
    fontPath='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
    font=ImageFont.truetype(fontPath,24) if Path(fontPath).exists() else ImageFont.load_default()
    for start in range(0,len(rows),8):
        batch=rows[start:start+8]
        originals=[Image.open(ROOT/a['artwork']).convert('RGBA') for a in batch]
        width=max(im.width for im in originals);height=max(im.height for im in originals)
        sheet=checker((width*4,(height+50)*2),32);d=ImageDraw.Draw(sheet)
        for i,(a,im) in enumerate(zip(batch,originals)):
            x=(i%4)*width;y=(i//4)*(height+50)
            sheet.paste(im,(x,y),im)
            d.rectangle((x,y+height,x+width,y+height+49),fill='white')
            d.text((x+12,y+height+10),a['id'],fill='black',font=font)
        # Native pixel dimensions are preserved. Full-size refers to scale,
        # not losslessness of the contact-sheet compression; PNGs are originals.
        sheet.save(REVIEW/f'full-size-{start//8+1:02}.webp',quality=94,method=6)
        for im in originals:im.close()
    for size in (64,32):
        cellW=190;cellH=size+45
        sheet=checker((cellW*8,cellH*8),8);d=ImageDraw.Draw(sheet)
        for i,a in enumerate(rows):
            im=Image.open(ROOT/a['artwork']).convert('RGBA');im.thumbnail((size,size),Image.Resampling.LANCZOS)
            x=(i%8)*cellW;y=(i//8)*cellH
            sheet.paste(im,(x+(cellW-size)//2,y),im)
            d.rectangle((x,y+size+2,x+cellW-1,y+cellH-1),fill='white')
            d.text((x+5,y+size+7),a['id'],fill='black')
        sheet.save(REVIEW/f'contact-{size}px.png')
    # A static local review page supports true full-size inspection on dark,
    # white and checker backgrounds; no network calls or external libraries.
    import html
    cards='\n'.join(f'<figure><a href="../{html.escape(a["artwork"])}"><img loading="lazy" src="../{html.escape(a["artwork"])}" alt="{html.escape(a["name"])}"></a><figcaption>{html.escape(a["id"])}</figcaption></figure>' for a in rows)
    (REVIEW/'index.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Menagerie artwork review</title><style>body{font-family:system-ui;margin:24px;background:#eee;color:#222}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}figure{margin:0;padding:12px;background:white;border-radius:8px}img{width:100%;height:280px;object-fit:contain;background:repeating-conic-gradient(#ddd 0 25%,#fff 0 50%) 0/24px 24px}a:focus-visible{outline:3px solid blue}figcaption{padding:8px}button{margin:8px;padding:8px}</style><h1>64 new competitors</h1><p>Click an original to inspect at full resolution. Small contact sheets contain actual 64 px and 32 px sprites. Artwork is a stylized representation, not anatomical reference.</p><button onclick="document.querySelectorAll('img').forEach(i=>i.style.background='#fff')">White</button><button onclick="document.querySelectorAll('img').forEach(i=>i.style.background='#222')">Dark</button><button onclick="document.querySelectorAll('img').forEach(i=>i.style.background='repeating-conic-gradient(#ddd 0 25%,#fff 0 50%) 0/24px 24px')">Checker</button><main>'''+cards+'</main></html>')

def main():
    rows=read('species.json');sources=read('sources.json');direction=read('art-direction.json')
    baseline=json.loads((ROOT.parent/'assets/animals/catalog.json').read_text())
    assert len(baseline)==36 and len(rows)==64
    ids=[r['id'] for r in rows];taxa=[r['scientific'] for r in rows]
    assert len(set(ids))==64 and len(set(taxa))==64
    assert not set(ids)&{a['id'] for a in baseline}
    assert not set(taxa)&{a['scientific'] for a in baseline}
    assert len({r['scientific'].split()[0] for r in rows})==64,'Repeated genus requires explicit review'
    assert set(direction['species'])==set(ids)
    assert set(ids)=={s['speciesId'] for s in sources['species']}
    assert sources['baseline']['sha256']==digest(ROOT.parent/'src/data/animals.ts')
    assert direction['styleReferenceSha256']==digest(ROOT.parent/'assets/animals/originals/cheetah.png')
    required={'quokka','cassowary','emu','secretary-bird','roadrunner','pangolin','wombat','komodo-dragon','tarantula','scorpion','coconut-crab'}
    assert required <= set(ids)
    assert next(a for a in rows if a['id']=='quokka')['scientific']=='Setonix brachyurus'
    records=[]
    for a,p in zip(rows,sources['species']):
        id=a['id'];assert id==p['speciesId'] and a['scientific']==p['scientific']
        assert re.fullmatch(r'[a-z][a-z0-9]*(?:-[a-z0-9]+)*',id)
        assert re.fullmatch(r'[A-Z][a-z]+ [a-z]+',a['scientific'])
        assert a['emoji']=='','No emoji placeholders'
        assert a['locomotion'] in {'gallop','bound','biped','waddle','crawl'}
        assert a['source']=='adw' and a['category'] in {'Sprinters','Distance stars','Heavyweights','Wildcards'}
        assert a['taxonomy']['living'] is True and a['taxonomy']['rank']=='species'
        assert a['lifeStage']=='adult' and a['raceMedium']=='land'
        assert a['biologicalGroup'] in {'mammal','bird','reptile','amphibian','terrestrial-invertebrate'}
        assert re.fullmatch(r'#[0-9a-f]{6}',a['color'])
        expected={'mass','topSpeed','acceleration','sprint','sustainable','fatigue','delay'}
        assert set(a['stats'])==expected and set(p['fields'])==expected
        for key,value in a['stats'].items():
            assert type(value) in (int,float) and math.isfinite(value) and value>=0
            assert p['fields'][key]['value']==value and p['fields'][key]['unit']
            assert p['fields'][key]['status']
        assert a['stats']['mass']>=1e-6 and a['stats']['topSpeed']>0 and a['stats']['acceleration']>0
        assert 0<a['stats']['sustainable']<=a['stats']['topSpeed']<=40
        assert a['stats']['sprint']<=600 and a['stats']['fatigue']<=2
        references={r['id']:r for r in p['references']};assert references
        for ref in references.values():
            assert ref['url'].startswith('https://') and ref['title'] and ref['evidenceNote']
            assert re.fullmatch(r'\d{4}-\d{2}-\d{2}',ref['accessed'])
        for field in p['fields'].values():
            for e in field['evidence']:assert e['sourceId'] in references
        path=ROOT/a['artwork'];assert path==ROOT/'originals'/f'{id}.png' and path.exists()
        with Image.open(path) as im:
            assert im.format=='PNG' and im.mode=='RGBA'
            im.load();w,h=im.size;assert w==h and w>=1024
            alpha=im.getchannel('A');hist=alpha.histogram()
            assert hist[0]>w*h*0.05 and sum(hist[240:])>w*h*0.01,'Must contain genuinely clear and substantially opaque pixels'
            raw=alpha.getbbox();visible=alpha.point(lambda x:255 if x>=16 else 0).getbbox()
            margins=[visible[0]/w,visible[1]/h,(w-visible[2])/w,(h-visible[3])/h]
            border=math.floor(w*0.1)
            # Strict requirement: all outer-border alpha must be zero.
            strict=all(alpha.crop(box).getextrema()[1]==0 for box in [(0,0,w,border),(0,h-border,w,h),(0,0,border,h),(w-border,0,w,h)])
            records.append(dict(speciesId=id,sha256=digest(path),bytes=path.stat().st_size,width=w,height=h,mode=im.mode,transparentPixelFraction=hist[0]/(w*h),partialAlphaPixelFraction=sum(hist[1:255])/(w*h),rawAlphaBounds=list(raw),visibleAlphaThreshold=16,visibleBounds=list(visible),visibleMargins=margins,strictTenPercentTransparentBorder=strict,visibleTenPercentBorder=min(margins)>=0.1,visibleEdgeTouch=visible[0]==0 or visible[1]==0 or visible[2]==w or visible[3]==h))
    assert {p.stem for p in (ROOT/'originals').glob('*.png')}==set(ids)
    assert len({r['sha256'] for r in records})==64,'Artwork must be individually distinct'
    report=dict(status='pass',recordCount=64,eventualCount=100,uniqueGenera=64,groups=dict(Counter(a['biologicalGroup'] for a in rows)),quantitativeMassEvidenceCount=sum(bool(p['fields']['mass']['evidence']) for p in sources['species']),massEstimateOnlyIds=[p['speciesId'] for p in sources['species'] if not p['fields']['mass']['evidence']],framingStatus='exceptions' if any(not r['strictTenPercentTransparentBorder'] for r in records) else 'pass',framingExceptionIds=[r['speciesId'] for r in records if not r['strictTenPercentTransparentBorder']],visibleEdgeTouchIds=[r['speciesId'] for r in records if r['visibleEdgeTouch']],note='Integrity pass does not certify anatomy or strict art-direction compliance. Read artwork-review.json and framing exceptions. Source metadata validation is not a fresh link availability check.',images=records)
    REVIEW.mkdir(exist_ok=True);write('review/image-checks.json',report)
    if '--sheets' in sys.argv:sheets(rows)
    print(f"PASS: 64 data/source/image records, 100 eventual IDs, 64 genuinely transparent PNGs. Strict framing exceptions: {len(report['framingExceptionIds'])}; visible edge-touch: {report['visibleEdgeTouchIds']}")

if __name__=='__main__':main()
