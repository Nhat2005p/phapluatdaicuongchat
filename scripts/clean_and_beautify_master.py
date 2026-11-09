# -*- coding: utf-8 -*-
import json
import math
import re
import sys
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')

MASTER_PATH = 'data/processed/sft_vietlaw_master.json'
HYPHEN_PATH = 'data/processed/sft-vietlaw-master.json'

VOWELS_LOWER = 'aàáảãạăằắẳẵặâầấẩẫậeèéẻẽẹêềếểễệiìíỉĩịoòóỏõọôồốổỗộơờớởỡợuùúủũụưừứửữựyỳýỷỹỵ'
VOWELS_UPPER = 'AÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬEÈÉẺẼẸÊỀẾỂỄỆIÌÍỈĨỊOÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢUÙÚỦŨỤƯỪỨỬỮỰYỲÝỶỸỴ'
VOWELS = VOWELS_LOWER + VOWELS_UPPER
CONSONANTS_LOWER = 'bcdfghjklmnpqrstvwxzđ'
CONSONANTS_UPPER = 'BCDFGHJKLMNPQRSTVWXZĐ'
CONSONANTS = CONSONANTS_LOWER + CONSONANTS_UPPER
VN_LOWER = VOWELS_LOWER + CONSONANTS_LOWER
VN_UPPER = VOWELS_UPPER + CONSONANTS_UPPER
VN_DIAC = 'àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ'

vcv_re = re.compile(rf'^[{VOWELS}{CONSONANTS}]*[{VOWELS}][{CONSONANTS}]+[{VOWELS}][{VOWELS}{CONSONANTS}]*$')
word_re = re.compile(rf'\b[{VOWELS}{CONSONANTS}]+\b')
diac_re = re.compile(rf'[{VN_DIAC}]')
has_vowel_re = re.compile(rf'[{VOWELS}]')
camel_re = re.compile(rf'([{VN_LOWER}])([{VN_UPPER}])')

SINGLE_CHAR_WORDS = {'ở', 'ý', 'ô', 'y'}
FOREIGN_WHITELIST = {
    'lênin', 'ôtô', 'hécta', 'madaguôi', 'amiăng', 'karaokê', 'cămpuchia',
    'càphê', 'đôla', 'đàlạt', 'ácvin', 'gumplôvích', 'đuyrinh', 'petơrazitki',
    'phơre', 'tuylíp', 'điêzen', 'urê', 'môtô', 'panô', 'ximăng', 'nanomét',
    'becơren', 'ăngten', 'brunây', 'đonêsia', 'châuro', 'đolomite'
}

SYL_FREQ = Counter()

def build_syllable_dictionary(data):
    SYL_FREQ.clear()
    for w in FOREIGN_WHITELIST:
        SYL_FREQ[w] = 500
    for x in data:
        for k in ('instruction', 'input', 'output'):
            v = x.get(k) or ''
            for w in word_re.findall(v):
                wl = w.lower()
                if not vcv_re.match(w) and has_vowel_re.search(w) and (len(w) >= 2 or wl in SINGLE_CHAR_WORDS) and len(w) <= 7:
                    SYL_FREQ[wl] += 1

def dp_split_vcv_word(w: str) -> str:
    wl = w.lower()
    if wl in FOREIGN_WHITELIST:
        return w
    w_camel = camel_re.sub(r'\1 \2', w)
    if ' ' in w_camel:
        return ' '.join(dp_split_vcv_word(part) for part in w_camel.split(' '))
    if not vcv_re.match(w):
        return w
    n = len(w)
    best = [None] * (n + 1)
    best[0] = (0.0, [])
    for i in range(n):
        if best[i] is None:
            continue
        score_i, parts_i = best[i]
        for j in range(i + 1, min(n, i + 8) + 1):
            sub = w[i:j]
            sub_l = sub.lower()
            min_freq = 30 if len(sub) == 1 else 2
            is_valid_sub = (sub_l in FOREIGN_WHITELIST) or (
                not vcv_re.match(sub) and has_vowel_re.search(sub) and (len(sub) >= 2 or sub_l in SINGLE_CHAR_WORDS) and SYL_FREQ[sub_l] >= min_freq
            )
            if is_valid_sub:
                sc = score_i + math.log(SYL_FREQ[sub_l] + 1) - 8.0
                if best[j] is None or sc > best[j][0]:
                    best[j] = (sc, parts_i + [sub])
    if best[n] is not None and len(best[n][1]) > 1:
        return ' '.join(best[n][1])
    return w

