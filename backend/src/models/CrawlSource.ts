import mongoose, { Schema, Document } from 'mongoose';

export interface ICrawlSource extends Document {
  name: string;
  url: string;
  category: 'Luật & Bộ luật' | 'Nghị định & Thông tư' | 'Giáo trình & Barem PLDC' | 'Án lệ & Giải đáp';
  crawlFrequency: 'Hàng ngày' | 'Hàng tuần' | 'Thủ công';
  status: 'active' | 'paused' | 'error';
  lastCrawlAt?: Date;
  extractedDocsCount: number;
  selectorRules?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CrawlSourceSchema = new Schema<ICrawlSource>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    category: {
      type: String,
      enum: ['Luật & Bộ luật', 'Nghị định & Thông tư', 'Giáo trình & Barem PLDC', 'Án lệ & Giải đáp'],
      default: 'Luật & Bộ luật'
    },
    crawlFrequency: {
      type: String,
      enum: ['Hàng ngày', 'Hàng tuần', 'Thủ công'],
      default: 'Hàng tuần'
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'error'],
      default: 'active'
    },
    lastCrawlAt: { type: Date },
    extractedDocsCount: { type: Number, default: 0 },
    selectorRules: { type: String, default: 'article.content, div.law-detail' }
  },
  { timestamps: true }
);

export const CrawlSource = mongoose.model<ICrawlSource>('CrawlSource', CrawlSourceSchema);
