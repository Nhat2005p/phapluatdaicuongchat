import mongoose, { Schema, Document } from 'mongoose';

export interface ILawArticle extends Document {
  articleId: string;       // e.g. 'BLHS2015_D134_K2'
  lawCode: string;         // 'BLHS2015', 'BLDS2015', 'HNGD2014', 'HP2013'
  lawName: string;
  articleNumber: number;
  clauseNumber?: number;
  title: string;
  contentRaw: string;
  contentTokenized?: string;
  keywords: string[];
}

const LawArticleSchema = new Schema<ILawArticle>(
  {
    articleId: { type: String, required: true, unique: true, index: true },
    lawCode: { type: String, required: true, index: true },
    lawName: { type: String, required: true },
    articleNumber: { type: Number, required: true, index: true },
    clauseNumber: { type: Number, default: null },
    title: { type: String, required: true },
    contentRaw: { type: String, required: true },
    contentTokenized: { type: String },
    keywords: [{ type: String, index: true }]
  },
  { timestamps: true }
);

LawArticleSchema.index({ lawCode: 1, articleNumber: 1 });

export const LawArticle = mongoose.model<ILawArticle>('LawArticle', LawArticleSchema);
