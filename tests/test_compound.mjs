import { LlmService } from '../backend/dist/services/llmService.js';
import { RagService } from '../backend/dist/services/ragService.js';

const compoundPrompt = `TC 1.1: Ông hàng xóm nhà tôi chết không để lại giấy tờ chia của gì cả, giờ vợ ông ấy với 2 đứa con tranh nhau mảnh đất thì chia kiểu gì?

TC 1.2: Hôm qua tôi đi nhậu về hơi ngà ngà say, lúc đi qua ngã tư do mải nghe điện thoại nên tôi không để ý đèn chuyển đỏ và phóng qua luôn, may chưa đụng ai nhưng bị công an thổi còi. Cho hỏi lỗi này của tôi có bị giam xe không?`;

const subQuestions = RagService.splitMultiQuestions(compoundPrompt);
console.log('Detected sub-questions:', subQuestions.length);

const answers = [];
for (let i = 0; i < subQuestions.length; i++) {
  const sq = subQuestions[i];
  console.log(`\n--- SOLVING QUESTION ${i + 1} ---`);
  const sft = LlmService.matchSftSample(sq);
  console.log(`Matched sample_id: ${sft?.sample_id}`);
  console.log(`First 120 chars: ${sft?.output.substring(0, 120).replace(/\n/g, ' ')}...`);
  answers.push(`## 📌 CÂU ${i + 1}:\n${sft?.output}`);
}

const finalAnswer = answers.join('\n\n---\n\n');
console.log('\nFinal Compound Answer Length:', finalAnswer.length);
console.log('Contains Câu 1:', finalAnswer.includes('📌 CÂU 1:'));
console.log('Contains Câu 2:', finalAnswer.includes('📌 CÂU 2:'));
