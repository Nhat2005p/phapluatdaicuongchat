import test from 'node:test';
import assert from 'node:assert/strict';
import { RagService } from '../backend/dist/services/ragService.js';
import { GuardrailService } from '../backend/dist/services/guardrailService.js';

test('RagService: Archetype & Intent Detection', async (t) => {
  await t.test('detects DEFINITION for theory questions', () => {
    const intent = RagService.detectIntent('Quy phạm pháp luật là gì? Cho ví dụ minh họa.');
    assert.equal(intent, 'DEFINITION');
  });

  await t.test('detects TRUE_FALSE for true/false questions', () => {
    const intent = RagService.detectIntent('Nhận định sau đúng hay sai: Mọi hành vi vi phạm pháp luật đều phải chịu trách nhiệm pháp lý?');
    assert.equal(intent, 'TRUE_FALSE');
  });

  await t.test('detects CIVIL_INHERIT for inheritance case studies', () => {
    const intent = RagService.detectIntent('Ông A chết để lại di sản 600 triệu, có vợ và 2 con, không để lại di chúc. Hãy chia thừa kế.');
    assert.equal(intent, 'CIVIL_INHERIT');
  });

  await t.test('detects OUT_OF_SCOPE for non-legal queries', () => {
    const intent = RagService.detectIntent('Hôm nay trời có mưa không bạn?');
    assert.equal(intent, 'OUT_OF_SCOPE');
  });

  await t.test('detects OUT_OF_SCOPE for model identity questions', () => {
    const intent = RagService.detectIntent('Bạn là mô hình gì? Ai tạo ra bạn?');
    assert.equal(intent, 'OUT_OF_SCOPE');
  });
});

test('RagService: Text Preprocessing & Query Transformation', async (t) => {
  await t.test('fixes Vietnamese OCR shifted đ letters', () => {
    const raw = 'Cơ quan nào có thẩm quyền quânđ ội và ban hành quyếtđ ịnh xử phạt?';
    const rewritten = RagService.rewriteLegalQuery(raw);
    assert.ok(rewritten.includes('quân đội'));
    assert.ok(rewritten.includes('quyết định'));
  });

  await t.test('expands common legal abbreviations', () => {
    const raw = 'Phân tích cơ cấu của qppl và các dấu hiệu của vppl';
    const rewritten = RagService.rewriteLegalQuery(raw);
    assert.ok(rewritten.includes('quy phạm pháp luật'));
    assert.ok(rewritten.includes('vi phạm pháp luật'));
  });

  await t.test('contextualizes follow-up questions with previous query', () => {
    const current = 'Cho ví dụ minh họa về tội này?';
    const previous = 'Tội cướp giật tài sản là gì?';
    const res = RagService.contextualizeQueryWithHistory(current, previous);
    assert.equal(res.isContextualized, true);
    assert.ok(res.effectiveQuery.includes('Tội cướp giật tài sản'));
  });

  await t.test('splits multi-item exam questions properly', () => {
    const multi = 'Câu 1: Pháp luật là gì?\nCâu 2: Nhận định sau đúng hay sai: Nhà nước có trước pháp luật?';
    const subQuestions = RagService.splitMultiQuestions(multi);
    assert.equal(subQuestions.length, 2);
    assert.ok(subQuestions[0].includes('Pháp luật là gì'));
    assert.ok(subQuestions[1].includes('đúng hay sai'));
  });
});

test('GuardrailService: Real-time Legal Citation Verification', async (t) => {
  await t.test('verifies accurate Vietnamese law articles and flags invalid ones', async () => {
    const sampleText = 'Căn cứ theo Điều 125 Bộ luật Dân sự 2015 về giao dịch dân sự vô hiệu, đồng thời áp dụng Điều 99999 BLDS.';
    const result = await GuardrailService.scanAndVerify(sampleText);
    
    assert.ok(result.totalFound >= 2);
    const validCitation = result.citations.find((c) => c.articleNumber === 125);
    const invalidCitation = result.citations.find((c) => c.articleNumber === 99999);

    assert.ok(validCitation, 'Should detect Điều 125 BLDS 2015');
    assert.equal(validCitation?.verified, true);

    assert.ok(invalidCitation, 'Should detect Điều 99999 BLDS');
    assert.equal(invalidCitation?.verified, false);
  });
});