def fix_ocr_and_glued_words(text: str) -> str:
    if not text:
        return ""

    # 1. Fix '<word>đ <rime>' -> '<word> đ<rime>' (e.g. 'quânđ ội' -> 'quân đội', 'quanđ ến' -> 'quan đến')
    pat_shifted_d = re.compile(rf'\b([{VN_LOWER}{VN_UPPER}]+)([đĐ])\s+([{VN_LOWER}]+)\b')
    for _ in range(3):
        text = pat_shifted_d.sub(r'\1 \2\3', text)

    # 2. Fix specific OCR split / shifted words & typos
    ocr_fixes = [
        (r'\bhươngư\s+ớc\b', 'hương ước'),
        (r'\bHươngư\s+ớc\b', 'Hương ước'),
        (r'\bcưổn\s+đị\s*nh\b', 'cư ổn định'),
        (r'\bcưổn\s+đị\b', 'cư ổn định'),
        (r'\bán\s+hìn\s+h\b', 'án hình'),
        (r'\bn\s+hân\s+dân\b', 'nhân dân'),
        (r'\bN\s+hân\s+dân\b', 'Nhân dân'),
        (r'\bt\s+hực\s+hiện\b', 'thực hiện'),
        (r'\bT\s+hực\s+hiện\b', 'Thực hiện'),
        (r'\bquyền\s+yê\s+u\b', 'quyền yêu'),
        (r'\bMã\s+uan\s+hệ\b', 'Quan hệ'),
        (r'\bqaun\s+hệ\b', 'quan hệ'),
        (r'\bvi\s+cảu\s+mình\b', 'vi của mình'),
        (r'\bcảu\b', 'của'),
        (r'\bđượec\b', 'được'),
        (r'\bđựoc\b', 'được'),
        (r'\bphạm\s+đao\s+đức\b', 'phạm đạo đức'),
        (r'\bchỉnh\s+bơi\s+các\b', 'chỉnh bởi các'),
        (r'\bvệ\s+dó\s+các\b', 'vệ do các'),
        (r'\bphụ\s+tuộc\b', 'phụ thuộc'),
        (r'\bvới\s+ngưới\s+từ\b', 'với người từ'),
        (r'\bđược\s+thưc\s+hiện\b', 'được thực hiện'),
        (r'\bcó\s+chj\s+chị\b', 'có chị'),
        (r'\bgái\s+vá\s+cháu\b', 'gái và cháu'),
        (r'\bNIHỆM\b', 'NHIỆM'),
        (r'\bhocạh\b', 'hoạch'),
        (r'\bhuvện\b', 'huyện'),
        (r'\bnagỳ\b', 'ngày'),
        (r'\btuvên\b', 'tuyên'),
        (r'\bnhiemẹ\b', 'nhiệm'),
        (r'\bbáẠnhân\b', 'cá nhân'),
        (r'\băncứ\b', 'căn cứ'),
        (r'\bthamư\b', 'tham mưu'),
        (r'\bphairthieejt\b', 'phải thiệt'),
        (r'\bvwosi\b', 'với'),
        (r'Downloaded by [^\n]+', ''),
        (r'lOMoARcPSD\|\d+', ''),
        (r'Studeersnel[^\n]*', ''),
    ]
    for pat, repl in ocr_fixes:
        text = re.sub(pat, repl, text)

    # 3. Glued syllables with đ / Đ: 'luậtđộc' -> 'luật độc', 'quyđịnh' -> 'quy định'
    pat_d = re.compile(rf'([{VN_LOWER}A-Z])([đĐ][{VN_LOWER}]+)')
    for _ in range(5):
        new_text = pat_d.sub(r'\1 \2', text)
        if new_text == text:
            break
        text = new_text

    # 4. Comprehensive vowel-initial & compound glued words
    glued_patterns = [
        (r'\b(cố|vô|có|khổ|bỏ|thể|là|hiện|đồng|lưu|cho|do|vào|những|định|ngoài|tính|phản|ánh|và|các|hết|của|với|vi|biết|bày|thức|về|nhất|thành|góp|trái)(ý)\b', r'\1 \2'),
        (r'\b(bản|chánh|kết|lên|hành|tòa|toà|dụng|các|mang|vụ|lại|dự|và|có|vì|đề|đáp)(án)\b', r'\1 \2'),
        (r'\b(được|tránh|hoặc|cần|không|bị|thì|chỉ|cứ|sự|thể|dù|sở|giúp|kiện|luôn|luật|trấn|định|và|nhất|phạt|vi|động|quyền|chính|để|sao|quán|năng|nước|tục|này|việc|tạo|đều|thức|đoạn|đã|nghĩa)(áp)\b', r'\1 \2'),
        (r'\b(phải|nhà|chỗ|thể|sự|người|kế|chồng|hình|khoản|nhiệm|nước|hiện|xã|nhũng|quyền|đẻ|xử|nói|sống|trú|phạt|ra|luật|xe|ai)(ở)\b', r'\1 \2'),
        (r'\b(và|khi|đình|điểm|vợ|hợp|được|với|nếu|cho|nên|sản|trước|do|việc|nơi|bị|từ|cầu|chính|là|mẹ|nợ)(ông)\b', r'\1 \2'),
        (r'\b(hưởng|tội|phạm|lại|sớm)(ít)\b', r'\1 \2'),
        (r'\b(cư|tính|việc|phòng|dụng|và)(ổn)\b', r'\1 \2'),
        (r'\b(xe|lái|khiển|chiếc)(ô)\s*(tô)\b', r'\1 \2 \3'),
        (r'\b(trạng)(ô)\s*(nhiễm)\b', r'\1 \2 \3'),
        (r'\b(tham)(ô)\b', r'\1 \2'),
        (r'\b(và|người|theo)(ủy)\b', r'\1 \2'),
        (r'\b(thể|tương|tắc|phản|sách|đáp)(ứng)\b', r'\1 \2'),
        (r'\b(phản)(ánh)\b', r'\1 \2'),
        (r'\b(thể|dán|dùng|hình|do|gây)(ảnh)\b', r'\1 \2'),
        (r'\b(điều|hương)(ước)\b', r'\1 \2'),
        (r'\b(trung)(ương)\b', r'\1 \2'),
        (r'\b(bị|sự|cưỡng|đoạn)(ép)\b', r'\1 \2'),
        (r'\b(được)(ưu)\b', r'\1 \2'),
        (r'\b(vượt)(ẩu)\b', r'\1 \2'),
        (r'\b(tội)(ấy)\b', r'\1 \2'),
        (r'\b(lợi)(ích)\b', r'\1 \2'),
        (r'\b(tiếng)(ồn)\b', r'\1 \2'),
    ]

    for pat_str, repl in glued_patterns:
        pat = re.compile(pat_str, re.IGNORECASE)
        text = pat.sub(repl, text)

    # 5. Phonological V-C-V DP ungluer for any Vietnamese diacritic word
    def replace_vcv(m):
        w = m.group(0)
        if diac_re.search(w) and (vcv_re.match(w) or camel_re.search(w)):
            return dp_split_vcv_word(w)
        return w

    text = word_re.sub(replace_vcv, text)

    return text

