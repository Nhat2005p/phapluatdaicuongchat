import fs from 'fs';

const sft = JSON.parse(fs.readFileSync('data/processed/sft_vietlaw_500.json', 'utf8'));
const item = sft.find(x => x.sample_id === 'SFT_CIVIL_002');

const query = `Ông A và bà B kết hôn năm 1993 và sinh được 3 người con là C sinh năm 1994, D sinh năm 1999 và E sinh năm 2001 Bà B có một người con nuôi tên là M sinh năm 1990. Năm 2013 bà B bị bệnh, tháng 2 năm 2014 Bà B chết, biết rằng tài sản chung của A và B là 2 tỷ đồng,
Anh (chị) hãy phân chia di sản thừa kế trong các trường hợp sau:
Bà B không để lại di chúc.
Bà B để lại di chúc có nội dung như sau: "Toàn bộ tài sản của B được chuyển cho Q" (Q là anh ruột của B).`;

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

function getBigrams(words) {
  const bigrams = new Set();
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.add(words[i] + ' ' + words[i + 1]);
  }
  return bigrams;
}

function calculateDiceCoefficient(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersect = 0;
  for (const item of setA) {
    if (setB.has(item)) intersect++;
  }
  return (2 * intersect) / (setA.size + setB.size);
}

const STOP_WORDS = new Set([
  'cho', 'tôi', 'biết', 'hãy', 'trình', 'bày', 'phân', 'tích', 'thế', 'nào', 'là', 'gì',
  'của', 'và', 'các', 'những', 'với', 'trong', 'theo', 'như', 'được', 'có', 'phải', 'không',
  'về', 'một', 'số', 'ở', 'đó', 'qua', 'ví', 'dụ', 'minh', 'họa', 'hỏi', 'anh', 'chị',
  'yêu', 'cầu', 'xác', 'định', 'sau', 'đây', 'em', 'xin', 'cần'
]);

function matchFactGuard(query, sample) {
  const sText = sample.instruction + ' ' + sample.input;
  const qMoney = query.match(/(\d+(?:[.,]\d+)?)\s*(triệu|tỷ|nghìn|đồng|vnđ)/i);
  if (qMoney) {
    const sMoney = sText.match(/(\d+(?:[.,]\d+)?)\s*(triệu|tỷ|nghìn|đồng|vnđ)/i);
    if (!sMoney || qMoney[1] !== sMoney[1]) {
      return false;
    }
  }
  const qAge = query.match(/(\d{1,2})\s*tuổi/i);
  if (qAge) {
    const sAge = sText.match(/(\d{1,2})\s*tuổi/i);
    if (!sAge || qAge[1] !== sAge[1]) {
      return false;
    }
  }
  return true;
}

console.log('FactGuard:', matchFactGuard(query, item));

const qWords = normalize(query);
const qKeywords = qWords.filter((w) => !STOP_WORDS.has(w));
const activeWords = qKeywords.length >= 2 ? qKeywords : qWords;
const qBigrams = getBigrams(activeWords.length >= 3 ? activeWords : qWords);

const itemWords = normalize(item.instruction + ' ' + item.input);
const tokenSet = new Set(itemWords);
let overlap = 0;
for (const w of activeWords) {
  if (tokenSet.has(w)) overlap++;
}
const unigramScore = overlap / activeWords.length;

const itemBigrams = getBigrams(itemWords);
const diceScore = calculateDiceCoefficient(qBigrams, itemBigrams);
const compositeScore = diceScore > 0 ? (0.65 * diceScore + 0.35 * unigramScore) : unigramScore;

console.log('Unigram score:', unigramScore);
console.log('Dice score:', diceScore);
console.log('Composite score:', compositeScore);
