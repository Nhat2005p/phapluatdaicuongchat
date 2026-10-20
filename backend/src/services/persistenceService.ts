import fs from 'fs';
import path from 'path';
import { User, IUser } from '../models/User.js';

export interface IPersistedUser {
  username: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'moderator' | 'admin';
  fullName: string;
  studentId?: string;
  avatarUrl?: string;
  status: 'active' | 'locked';
  questionsQuota?: number;
  questionsUsed?: number;
  quotaResetDate?: string;
}

export class PersistenceService {
  private static getFilePath(): string {
    const candidates = [
      path.resolve(process.cwd(), '../data/persisted_users.json'),
      path.resolve(process.cwd(), 'data/persisted_users.json'),
      path.resolve(__dirname, '../../../data/persisted_users.json')
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    // Mặc định lưu tại thư mục data gốc
    const defaultPath = candidates[0];
    const dir = path.dirname(defaultPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return defaultPath;
  }

  public static loadPersistedUsers(): IPersistedUser[] {
    try {
      const p = this.getFilePath();
      if (!fs.existsSync(p)) return [];
      const raw = fs.readFileSync(p, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.warn('⚠️ [Persistence] Lỗi đọc persisted_users.json:', err);
      return [];
    }
  }

  public static saveUser(user: Partial<IUser>): void {
    try {
      const p = this.getFilePath();
      let users = this.loadPersistedUsers();
      const email = user.email?.toLowerCase();
      if (!email) return;

      const userRecord: IPersistedUser = {
        username: user.username || email.split('@')[0],
        email,
        passwordHash: user.passwordHash || '',
        role: (user.role as any) || 'student',
        fullName: user.fullName || email.split('@')[0],
        studentId: user.studentId || '',
        avatarUrl: user.avatarUrl || '',
        status: user.status || 'active',
        questionsQuota: user.questionsQuota ?? 30,
        questionsUsed: user.questionsUsed ?? 0,
        quotaResetDate: user.quotaResetDate ? new Date(user.quotaResetDate).toISOString() : undefined
      };

      const idx = users.findIndex((u) => u.email.toLowerCase() === email);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...userRecord };
      } else {
        users.push(userRecord);
      }

      fs.writeFileSync(p, JSON.stringify(users, null, 2), 'utf-8');
      console.log(`💾 [Persistence] Đã lưu tài khoản ${email} vào ổ cứng.`);
    } catch (err) {
      console.error('❌ [Persistence] Lỗi lưu user vào disk:', err);
    }
  }

  public static async restoreAllUsers(): Promise<number> {
    try {
      const users = this.loadPersistedUsers();
      if (users.length === 0) return 0;

      let count = 0;
      for (const u of users) {
        if (!u.email || !u.passwordHash) continue;
        await User.findOneAndUpdate(
          { email: u.email.toLowerCase() },
          {
            username: u.username,
            email: u.email.toLowerCase(),
            passwordHash: u.passwordHash,
            role: u.role || 'student',
            fullName: u.fullName || u.username,
            studentId: u.studentId || '',
            avatarUrl: u.avatarUrl || '',
            status: u.status || 'active',
            questionsQuota: u.questionsQuota ?? 30,
            questionsUsed: u.questionsUsed ?? 0,
            quotaResetDate: u.quotaResetDate ? new Date(u.quotaResetDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          },
          { upsert: true, new: true }
        );
        count++;
      }
      console.log(`🔄 [Persistence] Đã khôi phục thành công ${count} tài khoản từ ổ cứng.`);
      return count;
    } catch (err) {
      console.error('❌ [Persistence] Lỗi khôi phục tài khoản:', err);
      return 0;
    }
  }
}
