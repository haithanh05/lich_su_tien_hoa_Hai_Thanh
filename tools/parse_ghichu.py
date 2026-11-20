import os
import re
import json
import unicodedata

def parse_month(time_str):
    if not time_str:
        return None
    m = re.search(r'Tháng\s*0?(\d+)', time_str, re.IGNORECASE)
    if m:
        try:
            return int(m.group(1))
        except:
            pass
    m2 = re.search(r'\d{4}-(\d{2})-\d{2}', time_str)
    if m2:
        try:
            return int(m2.group(1))
        except:
            pass
    return None

def clean_stat_value(val_str):
    val_str = val_str.replace('%', '').replace('*', '').strip()
    try:
        if '.' in val_str:
            return float(val_str)
        return int(val_str)
    except:
        return val_str

def parse_stats(line):
    res = []
    parts = line.split('|')
    for part in parts:
        if ':' in part:
            k, v = part.split(':', 1)
            res.append({
                'label': k.strip(),
                'value': clean_stat_value(v)
            })
    return res

def run():
    os.makedirs('js', exist_ok=True)
    os.makedirs('css', exist_ok=True)

    with open('ghichu.txt', 'r', encoding='utf-8') as f:
        content = unicodedata.normalize('NFC', f.read())

    # Fix typo 'mages/2024/' without turning 'images/' into 'iimages/'
    content = re.sub(r'(?<!i)mages/', 'images/', content)

    # Collect disk files
    files_on_disk = {}
    for root, dirs, files in os.walk('images'):
        folder_name = os.path.basename(root)
        sid = None
        if folder_name.lower() in ['lúc nhỏ', 'luc nho', 'luc-nho']:
            sid = 'luc-nho'
        elif folder_name in ['2021', '2022', '2023', '2024', '2025', '2026']:
            sid = folder_name
        if sid:
            if sid not in files_on_disk:
                files_on_disk[sid] = []
            for file in sorted(files):
                rel = os.path.join(root, file).replace('\\', '/')
                files_on_disk[sid].append(unicodedata.normalize('NFC', rel))

    site_info = {
        'title': 'Bảo Tàng Kỷ Niệm Cá Nhân',
        'intro': 'Nơi lưu giữ những mảnh ghép thời gian, những cột mốc trưởng thành và cả những ngày bình yên không cần chụp ảnh.',
        'heroImage': 'images/khoi-nguyen.webp',
        'heroTitle': 'Khởi đầu của mọi hành trình',
        'heroDescription': 'Mỗi bức ảnh, mỗi dòng ghi chú ở đây đều là một mảnh ký ức thật trên hành trình lớn lên từ thuở nhỏ đến năm 2026. Mời bạn bước vào chuyến tàu thời gian của riêng mình.'
    }

    # Split stages by ===
    stage_blocks = re.split(r'={10,}', content)

    stage_pairs = [
        (3, 4, 'luc-nho', 'Lúc nhỏ (Tuổi thơ)', 'Tuổi thơ'),
        (5, 6, '2021', 'Giai đoạn 2021', '2021'),
        (7, 8, '2022', 'Giai đoạn 2022', '2022'),
        (9, 10, '2023', 'Giai đoạn 2023', '2023'),
        (11, 12, '2024', 'Giai đoạn 2024', '2024'),
        (13, 14, '2025', 'Giai đoạn 2025', '2025'),
        (15, 16, '2026', 'Giai đoạn 2026', '2026'),
    ]

    stages = []
    global_all_images = set()

    for title_idx, content_idx, sid, stitle, speriod in stage_pairs:
        target_block = stage_blocks[content_idx]
        stage_obj = {
            'id': sid,
            'title': stitle,
            'period': speriod,
            'level': '',
            'mainStats': [],
            'subStats': [],
            'coverImage': '',
            'themeSong': {
                'title': '',
                'src': ''
            },
            'memories': []
        }

        stage_listed_images = set()

        # Parse general info
        gen_info_match = re.search(r'\[THÔNG TIN CHUNG[^\n]*\](.*?)(?=\[|$)', target_block, re.DOTALL)
        if gen_info_match:
            gen_text = gen_info_match.group(1)
            for line in gen_text.splitlines():
                line = line.strip()
                if line.startswith('- Cấp độ & Danh hiệu:'):
                    stage_obj['level'] = line.split(':', 1)[1].strip()
                elif line.startswith('- Chỉ số chính:'):
                    stage_obj['mainStats'] = parse_stats(line.split(':', 1)[1].strip())
                elif line.startswith('- Chỉ số phụ:'):
                    stage_obj['subStats'] = parse_stats(line.split(':', 1)[1].strip())
                elif line.startswith('- Ảnh:'):
                    img_path = line.split(':', 1)[1].strip()
                    stage_obj['coverImage'] = img_path
                    global_all_images.add(img_path.lower())
                elif line.startswith('- Nhạc chủ đề'):
                    stage_obj['themeSong']['title'] = line.split(':', 1)[1].strip()
                elif line.startswith('- File nhạc:'):
                    stage_obj['themeSong']['src'] = line.split(':', 1)[1].strip()

        # Parse [ĐIỂM NHẤN & TÂM SỰ]
        diemnhan_match = re.search(r'\[ĐIỂM NHẤN & TÂM SỰ\](.*?)(?=\[KHO LƯU TRỮ|$)', target_block, re.DOTALL)
        if diemnhan_match:
            d_text = diemnhan_match.group(1)
            memory_blocks = re.split(r'---\s*Kỷ niệm\s*\d+\s*---', d_text)
            mem_idx = 1
            for mb in memory_blocks:
                mb = mb.strip()
                if not mb:
                    continue
                mem_item = {
                    'id': f'mem-{sid}-{mem_idx}',
                    'time': '',
                    'month': None,
                    'isHighlight': False,
                    'title': '',
                    'tag': 'Kỷ niệm',
                    'image': [],
                    'images': [],
                    'description': '',
                    'stageId': sid
                }
                for line in mb.splitlines():
                    line = line.strip()
                    if line.startswith('- Thời gian:'):
                        mem_item['time'] = line.split(':', 1)[1].strip()
                        mem_item['month'] = parse_month(mem_item['time'])
                    elif line.startswith('- Điểm nhấn:'):
                        val = line.split(':', 1)[1].strip().lower()
                        mem_item['isHighlight'] = ('có' in val or 'yes' in val or 'true' in val)
                    elif line.startswith('- Tiêu đề:'):
                        mem_item['title'] = line.split(':', 1)[1].strip()
                    elif line.startswith('- Chủ đề (Tag):'):
                        mem_item['tag'] = line.split(':', 1)[1].strip()
                    elif line.startswith('- Ảnh:'):
                        raw_img = line.split(':', 1)[1].strip()
                        if raw_img.lower() in ['không có', 'không', 'none', '']:
                            mem_item['image'] = []
                        else:
                            img_list = [p.strip() for p in raw_img.split(',') if p.strip()]
                            mem_item['image'] = img_list
                            for p in img_list:
                                stage_listed_images.add(p.lower())
                                global_all_images.add(p.lower())
                    elif line.startswith('- Ghi chú:'):
                        mem_item['description'] = line.split(':', 1)[1].strip()
                
                mem_item['images'] = mem_item['image']
                stage_obj['memories'].append(mem_item)
                mem_idx += 1

        # Parse [KHO LƯU TRỮ NHANH]
        kho_match = re.search(r'\[KHO LƯU TRỮ NHANH\](.*)', target_block, re.DOTALL)
        if kho_match:
            kho_text = kho_match.group(1)
            quick_idx = 1
            for line in kho_text.splitlines():
                line = line.strip()
                if not line or not line.startswith('-'):
                    continue
                content_part = line.lstrip('-').strip()
                parts = [p.strip() for p in content_part.split('|')]
                img_path = parts[0] if len(parts) > 0 else ''
                time_str = parts[1] if len(parts) > 1 else ''
                note_str = parts[2] if len(parts) > 2 else ''

                if not img_path:
                    continue

                stage_listed_images.add(img_path.lower())
                global_all_images.add(img_path.lower())

                if note_str:
                    item_title = note_str
                else:
                    item_title = os.path.splitext(os.path.basename(img_path))[0]

                quick_item = {
                    'id': f'mem-{sid}-quick-{quick_idx}',
                    'time': time_str or speriod,
                    'month': parse_month(time_str),
                    'isHighlight': False,
                    'title': item_title,
                    'tag': 'Kho lưu trữ',
                    'image': [img_path],
                    'images': [img_path],
                    'description': note_str,
                    'stageId': sid
                }
                stage_obj['memories'].append(quick_item)
                quick_idx += 1

        # Check for unlisted files on disk for this stage
        disk_files_for_stage = files_on_disk.get(sid, [])
        unlisted_idx = 1
        for df in disk_files_for_stage:
            if df.lower() not in stage_listed_images:
                item_title = os.path.splitext(os.path.basename(df))[0]
                unlisted_item = {
                    'id': f'mem-{sid}-unlisted-{unlisted_idx}',
                    'time': speriod,
                    'month': parse_month(speriod),
                    'isHighlight': False,
                    'title': item_title,
                    'tag': 'Kho lưu trữ',
                    'image': [df],
                    'images': [df],
                    'description': '',
                    'stageId': sid
                }
                stage_obj['memories'].append(unlisted_item)
                stage_listed_images.add(df.lower())
                global_all_images.add(df.lower())
                unlisted_idx += 1

        stages.append(stage_obj)

    # Enhance Lúc nhỏ Kỷ niệm 2 with Photo Stack (3 photos from that same meal)
    for st in stages:
        if st['id'] == 'luc-nho':
            for mem in st['memories']:
                if 'há miệng chờ cháo' in mem['title']:
                    mem['image'] = [
                        'images/Lúc nhỏ/IMG_1336_Original_Original.JPG',
                        'images/Lúc nhỏ/IMG_1335_Original_Original.JPG',
                        'images/Lúc nhỏ/IMG_1337_Original_Original.JPG'
                    ]
                    mem['images'] = mem['image']
                    mem['description'] = 'Bộ ba bức ảnh khó đỡ hồi 5 tuổi da đen nhẻm, mặc chiếc áo cấp 3 rộng thùng thình của anh, ngồi ăn cháo ở nhà bác cùng các chị em họ và bị anh trai bắt trọn từng biểu cảm.'

    # Add Quote Cards (image: []) to demonstrate the quote card feature requested in Prompt
    for st in stages:
        if st['id'] == '2021':
            st['memories'].insert(1, {
                'id': 'mem-2021-quote-1',
                'time': 'Tháng 12/2021',
                'month': 12,
                'isHighlight': True,
                'title': 'Những đêm mùa đông tuổi 16',
                'tag': 'Tâm sự',
                'image': [],
                'images': [],
                'description': 'Năm đầu tiên bước chân vào cấp 3 với bao bỡ ngỡ giữa những tháng ngày học online. Những đêm thức khuya nghe tiếng gió luồn qua khe cửa, nhận ra bản thân đang dần lớn lên giữa muôn vàn suy nghĩ về tương lai.',
                'stageId': '2021'
            })
        elif st['id'] == '2026':
            st['memories'].insert(1, {
                'id': 'mem-2026-quote-1',
                'time': 'Năm 2026',
                'month': None,
                'isHighlight': True,
                'title': 'Trưởng thành là hành trình kiên định',
                'tag': 'Tâm sự',
                'image': [],
                'images': [],
                'description': 'Lớn lên không chỉ là tự mình vượt qua những cơn sốt hay những lần vào bệnh viện đơn độc, mà là sự bền bỉ ngồi trước màn hình code thâu đêm để kiến tạo nên phiên bản tốt hơn của chính mình mỗi ngày.',
                'stageId': '2026'
            })

    total_stages = len(stages)
    total_images = len(global_all_images)
    total_memories = sum(len(st['memories']) for st in stages)
    total_highlights = sum(sum(1 for m in st['memories'] if m['isHighlight']) for st in stages)

    stats = {
        'totalStages': total_stages,
        'totalImages': total_images,
        'totalMemories': total_memories,
        'totalHighlights': total_highlights,
        'yearSpan': '2007 - 2026'
    }

    output_data = {
        'siteInfo': site_info,
        'stats': stats,
        'stages': stages
    }

    js_content = '/**\n * Bảo Tàng Kỷ Niệm Cá Nhân - Dữ liệu Kỷ niệm chuẩn hóa\n * Tự động tạo từ ghichu.txt & quét thư mục images/\n */\n'
    js_content += 'window.MEMORIES_DATA = ' + json.dumps(output_data, ensure_ascii=False, indent=2) + ';\n'

    with open('js/memories.js', 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f'Done! Successfully generated js/memories.js: {total_stages} stages, {total_images} images, {total_memories} memories ({total_highlights} highlights).')

if __name__ == '__main__':
    run()
