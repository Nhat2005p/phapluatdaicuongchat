import fs from 'fs';
import { execSync } from 'child_process';

const MASTER_PATH = 'data/processed/sft_vietlaw_master.json';
const data = JSON.parse(fs.readFileSync(MASTER_PATH, 'utf8'));
const headLlm = execSync('git show HEAD:backend/src/services/llmService.ts', { maxBuffer: 50 * 1024 * 1024 }).toString('utf8');

// Extract all { sample_id: 'SFT_...', ..., output: `...` } blocks from HEAD llmService.ts
const headCanon = new Map();
const rx = /sample_id:\s*'(SFT_[A-Z0-9_]+)'[\s\S]{0,800}?output:\s*`((?:\\`|[^`])*)`/g;
let m;
while ((m = rx.exec(headLlm)) !== null) {
  const id = m[1];
  const out = m[2].replace(/\\`/g, '`').replace(/\\\$/g, '$').replace(/\r\n/g, '\n').trim();
  if (out.length > 100 && (!headCanon.has(id) || out.length > headCanon.get(id).length)) {
    headCanon.set(id, out);
  }
}
console.log(`Extracted ${headCanon.size} intact canonicals from HEAD:backend/src/services/llmService.ts`);

let restored = 0;
for (const item of data) {
  const baseId = item.sample_id.replace(/_(?:NAT_\d+|INV)$/, '');
  const intact = headCanon.get(item.sample_id) || headCanon.get(baseId);
  if (!intact) continue;

  const lastIdx = item.messages.length - 1;
  const cur = item.messages[lastIdx].content.replace(/\r\n/g, '\n');

  // Restore if truncated (# dangling) OR significantly shorter than intact HEAD output (< 75% of intact length)
  const hasDanglingHash = /\n#\s*(\n|$)/.test(cur);
  const isTruncated = cur.length < intact.length * 0.85;
  const isArt16BoldIssue = baseId === 'SFT_CIVIL_LEGAL_CAPACITY_TIMING_ART16' && cur.includes('người đó **sinh ra**');

  if (hasDanglingHash || isTruncated || isArt16BoldIssue) {
    const sec1Match = cur.match(/^(### 1\.[\s\S]*?)(?=\n### 2\.)/);
    const sec2Match = cur.match(/(### 2\.[\s\S]*?)(?=\n### 3\.)/);
    const sec1 = sec1Match ? sec1Match[1].trim() : `### 1. Tóm tắt vấn đề pháp lý\n${item.instruction}`;
    const sec2 = sec2Match ? sec2Match[1].trim() : `### 2. Căn cứ pháp lý (nêu rõ Tên luật, Điều, Khoản)\n- **Giáo trình Pháp luật đại cương (Bộ GD&ĐT)** và các văn bản quy phạm pháp luật thực định liên quan.`;

    const intactLines = intact.split('\n').map(l => l.trim()).filter(l => l.length > 35 && !l.startsWith('#') && !l.startsWith('---') && !l.startsWith('|'));
    const conclLine = intactLines.find(l => /kết luận|tóm lại|chốt lại|do đó|vì vậy/i.test(l)) || intactLines[intactLines.length - 1] || '';
    const cleanConcl = conclLine.replace(/^[-•*\d.]+\s*/, '').replace(/^\*\*[^*]+:?\*\*\s*/, '').trim();
    const sec4 = `### 4. Kết luận\n${cleanConcl.length >= 25 ? cleanConcl : 'Căn cứ quy định pháp luật thực định nêu trên, các nội dung và nghĩa vụ pháp lý trong tình huống đã được xác định rõ ràng theo chuẩn Barem Bộ GD&ĐT.'}`;

    let body = intact;
    if (baseId === 'SFT_CIVIL_LEGAL_CAPACITY_TIMING_ART16') {
      body = body.replace(/người đó \*\*sinh ra\*\*/g, 'người đó sinh ra');
    }

    const rebuilt = `${sec1}\n\n${sec2}\n\n### 3. Phân tích chi tiết từng ý\n${body}\n\n${sec4}`;
    item.messages[lastIdx].content = rebuilt;
    item.output = rebuilt;
    restored++;
  }
}

console.log(`✅ Restored ${restored} canonical samples from HEAD llmService.ts!`);
fs.writeFileSync(MASTER_PATH, JSON.stringify(data, null, 2), 'utf8');

// Resync train/val/test/csv
const trainLines = [], valLines = [], testLines = [];
const csvRows = ['sample_id,intent_code,taxonomy_group,instruction,input,has_context,output'];
const escapeCsv = (str) => (!str ? '""' : '"' + String(str).replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"');
for (let i = 0; i < data.length; i++) {
  const item = data[i];
  const line = JSON.stringify({ messages: item.messages });
  const mod = i % 10;
  if (mod < 8) trainLines.push(line);
  else if (mod === 8) valLines.push(line);
  else testLines.push(line);
  csvRows.push([escapeCsv(item.sample_id), escapeCsv(item.intent_code), escapeCsv(item.taxonomy_group), escapeCsv(item.instruction), escapeCsv(item.input), escapeCsv(item.context ? 'true' : 'false'), escapeCsv(item.output)].join(','));
}
fs.writeFileSync('data/processed/sft_vietlaw_train.jsonl', trainLines.join('\n') + '\n', 'utf8');
fs.writeFileSync('data/processed/sft_vietlaw_validation.jsonl', valLines.join('\n') + '\n', 'utf8');
fs.writeFileSync('data/processed/sft_vietlaw_test.jsonl', testLines.join('\n') + '\n', 'utf8');
fs.writeFileSync('data/processed/sft_vietlaw_flat.csv', '\ufeff' + csvRows.join('\n') + '\n', 'utf8');
console.log('✅ Resynced all derivative SFT files.');