def is_structural_line(line: str) -> bool:
    s = line.strip()
    if not s:
        return True
    if re.match(r'^(?:#{1,6}\s|[-•*+◦▪▫▸▹►▻–—]\s|\*\*|\||---|___)', s):
        return True
    if re.match(r'^(?:\d{1,3}[.)]\s|\(\d{1,3}\)\s|[a-eđ][.)]\s|\([a-eđ]\)\s|(?:I|II|III|IV|V|VI|VII|VIII|IX|X)[.)]\s)', s):
        return True
    if re.match(r'^[📚⚖️🎯💡👉➔✅❌⚠️🔹🔸📌]', s):
        return True
    if re.match(r'^(?:MỤC|PHẦN|CHƯƠNG|CÂU|ĐỀ|BÀI|ĐIỀU|KHOẢN|LƯU Ý|VÍ DỤ|KẾT LUẬN|GIẢI THÍCH|TRẢ LỜI|NHẬN ĐỊNH|TÌNH HUỐNG|CĂN CỨ|ĐÁP ÁN|LỜI GIẢI|Tóm tắt|Tình trạng|Hiệu lực)\b', s, re.IGNORECASE):
        return True
    return False

def is_heading_line(line: str) -> bool:
    s = line.strip()
    if not s:
        return True
    if s.startswith('#') or s.startswith('---') or s.startswith('|'):
        return True
    if s.isupper() and len(s) < 120:
        return True
    if re.match(r'^(?:\d{1,2}|I|II|III|IV|V|VI|VII|VIII|IX|X)\.\s+[^.?!]{2,70}$', s):
        return True
    return False

def unwrap_mid_sentence_lines(text: str) -> str:
    lines = text.split('\n')
    result = []
    for line in lines:
        s = line.strip()
        if not s:
            result.append('')
            continue
        if not result or result[-1] == '':
            result.append(s)
            continue
        prev = result[-1]
        if is_heading_line(prev) or is_structural_line(s):
            result.append(s)
        else:
            if not re.search(r'[.?!:;”"]$', prev) or re.match(rf'^[{VN_LOWER}]', s):
                result[-1] = prev + ' ' + s
            else:
                if prev.startswith('- ') or prev.startswith('+ '):
                    result[-1] = prev + ' ' + s
                else:
                    result.append(s)
    return '\n'.join(result)

