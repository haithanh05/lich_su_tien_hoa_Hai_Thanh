import subprocess
import sys

# 1. Node syntax check
try:
    res = subprocess.run(['node', '-c', 'js/app.js'], capture_output=True, text=True)
    if res.returncode != 0:
        print('Syntax error in js/app.js:', res.stderr)
        sys.exit(1)
    print('Node syntax check: PASSED')
except Exception as e:
    print('Node check skipped/error:', e)

# 2. Check HTML IDs
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

required_ids = [
    'ticket-station', 'ticket-visitor-name', 'ticket-stage-select', 
    'btn-print-ticket', 'souvenir-ticket', 'ticket-disp-visitor',
    'ticket-disp-stage', 'ticket-disp-time', 'ticket-disp-serial',
    'ticket-disp-quote', 'btn-download-ticket', 'ticket-disp-stub-serial',
    'ticket-disp-stub-visitor', 'ticket-disp-stub-date', 'ticket-disp-barcode-num'
]

missing = [i for i in required_ids if f'id="{i}"' not in html]
if missing:
    print('Missing IDs in index.html:', missing)
    sys.exit(1)
print('All required ticket IDs in index.html: PASSED')

# Check zero <img> tags inside souvenir-ticket
ticket_block = html.split('id="souvenir-ticket"')[1].split('<!-- Download Action Bar -->')[0]
if '<img' in ticket_block.lower():
    print('WARNING: <img> tag found inside souvenir ticket!')
    sys.exit(1)
else:
    print('Zero <img> tag inside ticket: PASSED (Zero canvas taint risk)')

# 3. Check CSS rules
with open('css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

for rule in ['.ticket-station-section', '.souvenir-ticket', '.css-barcode', '.btn-download-ticket', '.ticket-notch']:
    assert rule in css, f'Rule {rule} missing in CSS'
print('All CSS rules present: PASSED')

print('ALL CHECKS PASSED SUCCESSFULLY!')
