import mongoose, { Schema, Document } from 'mongoose';

export interface IQueryHistory extends Document {
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  query: string;
  intentCode: string;
  response: string;
  activityType?: 'solver' | 'review' | 'search';
  isBookmarked?: boolean;
  bookmarkNote?: string;
  bookmarkedAt?: Date;
  reviewMetadata?: {
    score: number;
    riskLevel: string;
    totalIssues: number;
    documentType: string;
  };
  baremAnalysis?: Record<string, any>;
  citations: Array<{
    rawText: string;
    lawCode: string;
    articleNumber: number;
    clauseNumber?: number;
    verified: boolean;
    lawTitle?: string;
  }>;
  verifiedCitationsCount: number;
  tier: string;
  latencyMs: number;
  createdAt: Date;
}

const QueryHistorySchema = new Schema<IQueryHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userEmail: { type: String, required: true },
    query: { type: String, required: true },
    intentCode: { type: String, required: true },
    response: { type: String, required: true },
    activityType: { type: String, enum: ['solver', 'review', 'search'], default: 'solver', index: true },
    isBookmarked: { type: Boolean, default: false, index: true },
    bookmarkNote: { type: String },
    bookmarkedAt: { type: Date },
    reviewMetadata: {
      score: Number,
      riskLevel: String,
      totalIssues: Number,
      documentType: String
    },
    baremAnalysis: { type: Schema.Types.Mixed },
    citations: [
      {
        rawText: String,
        lawCode: String,
        articleNumber: Number,
        clauseNumber: Number,
        verified: Boolean,
        lawTitle: String
      }
    ],
    verifiedCitationsCount: { type: Number, default: 0 },
    tier: { type: String, default: 'Tier 4 - Fine-tuned LoRA' },
    latencyMs: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const QueryHistory = mongoose.model<IQueryHistory>('QueryHistory', QueryHistorySchema);
