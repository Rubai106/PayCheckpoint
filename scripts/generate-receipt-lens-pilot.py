#!/usr/bin/env python3
"""Generate clearly watermarked, synthetic payment-receipt OCR pilot fixtures.

These are not copies of wallet/provider screens and contain no real transaction data.
Ground truth is known from this generator; results are a technical smoke pilot only,
not independently reviewed or representative of real MFS screenshots.
"""
from __future__ import annotations
import json, random, hashlib, csv
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'evaluation' / 'receipt-lens-pilot'
IMG_DIR = OUT / 'images'
IMG_DIR.mkdir(parents=True, exist_ok=True)
random.seed(20261030)

def find_font(candidates: list[str], label: str) -> str:
    for candidate in candidates:
        if Path(candidate).is_file():
            return candidate
    raise RuntimeError(
        f"A {label} font was not found. Install a Unicode font with Bengali glyphs "
        "(for example Noto Sans Bengali) and update the font candidate list in this generator."
    )

FONT_EN = find_font([
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    'C:/Windows/Fonts/arial.ttf',
    'C:/Windows/Fonts/segoeui.ttf',
    '/System/Library/Fonts/Supplemental/Arial.ttf',
], 'English')
FONT_EN_BOLD = find_font([
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    'C:/Windows/Fonts/arialbd.ttf',
    'C:/Windows/Fonts/segoeuib.ttf',
    '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
], 'English bold')
FONT_BN = find_font([
    '/usr/share/fonts/truetype/noto/NotoSansBengali-Regular.ttf',
    'C:/Windows/Fonts/Nirmala.ttf',
    'C:/Windows/Fonts/NirmalaUI.ttf',
    '/System/Library/Fonts/Supplemental/Bangla MN.ttc',
], 'Bengali')
FONT_BN_BOLD = find_font([
    '/usr/share/fonts/truetype/noto/NotoSansBengali-Bold.ttf',
    'C:/Windows/Fonts/NirmalaB.ttf',
    'C:/Windows/Fonts/NirmalaUI-Bold.ttf',
    '/System/Library/Fonts/Supplemental/Bangla MN.ttc',
], 'Bengali bold')

RECIPIENTS = ['01700000000','01800000000','01900000000','01600000000','01500000000','01300000000','01700000001','01800000001']
SENDERS = ['01400000000','01500000001','01600000001','01900000001']
AMOUNTS = ['1250.00','3000.00','475.50','999.00','25000.00','80.00','1500.00','625.25']
BN_DIGITS = str.maketrans('0123456789', '০১২৩৪৫৬৭৮৯')

def font(path: str, size: int):
    layout = getattr(ImageFont, 'Layout', None)
    engine = getattr(layout, 'RAQM', None) if layout else None
    try:
        return ImageFont.truetype(path, size, layout_engine=engine)
    except TypeError:
        return ImageFont.truetype(path, size)

def money_en(amount: str) -> str:
    return f'BDT {amount}'

def money_bn(amount: str) -> str:
    whole, dot, fraction = amount.partition('.')
    return '৳ ' + whole.translate(BN_DIGITS) + ('.' + fraction.translate(BN_DIGITS) if dot else '')

