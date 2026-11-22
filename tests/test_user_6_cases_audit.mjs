import assert from 'node:assert/strict';
import { connectDB, disconnectDB } from '../backend/dist/config/db.js';
import { runSeed } from '../backend/dist/scripts/seed.js';
import { RagService } from '../backend/dist/services/ragService.js';
import { LlmService } from '../backend/dist/services/llmService.js';
import { GuardrailService } from '../backend/dist/services/guardrailService.js';

async function runFullCase(label, rawQuery) {
  const plan = RagService.buildRoutingPlan(rawQuery);
  const ragCtx = await RagService.retrieveContext(plan.rewrittenQuery, plan.intentCode);
  const gen = await LlmService.generate(plan.rewrittenQuery, plan.intentCode, ragCtx.promptContext, ragCtx.articles);
  const guardrail = await GuardrailService.scanAndVerify(gen.text);

  console.log(`\n====================================================================`);
  console.log(`[${label}] Intent=${plan.intentCode} | Latency=${gen.latencyMs}ms`);
  console.log(`Retrieved Articles: ${ragCtx.articles.map((a) => `${a.lawCode}_D${a.articleNumber}`).join(', ')}`);
  console.log(`Verified Citations: ${guardrail.citations.filter((c) => c.verified).map((c) => `${c.lawCode}_D${c.articleNumber}`).join(', ')}`);
  console.log(`--- RESPONSE PREVIEW ---\n${gen.text}\n------------------------`);

  return { plan, ragCtx, gen, guardrail };
}

