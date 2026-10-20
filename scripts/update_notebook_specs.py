import json
from pathlib import Path

nb_path = Path("notebooks/train_lora_vietlaw.ipynb")
with open(nb_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

for cell in nb["cells"]:
    if cell.get("cell_type") == "code":
        src = "".join(cell.get("source", []))
        if "INTENT_BAREM_SPECS = {" in src and '"GENERAL_THEORY"' not in src:
            lines = cell["source"]
            new_lines = []
            for line in lines:
                if '"CRIMINAL_AGE":' in line and not line.strip().endswith(","):
                    line = line.replace(')"\n', ')",\n')
                    new_lines.append(line)
                    new_lines.append('    "GENERAL_THEORY": "[INTENT: GENERAL_THEORY] Barem Lý luận chung về Nhà nước và Pháp luật (Nguồn gốc, bản chất, chức năng, hình thức nhà nước, bộ máy nhà nước CHXHCN VN, hệ thống VBQPPL, thực hiện pháp luật và phòng chống tham nhũng)."\n')
                else:
                    new_lines.append(line)
            cell["source"] = new_lines
            print("[SUCCESS] Đã cập nhật INTENT_BAREM_SPECS cho GENERAL_THEORY trong notebook!")
            break

with open(nb_path, "w", encoding="utf-8") as f:
    json.dump(nb, f, ensure_ascii=False, indent=1)
