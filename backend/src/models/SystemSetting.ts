import mongoose, { Schema, Document } from 'mongoose';

export interface IPricingPlan {
  id: string;
  name: string;
  price: number;
  questionsLimit: number;
  durationDays: number;
  status: 'active' | 'paused';
  description: string;
  badge?: string;
}

export interface ISystemSetting extends Document {
  autoCrawl: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    executionTime: string; // e.g. '02:00'
    maxDocsPerCrawl: number;
    retryAttempts: number;
  };
  pricingPlans: IPricingPlan[];
  contactSupport: {
    hotline: string;
    email: string;
    workHours: string;
    copyright: string;
    disclaimer: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SystemSettingSchema = new Schema<ISystemSetting>(
  {
    autoCrawl: {
      enabled: { type: Boolean, default: true },
      frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
      executionTime: { type: String, default: '02:00' },
      maxDocsPerCrawl: { type: Number, default: 50 },
      retryAttempts: { type: Number, default: 3 }
    },
    pricingPlans: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        questionsLimit: { type: Number, required: true },
        durationDays: { type: Number, default: 30 },
        status: { type: String, enum: ['active', 'paused'], default: 'active' },
        description: { type: String, default: '' },
        badge: { type: String }
      }
    ],
    contactSupport: {
      hotline: { type: String, default: '0366 015 348' },
      email: { type: String, default: 'hotro@vietlaw.ai' },
      workHours: { type: String, default: '08:00 - 21:00 (Thứ 2 - Chủ Nhật)' },
      copyright: { type: String, default: '© 2026 Chatbot Hỗ Trợ Pháp Luật Đại Cương — Barem Chuẩn Điểm 10' },
      disclaimer: {
        type: String,
        default: 'Hệ thống hỗ trợ học tập và ôn thi môn Pháp luật đại cương, không thay thế các văn bản quy phạm pháp luật gốc.'
      }
    }
  },
  { timestamps: true }
);

export const SystemSetting = mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
