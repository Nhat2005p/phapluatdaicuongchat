import mongoose, { Schema, Document } from 'mongoose';

export interface IKnowledgeChunk extends Document {
  chunkId: string;
  sourceDoc: string;
  lawCode: string;
  articleNumber?: number;
  clauseNumber?: number;
  title: string;
  content: string;
  embeddingModel: string;
  vectorDimensions: number;
  status: 'indexed' | 'pending' | 'updated';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeChunkSchema = new Schema<IKnowledgeChunk>(
  {
    chunkId: { type: String, required: true, unique: true, index: true },
    sourceDoc: { type: String, required: true },
    lawCode: { type: String, required: true, index: true },
    articleNumber: { type: Number },
    clauseNumber: { type: Number },
    title: { type: String, required: true },
    content: { type: String, required: true },
    embeddingModel: { type: String, default: 'bge-m3-vietnamese-law' },
    vectorDimensions: { type: Number, default: 1024 },
    status: {
      type: String,
      enum: ['indexed', 'pending', 'updated'],
      default: 'indexed'
    },
    tags: [{ type: String }]
  },
  { timestamps: true }
);

KnowledgeChunkSchema.index({ lawCode: 1, title: 'text', content: 'text' });

export const KnowledgeChunk = mongoose.model<IKnowledgeChunk>('KnowledgeChunk', KnowledgeChunkSchema);
