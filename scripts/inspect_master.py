import json
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

def main():
    print("Inspecting data/processed/sft_vietlaw_master.json ...")
    with open('data/processed/sft_vietlaw_master.json', 'r', encoding='utf-8') as f:
        master = json.load(f)
    print(f"Master item count: {len(master)}")
    
    master_ids = [x.get('sample_id') for x in master]
    print(f"Unique master IDs: {len(set(master_ids))}")
    
    # Check sft_vietlaw_500.json
    with open('data/processed/sft_vietlaw_500.json', 'r', encoding='utf-8') as f:
        v500 = json.load(f)
    print(f"sft_vietlaw_500 count: {len(v500)}")
    
    # Check line numbers in master json
    print("\n--- LINE NUMBERS IN sft_vietlaw_master.json ---")
    with open('data/processed/sft_vietlaw_master.json', 'r', encoding='utf-8') as f:
        for idx, line in enumerate(f, 1):
            if '"sample_id": "SFT_VPPL_001"' in line:
                print(f"Line {idx}: SFT_VPPL_001 (Original Core Start)")
            elif '"sample_id": "SFT_TMU_CH1_001"' in line:
                print(f"Line {idx}: SFT_TMU_CH1_001 (TMU Start)")
            elif '"sample_id": "SFT_DUE_CH1_001"' in line:
                print(f"Line {idx}: SFT_DUE_CH1_001 (DUE Start)")
            elif '"sample_id": "SFT_200Q_001"' in line:
                print(f"Line {idx}: SFT_200Q_001 (200Q Start)")
            elif '"sample_id": "SFT_10D_CH1_001"' in line:
                print(f"Line {idx}: SFT_10D_CH1_001 (Diem 10 Start)")
            elif '"sample_id": "SFT_10D_METHOD_001"' in line:
                print(f"Line {idx}: SFT_10D_METHOD_001 (Diem 10 End)")
            elif '"sample_id": "SFT_QA_PRACTICAL_' in line and idx < 3000:
                print(f"Line {idx}: First SFT_QA_PRACTICAL (Parquet Start)")
            elif idx == 70002:
                print(f"Line {idx}: End of Master File")

    # Check DIEM10
    try:
        sys.path.append(os.path.abspath('.'))
        from data.processed.diem10_samples import DIEM10_SAMPLES
        print(f"\ndiem10_samples count: {len(DIEM10_SAMPLES)}")
        diem10_ids = [s.get('sample_id') for s in DIEM10_SAMPLES]
        in_master = [sid for sid in diem10_ids if sid in set(master_ids)]
        print(f"Diem10 samples already in master: {len(in_master)}/{len(DIEM10_SAMPLES)}")
        in_v500 = [sid for sid in diem10_ids if sid in set(x.get('sample_id') for x in v500)]
        print(f"Diem10 samples in v500: {len(in_v500)}/{len(DIEM10_SAMPLES)}")
    except Exception as e:
        print("Error checking diem10_samples:", e)

    # Check 200 questions
    try:
        with open('data/processed/sft_200_questions.json', 'r', encoding='utf-8') as f:
            q200 = json.load(f)
        print(f"\nsft_200_questions count: {len(q200)}")
        q200_ids = [s.get('sample_id') for s in q200]
        in_master_q200 = [sid for sid in q200_ids if sid in set(master_ids)]
        print(f"200Q in master: {len(in_master_q200)}/{len(q200)}")
        in_v500_q200 = [sid for sid in q200_ids if sid in set(x.get('sample_id') for x in v500)]
        print(f"200Q in v500: {len(in_v500_q200)}/{len(q200)}")
    except Exception as e:
        print("Error checking sft_200_questions:", e)

if __name__ == '__main__':
    main()
