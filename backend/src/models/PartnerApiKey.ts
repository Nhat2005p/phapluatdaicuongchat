import mongoose, { Schema, Document } from 'mongoose';

export interface IPartnerApiKey extends Document {
  name: string;
  key: string;
  partnerType: string;
  rateLimitRpm: number;
  status: 'active' | 'revoked';
  requestsUsed: number;
  monthlyLimit: number;
  lastUsedAt?: Date;
  contactEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

const PartnerApiKeySchema = new Schema<IPartnerApiKey>(
  {
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    partnerType: { type: String, default: 'Doanh nghiệp / Trường học' },
    rateLimitRpm: { type: Number, default: 120 },
    status: { type: String, enum: ['active', 'revoked'], default: 'active' },
    requestsUsed: { type: Number, default: 0 },
    monthlyLimit: { type: Number, default: 10000 },
    lastUsedAt: { type: Date },
    contactEmail: { type: String, required: true }
  },
  { timestamps: true }
);

export const PartnerApiKey = mongoose.model<IPartnerApiKey>('PartnerApiKey', PartnerApiKeySchema);
