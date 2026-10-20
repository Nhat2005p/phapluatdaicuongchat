import { RagService } from '../backend/src/services/ragService.js';
import { LlmService } from '../backend/src/services/llmService.js';

const q = `Ông A và bà B kết hôn năm 1993 và sinh được 3 người con là C sinh năm 1994, D sinh năm 1999 và E sinh năm 2001 Bà B có một người con nuôi tên là M sinh năm 1990. Năm 2013 bà B bị bệnh, tháng 2 năm 2014 Bà B chết, biết rằng tài sản chung của A và B là 2 tỷ đồng,
Anh (chị) hãy phân chia di sản thừa kế trong các trường hợp sau:
Bà B không để lại di chúc.
Bà B để lại di chúc có nội dung như sau: "Toàn bộ tài sản của B được chuyển cho Q" (Q là anh ruột của B).`;

const archetype = RagService.detectArchetype(q);
console.log('Detected archetype:', archetype);

const matchedSft = (LlmService as any).matchSftSample(q, archetype);
console.log('Matched SFT sample:', matchedSft?.sample_id, '| Intent:', matchedSft?.intent_code);
