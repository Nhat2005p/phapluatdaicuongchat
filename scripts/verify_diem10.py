import json
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')
sys.path.append(os.path.abspath('.'))
from data.processed.diem10_samples import DIEM10_SAMPLES

def verify_diem10():
    print("Verifying 10 Theory questions and 3 Cases against PDF:")
    for s in DIEM10_SAMPLES[:14]:
        sid = s['sample_id']
        inst = s['instruction']
        inp = s['input'].replace('\n', ' ')
        out_len = len(s['output'])
        print(f"ID: {sid:20s} | Inp: {inp[:60]}... | Out Length: {out_len} chars")

if __name__ == '__main__':
    verify_diem10()