async function main() {
  console.log('=== AUDIT TEST: ALL 6 LIVE USER BUG CASES + STATUTORY D175 CHECK ===');
  await connectDB();
  await runSeed();

  try {
    // CASE 1: Phân loại tội phạm khi Tòa tuyên dưới khung (Khoản 2 Điều 173: khung 2-7 năm, tuyên 18 tháng -> Tội nghiêm trọng)
    {
      const q =
        'Bị cáo X bị Tòa án xét xử theo Khoản 2 Điều 173 Bộ luật Hình sự 2015 (Tội trộm cắp tài sản có khung hình phạt từ 02 năm đến 07 năm tù). Do X có nhiều tình tiết giảm nhẹ nên Hội đồng xét xử chỉ tuyên phạt X mức án 18 tháng tù (1,5 năm tù). Hỏi tội phạm mà X đã thực hiện thuộc loại tội phạm ít nghiêm trọng (đến 3 năm tù) hay tội phạm nghiêm trọng (trên 3 năm đến 7 năm tù)?';
      const { ragCtx, gen } = await runFullCase('CASE 1: Phân loại tội phạm (Điều 9 & Điều 54 BLHS)', q);
      const artIds = ragCtx.articles.map((a) => `${a.lawCode}_D${a.articleNumber}`);
      assert.ok(artIds.includes('BLHS2015_D9'), `Expected BLHS2015_D9 in retrieved articles, got: ${artIds.join(', ')}`);
      assert.doesNotMatch(gen.text, /lén lút,\s*bí mật\s*chiếm đoạt tài sản đang trong sự quản lý/i, 'Must NOT hijack into hardcoded Theft template');
      assert.doesNotMatch(gen.text, /Nghị định 144\/2021/i, 'Must NOT dump VPHC theft template');
      assert.match(gen.text, /tội phạm nghiêm trọng/i, 'Must conclude Tội phạm nghiêm trọng');
      assert.match(gen.text, /Điều 9/i, 'Must cite Điều 9 BLHS');
    }

    // CASE 2: Bố đẻ (ông H) che giấu & em ruột (K) không tố giác anh T cướp tài sản Khoản 1 Điều 168 (tội rất nghiêm trọng)
    {
      const q =
        'Sau khi phạm tội cướp tài sản (theo Khoản 1 Điều 168 BLHS - tội phạm rất nghiêm trọng), anh T chạy về nhà kể hết sự thật cho bố đẻ là ông H và em ruột là K nghe. Thương con/anh, ông H đã đưa tiền và bố trí xe cho T bỏ trốn lên biên giới (hành vi che giấu tội phạm), còn K biết rõ mọi chuyện nhưng chỉ im lặng không đi báo công an (hành vi không tố giác tội phạm). Hỏi ông H và K có phải chịu trách nhiệm hình sự không?';
      const { ragCtx, gen } = await runFullCase('CASE 2: Che giấu & Không tố giác tội phạm (Điều 18, 19, 389, 390 BLHS)', q);
      const artIds = ragCtx.articles.map((a) => `${a.lawCode}_D${a.articleNumber}`);
      assert.ok(
        artIds.includes('BLHS2015_D18') || artIds.includes('BLHS2015_D389'),
        `Expected BLHS2015_D18 or D389 in retrieved articles, got: ${artIds.join(', ')}`
      );
      assert.ok(
        artIds.includes('BLHS2015_D19') || artIds.includes('BLHS2015_D390'),
        `Expected BLHS2015_D19 or D390 in retrieved articles, got: ${artIds.join(', ')}`
      );
      assert.doesNotMatch(gen.text, /làm Anh T lâm vào tình trạng không thể chống cự/i, 'Must NOT swap actor T against Anh T');
      assert.match(gen.text, /ông H|K/i, 'Must directly address ông H and K');
      assert.match(gen.text, /không phải chịu trách nhiệm hình sự|miễn trách nhiệm hình sự|không bị truy cứu/i, 'Must conclude ông H and K are exempt from criminal liability');
    }

    // CASE 3: Chó săn của ông P bị tên trộm Q cạy khóa chuồng xổng ra cắn anh R tốn 15 triệu viện phí
    {
      const q =
        'Ông P nuôi một con chó săn rất dữ nhưng nhốt trong chuồng có khóa cẩn thận. Đêm đó, tên trộm Q cạy khóa chuồng định bắt trộm chó, làm con chó xổng ra ngoài đường và cắn bị thương anh R (người đi đường) khiến anh R tốn 15 triệu đồng viện phí. Hỏi ông P (chủ con chó) hay tên trộm Q (người thứ ba làm chó xổng chuồng) phải bồi thường 15 triệu đồng cho anh R?';
      const { ragCtx, gen } = await runFullCase('CASE 3: Bồi thường thiệt hại do súc vật gây ra (Khoản 2 Điều 603 BLDS)', q);
      const artIds = ragCtx.articles.map((a) => `${a.lawCode}_D${a.articleNumber}`);
      assert.ok(artIds.includes('BLDS2015_D603'), `Expected BLDS2015_D603 in retrieved articles, got: ${artIds.join(', ')}`);
      assert.doesNotMatch(gen.text, /HÀNH VI XÂM PHẠM QUYỀN SỞ HỮU TÀI SẢN CỦA ÔNG P/i, 'Must NOT accuse Ông P of theft');
      assert.match(gen.text, /Điều 603/i, 'Must cite Điều 603 BLDS 2015');
      assert.match(gen.text, /Q[\s\S]{0,120}(?:phải bồi thường|bồi thường)|người thứ ba[\s\S]{0,80}phải bồi thường/i, 'Must conclude thief Q (third party at fault) compensates anh R');
    }

    // CASE 4: Đặt cọc mua ô tô vs. Tiền trả trước (500tr xe, chuyển khoản 50tr ghi "Chuyển trước tiền mua xe ô tô")
    {
      const q =
        'Anh M thỏa thuận mua chiếc ô tô cũ của anh N với giá 500 triệu đồng. Anh M chuyển khoản cho anh N 50 triệu đồng với nội dung ghi trên lệnh chuyển tiền là "Chuyển trước tiền mua xe ô tô BKS..." mà hai bên không lập văn bản thỏa thuận đặt cọc riêng. Sau đó anh N đổi ý bán xe cho người khác giá cao hơn. Anh M khởi kiện đòi anh N phải trả lại 50 triệu đồng và phạt cọc thêm 50 triệu đồng (tổng 100 triệu). Yêu cầu phạt cọc của anh M có được Tòa án chấp nhận không?';
      const { ragCtx, gen } = await runFullCase('CASE 4: Đặt cọc vs Tiền trả trước mua ô tô (Điều 328 BLDS & NĐ 21/2021)', q);
      const artIds = ragCtx.articles.map((a) => `${a.lawCode}_D${a.articleNumber}`);
      assert.ok(artIds.includes('BLDS2015_D328'), `Expected BLDS2015_D328 in retrieved articles, got: ${artIds.join(', ')}`);
      assert.doesNotMatch(gen.text, /Điều 463|hợp đồng vay tài sản|giấy vay viết tay/i, 'Must NOT hijack into Loan Contract template');
      assert.doesNotMatch(gen.text, /Chế độ tài sản của vợ chồng/i, 'Must NOT attach Marriage Property Mục 6.6 footer');
      assert.match(gen.text, /Điều 328|tiền trả trước/i, 'Must analyze Điều 328 BLDS / tiền trả trước');
      assert.match(gen.text, /không được[\s\S]{0,40}chấp nhận|không chấp nhận|bác yêu cầu phạt cọc|không phát sinh phạt cọc/i, 'Must reject the 50M deposit penalty claim');
    }

    // CASE 5: Sự biến pháp lý tuyệt đối vs. Sự biến pháp lý tương đối (Anh B đốt rẫy gió đổi hướng cháy nhà ông C)
    {
      const q =
        'Trong quan hệ pháp luật, sự biến pháp lý được chia thành sự biến tuyệt đối và sự biến tương đối. Hãy phân biệt hai loại này và xác định trường hợp sau thuộc loại nào: "Anh B đi đốt rẫy làm nương, do gió đổi hướng đột ngột khiến lửa lan sang làm cháy rụi căn nhà gỗ của ông C (đã mua bảo hiểm cháy nổ), làm phát sinh quan hệ bồi thường bảo hiểm giữa ông C và công ty bảo hiểm."';
      const { gen } = await runFullCase('CASE 5: Sự biến tuyệt đối vs Sự biến tương đối (Đốt rẫy gió đổi hướng)', q);
      assert.doesNotMatch(gen.text, /CƠ CẤU 3 YẾU TỐ CỦA QUAN HỆ PHÁP LUẬT/i, 'Must NOT dump generic Mục 4.1-4.2 QHPL structure');
      assert.doesNotMatch(gen.text, /Điều 41 Bộ luật Lao động/i, 'Must NOT inject unrelated BLLĐ citations');
      assert.match(gen.text, /sự biến(?: pháp lý)? tuyệt đối/i, 'Must analyze Sự biến tuyệt đối');
      assert.match(gen.text, /sự biến(?: pháp lý)? tương đối/i, 'Must analyze Sự biến tương đối');
    }

    // CASE 6: Hiệu lực hồi tố VBQPPL (Tháng 5/2025 phạt 20tr -> Tháng 8/2025 luật mới nâng 40tr -> Tháng 10/2025 xử phạt)
    {
      const q =
        'Tháng 5/2025, anh A thực hiện một hành vi vi phạm mà theo quy định pháp luật tại thời điểm đó có mức phạt tiền là 20 triệu đồng. Đến tháng 10/2025, cơ quan nhà nước mới ra quyết định xử phạt, nhưng lúc này có một văn bản luật mới có hiệu lực từ tháng 8/2025 nâng mức phạt cho hành vi đó lên 40 triệu đồng. Cơ quan có thẩm quyền được phép áp dụng hiệu lực hồi tố để phạt anh A 40 triệu đồng không? Khi nào thì được áp dụng hiệu lực trở về trước của văn bản quy phạm pháp luật?';
      const { ragCtx, gen } = await runFullCase('CASE 6: Hiệu lực hồi tố VBQPPL (Điều 152 & Khoản 1, 4 Điều 156)', q);
      const artIds = ragCtx.articles.map((a) => `${a.lawCode}_D${a.articleNumber}`);
      assert.ok(
        artIds.includes('VBQPPL2015_D152') && artIds.includes('VBQPPL2015_D156'),
        `Expected VBQPPL2015_D152 and D156 in retrieved articles, got: ${artIds.join(', ')}`
      );
      assert.match(gen.text, /20\s*triệu/i, 'Must address the 20 million VND penalty');
      assert.match(gen.text, /Điều 152|Điều 156/i, 'Must cite Điều 152 / Điều 156 Luật Ban hành VBQPPL 2015');
      assert.match(gen.text, /không được(?:\s+phép)?(?:\s+áp dụng)?|không áp dụng.*40\s*triệu|chỉ.*20\s*triệu/i, 'Must conclude cannot retroactively fine 40M');
    }

    // BUG #6 CHECK: Vay 500 triệu đồng viết giấy tay -> Nếu chiếm đoạt 500 triệu phải dẫn chiếu KHOẢN 4 Điều 175 BLHS 2015 (12 - 20 năm tù), KHÔNG PHẢI Khoản 2!
    {
      const q =
        'Anh A vay tiền của anh B số tiền 500 triệu đồng, có viết giấy vay tiền tay ghi rõ ngày trả nợ nhưng không công chứng. Đến hạn trả nợ, anh A chây ỳ không trả và nói giấy vay không công chứng nên vô hiệu. Lập luận của anh A đúng hay sai? Giải quyết theo pháp luật?';
      const { gen } = await runFullCase('BUG #6 CHECK: Hợp đồng vay 500 triệu -> Khoản 4 Điều 175 BLHS 2015', q);
      assert.match(gen.text, /Khoản 4 Điều 175/i, '500M VND must cite Khoản 4 Điều 175 BLHS 2015');
      assert.match(gen.text, /12 năm đến 20 năm tù/i, '500M VND must state 12-20 years penalty frame');
      assert.doesNotMatch(gen.text, /Khoản 2 Điều 175/i, '500M VND must NOT cite Khoản 2 Điều 175');
    }

    console.log('\n🎉 ALL 7 AUDIT CHECKS (6 LIVE BUG CASES + D175 STATUTORY FIX) PASSED 100%!');
  } finally {
    await disconnectDB();
  }
}

main().catch((err) => {
  console.error('❌ AUDIT TEST FAILED:', err);
  process.exit(1);
});
