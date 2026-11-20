import os
import re
import json
import urllib.parse
import hashlib
from PIL import Image

def clean_audio_title(filename):
    name = os.path.splitext(filename)[0]
    if 'Dancin' in name:
        return 'Dancin (Aaron Smith / Krono Remix)'
    elif '24kGoldn' in name or 'Mood' in name:
        return 'Mood (24kGoldn ft. iann dior)'
    elif 'Shape-of-You' in name:
        return 'Shape of You (Ed Sheeran)'
    elif 'let-her-go' in name or 'Passenger' in name:
        return 'Let Her Go (Passenger)'
    elif 'Tinh-Vệ' in name or 'Kasber' in name:
        return 'Tinh Vệ (Kasber Remix)'
    elif '7-Years' in name or 'Lukas' in name:
        return '7 Years (Lukas Graham)'
    name = re.sub(r'^(YTSave\.to|YTDown\.com)_YouTube_Media_[^_]+_', '', name)
    name = re.sub(r'_\d+_(vbr|\d+k)$', '', name)
    return name.replace('-', ' ')

def generate_witty_note(stage_id, filename, title=''):
    fn = filename.lower()
    
    # Try extract hour
    hour = None
    m_hour = re.search(r'(\d{8})_(\d{2})(\d{2})', fn)
    if m_hour:
        hour = int(m_hour.group(2))
    else:
        m_sc = re.search(r'screenshot[^\d]*\d{4}-?\d{2}-?\d{2}[-_](\d{2})', fn)
        if m_sc:
            hour = int(m_sc.group(1))

    # Hash for deterministic variation
    h_val = int(hashlib.md5(filename.encode('utf-8')).hexdigest()[:6], 16)

    # 1. Filename clues
    if 'retouch' in fn or 'beauty' in fn or 'polarr' in fn or 'edit' in fn:
        retouch_notes = [
            'Góc nghiêng thần thánh đã qua 7749 bước tút tát giao diện, tự tin khoe visual.',
            'Một chiếc ảnh filter đỉnh cao, visual nét căng chuẩn bị up story nhận bão tương tác.',
            'Khoảnh khắc tút tát dung nhan xuất thần, nhìn lại vẫn thấy độ chăm chút đỉnh cao.',
            'Tự tin là chính mình nhưng có thêm chút filter nghệ nghệ cho đời thêm tươi.'
        ]
        return retouch_notes[h_val % len(retouch_notes)]

    if 'screenshot' in fn:
        if hour is not None and (0 <= hour <= 4):
            late_sc = [
                f'Chụp màn hình lúc {hour}h sáng — bằng chứng cú đêm cày cuốc không thể chối cãi.',
                f'Chiến tích thức khuya lúc {hour}h sáng, vừa gõ phím vừa tự hỏi khi nào mới chịu đi ngủ.',
                f'Khoảnh khắc rạng sáng {hour}h còn online, hội cú đêm nhìn là nhận người quen ngay.'
            ]
            return late_sc[h_val % len(late_sc)]
        sc_notes = [
            'Một bức ảnh chụp màn hình lưu nhanh khoảnh khắc thú vị đang lướt mạng.',
            'Chụp màn hình lưu lại kỷ niệm đáng nhớ hoặc một dòng tin nhắn đặc biệt.',
            'Tấm ảnh cap màn hình ngẫu hứng, lưu giữ một mảnh thông tin của ngày hôm đó.'
        ]
        return sc_notes[h_val % len(sc_notes)]

    if 'fb_img' in fn or 'received' in fn or 'messenger' in fn:
        fb_notes = [
            'Ảnh bạn bè truyền tay gửi qua mạng, dù bị nén chất lượng nhưng kỷ niệm vẫn nét căng.',
            'Chiếc ảnh dìm hàng hoặc kỷ niệm được đồng bọn gửi tặng, lưu lại làm bằng chứng thanh xuân.',
            'Nhận qua tin nhắn bạn bè, khoảnh khắc gắn kết những ngày tháng quẩy hết mình.'
        ]
        return fb_notes[h_val % len(fb_notes)]

    # Late night check for normal photos
    if hour is not None and (0 <= hour <= 4):
        night_notes = [
            f'Bắt trọn khoảnh khắc lúc {hour}h sáng, sinh vật này dường như chưa biết mệt mỏi là gì.',
            f'Ảnh chụp lúc {hour}h sáng — năng lượng về đêm luôn đạt cực đỉnh.',
            f'Lưu giữ một góc nhỏ rạng sáng, thanh xuân là những đêm thức trọn vẹn.'
        ]
        return night_notes[h_val % len(night_notes)]

    # 2. Stage context
    if stage_id == 'luc-nho':
        luc_nho_notes = [
            'Thời còn là tân thủ Lv.02 má bánh bao tròn vo, ăn chưa no lo chưa tới.',
            'Biểu cảm ngây ngô thời niên thiếu, vô tư cười đùa giữa những ngày hè êm ả.',
            'Bé con mũm mĩm năm ấy giờ đã tiến hóa thành chàng trai 21 tuổi bản lĩnh.',
            'Kỷ niệm tuổi thơ êm đềm, những ngày bình yên nhất của cuộc đời.'
        ]
        return luc_nho_notes[h_val % len(luc_nho_notes)]

    if stage_id == '2021':
        s2021_notes = [
            'Năm đầu cấp 3 (Lv.16) học online, vừa cày bài vừa ngắm mưa rơi ngoài khung cửa sổ.',
            'Những ngày tháng 16 tuổi nhiều bỡ ngỡ, bắt đầu hành trình nâng cấp bản thân.',
            'Khoảnh khắc học trò giản dị, thanh xuân cấp 3 bắt đầu từ những điều nhỏ bé nhất.',
            'Dấu ấn tuổi 16 mộng mơ, từng bước khám phá thế giới xung quanh.'
        ]
        return s2021_notes[h_val % len(s2021_notes)]

    if stage_id == '2022':
        s2022_notes = [
            'Tuổi 17 (Lv.17) rực rỡ, áp lực bài vở nhưng lúc nào cũng thừa năng lượng nhí nhố.',
            'Những ngày thanh xuân cấp 3 cháy hết mình cùng bạn bè và ước mơ phía trước.',
            'Khoảnh khắc ghi dấu tuổi 17 — cái tuổi đẹp nhất của thời áo trắng đến trường.',
            'Nụ cười và nhiệt huyết tuổi 17, những kỷ niệm học trò không bao giờ phai.'
        ]
        return s2022_notes[h_val % len(s2022_notes)]

    if stage_id == '2023':
        s2023_notes = [
            'Năm cuối cấp 3 (Lv.18) chạy đua cùng các kỳ thi, những đêm ôn bài căng thẳng nhưng kiên định.',
            'Mốc son tuổi 18 sẵn sàng vươn mình ra biển lớn, khép lại thời học sinh tươi đẹp.',
            'Khoảnh khắc chuyển giao quan trọng, chuẩn bị hành trang bước chân vào giảng đường đại học.',
            'Trưởng thành từ những áp lực, đánh dấu bước ngoặt lớn của tuổi 18.'
        ]
        return s2023_notes[h_val % len(s2023_notes)]

    if stage_id == '2024':
        s2024_notes = [
            'Tuổi 19 (Lv.19) tự lập bước vào đời, vừa học đại học vừa cày việc kiếm tiền xây dựng tương lai.',
            'Những ngày đầu làm quen với nhịp sống bận rộn, trải nghiệm cuộc sống sinh viên đầy sắc màu.',
            'Dấu mốc tự lập đầy tự hào, tự kiếm những đồng tiền đầu tiên và tích lũy trải nghiệm.',
            'Một góc nhìn tuổi 19 năng động, dám dấn thân và không ngại thử thách.'
        ]
        return s2024_notes[h_val % len(s2024_notes)]

    if stage_id == '2025':
        s2025_notes = [
            'Tuổi 20 (Lv.20) bản lĩnh và vững vàng, ánh mắt toát lên sự tự tin của người từng trải.',
            'Cột mốc tuổi 20 tròn trịa, định hình phong cách và khẳng định giá trị bản thân.',
            'Trưởng thành không chỉ ở diện mạo mà còn ở sự điềm tĩnh trước mọi sóng gió cuộc đời.',
            'Những ngày tháng 20 tuổi đầy nhiệt huyết, sẵn sàng bứt phá cho những mục tiêu lớn.'
        ]
        return s2025_notes[h_val % len(s2025_notes)]

    if stage_id == '2026':
        s2026_notes = [
            'Tuổi 21 (Lv.21) chiến thần IT cày code, ánh sáng màn hình thâu đêm thắp sáng tương lai.',
            'Phiên bản hoàn thiện nhất của Hải Thành, kiến tạo giá trị và vững vàng trên con đường sự nghiệp.',
            'Những dòng code miệt mài và phong thái tự tin của một lập trình viên tuổi 21.',
            'Đỉnh cao tiến hóa từ Lv.02 đến Lv.21, sẵn sàng chinh phục những đỉnh cao mới!'
        ]
        return s2026_notes[h_val % len(s2026_notes)]

    return 'Một khoảnh khắc lưu giữ dấu ấn thời gian trên hành trình trưởng thành.'

