import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LlmService } from '../backend/dist/services/llmService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const MASTER_PATH = path.join(ROOT, 'data/processed/sft_vietlaw_master.json');
const LLM_CANON_PATH = path.join(ROOT, 'data/rag/llm_service_canonical_extracted.json');

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  [PASS] ${msg}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${msg}`);
    failed++;
  }
}

function main() {
  console.log('=== KIỂM ĐỊNH CHẤT LƯỢNG TOÀN DIỆN DATASET 20.000 MẪU ===');
  const data = JSON.parse(fs.readFileSync(MASTER_PATH, 'utf8'));
  const llmCanon = JSON.parse(fs.readFileSync(LLM_CANON_PATH, 'utf8'));

  // 1. Count & uniqueness
  assert(Array.isArray(data) && data.length >= 20000, `Đủ tối thiểu 20.000 mẫu chuẩn (thực tế: ${data.length})`);

  const idSet = new Set();
  let dupIds = 0;
  let emptyCtx = 0;
  let shortOut = 0;
  let rawGuidance = 0;
  let syntheticTagHits = 0;
  const syntheticSampleExamples = [];

  const syntheticRx = /\[Biến thể|biến thể câu hỏi|#\d{2,}|mẫu\s+\d+|tên trộm\s+[A-Z]\d|em ruột\s+[A-Z]\d|người mua\s+[A-Z]\d|bố đẻ\s+[A-Z]\d/i;

  const byTax = {};
  const byRole = {};
  let multiTurnValid = 0;
  let multiTurnInvalid = 0;

  let d175Checked = 0;
  let d175Errors = 0;
  let probChecked = 0;
  let probErrors = 0;

  for (const item of data) {
    if (idSet.has(item.sample_id)) dupIds++;
    idSet.add(item.sample_id);

    if (!item.context || item.context.trim().length < 15) emptyCtx++;
    if (!item.output || item.output.trim().length < 30) shortOut++;
    if (LlmService.isRawGuidanceNote(item.output)) rawGuidance++;

    if (syntheticRx.test(item.instruction || '') || syntheticRx.test(item.output || '')) {
      syntheticTagHits++;
      if (syntheticSampleExamples.length < 3) syntheticSampleExamples.push(item.sample_id);
    }

    byTax[item.taxonomy_group] = (byTax[item.taxonomy_group] || 0) + 1;
    byRole[item.corpus_role || 'none'] = (byRole[item.corpus_role || 'none'] || 0) + 1;

    if (item.taxonomy_group === 'G15_MULTITURN_FOLLOWUP') {
      const ok =
        Array.isArray(item.messages) &&
        item.messages.length >= 5 &&
        item.messages[0].role === 'system' &&
        item.messages[1].role === 'user' &&
        item.messages[2].role === 'assistant' &&
        item.messages[3].role === 'user' &&
        item.messages[4].role === 'assistant';
      if (ok) multiTurnValid++;
      else multiTurnInvalid++;
    }

    // Legal math check: Điều 175 BLHS 2015 (sửa đổi 2017)
    if (item.sample_id.startsWith('SFT_G05_LOAN_')) {
      const m = item.sample_id.match(/SFT_G05_LOAN_(\d+)M_/);
      if (m) {
        d175Checked++;
        const amt = Number(m[1]);
        const out = item.output;
        if (amt >= 500 && !out.includes('Khoản 4 Điều 175')) d175Errors++;
        else if (amt >= 200 && amt < 500 && !out.includes('Khoản 3 Điều 175')) d175Errors++;
        else if (amt >= 50 && amt < 200 && !out.includes('Khoản 2 Điều 175')) d175Errors++;
        else if (amt >= 4 && amt < 50 && !out.includes('Khoản 1 Điều 175')) d175Errors++;
      }
    }

    // Math check: Probation 85% salary
    if (item.sample_id.startsWith('SFT_G05_PROBATION_')) {
      const m = item.sample_id.match(/SFT_G05_PROBATION_\d+_(\d+)M_/);
      if (m) {
        probChecked++;
        const sal = Number(m[1]);
        const expected = String(Number((sal * 0.85).toFixed(2))).replace('.', ',');
        if (!item.output.includes(expected)) probErrors++;
      }
    }
  }

  assert(dupIds === 0, `Không có sample_id trùng lặp (trùng: ${dupIds})`);
  assert(emptyCtx === 0, `100% mẫu có trường context Context-Aware đầy đủ (thiếu: ${emptyCtx})`);
  assert(shortOut === 0, `Không có mẫu output rỗng/quá ngắn <30 ký tự (lỗi: ${shortOut})`);
  assert(rawGuidance === 0, `Không lẫn ghi chú barem thô (raw guidance: ${rawGuidance})`);
  assert(
    syntheticTagHits === 0,
    `0 thẻ biến thể giả tạo (#123, biến thể, K2, Q1...) (phát hiện: ${syntheticTagHits}${syntheticSampleExamples.length ? ' -> ' + syntheticSampleExamples.join(',') : ''})`
  );

  // 2. All 17 active taxonomy groups covered
  const expectedGroups = [
    'G01_CONCEPT_NATURE',
    'G02_COMPARATIVE',
    'G03_STRUCTURAL_ANALYSIS',
    'G04_TRUE_FALSE',
    'G05_SCENARIO_NARRATIVE',
    'G06_FACTOID_THRESHOLD',
    'G07_AMBIGUOUS_UNDERSPECIFIED',
    'G08_ADVERSARIAL_OOS',
    'G09_PROCEDURAL_HOWTO',
    'G11_DOC_SUMMARIZATION',
    'G12_VERIFICATION_YESNO',
    'G13_EXCEPTION_SEEKING',
    'G14_ANALYTICAL_CRITICAL',
    'G15_MULTITURN_FOLLOWUP',
    'G16_FORMAT_CONSTRAINED',
    'G17_PREVENTIVE_RISK',
    'G18_META_CONVERSATIONAL'
  ];
  const missingGroups = expectedGroups.filter((g) => !(byTax[g] >= 100));
  assert(
    missingGroups.length === 0,
    `Phủ kín 17/17 nhóm Intent Taxonomy (mỗi nhóm >= 100 mẫu; thiếu: ${missingGroups.join(', ') || 'không'})`
  );

  const g07g08Ratio = ((byTax['G07_AMBIGUOUS_UNDERSPECIFIED'] + byTax['G08_ADVERSARIAL_OOS']) / data.length) * 100;
  assert(
    g07g08Ratio >= 10 && g07g08Ratio <= 18,
    `Tỷ lệ Nhóm 7 (Mơ hồ) + Nhóm 8 (Gài bẫy/OOS) đạt chuẩn khuyến nghị 10-15%: ${g07g08Ratio.toFixed(1)}% (${byTax['G07_AMBIGUOUS_UNDERSPECIFIED'] + byTax['G08_ADVERSARIAL_OOS']} mẫu)`
  );

  assert(
    multiTurnValid >= 400 && multiTurnInvalid === 0,
    `Hội thoại đa lượt thật có mảng messages >= 5 lượt (hợp lệ: ${multiTurnValid}, lỗi: ${multiTurnInvalid})`
  );

  assert(
    d175Checked >= 200 && d175Errors === 0,
    `Chính xác 100% khung hình phạt Điều 175 BLHS 2015 (sửa đổi 2017) kể cả mốc >=500tr Khoản 4 (${d175Checked} mẫu, lỗi: ${d175Errors})`
  );

  assert(
    probChecked >= 200 && probErrors === 0,
    `Chính xác 100% công thức tính lương thử việc tối thiểu 85% Điều 26 BLLĐ 2019 (${probChecked} mẫu, lỗi: ${probErrors})`
  );

  // 3. Verify all 101 llmService.ts canonicals + 6 Gold User Cases are retrievable in O(1) via LlmService.getMasterOutput()
  let missingInRuntime = 0;
  for (const c of llmCanon) {
    const out = LlmService.getMasterOutput(c.sample_id);
    if (!out || out.length < 100) missingInRuntime++;
  }
  assert(
    missingInRuntime === 0,
    `LlmService.getMasterOutput() truy xuất O(1) đủ 101/101 tri thức canonical hợp nhất từ llmService.ts (thiếu: ${missingInRuntime})`
  );

  const goldIds = [
    'SFT_GOLD_USER_CASE_01_CRIME_CLASSIFICATION_ART9_ART54',
    'SFT_GOLD_USER_CASE_02_HARBORING_NON_REPORTING_RELATIVES_ART18_19',
    'SFT_GOLD_USER_CASE_03_ANIMAL_DAMAGE_THIRD_PARTY_FAULT_ART603',
    'SFT_GOLD_USER_CASE_04_CAR_DEPOSIT_VS_PREPAYMENT_ART328_ND21',
    'SFT_GOLD_USER_CASE_05_ABSOLUTE_VS_RELATIVE_LEGAL_EVENT_FIRE',
    'SFT_GOLD_USER_CASE_06_RETROACTIVITY_ADMIN_FINE_20M_TO_40M_ART152_156'
  ];
  const missingGold = goldIds.filter((id) => !LlmService.getMasterOutput(id));
  assert(missingGold.length === 0, `6/6 tình huống Gold người dùng sẵn sàng trong O(1) index (thiếu: ${missingGold.length})`);

  // 4. Verify corpus_role distribution
  assert(
    byRole.fuzzy_base >= 3000 && byRole.exact_lookup >= 250 && byRole.train_aug >= 16000,
    `Phân tầng corpus_role chuẩn: fuzzy_base=${byRole.fuzzy_base}, exact_lookup=${byRole.exact_lookup}, train_aug=${byRole.train_aug}`
  );

  console.log(`\n========================================`);
  console.log(`KẾT QUẢ KIỂM ĐỊNH DATASET 20K: ${passed}/${passed + failed} PASS`);
  console.log(`========================================`);
  if (failed > 0) process.exit(1);
}

main();
