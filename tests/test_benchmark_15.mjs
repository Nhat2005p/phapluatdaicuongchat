import { RagService } from '../backend/dist/services/ragService.js';
import { GuardrailService } from '../backend/dist/services/guardrailService.js';
import { LlmService } from '../backend/dist/services/llmService.js';

const testCases = [
  { id: 'TC 1.1', text: 'Ông hàng xóm nhà tôi chết không để lại giấy tờ chia của gì cả, giờ vợ ông ấy với 2 đứa con tranh nhau mảnh đất thì chia kiểu gì?' },
  { id: 'TC 1.2', text: 'Hôm qua tôi đi nhậu về hơi ngà ngà say, lúc đi qua ngã tư do mải nghe điện thoại nên tôi không để ý đèn chuyển đỏ và phóng qua luôn, may chưa đụng ai nhưng bị công an thổi còi. Cho hỏi lỗi này của tôi có bị giam xe không?' },
  { id: 'TC 1.3', text: 'So sánh thời hiệu khởi kiện vụ án dân sự và thời hiệu truy cứu trách nhiệm hình sự. Căn cứ nào làm gián đoạn thời hiệu?' },
  { id: 'TC 2.1', text: 'Trích dẫn nguyên văn Khoản 2 Điều 14 Bộ luật Dân sự 2015 về giới hạn việc thực hiện quyền dân sự.' },
  { id: 'TC 2.2', text: 'Phân biệt ba biện pháp ngăn chặn sau trong Tố tụng Hình sự về thời hạn tối đa và thẩm quyền áp dụng: Bắt người bị giữ trong trường hợp khẩn cấp, Tạm giữ, Tạm giam.' },
  { id: 'TC 2.3', text: 'Khái niệm Án lệ là gì? Giá trị pháp lý của Án lệ có cao hơn Văn bản quy phạm pháp luật không? Nêu 3 điều kiện để một bản án được lựa chọn phát triển thành Án lệ.' },
  { id: 'TC 3.1', text: 'Người từ đủ 14 tuổi đến dưới 16 tuổi thực hiện hành vi trộm cắp tài sản (Điều 173 BLHS) thì có phải chịu trách nhiệm hình sự trong mọi trường hợp không? Tại sao?' },
  { id: 'TC 3.2', text: 'Hành vi cố ý gây thương tích cho người khác dưới 11% thì có trường hợp nào vẫn bị khởi tố hình sự theo Điều 134 BLHS 2015 sửa đổi 2017 không?' },
  { id: 'TC 3.3', text: 'So sánh hậu quả pháp lý của Hợp đồng vô hiệu từng phần trong Bộ luật Lao động 2019 và Bộ luật Dân sự 2015.' },
  { id: 'TC 4.1', text: 'Sinh viên X (19 tuổi) ghét bạn cùng lớp Y nên đã lập nick ảo Facebook đăng bài bịa đặt rằng Y ăn cắp tiền quỹ lớp, khiến Y bị khủng hoảng tâm lý phải nghỉ học. Hãy phân tích 4 yếu tố cấu thành vi phạm pháp luật của X và xác định các loại trách nhiệm pháp lý X có thể phải gánh chịu.' },
  { id: 'TC 4.2', text: 'Phân tích hình thức Nhà nước của Việt Nam theo Hiến pháp 2013 và giải thích vì sao Quốc hội là cơ quan quyền lực nhà nước cao nhất.' },
  { id: 'TC 4.3', text: 'Cháu K (10 tuổi) tự ý lấy chiếc xe đạp địa hình trị giá 3.000.000đ của bố mẹ đem bán cho anh H (hàng xóm, 25 tuổi) với giá 1.000.000đ để lấy tiền chơi game. Bố mẹ K phát hiện và yêu cầu anh H trả lại xe nhưng anh H từ chối với lý do thuận mua vừa bán. Hợp đồng mua bán này có hiệu lực không? Bố mẹ K có quyền đòi lại xe không? Căn cứ điều luật nào?' },
  { id: 'TC 5.1', text: 'Theo quy định của Bộ luật Tố tụng Dân sự 2015, thời hạn kháng cáo bản án sơ thẩm hình sự là bao nhiêu ngày?' },
  { id: 'TC 5.2', text: 'Vợ chồng tôi đang làm thủ tục ly hôn đồng thuận tại Tòa án. Vì cả hai đều bận công tác nước ngoài nên chúng tôi muốn ủy quyền toàn bộ cho một luật sư thay mặt cả hai vợ chồng đến Tòa tham gia phiên giải quyết ly hôn và ký các biên bản có được không? Căn cứ điều luật nào?' },
  { id: 'TC 5.3', text: 'Theo Nghị định 999/2024/NĐ-CP của Chính phủ về xử phạt vi phạm hành chính trong lĩnh vực thám hiểm vũ trụ, hành vi phóng vệ tinh trái phép bị phạt bao nhiêu tiền?' }
];

console.log('=== TEST 15 CASES AND GUARDRAILS ===');
let passed = 0;
for (const tc of testCases) {
  const isLegal = RagService.isLegalQuery(tc.text);
  const intent = RagService.detectIntent(tc.text);
  const sft = LlmService.matchSftSample(tc.text);
  const hasSft = !!sft;
  const isOk = isLegal && intent !== 'OUT_OF_SCOPE' && hasSft;
  if (isOk) passed++;
  
  const guardRes = await GuardrailService.scanAndVerify(sft?.output || '');
  console.log(`[${tc.id}] Legal: ${isLegal} | Intent: ${intent} | Matcher: ${hasSft ? 'OK' : 'FAIL'} | Verified Citations: ${guardRes.verifiedCount}/${guardRes.citations.length} | Precision: ${guardRes.precisionRate}%`);
}
console.log(`Passed: ${passed}/${testCases.length}`);