def format_sample_structure(sid: str, text: str, is_output: bool) -> str:
    if not text:
        return ""

    # Strip remaining point rubrics like (Thang điểm: 2.0 điểm), (0.5 điểm), Barem, Rubric
    text = re.sub(r'\s*\((?:Thang\s*điểm\s*:\s*)?[\d.,]+\s*điểm\)', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s*Thang\s*điểm\s*:\s*[\d.,]+\s*điểm', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s*\(?Chuẩn\s*Barem\s*Rubric[^)\n]*\)?', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s*\(?Barem\s*Rubric[^)\n]*\)?', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\btheo\s+barem\b', 'theo quy định', text, flags=re.IGNORECASE)
    text = re.sub(r'\bBarem\s+đáp\s+án\b', 'Đáp án', text, flags=re.IGNORECASE)
    text = re.sub(r'\bBarem\b', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\bRubric\b', '', text, flags=re.IGNORECASE)

    # Convert special bullets ◦, ▪
    text = re.sub(r'(?:^|\n)\s*◦\s*((?:I|II|III|IV|V|VI|VII|VIII|IX|X)\.\s*)', r'\n### \1', text)
    text = re.sub(r'(?:^|\n)\s*[◦▪▫▸▹]\s*', r'\n- ', text)
    text = text.replace('DÀN Ý VÀ HƯỚNG DẪN GIẢI CHI TIẾT:', '### PHÂN TÍCH VÀ GIẢI ĐÁP CHI TIẾT:')
    text = text.replace('(CHUẨN BAREM PBL6 - ĐHBK ĐÀ NẴNG)', '')
    text = re.sub(r',\.', '.', text)

    # Unwrap mid-sentence PDF line breaks
    text = unwrap_mid_sentence_lines(text)

    if is_output:
        # Format SFT_196Q_ND_ and similar "Trả lời: \nNhận định trên: SAI/ĐÚNG. \nBởi vì..."
        m_tf = re.match(
            r'^(?:Trả\s*lời\s*:\s*\n*)?Nhận\s*định(?:\s+trên)?\s*:\s*(SAI|ĐÚNG|Sai|Đúng)\.?\s*\n*(.*)$',
            text.strip(),
            re.DOTALL | re.IGNORECASE
        )
        if m_tf:
            verdict = m_tf.group(1).upper()
            explanation = m_tf.group(2).strip()
            explanation = re.sub(
                r'^(Bởi\s+vì|Vì)\s+([A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ])',
                lambda m: m.group(1) + ' ' + (
                    m.group(2) if explanation[len(m.group(1)):].lstrip().startswith(('Bộ luật', 'Luật', 'Hiến pháp', 'Điều', 'Khoản', 'Nhà nước', 'Quốc hội', 'Chính phủ', 'Tòa án', 'Chủ tịch', 'Ủy ban', 'Việt Nam'))
                    else m.group(2).lower()
                ),
                explanation
            )
            if explanation and not explanation.endswith('.'):
                explanation += '.'
            text = f"- **Kết luận:** Nhận định trên là **{verdict}**.\n- **Giải thích:** {explanation}"

        # Also clean PBL6 "- **Cơ sở lý luận & Phân tích chi tiết**:\n <text>" onto single bullet line
        text = re.sub(r'(- \*\*Cơ sở lý luận & Phân tích chi tiết\*\*:?)\s*\n+\s*', r'\1 ', text)

    # Final punctuation & whitespace polish
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r' *\n *', '\n', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def main():
    print("-> Đang đọc dữ liệu từ", MASTER_PATH)
    with open(MASTER_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    build_syllable_dictionary(data)

    processed = []
    for d in data:
        sid = d.get('sample_id', '')
        new_d = dict(d)
        for fld in ['instruction', 'input', 'output']:
            val = new_d.get(fld, '')
            if val:
                val = fix_ocr_and_glued_words(val)
                val = format_sample_structure(sid, val, is_output=(fld == 'output'))
                new_d[fld] = val
        processed.append(new_d)

    print(f"-> Đã xử lý xong {len(processed)} mẫu.")

    with open(MASTER_PATH, 'w', encoding='utf-8') as f:
        json.dump(processed, f, ensure_ascii=False, indent=2)
    with open(HYPHEN_PATH, 'w', encoding='utf-8') as f:
        json.dump(processed, f, ensure_ascii=False, indent=2)
    print("-> Đã lưu đồng bộ vào cả 2 file master json.")

if __name__ == '__main__':
    main()
