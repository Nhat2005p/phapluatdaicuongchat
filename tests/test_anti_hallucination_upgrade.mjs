import assert from 'node:assert/strict';
import { connectDB, disconnectDB } from '../backend/dist/config/db.js';
import { runSeed } from '../backend/dist/scripts/seed.js';
import { RagService } from '../backend/dist/services/ragService.js';
import { LlmService } from '../backend/dist/services/llmService.js';
import { BenchmarkService } from '../backend/dist/services/benchmarkService.js';

async function main() {
  console.log('=== END-TO-END ANTI-VAGUENESS & ANTI-HALLUCINATION VERIFICATION ===');
  await connectDB();
  await runSeed();

  try {
    // 1. Live Web App Flow: Moon Land Ownership -> retrieveContext returns 0 articles -> < 0.35 Refusal Guardrail triggers!
    {
      const q = 'Thủ tục đăng ký quyền sở hữu đất đai trên Mặt Trăng theo pháp luật Việt Nam hiện nay như thế nào?';
      const rewritten = RagService.rewriteLegalQuery(q);
      const intent = RagService.detectIntent(rewritten);
      const ragCtx = await RagService.retrieveContext(rewritten, intent);
      assert.equal(ragCtx.articles.length, 0, `Expected 0 fallback articles for Moon query, got ${ragCtx.articles.length}`);
      const gen = await LlmService.generate(q, intent, ragCtx.promptContext, ragCtx.articles);
      assert.match(gen.text, /0\.35|không tìm thấy quy định cụ thể/i, 'Expected < 0.35 Reranker Guardrail refusal on live flow');
      console.log('[PASS 1] Live retrieveContext + < 0.35 Reranker Guardrail (0 bogus fallback articles)');
    }

    // 2. Universal QPPL 3-Part Dissector on Unseen Quoted Norm (Điều 47 Hiến pháp 2013)
    {
      const q = 'Xác định 3 bộ phận của quy phạm pháp luật sau: "Mọi người có nghĩa vụ nộp thuế theo luật định" (Điều 47 Hiến pháp 2013). Bộ phận nào bị ẩn?';
      const rewritten = RagService.rewriteLegalQuery(q);
      const intent = RagService.detectIntent(rewritten);
      const ragCtx = await RagService.retrieveContext(rewritten, intent);
      const gen = await LlmService.generate(q, intent, ragCtx.promptContext, ragCtx.articles);
      assert.match(gen.text, /Mọi người/i);
      assert.match(gen.text, /có nghĩa vụ nộp thuế/i);
      assert.match(gen.text, /Chế tài[\s\S]*bị ẩn|khuyết chế tài/i);
      assert.doesNotMatch(gen.text, /Điều 207 Bộ luật Hình sự/i, 'Should not dump hardcoded 4-clause sheet');
      const footerMatches = gen.text.match(/CĂN CỨ THAM KHẢO GIÁO TRÌNH/gi) || [];
      assert.ok(footerMatches.length <= 1, `Duplicate citation footer detected (${footerMatches.length})`);
      console.log('[PASS 2] Universal QPPL Dissector on unseen quoted norm + Zero duplicate citation footer');
    }

    // 3. General Multiple-Choice Solver (Unseen MCQ)
    {
      const q = 'Theo Hiến pháp năm 2013, cơ quan nào thực hiện quyền hành pháp? Chỉ chọn 1 đáp án đúng: A. Quốc hội B. Chính phủ C. Tòa án nhân dân tối cao D. Viện kiểm sát nhân dân tối cao';
      const gen = await LlmService.generate(q);
      assert.match(gen.text, /Đáp án đúng:\s*B\.\s*Chính phủ/i);
      assert.match(gen.text, /Điều 94/i);
      console.log('[PASS 3] General Multiple-Choice Solver (A/B/C/D -> B. Chính phủ, Điều 94 HP2013)');
    }

    // 4. Ambiguous Real-Life Query -> Anti-Vagueness Conditional Legal Branching
    {
      const q1 = 'Hôm qua hàng xóm đánh người bị thương phải nhập viện, cho hỏi đánh người thì đi tù mấy năm?';
      const gen1 = await LlmService.generate(q1);
      assert.match(gen1.text, /11%/i);
      assert.match(gen1.text, /Điều 134/i);
      assert.match(gen1.text, /hành chính/i);

      const q2 = 'Mua đất bằng giấy viết tay không công chứng có hợp lệ không?';
      const gen2 = await LlmService.generate(q2);
      assert.match(gen2.text, /hai phần ba|2\/3/i);
      assert.match(gen2.text, /Điều 129/i);
      console.log('[PASS 4] Ambiguous Query Conditional Legal Branching (injury % & handwritten land sale 2/3 rule)');
    }

    // 5. Dynamic Comparison: Quốc hội vs Chính phủ + Zero Duplicate Footer Check
    {
      const q = 'So sánh vị trí, chức năng của Quốc hội và Chính phủ theo Hiến pháp năm 2013.';
      const rewritten = RagService.rewriteLegalQuery(q);
      const intent = RagService.detectIntent(rewritten);
      const ragCtx = await RagService.retrieveContext(rewritten, intent);
      const gen = await LlmService.generate(q, intent, ragCtx.promptContext, ragCtx.articles);
      assert.match(gen.text, /Điều 69/i);
      assert.match(gen.text, /Điều 94/i);
      assert.match(gen.text, /quyền lập pháp/i);
      assert.match(gen.text, /quyền hành pháp/i);
      const footerMatches = gen.text.match(/CĂN CỨ THAM KHẢO GIÁO TRÌNH/gi) || [];
      assert.ok(footerMatches.length <= 1, `Duplicate citation footer detected (${footerMatches.length})`);
      console.log('[PASS 5] Dynamic Comparison (Quốc hội vs Chính phủ) + Single clean citation footer');
    }

    // 6. Multi-Turn Contextualization with previousResponse item extraction
    {
      const prevQ = 'Nêu các điều kiện có hiệu lực của giao dịch dân sự theo Điều 117 BLDS 2015.';
      const prevResp = `1. Chủ thể có năng lực pháp luật dân sự, năng lực hành vi dân sự phù hợp.\n2. Chủ thể tham gia giao dịch dân sự hoàn toàn tự nguyện.\n3. Mục đích và nội dung không vi phạm điều cấm của luật, không trái đạo đức xã hội.`;
      const followUp = 'Phân tích kỹ hơn điều kiện thứ 2 vừa nêu và hậu quả nếu bị lừa dối.';
      const contextualized = RagService.contextualizeQueryWithHistory(followUp, prevQ, prevResp);
      assert.equal(contextualized.isContextualized, true);
      assert.match(contextualized.effectiveQuery, /hoàn toàn tự nguyện/i);
      console.log('[PASS 6] Multi-turn contextualization extracts exact numbered item #2 from previousResponse');
    }

    // 7. Dynamic BenchmarkService (no hardcoded 22% injury on inheritance query)
    {
      const q = 'Ông A mất không để lại di chúc, di sản 900 triệu chia cho vợ và 2 con như thế nào?';
      const bench = await BenchmarkService.runBenchmark(q);
      assert.equal(bench.tiers.length, 4);
      assert.doesNotMatch(bench.tiers[1].response, /22%/, 'Benchmark Tier 2 should no longer hardcode 22% injury');
      assert.match(bench.tiers[3].response, /300\.000\.000|Điều 651/i);
      console.log('[PASS 7] Dynamic BenchmarkService Tier 1-4 tailored to actual query');
    }

    console.log('\n🎉 ALL 7/7 ANTI-VAGUENESS & ANTI-HALLUCINATION E2E SUITES PASSED!');
  } finally {
    await disconnectDB();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ E2E Verification Failed:', err);
    process.exit(1);
  });
