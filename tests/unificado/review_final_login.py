"""Read-only homologation login proof; local candidate assets may be intercepted."""
import argparse, hashlib, json
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
from PIL import Image, ImageChops

R = Path(__file__).resolve().parents[2]
O = R / 'docs/revisao-visual-unificado/homolog/revisao-final'
BASE = 'https://concrefer.concretrack.com.br:18446'
parser = argparse.ArgumentParser()
parser.add_argument('--candidate', action='store_true')
args = parser.parse_args()
moment = 'depois' if args.candidate else 'antes'
(O / moment).mkdir(parents=True, exist_ok=True)
with sync_playwright() as pw:
    browser = pw.chromium.launch(channel='msedge', headless=True)
    for width, height in [(1440,900),(1024,768),(820,1180),(390,844)]:
        context = browser.new_context(viewport={'width':width,'height':height},service_workers='block')
        def intercept(route):
            url = urlsplit(route.request.url)
            if url.netloc != urlsplit(BASE).netloc:
                return route.abort()
            relative = url.path.removeprefix('/unificado/')
            if args.candidate and relative in ['login.html','shell/login-desktop.css','shell/tokens.css','assets/img/logo-concrefer-oficial.png']:
                p = R / 'unificado' / relative
                if relative == 'login.html':
                    source = p.read_text(encoding='utf-8')
                    source = source.replace('</head>', '<style>.test-environment-bar{position:relative;z-index:9999;padding:6px 12px;background:#fff3cd;color:#664d03;text-align:center;font:600 12px sans-serif}body{padding-top:31px}</style></head>',1)
                    source = source.replace('<body>','<body><div class="test-environment-bar">AMBIENTE DE TESTE · dados isolados de homologação</div>',1)
                    return route.fulfill(body=source, content_type='text/html; charset=utf-8')
                return route.fulfill(path=str(p))
            route.continue_()
        context.route('**/*',intercept)
        page=context.new_page()
        page.goto(BASE+'/unificado/login.html',wait_until='networkidle')
        page.evaluate('document.fonts.ready')
        page.screenshot(path=str(O / moment / f'login-{width}.png'))
        context.close()
    browser.close()
if args.candidate:
    checks=[]
    for width in [1024,820,390]:
        a=Image.open(O/'antes'/f'login-{width}.png').convert('RGB')
        b=Image.open(O/'depois'/f'login-{width}.png').convert('RGB')
        difference=ImageChops.difference(a,b)
        checks.append({'width':width,'pixels_changed':sum(pixel!=(0,0,0) for pixel in difference.getdata()),'identical':difference.getbbox() is None})
    (O/'login-comparison.json').write_text(json.dumps(checks,indent=2))
    assert all(row['identical'] for row in checks),checks
    print(json.dumps(checks))
else:
    print('Captured published 1.4.25 login in four widths')
