import assert from 'node:assert/strict';
import { RagService } from '../backend/dist/services/ragService.js';
import { LlmService } from '../backend/dist/services/llmService.js';
import { GuardrailService } from '../backend/dist/services/guardrailService.js';

async function main() {
  console.log('=== LONG QUESTIONS & MULTI-PARAGRAPH CASE STUDIES STRESS SUITE ===');

  // 1. Vụ án Đỗ Thị Kim Hoa — Nhiều đoạn văn + Câu hỏi: 1/ ... 2/ ...
  {
    const q = `Chị Thanh (40 tuổi, không chồng), có quan hệ với anh Lê Mạnh H (đã có vợ), và sinh được một đứa con (cháu Minh). Sau khi chấm dứt quan hệ với anh H, chị luôn bị một người tên Đỗ Thị Kim Hoa (43 tuổi) - vợ của H, gọi điện thoại chửi mắng.
Ngày 06/11/2011, Hoa đến nhà chị Thanh (Đông Anh, Hà Nội). Tại đây, Hoa xin được bế đứa trẻ, chị Thanh đồng ý. Lấy cớ nghe điện thoại, Hoa bế cháu xuống bếp và dùng chiếc kim khâu lốp dài 7cm mang theo đâm vào đỉnh thóp đầu cháu. Sợ bị phát hiện, Hoa lấy mũ đậy vết đâm lại, nhưng máu chảy quá nhiều, cháu khóc thét lên nên bị mọi người phát hiện. Sau khi đưa đi cấp cứu, cháu Minh (40 ngày tuổi) qua đời.
Hoa (sinh năm 1974, Đông Anh, Hà Nội) không có bệnh về tâm thần, chưa có tiền án, là một người làm ruộng.
Câu hỏi:
1/ Hành vi của Hoa có phải là vi phạm pháp luật không?
2/ Nếu có, hãy phân tích cấu thành của vi phạm pháp luật trên.`;
    assert.equal(RagService.splitMultiQuestions(q).length, 1, 'Kim Hoa case must NOT be split');
    const res = await LlmService.generate(q);
    assert.doesNotMatch(res.text, /Cháu Xuống|nằm ngoài phạm vi|đang mắc \*\*bệnh tâm thần/i);
    assert.match(res.text, /Đỗ Thị Kim Hoa/i);
    assert.match(res.text, /Cháu Minh/i);
    assert.match(res.text, /Điều 123/i);
    console.log('✅ [1/10] PASS — Vụ Đỗ Thị Kim Hoa (nhiều đoạn + đánh số 1/, 2/)');
  }

  // 2. Cô giáo H dán băng keo miệng bé T tử vong (SFT_VPPL_004)
  {
    const q = `Tình huống: Cô giáo H là giáo viên một trường mầm non trên địa bàn Hà Nội. Ngày 01/6/2018, khi đang trông bé T, thấy bé khóc mãi không dừng, cô H đã dùng miếng băng keo dài 15 cm, rộng 4 cm bịt miệng bé T để bé khỏi khóc. Sau khoảng 2 phút bị dán miệng, bé T bị tím tái cả người nên cô H gọi mẹ bé lên và đưa đi cấp cứu nhưng sau một thời gian được cứu chữa, bé T đã tử vong.
1. Hãy xác định lỗi của cô giáo H?
2. Hãy phân tích lỗi của cô giáo H trong trường hợp trên?`;
    assert.equal(RagService.splitMultiQuestions(q).length, 1);
    assert.notEqual(RagService.detectIntent(q), 'OUT_OF_SCOPE');
    const res = await LlmService.generate(q);
    assert.match(res.text, /vô ý vì quá tự tin|Điều 11|Điều 129/i);
    console.log('✅ [2/10] PASS — Tình huống Cô giáo H mầm non (Lỗi vô ý vì quá tự tin)');
  }

  // 3. Bác sĩ K không thử phản vệ trước khi tiêm kháng sinh gây tử vong (SFT_10D_CASE_010)
  {
    const q = `Đề bài tình huống: Bác sĩ K không kiểm tra tiền sử dị ứng thuốc và không thử phản vệ trước khi tiêm kháng sinh, dẫn đến bệnh nhân sốc phản vệ tử vong. Xác định hình thức lỗi và trách nhiệm của bác sĩ K.`;
    assert.equal(RagService.splitMultiQuestions(q).length, 1);
    assert.notEqual(RagService.detectIntent(q), 'OUT_OF_SCOPE');
    const res = await LlmService.generate(q);
    assert.match(res.text, /vô ý do cẩu thả/i);
    assert.match(res.text, /Điều 315|Điều 11/i);
    console.log('✅ [3/10] PASS — Tình huống Bác sĩ K sốc phản vệ (Lỗi vô ý do cẩu thả & Điều 315 BLHS)');
  }

  // 4. Chia thừa kế tài sản chung 2,4 tỷ + di chúc cho bạn + Điều 644 (vợ + 1 con 15 tuổi)
  {
    const q = `Ông Nam và bà Lan là vợ chồng hợp pháp, có khối tài sản chung là căn nhà trị giá 2,4 tỷ đồng. Ông bà có 3 người con chung là Anh (30 tuổi), Bình (25 tuổi, hoàn toàn bình thường) và Cường (15 tuổi). Năm 2024, ông Nam qua đời, trước khi mất ông lập di chúc hợp pháp để lại toàn bộ phần di sản của mình cho người bạn thân là ông Hùng.
Câu hỏi:
a) Xác định giá trị di sản thừa kế của ông Nam?
b) Những ai được hưởng thừa kế không phụ thuộc vào nội dung di chúc theo Điều 644 BLDS 2015?
c) Chia cụ thể di sản thừa kế của ông Nam cho từng người.`;
    assert.equal(RagService.splitMultiQuestions(q).length, 1);
    const res = await LlmService.generate(q);
    assert.match(res.text, /1\.200\.000\.000/, 'Must divide 2.4B marital property by 2 -> 1.2B estate');
    assert.match(res.text, /200\.000\.000/, '2/3 of (1.2B / 4) = 200M each for Bà Lan & Cường (15yo)');
    assert.match(res.text, /800\.000\.000/, 'Remaining 800M for Ông Hùng');
    console.log('✅ [4/10] PASS — Chia thừa kế tài sản chung 2,4 tỷ + Di chúc + Điều 644 (1,2 tỷ -> 200tr + 200tr + 800tr)');
  }

  // 5. Kỷ luật sa thải trái pháp luật lao động nữ đang nuôi con 08 tháng tuổi
  {
    const q = `Chị Mai làm việc theo hợp đồng lao động xác định thời hạn 24 tháng tại Công ty TNHH Sao Việt với mức lương 12 triệu đồng/tháng. Hiện chị Mai đang nuôi con nhỏ 08 tháng tuổi. Do công ty gặp khó khăn kinh tế và cho rằng chị Mai hay xin về sớm 1 tiếng mỗi ngày, Giám đốc công ty đã ra quyết định sa thải chị Mai ngay lập tức mà không tổ chức họp xử lý kỷ luật.
Hỏi:
1/ Quyết định sa thải của Giám đốc Công ty TNHH Sao Việt là đúng hay sai?
2/ Quyền lợi của chị Mai được pháp luật bảo vệ như thế nào theo Bộ luật Lao động 2019?`;
    assert.equal(RagService.splitMultiQuestions(q).length, 1);
    const res = await LlmService.generate(q);
    assert.match(res.text, /SAI|TRÁI PHÁP LUẬT/i);
    assert.match(res.text, /Điều 122|Điều 137/i);
    assert.match(res.text, /Điều 41/i);
    console.log('✅ [5/10] PASS — Sa thải lao động nữ nuôi con dưới 12 tháng tuổi (Điều 122, 137, 41 BLLĐ 2019)');
  }

  // 6. Tai nạn giao thông vượt đèn đỏ thương tích 35% (< 61%) + hỏng xe 20 triệu (< 100 triệu)
  {
    const q = `Tối ngày 15/10/2025, anh Tuấn (26 tuổi, nhận thức bình thường) điều khiển xe ô tô phóng nhanh vượt đèn đỏ tại ngã tư nên đã tông trực diện vào xe máy do chị Hoa đang đi đúng phần đường. Vụ tai nạn khiến chị Hoa bị gãy xương đùi với tỷ lệ tổn thương cơ thể là 35%, chiếc xe máy hư hỏng nặng thiệt hại 20 triệu đồng.
Câu hỏi:
1. Hành vi của anh Tuấn có cấu thành tội phạm hình sự hay chỉ bị xử phạt hành chính?
2. Anh Tuấn phải bồi thường những khoản thiệt hại nào cho chị Hoa theo Bộ luật Dân sự 2015?`;
    assert.equal(RagService.splitMultiQuestions(q).length, 1);
    const res = await LlmService.generate(q);
    assert.match(res.text, /CHƯA CẤU THÀNH TỘI PHẠM HÌNH SỰ|61%/i);
    assert.match(res.text, /168\/2024/i);
    assert.match(res.text, /Điều 589|Điều 590/i);
    console.log('✅ [6/10] PASS — Tai nạn giao thông thương tích 35% + xe 20tr (Chưa đủ 61% Điều 260 -> VPHC NĐ 168 + BTTH)');
  }

  // 7. Chống cắt vỡ câu khi có số điều luật trong ngoặc đơn: "(Điều 68) và ... (Điều 71)"
  {
    const q = 'Xác định điều kiện yêu cầu Tòa án tuyên bố mất tích (Điều 68) và tuyên bố một người là đã chết (Điều 71) theo Bộ luật Dân sự 2015.';
    const subs = RagService.splitMultiQuestions(q);
    assert.equal(subs.length, 1, `Must NOT split on (Điều 68) / (Điều 71), got: ${JSON.stringify(subs)}`);
    console.log('✅ [7/10] PASS — Không cắt vỡ câu có "(Điều 68) ... (Điều 71)" trong ngoặc đơn');
  }

  // 8. Câu dẫn chung "Câu 3: Các nhận định dưới đây đúng hay sai?" không bị biến thành Câu 1
  {
    const q = `Câu 3: Các nhận định dưới đây đúng hay sai? Giải thích?
1. Bản chất của Nhà nước không chỉ có tính giai cấp mà còn có tính xã hội.
2. Mọi hành vi trái pháp luật đều là hành vi vi phạm pháp luật.`;
    const subs = RagService.splitMultiQuestions(q);
    assert.equal(subs.length, 2, `Expected 2 statements (excluding umbrella header), got ${subs.length}: ${JSON.stringify(subs)}`);
    console.log('✅ [8/10] PASS — Loại bỏ câu dẫn chung "Các nhận định dưới đây..." khỏi danh sách câu con');
  }

  // 9. Bảo toàn chỉ thị chung khi tách nhiều tình huống nhỏ ("Xác định loại lỗi trong 2 trường hợp sau:")
  {
    const q = `Xác định loại lỗi và giải thích trong 2 trường hợp sau:
1. C dùng dao đâm thẳng vào ngực D với ý muốn tước đoạt tính mạng của D làm D tử vong.
2. A là kế toán nhập lệnh chuyển tiền sơ ý gõ thừa một chữ số 0 gây thiệt hại cho công ty.`;
    const subs = RagService.splitMultiQuestions(q);
    assert.equal(subs.length, 2);
    assert.match(subs[1], /Xác định loại lỗi/i, 'Sub-item must inherit shared task instruction');
    console.log('✅ [9/10] PASS — Kế thừa chỉ thị đề bài chung cho từng trường hợp nhỏ');
  }

  // 10. Đoạn văn bản luật có đánh khoản "1. ... 2. ..." dán vào để đọc hiểu không bị tách rời
  {
    const q = `Đọc đoạn quy định tại Điều 71 Bộ luật Dân sự năm 2015 dưới đây và trình bày lại các ý cốt lõi bằng ngôn ngữ dễ hiểu:
"1. Người có quyền, lợi ích liên quan có thể yêu cầu Tòa án ra quyết định tuyên bố một người là đã chết.
2. Tòa án xác định ngày chết của người bị tuyên bố là đã chết căn cứ vào các trường hợp quy định tại khoản 1 Điều này."`;
    const subs = RagService.splitMultiQuestions(q);
    assert.equal(subs.length, 1, 'Quoted multi-clause law article must NOT be split');
    const gr = await GuardrailService.scanAndVerify((await LlmService.generate(q)).text);
    assert.ok(gr.precisionRate === 100 || gr.totalFound === 0);
    console.log('✅ [10/10] PASS — Bảo toàn nguyên vẹn đoạn điều luật nhiều khoản dán vào để giải thích');
  }

  console.log('\n🎉 ALL 10/10 LONG QUESTION & COMPLEX CASE STUDY CHECKS PASSED!');
}

main().catch((err) => {
  console.error('❌ Long & Case Study Test Failed:', err);
  process.exit(1);
});