def draw_receipt(case_no: int, lang: str, condition: str, recipient: str, amount: str, sender: str):
    w, h = 1040, 1460
    img = Image.new('RGB', (w, h), '#ffffff')
    d = ImageDraw.Draw(img)
    en = lang in ('en', 'mixed')
    bn = lang in ('bn', 'mixed')
    # The title and full-width watermark make these unmistakably synthetic.
    d.rounded_rectangle((34, 28, w-34, h-28), radius=28, outline='#b5c0cb', width=3, fill='#fbfcfe')
    d.rounded_rectangle((56, 52, w-56, 236), radius=20, fill='#172635')
    title_font = font(FONT_EN_BOLD, 44)
    subtitle_font = font(FONT_EN, 24)
    d.text((92, 78), 'SYNTHETIC TEST RECEIPT', font=title_font, fill='#ffffff')
    d.text((94, 148), 'NOT A REAL WALLET OR PAYMENT RECORD', font=subtitle_font, fill='#d9e3ed')
    d.text((94, 190), f'PILOT FIXTURE RL-{case_no:03d}', font=font(FONT_EN, 20), fill='#d9e3ed')

    # Layout deliberately varies only in visual quality, not factual ambiguity.
    base_y = 282
    row_h = 102
    label_en = {
        'sender':'From', 'recipient':'Recipient', 'amount':'Amount', 'fee':'Fee',
        'balance':'Available balance', 'date':'Date', 'ref':'Reference', 'status':'Status'
    }
    label_bn = {
        'sender':'প্রেরক', 'recipient':'প্রাপক', 'amount':'পরিমাণ', 'fee':'চার্জ',
        'balance':'ব্যালেন্স', 'date':'তারিখ', 'ref':'রেফারেন্স', 'status':'অবস্থা'
    }
    vals_en = {
        'sender':sender, 'recipient':recipient, 'amount':money_en(amount), 'fee':'BDT 10.00',
        'balance':'BDT 5000.00', 'date':'2026-10-30 10:25', 'ref':f'TESTREF26{case_no:06d}', 'status':'SIMULATED ONLY'
    }
    vals_bn = {
        'sender':sender.translate(BN_DIGITS), 'recipient':recipient.translate(BN_DIGITS), 'amount':money_bn(amount),
        'fee':'৳ ১০.০০', 'balance':'৳ ৫০০০.০০', 'date':'৩০-১০-২০২৬ ১০:২৫', 'ref':f'TESTREF26{case_no:06d}', 'status':'শুধু নমুনা'
    }
    labels = [
        ('status', 'status'), ('sender','sender'), ('recipient','recipient'), ('amount','amount'),
        ('fee','fee'), ('balance','balance'), ('date','date'), ('ref','ref')
    ]
    reference_lines = ['SYNTHETIC TEST RECEIPT', 'NOT A REAL WALLET OR PAYMENT RECORD', f'PILOT FIXTURE RL-{case_no:03d}']
    # Mixed mode deliberately alternates scripts by field. Avoid rendering Latin
    # labels in a Bengali-only font, which would create missing-glyph artefacts.
    for idx, (key, _) in enumerate(labels):
        y = base_y + idx * row_h
        if idx % 2 == 0:
            d.line((84, y+row_h-12, w-84, y+row_h-12), fill='#e3e8ee', width=2)
        label_is_bn = False
        value_is_bn = False
        if key == 'status':
            label = label_en[key] if lang != 'bn' else label_bn[key]
            value = vals_en[key] if lang != 'bn' else vals_bn[key]
            label_is_bn = (lang == 'bn'); value_is_bn = (lang == 'bn')
        elif lang == 'en':
            label, value = label_en[key], vals_en[key]
        elif lang == 'bn':
            label, value = label_bn[key], vals_bn[key]
            label_is_bn = True; value_is_bn = True
        else:
            if key == 'sender': label, value = 'From', vals_en[key]
            elif key == 'recipient': label, value = 'Recipient', vals_bn[key]; value_is_bn = True
            elif key == 'amount': label, value = label_bn[key], money_bn(amount); label_is_bn = True; value_is_bn = True
            elif key == 'fee': label, value = 'Fee', vals_en[key]
            elif key == 'balance': label, value = label_bn[key], vals_bn[key]; label_is_bn = True; value_is_bn = True
            elif key == 'date': label, value = 'Date', vals_en[key]
            elif key == 'ref': label, value = 'Reference', vals_en[key]
            else: label, value = label_en[key], vals_en[key]
        lf = font(FONT_BN_BOLD, 30) if label_is_bn else font(FONT_EN_BOLD, 26)
        vf = font(FONT_BN, 34) if value_is_bn else font(FONT_EN, 32)
        d.text((96, y+12), label, font=lf, fill='#536273')
        d.text((420, y+10), value, font=vf, fill='#172635')
        reference_lines.append(f'{label} {value}')

    footer_y = base_y + len(labels)*row_h + 24
    d.rounded_rectangle((84, footer_y, w-84, footer_y+100), radius=14, fill='#fff5db', outline='#dfbd65', width=2)
    d.text((112, footer_y+18), 'SYNTHETIC / TEST DATA ONLY — DO NOT CONTACT OR PAY', font=font(FONT_EN_BOLD, 22), fill='#6b4b00')
    d.text((112, footer_y+55), f'Fixture {case_no:03d} · no real customer or provider data', font=font(FONT_EN, 20), fill='#6b4b00')
    reference_lines.extend(['SYNTHETIC / TEST DATA ONLY — DO NOT CONTACT OR PAY', f'Fixture {case_no:03d} · no real customer or provider data'])

    # Image conditions stress rendering while preserving readable ground truth.
    if condition == 'low-contrast':
        img = Image.blend(img, Image.new('RGB', img.size, '#f0f0f0'), 0.38)
    elif condition == 'small-text':
        img = img.resize((800, 1123), Image.Resampling.LANCZOS)
    elif condition == 'jpeg-compressed':
        import io
        buff = io.BytesIO(); img.save(buff, 'JPEG', quality=42, optimize=True); buff.seek(0); img = Image.open(buff).convert('RGB')
    elif condition == 'mild-blur':
        img = img.filter(ImageFilter.GaussianBlur(1.0))
    elif condition == 'slight-rotation':
        img = img.rotate(1.1, resample=Image.Resampling.BICUBIC, expand=False, fillcolor='white')
    elif condition == 'narrow-crop':
        # Crop only the outside margins; all labeled fields remain visible.
        img = img.crop((35, 20, w-35, h-20))
    return img, '\n'.join(reference_lines)

