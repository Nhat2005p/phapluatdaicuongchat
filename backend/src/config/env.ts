import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env from root or cwd
const envCandidates = [
  path.resolve(process.cwd(), '../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../../.env')
];

function loadEnvFiles(overrideNonEmpty = false): void {
  for (const envPath of envCandidates) {
    if (!fs.existsSync(envPath)) continue;
    if (!overrideNonEmpty) {
      dotenv.config({ path: envPath, override: false });
    } else {
      try {
        const parsed = dotenv.parse(fs.readFileSync(envPath));
        for (const [k, v] of Object.entries(parsed)) {
          if (v && v.trim() !== '') {
            process.env[k] = v.trim();
          }
        }
      } catch {
        // ignore read error
      }
    }
  }
}

loadEnvFiles(false);

function cleanEnvVal(val?: string): string {
  const trimmed = (val || '').trim();
  if (
    !trimmed ||
    trimmed.startsWith('your_') ||
    trimmed === 'CHANGE_ME' ||
    trimmed === 'xxx'
  ) {
    return '';
  }
  return trimmed;
}

export function reloadEnvConfig(): void {
  loadEnvFiles(true);
}

export const config = {
  port: parseInt(process.env.PORT || '8000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vietlaw_assist',
  jwtSecret: process.env.JWT_SECRET || 'vietlaw_secret_key_pbl6_2026_dut',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  llamaServerUrl: process.env.LLAMA_SERVER_URL || 'http://127.0.0.1:8088/v1',
  // Server model Qwen2.5-3B (Hugging Face Space riêng) cho chế độ "Nhanh"
  llamaServerUrl3b:
    process.env.LLAMA_SERVER_URL_3B || 'https://pthanh635-qwen2-5-3b-legal-vn-server.hf.space/v1',
  // Google Gemini API (tùy chọn, dùng khi người dùng chọn model Gemini)
  geminiApiKey: cleanEnvVal(process.env.GEMINI_API_KEY),
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  // LLM_FIRST=1: ưu tiên gọi Fine-tuned LLM (khi llama-server sẵn sàng) thay vì để Bộ giải Động rule-based trả lời sớm
  llmFirst: process.env.LLM_FIRST === '1',
  llmTimeoutMs: parseInt(process.env.LLM_TIMEOUT_MS || '90000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  get smtp() {
    return {
      user: process.env.SMTP_USER || 'nhatpham.241105@gmail.com',
      pass: process.env.SMTP_PASS || '',
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10)
    };
  },
  get oauth() {
    return {
      frontendUrl: cleanEnvVal(process.env.FRONTEND_URL) || 'http://localhost:3000',
      googleClientId: cleanEnvVal(process.env.GOOGLE_CLIENT_ID),
      googleClientSecret: cleanEnvVal(process.env.GOOGLE_CLIENT_SECRET),
      googleRedirectUri: cleanEnvVal(process.env.GOOGLE_REDIRECT_URI),
      facebookAppId: cleanEnvVal(process.env.FACEBOOK_APP_ID),
      facebookAppSecret: cleanEnvVal(process.env.FACEBOOK_APP_SECRET),
      facebookRedirectUri: cleanEnvVal(process.env.FACEBOOK_REDIRECT_URI)
    };
  }
};

