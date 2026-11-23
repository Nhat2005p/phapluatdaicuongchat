import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'student' | 'moderator' | 'admin';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  fullName: string;
  studentId?: string;
  avatarUrl?: string;
  googleId?: string;
  authProvider?: 'local' | 'google' | 'facebook';
  status: 'active' | 'locked';
  lockReason?: string;
  lockedAt?: Date;
  questionsQuota: number;
  questionsUsed: number;
  quotaResetDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['student', 'moderator', 'admin'],
      default: 'student',
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'locked'],
      default: 'active'
    },
    lockReason: { type: String, default: '' },
    lockedAt: { type: Date },
    fullName: { type: String, required: true },
    studentId: { type: String, trim: true },
    avatarUrl: { type: String, default: '' },
    googleId: { type: String, default: '', index: true },
    authProvider: { type: String, enum: ['local', 'google', 'facebook'], default: 'local' },
    questionsQuota: { type: Number, default: 30 },
    questionsUsed: { type: Number, default: 0 },
    quotaResetDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
