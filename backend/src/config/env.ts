import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or cwd
const envCandidates = [
  path.resolve(process.cwd(), '../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../../.env')
];
for (const envPath of envCandidates) {
  dotenv.config({ path: envPath });
}
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '8000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vietlaw_assist',
  jwtSecret: process.env.JWT_SECRET || 'vietlaw_secret_key_pbl6_2026_dut',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  llamaServerUrl: process.env.LLAMA_SERVER_URL || 'http://127.0.0.1:8088/v1',
  nodeEnv: process.env.NODE_ENV || 'development',
  get smtp() {
    return {
      user: process.env.SMTP_USER || 'nhatpham.241105@gmail.com',
      pass: process.env.SMTP_PASS || '',
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10)
    };
  }
};

