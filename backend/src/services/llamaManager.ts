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

const DEFAULT_BASE_URL = 'http://127.0.0.1:8088/v1';

// Cache kết quả health theo URL để tránh gọi lặp lại nhiều lần trong 1 request
// (mỗi lần gọi tới HF Space có thể mất tới vài giây).
const HEALTH_TTL_OK_MS = 15_000;
const HEALTH_TTL_FAIL_MS = 3_000;
const healthCache = new Map<string, { ok: boolean; at: number }>();
const healthInflight = new Map<string, Promise<boolean>>();

function normalizeBase(baseUrl?: string): string {
  return (baseUrl || config.llamaServerUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

function getLlamaHealthUrl(baseUrl?: string): string {
  const base = normalizeBase(baseUrl);
  return base.endsWith('/v1') ? `${base.slice(0, -3)}/health` : `${base}/health`;
}

function isRemoteUrl(baseUrl?: string): boolean {
  const url = normalizeBase(baseUrl);
  return !url.includes('127.0.0.1') && !url.includes('localhost');
}

export class LlamaManager {
  public static isFullGenerating = false;

  /**
   * Kiểm tra sức khỏe của 1 llama-server. Mặc định kiểm tra server chính (LLAMA_SERVER_URL).
   * Có cache ngắn hạn theo URL và gộp các request đồng thời.
   */
  public static async isHealthy(baseUrl?: string): Promise<boolean> {
    const key = normalizeBase(baseUrl);
    const cached = healthCache.get(key);
    if (cached) {
      const ttl = cached.ok ? HEALTH_TTL_OK_MS : HEALTH_TTL_FAIL_MS;
      if (Date.now() - cached.at < ttl) return cached.ok;
    }

    const inflight = healthInflight.get(key);
    if (inflight) return inflight;

    const probe = (async () => {
      let ok = false;
      try {
        const res = await fetch(getLlamaHealthUrl(key), {
          signal: AbortSignal.timeout(isRemoteUrl(key) ? 8000 : 1500)
        });
        if (res.ok) {
          const data: any = await res.json();
          ok = data.status === 'ok';
        }
      } catch {
        ok = false;
      }
      healthCache.set(key, { ok, at: Date.now() });
      return ok;
    })().finally(() => {
      healthInflight.delete(key);
    });

    healthInflight.set(key, probe);
    return probe;
  }

  /** Xóa cache health (dùng khi vừa khởi động/dừng server cục bộ). */
  public static invalidateHealth(baseUrl?: string): void {
    healthCache.delete(normalizeBase(baseUrl));
  }

  public static async ensureRunning(baseUrl?: string): Promise<boolean> {
    const target = normalizeBase(baseUrl);
    const healthy = await this.isHealthy(target);
    if (healthy) {
      console.log(`🤖 [Llama-Server] Model đang hoạt động tại ${target}.`);
      return true;
    }

    // Server remote (Hugging Face Space...) không thể tự bật từ backend
    if (isRemoteUrl(target)) {
      console.warn(`⚠️ [Llama-Server] Remote server (${target}) chưa sẵn sàng.`);
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
        this.invalidateHealth(target);
        if (await this.isHealthy(target)) {
          console.log('✅ [Llama-Server] Model đã nạp xong và sẵn sàng trả lời câu hỏi!');
          return true;
        }
      }
    } catch (err: any) {
      console.warn('[Llama-Server] Không thể khởi chạy llama-server tự động:', err.message);
    }

    return true;
  }

  /**
   * Kiểm tra sẵn sàng nhẹ (TUYỆT ĐỐI KHÔNG gửi dummy /chat/completions gây nghẽn slot suy luận chính).
   */
  public static async triggerLiveModelPass(
    _query: string,
    _intentCode: string = 'GENERAL_THEORY',
    baseUrl?: string
  ): Promise<void> {
    if (this.isFullGenerating) return;
    void this.isHealthy(baseUrl);
  }
}
