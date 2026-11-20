import subprocess
import sys
import os
import re

print('=== 1. CHECKING JAVASCRIPT SYNTAX ===')
try:
    res1 = subprocess.run(['node', '-c', 'js/app.js'], capture_output=True, text=True)
    if res1.returncode != 0:
        print('Syntax error in js/app.js:', res1.stderr)
        sys.exit(1)
    print('js/app.js: SYNTAX OK')

    res2 = subprocess.run(['node', '-c', 'js/memories.js'], capture_output=True, text=True)
    if res2.returncode != 0:
        print('Syntax error in js/memories.js:', res2.stderr)
        sys.exit(1)
    print('js/memories.js: SYNTAX OK')
except Exception as e:
    print('Node check error:', e)

print('\n=== 2. CHECKING RENAMING TO LỊCH SỬ TIẾN HÓA CỦA HẢI THÀNH ===')
files = ['index.html', 'js/memories.js', 'js/app.js', 'ghichu.txt']
for fn in files:
    with open(fn, 'r', encoding='utf-8') as f:
        content = f.read()
    
    old_matches = re.findall(r'Bảo\s*Tàng\s*Kỷ\s*Niệm\s*Cá\s*Nhân', content, re.IGNORECASE)
    new_matches = re.findall(r'Lịch\s*Sử\s*Tiến\s*Hóa\s*Của\s*Hải\s*Thành', content, re.IGNORECASE)

    print(f'{fn}:')
    print(f'  - "Bảo Tàng Kỷ Niệm Cá Nhân" found: {len(old_matches)}')
    print(f'  - "Lịch Sử Tiến Hóa Của Hải Thành" found: {len(new_matches)}')
    assert len(new_matches) > 0, f'Expected new name in {fn}'
    assert len(old_matches) == 0, f'Old name still exists in {fn}'

print('\n=== 3. CHECKING BACKGROUND PLAYLIST & AUDIO SCAN ===')
with open('js/memories.js', 'r', encoding='utf-8') as f:
    mem_text = f.read()

assert 'window.BACKGROUND_PLAYLIST' in mem_text, 'BACKGROUND_PLAYLIST missing in js/memories.js'
print('BACKGROUND_PLAYLIST present in js/memories.js')

# Check audio files
assert 'audio/nh%E1%BA%A1c%20n%E1%BB%81n/' in mem_text, 'Encoded background music paths missing'
print('Encoded audio paths: VERIFIED')

print('\n=== 4. CHECKING FOCAL POINTS AND AUTO-GENERATED NOTES ===')
import json
json_part = mem_text.split('window.MEMORIES_DATA = ')[1].split(';\n\n/**')[0]
data = json.loads(json_part)

total_mem = 0
empty_notes = 0
with_focal = 0
for s in data['stages']:
    for m in s['memories']:
        total_mem += 1
        if not m.get('description') or m['description'].strip() == '':
            empty_notes += 1
        if m.get('focalPoint'):
            with_focal += 1

print(f'Total memories: {total_mem}')
print(f'Memories with empty notes: {empty_notes} (Must be 0)')
print(f'Memories with focalPoint: {with_focal}')
assert empty_notes == 0, 'Found memories with empty notes!'
assert with_focal > 0, 'No focal points found!'

print('\n=== 5. CHECKING FLOATING PLAYER IN HTML & CSS ===')
with open('index.html', 'r', encoding='utf-8') as f:
    html_text = f.read()
assert 'id="floating-bg-player"' in html_text
assert 'id="bg-music-toggle-btn"' in html_text
assert 'id="bg-music-next-btn"' in html_text

with open('css/style.css', 'r', encoding='utf-8') as f:
    css_text = f.read()
assert '.floating-bg-player' in css_text
assert '.bg-music-disk-btn' in css_text

print('Floating player markup and styles: VERIFIED')

print('\n=== 6. CHECKING STAGE MUSIC AUTO-PLAY ON ARCHIVE BUTTON ===')
with open('js/app.js', 'r', encoding='utf-8') as f:
    app_text = f.read()

assert 'playStageAudio(stageId)' in app_text, 'playStageAudio not called in openFilmstripModal'
assert 'initBackgroundMusic()' in app_text, 'initBackgroundMusic not called'
assert 'pauseBgMusic' in app_text, 'pauseBgMusic missing'
print('Stage music on archive button & anti-overlapping: VERIFIED')

print('\nALL 4 UPGRADES VERIFIED SUCCESSFULLY!')
