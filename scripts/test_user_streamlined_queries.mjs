import { RagService } from '../backend/dist/services/ragService.js';
import { LlmService } from '../backend/dist/services/llmService.js';

async function main() {
  const q1 = 'Khái niệm quy phạm pháp luật: Hãy hệ thống hóa kiến thức về "Khái niệm quy phạm pháp luật" và chỉ ra ít nhất hai luận điểm giúp phân biệt nó với một cách hiểu thông thường dễ nhầm lẫn.';
  const p1 = RagService.buildRoutingPlan(q1);
  const r1 = await LlmService.generate(p1.rewrittenQuery, p1.intentCode, '', []);
  console.log('================= RESULT FOR Q1 (KHÁI NIỆM QPPL) =================');
  console.log(r1.text);

  const q2 = 'Phân tích cấu trúc của quy phạm pháp luật. Trình bày nội dung của: Giả định; Quy định; Chế tài. c) Cho ví dụ về một quy phạm pháp luật và xác định ba bộ phận cấu thành của quy phạm đó.';
  const p2 = RagService.buildRoutingPlan(q2);
  const r2 = await LlmService.generate(p2.rewrittenQuery, p2.intentCode, '', []);
  console.log('\n================= RESULT FOR Q2 (CẤU TRÚC QPPL) =================');
  console.log(r2.text);

  const q3 = 'Quan hệ pháp luật là gì? Phân tích 3 yếu tố cấu thành của quan hệ pháp luật.';
  const p3 = RagService.buildRoutingPlan(q3);
  const r3 = await LlmService.generate(p3.rewrittenQuery, p3.intentCode, '', []);
  console.log('\n================= RESULT FOR Q3 (QUAN HỆ PHÁP LUẬT) =================');
  console.log(r3.text);
}

main().catch(console.error);
