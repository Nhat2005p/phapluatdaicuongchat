import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const MASTER_PATH = path.join(ROOT, 'data/processed/sft_vietlaw_master.json');
const PLDC_MASTER_PATH = path.join(ROOT, 'data/processed/PLDC_1000_master.jsonl');

const intentMapping = {
  concept_theory: { tax: 'G01_CONCEPT_NATURE', code: 'DEFINITION' },
  comparison: { tax: 'G02_COMPARATIVE', code: 'COMPARISON' },
  structural_analysis: { tax: 'G03_STRUCTURAL_ANALYSIS', code: 'QPPL_STRUCT' },
  true_false: { tax: 'G04_TRUE_FALSE', code: 'TRUE_FALSE' },
  real_world_scenario: { tax: 'G05_SCENARIO_NARRATIVE', code: 'CASE_ANALYSIS' },
  factoid_threshold: { tax: 'G06_FACTOID_THRESHOLD', code: 'GENERAL_THEORY' },
  ambiguous_missing_facts: { tax: 'G07_AMBIGUOUS_UNDERSPECIFIED', code: 'CASE_ANALYSIS' },
  adversarial_wrong_premise_oos: { tax: 'G08_ADVERSARIAL_OOS', code: 'OUT_OF_SCOPE' },
  procedure_steps: { tax: 'G09_PROCEDURAL_HOWTO', code: 'PRACTICAL_CONSULT' },
  document_summary_extraction: { tax: 'G11_DOC_SUMMARIZATION', code: 'EXPLAIN_LAW' },
  verification_yes_no: { tax: 'G12_VERIFICATION_YESNO', code: 'TRUE_FALSE' },
  exceptions_special_cases: { tax: 'G13_EXCEPTION_SEEKING', code: 'GENERAL_THEORY' },
  analytical_critical_thinking: { tax: 'G14_ANALYTICAL_CRITICAL', code: 'GENERAL_THEORY' },
  multi_turn_followup: { tax: 'G15_MULTITURN_FOLLOWUP', code: 'CASE_ANALYSIS' },
  format_constraint: { tax: 'G16_FORMAT_CONSTRAINED', code: 'THEORY_EXAM' },
  preventive_risk_assessment: { tax: 'G17_PREVENTIVE_RISK', code: 'PRACTICAL_CONSULT' },
  conversational_meta: { tax: 'G18_META_CONVERSATIONAL', code: 'GENERAL_THEORY' }
};

const sysPrompt = 'Bạn là trợ lý AI thông minh chuyên sâu về Pháp luật đại cương và Pháp luật Việt Nam. Hãy trả lời chuẩn xác theo giáo trình và căn cứ pháp luật.';

function main() {
  console.log('[*] Đang đọc sft_vietlaw_master.json hiện tại...');
  const existing = JSON.parse(fs.readFileSync(MASTER_PATH, 'utf8'));
  console.log(`[*] Số mẫu hiện có: ${existing.length}`);

  const existingIds = new Set(existing.map((s) => s.sample_id));
  const existingPrompts = new Set(existing.map((s) => (s.instruction || '').trim().toLowerCase()));

  console.log('[*] Đang đọc PLDC_1000_master.jsonl...');
  const lines = fs.readFileSync(PLDC_MASTER_PATH, 'utf8').split('\n').filter(Boolean);
  console.log(`[*] Tổng số dòng trong PLDC_1000: ${lines.length}`);

  let added = 0;
  let skippedId = 0;
  let skippedPrompt = 0;

  const newItems = [];

  for (const line of lines) {
    const o = JSON.parse(line);
    const sampleId = 'SFT_' + o.id;

    if (existingIds.has(sampleId)) {
      skippedId++;
      continue;
    }

    const map = intentMapping[o.intent] || { tax: 'G01_CONCEPT_NATURE', code: 'GENERAL_THEORY' };

    const pages =
      o.source && o.source.pdf_pages && o.source.pdf_pages.length > 0
        ? ` (Trang PDF: ${o.source.pdf_pages.join(', ')})`
        : '';
    const excerpt =
      o.source && o.source.source_excerpt && o.source.source_excerpt.trim()
        ? `\nTrích dẫn bài giảng: "${o.source.source_excerpt.trim()}"`
        : '';
    const context = `[GIÁO TRÌNH PHÁP LUẬT ĐẠI CƯƠNG (LAW 1001) - Chương ${o.chapter}: ${o.chapter_name || ''}${pages}]\nChủ đề: ${o.topic || ''}${excerpt}\nCăn cứ: Bài giảng Pháp luật đại cương LAW 1001 (Năm 2020)`;

    let instruction = '';
    let input = '';
    let output = '';
    let messages = [];

    if (o.intent === 'multi_turn_followup' && o.messages.length >= 4) {
      instruction = o.messages[2].content.trim();
      input =
        `[Hội thoại trước]\nNgười dùng: ${o.messages[0].content}\nTrợ lý: ${o.messages[1].content}\n[Câu hỏi tiếp theo]\n${o.messages[2].content}`.trim();
      output = o.messages[3].content.trim();
      messages = [
        { role: 'system', content: sysPrompt },
        o.messages[0],
        o.messages[1],
        o.messages[2],
        o.messages[3]
      ];
    } else {
      instruction = o.messages[0].content.trim();
      input = instruction;
      output = o.messages[1].content.trim();
      messages = [
        { role: 'system', content: sysPrompt },
        o.messages[0],
        o.messages[1]
      ];
    }

    const normPrompt = instruction.toLowerCase();
    if (existingPrompts.has(normPrompt)) {
      skippedPrompt++;
      continue;
    }

    const newItem = {
      sample_id: sampleId,
      intent_code: map.code,
      taxonomy_group: map.tax,
      instruction,
      input,
      context,
      output,
      messages,
      is_canonical: false,
      corpus_role: 'fuzzy_base'
    };

    newItems.push(newItem);
    existingIds.add(sampleId);
    existingPrompts.add(normPrompt);
    added++;
  }

  console.log(`[*] Thống kê: Thêm mới = ${added}, Trùng ID = ${skippedId}, Trùng Prompt = ${skippedPrompt}`);

  const combined = existing.concat(newItems);
  console.log(`[*] Tổng mẫu sau khi hợp nhất: ${combined.length}`);

  // Backup file cũ
  const backupPath = MASTER_PATH + '.pre_pldc1000.bak';
  fs.copyFileSync(MASTER_PATH, backupPath);
  console.log(`[*] Đã tạo bản backup tại: ${backupPath}`);

  fs.writeFileSync(MASTER_PATH, JSON.stringify(combined, null, 2), 'utf8');
  console.log(`[✔] Đã lưu thành công ${combined.length} mẫu vào ${MASTER_PATH}`);
}

main();
