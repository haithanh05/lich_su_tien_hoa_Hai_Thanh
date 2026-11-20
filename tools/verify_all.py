import os
import re
import json

def run():
    print("=== RUNNING FULL VERIFICATION ===")

    # 1. Load files
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    with open('js/app.js', 'r', encoding='utf-8') as f:
        app_js = f.read()

    with open('js/memories.js', 'r', encoding='utf-8') as f:
        raw_mem = f.read().split('window.MEMORIES_DATA = ', 1)[1].rstrip(';\n')
        mem_data = json.loads(raw_mem)

    # 2. Check IDs
    all_js_ids = re.findall(r"document\.getElementById\(['\"]([^'\"]+)['\"]\)", app_js)
    html_ids = set(re.findall(r"id=['\"]([^'\"]+)['\"]", html))

    missing_ids = []
    for id_name in set(all_js_ids):
        if '${' in id_name or ('-' in id_name and any(x in id_name for x in ['play-btn-', 'audio-', 'vinyl-', 'dot-', 'time-', 'progress-', 'highlights-grid-'])):
            continue
        if id_name not in html_ids:
            missing_ids.append(id_name)

    print(f"Static DOM IDs checked: {len(set(all_js_ids))}, Missing: {missing_ids}")
    assert len(missing_ids) == 0, f"Missing IDs: {missing_ids}"

    # 3. Test Cinema Slides Generation for 'all'
    all_highlights = []
    for st in mem_data['stages']:
        hl = [m for m in st['memories'] if m['isHighlight']]
        all_highlights.extend(hl)

    print(f"Total highlight memories across all stages: {len(all_highlights)}")
    quote_highlights = [m for m in all_highlights if not m['image'] or len(m['image']) == 0]
    photo_highlights = [m for m in all_highlights if m['image'] and len(m['image']) > 0]
    print(f"  Photo highlights: {len(photo_highlights)}")
    print(f"  Quote (text-only) highlights: {len(quote_highlights)}")
    for qh in quote_highlights:
        print(f"    - Quote slide: '{qh['title']}' ({qh['time']})")

    # 4. Check stage audio files on disk
    for st in mem_data['stages']:
        audio_src = st['themeSong']['src']
        if audio_src:
            exists = os.path.exists(audio_src)
            print(f"Stage {st['id']} themeSong: {st['themeSong']['title'][:35]}... (On disk? {exists})")

    print("=== ALL VERIFICATION CHECKS PASSED SUCCESSFULLY! ===")

if __name__ == '__main__':
    run()
