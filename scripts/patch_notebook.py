import json
import sys
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

PROJECT_ROOT = Path(__file__).resolve().parents[1]
nb_path = PROJECT_ROOT / "notebooks" / "train_lora_vietlaw.ipynb"

with open(nb_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

for cell in nb["cells"]:
    if cell.get("cell_type") == "code":
        src = "".join(cell.get("source", []))
        if "dataset_candidates = glob.glob" in src:
            lines = cell["source"]
            new_lines = []
            seen_glob = False
            for l in lines:
                if 'glob.glob("/kaggle/input/**/' in l or 'dataset_candidates = glob.glob' in l:
                    if not seen_glob:
                        new_lines.append('dataset_candidates = glob.glob("/kaggle/input/**/sft_vietlaw_*.json", recursive=True)\n')
                        seen_glob = True
                    continue
                elif 'if not dataset_candidates:' in l and len(new_lines) > 0 and 'if not dataset_candidates:' in new_lines[-1]:
                    continue
                else:
                    new_lines.append(l)
            cell["source"] = new_lines

        if "per_device_train_batch_size=" in src:
            lines = cell["source"]
            new_lines = []
            for l in lines:
                if "per_device_train_batch_size=" in l:
                    new_lines.append("        per_device_train_batch_size=2,\n")
                elif "gradient_accumulation_steps=" in l:
                    new_lines.append("        gradient_accumulation_steps=4,\n")
                elif "num_train_epochs=" in l:
                    new_lines.append("        num_train_epochs=3 if len(safe_dataset) < 2000 else (2 if len(safe_dataset) < 8000 else 1),\n")
                elif "logging_steps=" in l:
                    new_lines.append("        logging_steps=20,\n")
                elif 'save_strategy="no",' in l:
                    new_lines.append('        save_strategy="steps",\n')
                    new_lines.append('        save_steps=250,\n')
                    new_lines.append('        save_total_limit=2,\n')
                elif "trainer.train()\n" in l:
                    new_lines.append('ckpt_candidates = sorted(glob.glob("/kaggle/input/**/checkpoint-*", recursive=True))\n')
                    new_lines.append('if not ckpt_candidates:\n')
                    new_lines.append('    ckpt_candidates = sorted(glob.glob("/kaggle/working/checkpoints/checkpoint-*"))\n')
                    new_lines.append('resume_ckpt = ckpt_candidates[-1] if ckpt_candidates else None\n')
                    new_lines.append('if resume_ckpt:\n')
                    new_lines.append('    print(f"[*] Tiếp tục huấn luyện từ checkpoint: {resume_ckpt}")\n')
                    new_lines.append('    trainer.train(resume_from_checkpoint=resume_ckpt)\n')
                    new_lines.append('else:\n')
                    new_lines.append('    print("[*] Bắt đầu huấn luyện LoRA Tầng 4...")\n')
                    new_lines.append('    trainer.train()\n')
                else:
                    new_lines.append(l)
            # Thêm chức năng hiển thị link tải checkpoint nếu người dùng muốn dừng
            if "display(FileLink(os.path.basename(ckpt_zip)))" not in "".join(new_lines):
                new_lines.append('\n# Tự động nén checkpoint mới nhất để bạn tải về nếu muốn tạm dừng:\n')
                new_lines.append('import glob, os\n')
                new_lines.append('from IPython.display import FileLink, display\n')
                new_lines.append('saved_ckpts = sorted(glob.glob("/kaggle/working/checkpoints/checkpoint-*"))\n')
                new_lines.append('if saved_ckpts:\n')
                new_lines.append('    latest_ckpt = saved_ckpts[-1]\n')
                new_lines.append('    ckpt_zip = f"/kaggle/working/{os.path.basename(latest_ckpt)}.zip"\n')
                new_lines.append('    !zip -q -r {ckpt_zip} {latest_ckpt}\n')
                new_lines.append('    print(f"💾 Link tải checkpoint dự phòng: {os.path.basename(ckpt_zip)}")\n')
                new_lines.append('    display(FileLink(os.path.basename(ckpt_zip)))\n')
            cell["source"] = new_lines

with open(nb_path, "w", encoding="utf-8") as f:
    json.dump(nb, f, ensure_ascii=False, indent=1)

print("[OK] Notebook train_lora_vietlaw.ipynb updated successfully!")
