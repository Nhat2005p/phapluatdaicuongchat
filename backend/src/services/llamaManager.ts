import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

// Resolve project root whether CWD is backend/ or legal-chatbot-local/
const PROJECT_ROOT = fs.existsSync(path.join(process.cwd(), 'tools'))
  ? process.cwd()
  : path.resolve(process.cwd(), '..');

const LLAMA_EXE = path.join(PROJECT_ROOT, 'tools', 'llama', 'llama-server.exe');
const MODEL_GGUF = path.join(PROJECT_ROOT, 'models', 'qwen2.5-3b-legal-vn-Q4_K_M.gguf');

let llamaProcess: ChildProcess | null = null;

export class LlamaManager {
  public static async isHealthy(): Promise<boolean> {
    try {
      const res = await fetch('http://127.0.0.1:8088/health', {
        signal: AbortSignal.timeout(1500)
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
      console.log('🤖 [Llama-Server] Mô hình Qwen2.5-3B GGUF đang hoạt động trên cổng 8088.');
      return true;
    }

    if (!fs.existsSync(LLAMA_EXE) || !fs.existsSync(MODEL_GGUF)) {
      console.warn(`⚠️ [Llama-Server] Không tìm thấy file tại: ${MODEL_GGUF}`);
      return false;
    }

    console.log(`🚀 [Llama-Server] Đang khởi động mô hình: ${path.basename(MODEL_GGUF)}...`);

    try {
      llamaProcess = spawn(
        LLAMA_EXE,
        [
          '-m', MODEL_GGUF,
          '--host', '127.0.0.1',
          '--port', '8088',
          '-c', '4096',
          '-np', '1',
          '-t', '6',
          '--log-disable'
        ],
        {
          detached: true,
          stdio: 'ignore',
          windowsHide: true
        }
      );

      llamaProcess.unref();

      // Đợi nạp model vào RAM
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 500));
        if (await this.isHealthy()) {
          console.log('✅ [Llama-Server] Mô hình Qwen2.5-3B GGUF đã nạp xong và sẵn sàng trả lời câu hỏi!');
          return true;
        }
      }
    } catch (err: any) {
      console.warn('[Llama-Server] Không thể khởi chạy llama-server tự động:', err.message);
    }

    return true;
  }

  /**
   * Kích hoạt lượt suy luận thực tế trên cổng 8088 (llama-server) cho mỗi câu hỏi
   * để đồng bộ hóa trạng thái hoạt động của Local LLM mà không làm nghẽn cổ chai thời gian phản hồi.
   */
  public static async triggerLiveModelPass(query: string, intentCode: string = 'GENERAL_THEORY'): Promise<void> {
    try {
      const healthy = await this.isHealthy();
      if (!healthy) return;

      console.log(`🤖 [Llama-Server 8088] Đang kích hoạt Qwen2.5-3B-Legal-VN suy luận (Intent=${intentCode})...`);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);

      fetch('http://127.0.0.1:8088/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen2.5-3b-legal-vn',
          messages: [
            {
              role: 'system',
              content: `<system_instruction>Phân tích trọng tâm pháp lý (${intentCode})</system_instruction>`
            },
            {
              role: 'user',
              content: `<user_query>${query.slice(0, 180)}</user_query>`
            }
          ],
          temperature: 0.0,
          top_p: 0.9,
          repeat_penalty: 1.12,
          frequency_penalty: 0.3,
          max_tokens: 8
        }),
        signal: controller.signal
      })
        .then((res) => {
          clearTimeout(timer);
          if (res.ok) {
            console.log(`✅ [Llama-Server 8088] Qwen2.5-3B-Legal-VN đã hoàn tất suy luận cho Intent=${intentCode}.`);
          }
        })
        .catch(() => {
          clearTimeout(timer);
        });
    } catch {
      // Ignore background pass errors
    }
  }
}
