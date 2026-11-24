import mongoose, { Schema, Document } from 'mongoose';

export interface ITextbookPrinciple extends Document {
  principleId: string;     // e.g. 'GT_PLDC_CH2_VPPL_CAUTHO'
  chapter: string;
  topicCode: string;       // 'VPPL_4_ELEMENTS', 'QPPL_STRUCT', 'TRUE_FALSE', 'CIVIL_INHERIT', 'CRIMINAL_AGE'
  frameworkTitle: string;
  rulesJson: Record<string, any>;
  theoryContent: string;
}

const TextbookPrincipleSchema = new Schema<ITextbookPrinciple>(
  {
    principleId: { type: String, required: true, unique: true, index: true },
    chapter: { type: String, required: true },
    topicCode: { type: String, required: true, index: true },
    frameworkTitle: { type: String, required: true },
    rulesJson: { type: Schema.Types.Mixed, required: true },
    theoryContent: { type: String, required: true }
  },
  { timestamps: true }
);

export const TextbookPrinciple = mongoose.model<ITextbookPrinciple>('TextbookPrinciple', TextbookPrincipleSchema);