def main():
    # 1. Update ghichu.txt
    if os.path.exists('ghichu.txt'):
        with open('ghichu.txt', 'r', encoding='utf-8') as f:
            ghichu_txt = f.read()
        ghichu_txt_updated = re.sub(r'Bảo\s*Tàng\s*Kỷ\s*Niệm\s*Cá\s*Nhân', 'Lịch Sử Tiến Hóa Của Hải Thành', ghichu_txt, flags=re.IGNORECASE)
        with open('ghichu.txt', 'w', encoding='utf-8') as f:
            f.write(ghichu_txt_updated)
        print('ghichu.txt: updated title to Lịch Sử Tiến Hóa Của Hải Thành')

    # 2. Scan audio subdirectories for background playlist
    playlist = []
    track_idx = 1
    for root, dirs, files in os.walk('audio'):
        if root == 'audio':
            continue
        for f in sorted(files):
            if f.lower().endswith(('.mp3', '.wav', '.m4a', '.ogg')):
                rel_path = os.path.join(root, f).replace('\\', '/')
                encoded_src = urllib.parse.quote(rel_path, safe='/:')
                title = clean_audio_title(f)
                playlist.append({
                    'id': f'bg-{track_idx}',
                    'title': title,
                    'src': encoded_src,
                    'file': rel_path
                })
                track_idx += 1
    print(f'Discovered {len(playlist)} background playlist tracks.')

    # 3. Read current js/memories.js
    with open('js/memories.js', 'r', encoding='utf-8') as f:
        content = f.read()

    prefix = 'window.MEMORIES_DATA = '
    start_pos = content.find(prefix)
    if start_pos == -1:
        print('Error: window.MEMORIES_DATA not found in js/memories.js')
        return

    json_str = content[start_pos + len(prefix):]
    # Find the end of JSON (strip any trailing semicolons or playlist)
    # The JSON object starts with {
    data = json.loads(json_str.split(';\nwindow.BACKGROUND_PLAYLIST')[0].split(';\nconst BACKGROUND_PLAYLIST')[0].rstrip(';\n '))

    # 4. Update siteInfo
    data['siteInfo']['title'] = 'Lịch Sử Tiến Hóa Của Hải Thành'
    data['siteInfo']['intro'] = 'Biên niên sử tiến hóa vượt bậc của sinh vật Hải Thành từ lúc còn là tân thủ Lv.02 ngây ngô đến chiến thần Lv.21 cày code xuyên màn đêm. Mời bạn bước vào hành trình xem anh ấy đã "tiến hóa" (và lag) ra sao!'
    data['siteInfo']['heroTitle'] = 'Cột mốc khởi nguyên sinh vật'
    data['siteInfo']['heroDescription'] = 'Mỗi bức ảnh, mỗi cột mốc là một lần nhảy vọt chỉ số EXP và thay đổi ngoại hình từ bé con mũm mĩm đến lập trình viên tuổi 21. Cùng khám phá bảng chỉ số tiến hóa đầy kỳ thú này!'

    # 5. Process each memory: calculate focalPoint and auto-generate empty notes
    focal_cache = {}
    total_notes_generated = 0
    total_focal_assigned = 0

    for stage in data['stages']:
        stage_id = stage['id']
        for mem in stage['memories']:
            # Focal point
            img_list = mem.get('image') or []
            if img_list:
                first_img = img_list[0]
                if first_img not in focal_cache:
                    if os.path.exists(first_img):
                        try:
                            with Image.open(first_img) as im:
                                w, h = im.size
                                focal_cache[first_img] = 'center 20%' if h > w else 'center 35%'
                        except Exception as e:
                            focal_cache[first_img] = 'center 25%'
                    else:
                        focal_cache[first_img] = 'center 25%'
                mem['focalPoint'] = focal_cache[first_img]
                total_focal_assigned += 1
            else:
                mem['focalPoint'] = 'center 25%'

            # Witty note for empty description
            desc = (mem.get('description') or '').strip()
            if not desc:
                first_img = img_list[0] if img_list else ''
                mem['description'] = generate_witty_note(stage_id, first_img, mem.get('title', ''))
                total_notes_generated += 1

    print(f'Total focal points computed: {total_focal_assigned}')
    print(f'Total empty notes generated: {total_notes_generated}')

    # 6. Save back to js/memories.js with BACKGROUND_PLAYLIST
    new_js = '/**\n * Lịch Sử Tiến Hóa Của Hải Thành - Dữ liệu Kỷ niệm chuẩn hóa\n * Tự động tạo từ ghichu.txt, quét ảnh & nhạc nền\n */\n'
    new_js += 'window.MEMORIES_DATA = ' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n\n'
    new_js += '/**\n * Danh sách nhạc nền tự động phát ngẫu nhiên (BACKGROUND_PLAYLIST)\n */\n'
    new_js += 'window.BACKGROUND_PLAYLIST = ' + json.dumps(playlist, ensure_ascii=False, indent=2) + ';\n'

    with open('js/memories.js', 'w', encoding='utf-8') as f:
        f.write(new_js)
    print('js/memories.js successfully updated!')

if __name__ == '__main__':
    main()