cases=[]
conditions=['clean','low-contrast','small-text','jpeg-compressed','mild-blur','slight-rotation','narrow-crop','clean']
for i in range(24):
    lang = 'en' if i < 8 else 'bn' if i < 16 else 'mixed'
    slot = i % 8
    recipient = RECIPIENTS[i % len(RECIPIENTS)]
    sender = SENDERS[i % len(SENDERS)]
    amount = AMOUNTS[(i*3) % len(AMOUNTS)]
    condition = conditions[slot]
    case_id = f'PILOT-{i+1:03d}'
    filename = case_id.lower() + '.png'
    image, reference_text = draw_receipt(i+1, lang, condition, recipient, amount, sender)
    path = IMG_DIR / filename
    image.save(path, format='PNG', optimize=True)
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    cases.append({
        'caseId':case_id, 'file':f'images/{filename}', 'sha256':digest,
        'language':lang, 'condition':condition,
        'expectedRecipient':recipient, 'expectedAmount':amount, 'referenceText':reference_text,
        'nonTargetSender':sender, 'groundTruthSource':'deterministic synthetic generator',
        'independentReview':'not performed', 'notes':'Synthetic watermarked test fixture; not a real payment or provider screen.'
    })

manifest={
  'schemaVersion':1,
  'dataset':'PayCheckpoint ReceiptLens Synthetic Technical Pilot v1',
  'createdAt':'2026-10-30',
  'status':'synthetic-pilot-only-not-independent-evaluation',
  'engineUnderTest':'Native Tesseract CLI; exact version and traineddata hashes are recorded in each run result.',
  'browserEngineParity':'not established; ReceiptLens browser uses Tesseract.js 7.0.0',
  'cases':len(cases),
  'languageCounts':{'en':8,'bn':8,'mixed':8},
  'conditions':sorted(set(c['condition'] for c in cases)),
  'privacy':'No real customer, provider, payment, or account data. Images are generated locally and watermarked synthetic.',
  'groundTruth':'Generated from known input values; not independently annotated or adjudicated.',
  'casesManifest':cases
}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
with (OUT/'generator-ground-truth.csv').open('w',newline='',encoding='utf-8-sig') as f:
    writer=csv.DictWriter(f,fieldnames=['case_id','file','sha256','language','condition','expected_recipient','expected_amount','non_target_sender','ground_truth_source','independent_review'])
    writer.writeheader()
    for c in cases:
        writer.writerow({'case_id':c['caseId'],'file':c['file'],'sha256':c['sha256'],'language':c['language'],'condition':c['condition'],'expected_recipient':c['expectedRecipient'],'expected_amount':c['expectedAmount'],'non_target_sender':c['nonTargetSender'],'ground_truth_source':c['groundTruthSource'],'independent_review':c['independentReview']})
print(f'Generated {len(cases)} synthetic watermarked receipt images at {OUT}')
