import { config } from '../config/env.js';

export type ModelId = 'qwen2.5-7b' | 'qwen2.5-3b' | 'gemini-2.5-flash';
export type ModelProvider = 'llama' | 'gemini';

export interface ModelDefinition {
  id: ModelId;
  provider: ModelProvider;
  /** Tên hiển thị trên giao diện */
  label: string;
  /** Mô tả ngắn cho người dùng */
  description: string;
  badge: string;
  /** Base URL kiểu OpenAI (kết thúc bằng /v1) hoặc Gemini API base */
  baseUrl: string;
  /** Tên model gửi trong payload */
  servedName: string;
  /** Ước lượng tốc độ để hiển thị */
  speedHint: string;
}

const MODELS: Record<ModelId, ModelDefinition> = {
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    provider: 'gemini',
    label: 'Gemini 2.5 Flash',
    description: 'Chuẩn xác nhất — Google Gemini API kèm RAG Giáo trình',
    badge: 'Chuẩn xác',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    servedName: config.geminiModel,
    speedHint: '~2–5 giây/câu'
  },
  'qwen2.5-7b': {
    id: 'qwen2.5-7b',
    provider: 'llama',
    label: 'Qwen2.5-7B',
    description: 'Chuyên sâu — lập luận kỹ, chính xác hơn',
    badge: 'Chuyên sâu',
    baseUrl: config.llamaServerUrl,
    servedName: 'qwen2.5-7b-legal-vn',
    speedHint: '~25–40 giây/câu'
  },
  'qwen2.5-3b': {
    id: 'qwen2.5-3b',
    provider: 'llama',
    label: 'Qwen2.5-3B',
    description: 'Nhanh — phản hồi gọn, tốc độ cao',
    badge: 'Nhanh',
    baseUrl: config.llamaServerUrl3b,
    servedName: 'qwen2.5-3b-legal-vn',
    speedHint: '~10–20 giây/câu'
  }
};

export const DEFAULT_MODEL_ID: ModelId =
  (process.env.DEFAULT_MODEL_ID as ModelId) in MODELS ? (process.env.DEFAULT_MODEL_ID as ModelId) : 'qwen2.5-7b';

export function listModels(): ModelDefinition[] {
  return Object.values(MODELS);
}

/** Chuẩn hóa id từ client; id lạ/không hợp lệ sẽ rơi về model mặc định. */
export function resolveModel(id?: string | null): ModelDefinition {
  if (id && Object.prototype.hasOwnProperty.call(MODELS, id)) {
    return MODELS[id as ModelId];
  }
  return MODELS[DEFAULT_MODEL_ID];
}
