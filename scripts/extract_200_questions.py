import re
import json
from pathlib import Path
import pypdf

PROJECT_ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = Path(r"C:\Users\HP ENVY\.gemini\antigravity-ide\brain\c8bec685-ca6d-467c-aae7-0a97a4b65b1f\.user_uploaded\media_1790781677504.pdf")
OUTPUT_PATH = PROJECT_ROOT / "data" / "processed" / "sft_200_questions.json"

def main():
    if not PDF_PATH.exists():
        print(f"[!] PDF not found at {PDF_PATH}")
        return

    reader = pypdf.PdfReader(str(PDF_PATH))
    full_text = ""
    for page in reader.pages:
        t = page.extract_text() or ""
        lines = []
        for l in t.split("\n"):
            line = l.strip()
            if not line or "Bộ 200 câu" in line or (line.startswith("Trang ") and line[6:].isdigit()):
                continue
            lines.append(line)
        full_text += "\n" + "\n".join(lines)

    pattern = r"(?:^|\n)(Câu\s+(\d+)[\.:]\s*(\[.*?\])?\s*(.*?))(?=(?:<b>)?(?:ĐÁP ÁN|LỜI GIẢI)\s*CHI\s*TIẾT:?(?:</b>)?)(?:<b>)?(?:ĐÁP ÁN|LỜI GIẢI)\s*CHI\s*TIẾT:?(?:</b>)?(.*?)(?=(?:(?:\n|^)Câu\s+\d+[\.:]|PHẦN\s+LỤC|$))"
    matches = list(re.finditer(pattern, full_text, flags=re.DOTALL))
    print(f"[*] Regex matched {len(matches)} questions.")

    samples = []
    for m in matches:
        q_num = int(m.group(2))
        tag = (m.group(3) or "").strip()
        title = m.group(4).strip()
        body = m.group(5).strip()

        title_clean = re.sub(r"<[^>]+>", "", title).replace("\n", " ").strip()
        body_clean = re.sub(r"<br\s*/?>", "\n", body)
        body_clean = re.sub(r"<[^>]+>", "", body_clean).strip()

        intent_code = "GENERAL_THEORY"
        q_lower = (tag + " " + title_clean).lower()
        if "thừa kế" in q_lower or "di sản" in q_lower:
            intent_code = "CIVIL_INHERIT"
        elif "đúng hay sai" in q_lower or "đúng không" in q_lower:
            intent_code = "TRUE_FALSE"
        elif "quy phạm" in q_lower or "giả định" in q_lower or "chế tài" in q_lower:
            intent_code = "QPPL_STRUCT"
        elif "vi phạm" in q_lower or "bồi thường" in q_lower or "tội phạm" in q_lower:
            intent_code = "VPPL_4_ELEMENTS"
        elif "độ tuổi" in q_lower or "hình sự" in q_lower:
            intent_code = "CRIMINAL_AGE"

        samples.append({
            "sample_id": f"SFT_200Q_{q_num:03d}",
            "intent_code": intent_code,
            "instruction": "Hãy phân tích và trả lời câu hỏi tự luận Pháp luật Đại cương sau đây theo chuẩn Barem giáo trình 2021.",
            "input": f"Câu {q_num}. {tag + ' ' if tag else ''}{title_clean}".strip(),
            "output": body_clean
        })

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(samples, f, ensure_ascii=False, indent=2)

    print(f"[SUCCESS] Extracted and saved {len(samples)} samples to {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
