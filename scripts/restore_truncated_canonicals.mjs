import fs from 'fs';
import { execSync } from 'child_process';

const MASTER_PATH = 'data/processed/sft_vietlaw_master.json';
const data = JSON.parse(fs.readFileSync(MASTER_PATH, 'utf8'));
const canon = JSON.parse(fs.readFileSync('data/rag/llm_service_canonical_extracted.json', 'utf8'));
const headMaster = JSON.parse(execSync('git show HEAD:data/processed/sft_vietlaw_master.json', { maxBuffer: 250 * 1024 * 1024 }).toString('utf8'));
const headLlm = execSync('git show HEAD:backend/src/services/llmService.ts', { maxBuffer: 50 * 1024 * 1024 }).toString('utf8');

// Build map of intact original outputs by sample_id
const intactMap = new Map();
for (const c of canon) {
  if (c.sample_id && c.output && !/\n#\s*(\n|$)/.test(c.output)) intactMap.set(c.sample_id, c.output);
}
for (const h of headMaster) {
  if (h.sample_id && h.output && !/\n#\s*(\n|$)/.test(h.output) && !intactMap.has(h.sample_id)) {
    intactMap.set(h.sample_id, h.output);
  }
}

// Also extract all static SFT returns from HEAD:backend/src/services/llmService.ts
// Pattern: sample_id: 'SFT_...', ... output: `...`
const rx = /sample_id:\s*'(SFT_[A-Z0-9_]+)'[\s\S]{0,600}?output:\s*`([\s\S]*?)`/g;
let m;
let extractedFromHeadLlm = 0;
while ((m = rx.exec(headLlm)) !== null) {
  const id = m[1];
  const out = m[2].replace(/\\`/g, '`').replace(/\\\$/g, '$');
  if (!intactMap.has(id) && out.length > 120 && !/\n#\s*(\n|$)/.test(out)) {
    intactMap.set(id, out);
    extractedFromHeadLlm++;
  }
}
console.log(`Intact sources loaded: total=${intactMap.size} (from HEAD llmService.ts: ${extractedFromHeadLlm})`);

let restored = 0;
let unresolved = [];

for (const item of data) {
  const lastIdx = item.messages.length - 1;
  const cur = item.messages[lastIdx].content;
  if (!/\n#\s*\n/.test(cur) && !/\n#\s*$/.test(cur)) continue;

  const baseId = item.sample_id.replace(/_(?:NAT_\d+|INV)$/, '');
  const intact = intactMap.get(item.sample_id) || intactMap.get(baseId);
  if (!intact) {
    unresolved.push(item.sample_id);
    continue;
  }

  // Keep clean Sec 1 & Sec 2 from current item, put FULL intact body in Sec 3, and build clean Sec 4
  const sec1Match = cur.match(/^(### 1\.[\s\S]*?)(?=\n### 2\.)/);
  const sec2Match = cur.match(/(### 2\.[\s\S]*?)(?=\n### 3\.)/);
  const sec1 = sec1Match ? sec1Match[1].trim() : `### 1. Tóm tắt vấn đề pháp lý\n${item.instruction}`;
  const sec2 = sec2Match ? sec2Match[1].trim() : `### 2. Căn cứ pháp lý (nêu rõ Tên luật, Điều, Khoản)\n- **Giáo trình Pháp luật đại cương (Bộ GD&ĐT)** và các văn bản quy phạm pháp luật thực định liên quan.`;

  // Extract a meaningful conclusion from intact text (last substantive paragraph/bullet)
  const intactLines = intact.split('\n').map(l => l.trim()).filter(l => l.length > 35 && !l.startsWith('#') && !l.startsWith('---') && !l.startsWith('|'));
  const conclLine = intactLines.find(l => /kết luận|tóm lại|chốt lại|do đó|vì vậy/i.test(l)) || intactLines[intactLines.length - 1] || '';
  const cleanConcl = conclLine.replace(/^[-•*\d.]+\s*/, '').replace(/^\*\*[^*]+:?\*\*\s*/, '').trim();
  const sec4 = `### 4. Kết luận\n${cleanConcl.length >= 25 ? cleanConcl : 'Căn cứ các quy định pháp luật thực định và phân tích chi tiết nêu trên, vấn đề pháp lý đã được làm rõ theo đúng chuẩn Barem Bộ GD&ĐT.'}`;

  const rebuilt = `${sec1}\n\n${sec2}\n\n### 3. Phân tích chi tiết từng ý\n${intact.trim()}\n\n${sec4}`;
  item.messages[lastIdx].content = rebuilt;
  item.output = rebuilt;
  restored++;
}

console.log(`✅ Restored ${restored} truncated canonical samples! Unresolved: ${unresolved.length}`);
if (unresolved.length) console.log('Unresolved sample IDs:', unresolved.slice(0, 15));

fs.writeFileSync(MASTER_PATH, JSON.stringify(data, null, 2), 'utf8');

// Also mark our new SFT_RAG_GROUNDED_ seeds (first variation of each) as exact_lookup/fuzzy_base so Fast-Path can find them immediately
let upgradedRoles = 0;
for (const item of data) {
  if (String(item.sample_id || '').startsWith('SFT_RAG_GROUNDED_') && !item.sample_id.includes('NEGREJ')) {
    item.corpus_role = 'fuzzy_base';
    upgradedRoles++;
  }
}
fs.writeFileSync(MASTER_PATH, JSON.stringify(data, null, 2), 'utf8');
console.log(`✅ Upgraded ${upgradedRoles} SFT_RAG_GROUNDED samples to fuzzy_base for runtime matching.`);

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
console.log('✅ Resynced train/val/test JSONL & CSV.');
