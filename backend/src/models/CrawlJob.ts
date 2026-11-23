import mongoose, { Schema, Document } from 'mongoose';

export interface ICrawlJob extends Document {
  jobCode: string;
  sourceName: string;
  sourceUrl: string;
  startedAt: Date;
  completedAt?: Date;
  durationSeconds: number;
  status: 'completed' | 'in_progress' | 'failed';
  docsExtracted: number;
  chunksGenerated: number;
  errorLog?: string;
  triggeredBy: string;
}

const CrawlJobSchema = new Schema<ICrawlJob>(
  {
    jobCode: { type: String, required: true, unique: true },
    sourceName: { type: String, required: true },
    sourceUrl: { type: String, required: true },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    durationSeconds: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['completed', 'in_progress', 'failed'],
      default: 'in_progress'
    },
    docsExtracted: { type: Number, default: 0 },
    chunksGenerated: { type: Number, default: 0 },
    errorLog: { type: String, default: '' },
    triggeredBy: { type: String, default: 'Hệ thống (Cron)' }
  },
  { timestamps: true }
);

export const CrawlJob = mongoose.model<ICrawlJob>('CrawlJob', CrawlJobSchema);
