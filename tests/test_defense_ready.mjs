import { RagService } from '../backend/dist/services/ragService.js';
import { LlmService } from '../backend/dist/services/llmService.js';
import { GuardrailService } from '../backend/dist/services/guardrailService.js';

const defenseQuestions = [
  {
    id: 'D1_LABOR_NO_WRITTEN',
    q: 'Công ty không ký hợp đồng lao động bằng văn bản với tôi thì tôi có được pháp luật bảo vệ quyền lợi không?',
    must: ['Điều 13', 'Điều 14', 'bảo vệ'],
    forbid: ['không bảo vệ']
  },
  {
    id: 'D2_17YO_THEFT_3M',
    q: 'Bạn 17 tuổi trộm cắp điện thoại trị giá 3 triệu đồng thì có bị truy cứu trách nhiệm hình sự không?',
    must: ['Điều 12', 'Điều 173', 'trách nhiệm hình sự'],
    forbid: ['hợp đồng mua bán', 'Điều 16']
  },
  {
    id: 'D3_15YO_THEFT_3M',
    q: 'Em B 15 tuổi trộm cắp điện thoại trị giá 3 triệu đồng thì có bị truy cứu trách nhiệm hình sự không?',
    must: ['Điều 12', 'Điều 173', 'không'],
    forbid: []
  },
  {
    id: 'D4_DEPOSIT_100M',
    q: 'Anh A đặt cọc 100 triệu đồng mua đất của ông B nhưng đến hạn ông B đổi ý không bán nữa (không có thỏa thuận khác). Ông B phải trả cho anh A bao nhiêu tiền?',
    must: ['Điều 328', '200'],
    forbid: []
  },
  {
    id: 'D5_HUNG_PHO_VPPL',
    q: 'Trưa ngày 26/12/2015 tại nhà của vợ chồng Hưng (Hà Nội), nhằm ngăn chặn hành vi đánh vợ mình (chị Hà) của Phố, Hưng đã dùng dao đâm một nhát vào ngực của Phố làm Phố tử vong ngay sau đó. Biết Hưng đã đủ tuổi chịu trách nhiệm hình sự và có năng lực hành vi bình thường. Hãy phân tích cấu thành tội phạm của hành vi trên.',
    must: ['Điều 126', 'Điều 22', 'Mặt khách quan', 'Mặt chủ quan'],
    forbid: []
  },
  {
    id: 'D6_MARRIAGE_19YO',
    q: 'Nam 19 tuổi 10 tháng và nữ 18 tuổi 2 tháng có đủ điều kiện đăng ký kết hôn theo Luật Hôn nhân và Gia đình 2014 không?',
    must: ['Điều 8', '20 tuổi', 'không đủ'],
    forbid: []
  },
  {
    id: 'D7_OOS_PHO',
    q: 'Cho tôi công thức nấu phở bò Hà Nội ngon nhất.',
    must: ['ngoài phạm vi'],
    forbid: ['nước dùng', 'Luật Doanh nghiệp 2012', 'Nghị định 67/2016']
  },
  {
    id: 'D8_FAKE_ART_999',
    q: 'Điều 999 Bộ luật Dân sự năm 2015 quy định về nội dung gì?',
    must: ['689', 'không tồn tại'],
    forbid: []
  }
];

let pass = 0;
let fail = 0;

for (const tc of defenseQuestions) {
  const t0 = Date.now();
  const { effectiveQuery } = RagService.contextualizeQueryWithHistory(RagService.sanitizeSecurityPayload(tc.q), null, null);
  const plan = RagService.buildRoutingPlan(effectiveQuery);
  const res = await LlmService.generate(plan.rewrittenQuery, plan.intentCode, '', []);
  const gr = await GuardrailService.scanAndVerify(res.text);
  const low = res.text.toLowerCase();
  const miss = tc.must.filter(m => !low.includes(m.toLowerCase()));
  const bad = tc.forbid.filter(f => low.includes(f.toLowerCase()));
  const ok = miss.length === 0 && bad.length === 0;
  if (ok) pass++; else fail++;
  console.log(`[${tc.id}] ${ok ? 'PASS' : 'FAIL'} | ${((Date.now() - t0) / 1000).toFixed(2)}s | intent=${plan.intentCode} | cites=${gr.verifiedCount}/${gr.totalFound} | miss=${JSON.stringify(miss)} | bad=${JSON.stringify(bad)}`);
  if (!ok) {
    console.log('   PREVIEW:', res.text.replace(/\n+/g, ' ').slice(0, 260));
  }
}
console.log(`\n=== DEFENSE SMOKE TEST: ${pass}/${pass + fail} PASS ===`);
process.exit(fail > 0 ? 1 : 0);
