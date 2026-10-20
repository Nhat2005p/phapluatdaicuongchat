const fs = require('fs');
const path = require('path');

function splitDataset(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('File not found:', filePath);
    return;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const dataset = JSON.parse(raw);
  const initialCount = dataset.length;
  const newSamples = [];
  const existingIds = new Set(dataset.map(s => s.sample_id));

  for (const item of dataset) {
    // 1. Tách các bài TRUE_FALSE có nhiều câu nhận định
    if (item.intent_code === 'TRUE_FALSE' && item.input && item.input.includes('1.') && item.input.includes('2.')) {
      const lines = item.input.split('\n');
      for (const line of lines) {
        const m = line.trim().match(/^(\d+)\.\s*(.+)$/);
        if (m && m[2].length > 8) {
          const num = m[1];
          const stmt = m[2].trim();
          const newId = `${item.sample_id}_ITEM_${num}`;
          if (!existingIds.has(newId)) {
            const outRegex = new RegExp('(?:^|\\n)\\s*(' + num + '\\.[\\s\\S]*?)(?=\\n\\s*\\d+\\.|$)');
            const outMatch = item.output.match(outRegex);
            if (outMatch) {
              newSamples.push({
                sample_id: newId,
                intent_code: 'TRUE_FALSE',
                instruction: `Nhận định sau đây Đúng hay Sai, giải thích tại sao: "${stmt}"`,
                input: stmt,
                output: `### KẾT LUẬN VÀ GIẢI ĐÁP CHI TIẾT:\n\n${outMatch[1].trim()}`
              });
              existingIds.add(newId);
            }
          }
        }
      }
    }

    // 2. Tách bài lý thuyết SFT_10D_CH2_003 (Định nghĩa pháp luật & các mối quan hệ)
    if (item.sample_id === 'SFT_10D_CH2_003') {
      const defId = 'SFT_10D_CH2_003_DEF';
      if (!existingIds.has(defId)) {
        const defMatch = item.output.match(/(?:^|\n)\s*(1\.\s*Định nghĩa Pháp luật[\s\S]*?)(?=\n\s*2\.|$)/);
        if (defMatch) {
          newSamples.push({
            sample_id: defId,
            intent_code: 'GENERAL_THEORY',
            instruction: 'Nêu định nghĩa và bản chất của Pháp luật theo giáo trình Pháp luật đại cương Bộ GD&ĐT.',
            input: 'Nêu định nghĩa pháp luật.',
            output: `### ĐỊNH NGHĨA PHÁP LUẬT (CHUẨN GIÁO TRÌNH BỘ GD&ĐT):\n\n${defMatch[1].trim()}`
          });
          existingIds.add(defId);
        }
      }

      const econId = 'SFT_10D_CH2_003_ECON';
      if (!existingIds.has(econId)) {
        const econMatch = item.output.match(/(?:^|\n)\s*(2\.\s*Mối quan hệ giữa Pháp luật và Kinh tế[\s\S]*?)(?=\n\s*3\.|$)/);
        if (econMatch) {
          newSamples.push({
            sample_id: econId,
            intent_code: 'GENERAL_THEORY',
            instruction: 'Phân tích mối quan hệ biện chứng giữa Pháp luật và Kinh tế theo giáo trình Pháp luật đại cương.',
            input: 'Phân tích mối quan hệ giữa pháp luật và kinh tế.',
            output: `### MỐI QUAN HỆ GIỮA PHÁP LUẬT VÀ KINH TẾ:\n\n${econMatch[1].trim()}`
          });
          existingIds.add(econId);
        }
      }

      const polId = 'SFT_10D_CH2_003_POL';
      if (!existingIds.has(polId)) {
        const polMatch = item.output.match(/(?:^|\n)\s*(3\.\s*Mối quan hệ giữa Pháp luật và Chính trị[\s\S]*?)(?=\n\s*4\.|$)/);
        if (polMatch) {
          newSamples.push({
            sample_id: polId,
            intent_code: 'GENERAL_THEORY',
            instruction: 'Phân tích mối quan hệ giữa Pháp luật và Chính trị theo giáo trình Pháp luật đại cương.',
            input: 'Phân tích mối quan hệ giữa pháp luật và chính trị.',
            output: `### MỐI QUAN HỆ GIỮA PHÁP LUẬT VÀ CHÍNH TRỊ:\n\n${polMatch[1].trim()}`
          });
          existingIds.add(polId);
        }
      }

      const moralId = 'SFT_10D_CH2_003_MORAL';
      if (!existingIds.has(moralId)) {
        const moralMatch = item.output.match(/(?:^|\n)\s*(4\.\s*Mối quan hệ giữa Pháp luật và Đạo đức[\s\S]*?$)/);
        if (moralMatch) {
          newSamples.push({
            sample_id: moralId,
            intent_code: 'GENERAL_THEORY',
            instruction: 'Phân tích mối quan hệ giữa Pháp luật và Đạo đức theo giáo trình Pháp luật đại cương.',
            input: 'Phân tích mối quan hệ giữa pháp luật và đạo đức.',
            output: `### MỐI QUAN HỆ GIỮA PHÁP LUẬT VÀ ĐẠO ĐỨC:\n\n${moralMatch[1].trim()}`
          });
          existingIds.add(moralId);
        }
      }
    }

    // 3. Tách bài lý thuyết SFT_10D_CH4_007 (Định nghĩa quan hệ pháp luật & Năng lực chủ thể)
    if (item.sample_id === 'SFT_10D_CH4_007') {
      const qhDefId = 'SFT_10D_CH4_007_DEF';
      if (!existingIds.has(qhDefId)) {
        const defMatch = item.output.match(/(?:^|\n)\s*(1\.\s*Định nghĩa Quan hệ pháp luật[\s\S]*?)(?=\n\s*2\.|$)/);
        if (defMatch) {
          newSamples.push({
            sample_id: qhDefId,
            intent_code: 'QPPL_STRUCT',
            instruction: 'Nêu định nghĩa quan hệ pháp luật theo giáo trình môn Pháp luật đại cương.',
            input: 'Quan hệ pháp luật là gì? Nêu định nghĩa quan hệ pháp luật.',
            output: `### ĐỊNH NGHĨA QUAN HỆ PHÁP LUẬT:\n\n${defMatch[1].trim()}`
          });
          existingIds.add(qhDefId);
        }
      }

      const qhSubId = 'SFT_10D_CH4_007_CAPACITY';
      if (!existingIds.has(qhSubId)) {
        const capMatch = item.output.match(/(?:^|\n)\s*(2\.\s*Phân tích Năng lực chủ thể của Cá nhân[\s\S]*?$)/);
        if (capMatch) {
          newSamples.push({
            sample_id: qhSubId,
            intent_code: 'QPPL_STRUCT',
            instruction: 'Phân tích các thành tố cấu thành Năng lực chủ thể của Cá nhân (Năng lực pháp luật và Năng lực hành vi).',
            input: 'Phân tích năng lực chủ thể của cá nhân trong quan hệ pháp luật.',
            output: `### NĂNG LỰC CHỦ THỂ CỦA CÁ NHÂN:\n\n${capMatch[1].trim()}`
          });
          existingIds.add(qhSubId);
        }
      }
    }

    // 4. Tách bài lý thuyết SFT_10D_CH7_010 (Khái niệm tham nhũng & Hậu quả)
    if (item.sample_id === 'SFT_10D_CH7_010') {
      const tnDefId = 'SFT_10D_CH7_010_DEF';
      if (!existingIds.has(tnDefId)) {
        const defMatch = item.output.match(/(?:^|\n)\s*(1\.\s*Khái niệm Tham nhũng[\s\S]*?)(?=\n\s*2\.|$)/);
        if (defMatch) {
          newSamples.push({
            sample_id: tnDefId,
            intent_code: 'GENERAL_THEORY',
            instruction: 'Nêu khái niệm Tham nhũng theo Luật Phòng, chống tham nhũng 2018.',
            input: 'Tham nhũng là gì? Nêu khái niệm tham nhũng.',
            output: `### KHÁI NIỆM THAM NHŨNG:\n\n${defMatch[1].trim()}`
          });
          existingIds.add(tnDefId);
        }
      }

      const tnHarmId = 'SFT_10D_CH7_010_HARM';
      if (!existingIds.has(tnHarmId)) {
        const harmMatch = item.output.match(/(?:^|\n)\s*(2\.\s*Nguyên nhân và Hậu quả của tham nhũng[\s\S]*?)(?=\n\s*3\.|$)/);
        if (harmMatch) {
          newSamples.push({
            sample_id: tnHarmId,
            intent_code: 'GENERAL_THEORY',
            instruction: 'Phân tích nguyên nhân và hậu quả, tác hại của tham nhũng.',
            input: 'Phân tích hậu quả và tác hại của tham nhũng.',
            output: `### HẬU QUẢ VÀ TÁC HẠI CỦA THAM NHŨNG:\n\n${harmMatch[1].trim()}`
          });
          existingIds.add(tnHarmId);
        }
      }
    }
  }

  if (newSamples.length > 0) {
    const updated = [...dataset, ...newSamples];
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');
    console.log(`✅ [${path.basename(filePath)}] Đã bổ sung ${newSamples.length} mẫu đơn lẻ (Tổng cộng: ${initialCount} -> ${updated.length} mẫu).`);
  } else {
    console.log(`ℹ️ [${path.basename(filePath)}] Các mẫu đơn lẻ đã tồn tại đầy đủ.`);
  }
}

const file1 = path.resolve(__dirname, '../data/processed/sft_vietlaw_500.json');
const file2 = path.resolve(__dirname, '../data/processed/sft_vietlaw_master.json');

splitDataset(file1);
splitDataset(file2);
