import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  transactionCode: string;
  planName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  billingCycle: string;
  questionsAdded: number;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userEmail: { type: String, required: true },
    transactionCode: { type: String, required: true, unique: true },
    planName: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'VNĐ' },
    paymentMethod: { type: String, required: true },
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed'],
      default: 'completed'
    },
    description: { type: String, required: true },
    billingCycle: { type: String, default: 'Hàng tháng' },
    questionsAdded: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
