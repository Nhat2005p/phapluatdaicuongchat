import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { config } from '../config/env.js';

// Resolve project root whether CWD is backend/ or legal-chatbot-local/
const PROJECT_ROOT = fs.existsSync(path.join(process.cwd(), 'tools'))
  ? process.cwd()
  : path.resolve(process.cwd(), '..');

const LLAMA_EXE = path.join(PROJECT_ROOT, 'tools', 'llama', 'llama-server.exe');
const MODEL_GGUF = path.join(PROJECT_ROOT, 'models', 'qwen2.5-7b-legal-vn-Q4_K_M.gguf');

let llamaProcess: ChildProcess | null = null;

function getLlamaHealthUrl(): string {
  const base = (config.llamaServerUrl || 'http://127.0.0.1:8088/v1').replace(/\/+$/, '');
  return base.endsWith('/v1') ? `${base.slice(0, -3)}/health` : `${base}/health`;
}

function isRemoteLlamaServer(): boolean {
  const url = config.llamaServerUrl || '';
  return !url.includes('127.0.0.1') && !url.includes('localhost');
}

export class LlamaManager {
  public static isFullGenerating = false;

  public static async isHealthy(): Promise<boolean> {
    try {
      const res = await fetch(getLlamaHealthUrl(), {
        signal: AbortSignal.timeout(isRemoteLlamaServer() ? 5000 : 1500)
      });
      if (res.ok) {
        const data: any = await res.json();
        return data.status === 'ok';
      }
      return false;
    } catch {
      return false;
    }
  }

  public static async ensureRunning(): Promise<boolean> {
    const healthy = await this.isHealthy();
    if (healthy) {
      console.log(`🤖 [Llama-Server] Mô hình Qwen2.5-7B GGUF đang hoạt động tại ${config.llamaServerUrl}.`);
      return true;
    }

    if (isRemoteLlamaServer()) {
      console.warn(`⚠️ [Llama-Server] Remote server (${config.llamaServerUrl}) chưa sẵn sàng.`);
      return false;
    }

    if (!fs.existsSync(LLAMA_EXE) || !fs.existsSync(MODEL_GGUF)) {
      console.warn(`⚠️ [Llama-Server] Không tìm thấy file tại: ${MODEL_GGUF}`);
      return false;
    }

    const logicalThreads = Math.max(4, os.cpus().length || 8);
    const genThreads = Math.max(4, Math.floor(logicalThreads / 2));

    const llamaArgs = [
      '-m', MODEL_GGUF,
      '-ngl', '99',
      '--host', '127.0.0.1',
      '--port', '8088',
      '-c', '4096',
      '-np', '1',
      '-t', String(genThreads),
      '-tb', String(logicalThreads),
      '-b', '1024',
      '-ub', '512',
      '-fa', 'on',
      '--cache-reuse', '64',
      '--log-disable'
    ];

    console.log(
      `🚀 [Llama-Server] Đang khởi động ${path.basename(MODEL_GGUF)} (GPU ngl=99, t=${genThreads}, tb=${logicalThreads}, FlashAttention=ON)...`
    );

    try {
      llamaProcess = spawn(LLAMA_EXE, llamaArgs, {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      });

      llamaProcess.unref();

      // Đợi nạp model vào VRAM/RAM
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 500));
        if (await this.isHealthy()) {
          console.log('✅ [Llama-Server] Mô hình Qwen2.5-7B GGUF đã nạp xong và sẵn sàng trả lời câu hỏi!');
          return true;
        }
      }
    } catch (err: any) {
      console.warn('[Llama-Server] Không thể khởi chạy llama-server tự động:', err.message);
    }

    return true;
  }

  /**
   * Kiểm tra sẵn sàng nhẹ trên cổng 8088 (TUYỆT ĐỐI KHÔNG gửi dummy /chat/completions gây nghẽn slot suy luận chính của BƯỚC 4).
   */
  public static async triggerLiveModelPass(_query: string, _intentCode: string = 'GENERAL_THEORY'): Promise<void> {
    if (this.isFullGenerating) return;
    void this.isHealthy();
  }
}
