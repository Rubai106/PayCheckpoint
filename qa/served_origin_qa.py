"""HTTP-level smoke test against the actual local Node origin.

Browser navigation to localhost is restricted in some isolated runners; the separate
Playwright first-time suite covers UI interactions. This script deliberately reports
HTTP/API evidence only and never labels it as a browser test.
"""
import json
from urllib.request import Request, urlopen
from urllib.error import HTTPError

BASE = 'http://127.0.0.1:4173'

def get(path, expected=200):
    try:
        with urlopen(BASE + path, timeout=8) as r:
            status, headers, body = r.status, r.headers, r.read()
    except HTTPError as e:
        status, headers, body = e.code, e.headers, e.read()
    assert status == expected, (path, status, body[:200])
    return headers, body

def post(path):
    req = Request(BASE + path, method='POST')
    with urlopen(req, timeout=8) as r:
        return r.status, json.loads(r.read().decode('utf-8'))

headers, body = get('/')
assert b'PayCheckpoint' in body
assert headers.get('X-Content-Type-Options') == 'nosniff'
assert headers.get('X-Frame-Options') == 'DENY'
assert headers.get('Referrer-Policy') == 'strict-origin-when-cross-origin'
assert 'camera=()' in headers.get('Permissions-Policy', '')
for path in ['/js/prevention.js', '/js/receipt-lens.js', '/assets/styles.css']:
    get(path)
for path in ['/README.md', '/QA_REPORT.md', '/docs/QA_REPORT.md', '/.env.example', '/tests/', '/scripts/check.mjs']:
    get(path, 404)

_, body = get('/api/copilot/status')
ai = json.loads(body.decode('utf-8'))
assert ai['cloudAiConfigured'] is False
assert ai['requiresApiKey'] is False
assert ai['localFallbackAvailable'] is True
_, body = get('/api/integrations/bkash/status')
provider = json.loads(body.decode('utf-8'))
assert provider['configured'] is False and provider['enabled'] is False
assert provider['networkRequestsMadeByStatusCheck'] is False
status, synthetic = post('/api/sandbox/self-test')
assert status == 200
assert synthetic['status'] == 'passed'
assert synthetic['passed'] == synthetic['total'] == 8
assert synthetic['providerApiCalls'] == 0
assert synthetic['realWalletDataUsed'] is False

print('Served-origin HTTP/API QA: PASS — homepage/static assets 200; private docs/tests/env files 404; security headers present; local AI/provider disabled; synthetic self-test 8/8 with zero provider calls.')
print('Browser limitation: Chromium navigation to localhost is blocked by this runner policy; UI interaction is covered separately by qa:first-time and focused Playwright suites.')
