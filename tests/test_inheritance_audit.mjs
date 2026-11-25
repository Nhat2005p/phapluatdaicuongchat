import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { LlmService } = require('../backend/dist/services/llmService.js');

const CASES = [
  {
    name: 'Case 1: Chết năm 2014 + Con nuôi + Tài sản chung (Không di chúc)',
    query:
      'Ông A và bà B kết hôn năm 1993, có ba người con C (1994), D (1999), E (2001). Bà B có con nuôi M (1990). Bà B mất năm 2014. Tài sản chung vợ chồng là 2 tỷ đồng.',
    money: '2 tỷ đồng',
    mustContain: [
      /2014/,
      /BLDS\s*2005/i,
      /Điều\s*676/i,
      /Điều\s*678/i,
      /1\.000\.000\.000/,
      /con\s+nuôi/i,
      /\bM\b/,
      /200\.000\.000/,
      /1\.200\.000\.000/,
      /2\.000\.000\.000/
    ],
    mustNotContain: [/250\.000\.000/]
  },
  {
    name: 'Case 2: Chết năm 2014 + Có di chúc cho người ngoài (Kiểm tra tính tuổi từ năm sinh & Điều 669)',
    query:
      'Ông A và bà B có ba con C (1994), D (1999), E (2001) và con nuôi M (1990). Bà B mất năm 2014, lập di chúc hợp pháp để lại toàn bộ tài sản cho anh K. Tài sản chung vợ chồng là 2 tỷ đồng.',
    money: '2 tỷ đồng',
    mustContain: [
      /Điều\s*669/i,
      /D\s*\([^)]*15\s*tuổi/i,
      /E\s*\([^)]*13\s*tuổi/i,
      /133\.333\.333/,
      /2\.000\.000\.000/
    ],
    mustNotContain: [/250\.000\.000/]
  },
  {
    name: 'Case 3: Chết năm 2022 + Con nuôi (Áp dụng BLDS 2015, Điều 651 & 653)',
    query:
      'Ông X và bà Y có 2 con đẻ và 1 con nuôi hợp pháp. Ông X mất năm 2022 không để lại di chúc. Tài sản chung vợ chồng là 4 tỷ đồng.',
    money: '4 tỷ đồng',
    mustContain: [
      /BLDS\s*2015/i,
      /Điều\s*651/i,
      /Điều\s*653/i,
      /500\.000\.000/,
      /2\.500\.000\.000/,
      /4\.000\.000\.000/
    ],
    mustNotContain: [/666\.666\.667/]
  }
];

let passed = 0;
for (const c of CASES) {
  const raw = LlmService.solveDynamicCivilInherit(c.query, ['Ông A', 'Bà B'], c.money);
  const cleaned = LlmService.cleanRubricText(raw);

  for (const re of c.mustContain) {
    assert.match(cleaned, re, `[${c.name}] Missing expected pattern: ${re}\n---\n${cleaned}`);
  }
  for (const re of c.mustNotContain) {
    assert.doesNotMatch(cleaned, re, `[${c.name}] Found forbidden pattern: ${re}\n---\n${cleaned}`);
  }
  passed++;
  console.log(`PASS: ${c.name}`);
}

console.log(`\nAll ${passed}/${CASES.length} inheritance audit regression tests passed!`);
