import fs from 'fs';
import path from 'path';
import { User, IUser } from '../models/User.js';
import { QueryHistory, IQueryHistory } from '../models/QueryHistory.js';

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

export interface IPersistedHistory {
  _id?: string;
  userId?: string;
  userEmail: string;
  query: string;
  intentCode: string;
  response: string;
  activityType?: 'solver' | 'review' | 'search';
  isBookmarked?: boolean;
  bookmarkNote?: string;
  bookmarkedAt?: string;
  reviewMetadata?: any;
  baremAnalysis?: any;
  citations?: Array<{
    rawText: string;
    lawCode: string;
    articleNumber: number;
    clauseNumber?: number;
    verified: boolean;
    lawTitle?: string;
  }>;
  verifiedCitationsCount?: number;
  tier?: string;
  latencyMs?: number;
  createdAt: string;
}

export class PersistenceService {
  private static getUserFilePath(): string {
    const candidates = [
      path.resolve(process.cwd(), '../data/persisted_users.json'),
      path.resolve(process.cwd(), 'data/persisted_users.json'),
      path.resolve(__dirname, '../../../data/persisted_users.json')
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    const defaultPath = candidates[0];
    const dir = path.dirname(defaultPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return defaultPath;
  }

  private static getHistoryFilePath(): string {
    const candidates = [
      path.resolve(process.cwd(), '../data/persisted_history.json'),
      path.resolve(process.cwd(), 'data/persisted_history.json'),
      path.resolve(__dirname, '../../../data/persisted_history.json')
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    const defaultPath = candidates[0];
    const dir = path.dirname(defaultPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return defaultPath;
  }

  // ================= USERS PERSISTENCE =================
  public static loadPersistedUsers(): IPersistedUser[] {
    try {
      const p = this.getUserFilePath();
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
      const p = this.getUserFilePath();
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

  // ================= QUERY HISTORY PERSISTENCE =================
  public static loadPersistedHistory(): IPersistedHistory[] {
    try {
      const p = this.getHistoryFilePath();
      if (!fs.existsSync(p)) return [];
      const raw = fs.readFileSync(p, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.warn('⚠️ [Persistence] Lỗi đọc persisted_history.json:', err);
      return [];
    }
  }

  public static saveHistory(item: Partial<IQueryHistory> & { userEmail: string; query: string }): void {
    try {
      const p = this.getHistoryFilePath();
      const list = this.loadPersistedHistory();

      const record: IPersistedHistory = {
        _id: item._id ? item._id.toString() : 'hist_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        userId: item.userId ? item.userId.toString() : undefined,
        userEmail: item.userEmail.toLowerCase(),
        query: item.query,
        intentCode: item.intentCode || 'GENERAL_THEORY',
        response: item.response || '',
        activityType: item.activityType || 'solver',
        isBookmarked: !!item.isBookmarked,
        bookmarkNote: item.bookmarkNote || '',
        bookmarkedAt: item.bookmarkedAt ? new Date(item.bookmarkedAt).toISOString() : undefined,
        reviewMetadata: item.reviewMetadata,
        baremAnalysis: item.baremAnalysis,
        citations: item.citations || [],
        verifiedCitationsCount: item.verifiedCitationsCount || 0,
        tier: item.tier || 'Tier 4 - Fine-tuned LoRA',
        latencyMs: item.latencyMs || 250,
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString()
      };

      // Tìm xem bản ghi đã tồn tại chưa (dựa theo _id hoặc query cùng user trong vòng 5 giây)
      const existingIdx = list.findIndex(
        (x) =>
          (record._id && x._id === record._id) ||
          (x.userEmail === record.userEmail &&
            x.query === record.query &&
            Math.abs(new Date(x.createdAt).getTime() - new Date(record.createdAt).getTime()) < 10000)
      );

      if (existingIdx !== -1) {
        list[existingIdx] = { ...list[existingIdx], ...record };
      } else {
        list.unshift(record);
      }

      // Giữ tối đa 1000 bản ghi lịch sử bền vững
      if (list.length > 1000) {
        list.length = 1000;
      }

      fs.writeFileSync(p, JSON.stringify(list, null, 2), 'utf-8');
      console.log(`💾 [Persistence] Đã lưu lịch sử hỏi đáp của ${record.userEmail} vào ổ cứng (${list.length} mục).`);
    } catch (err) {
      console.error('❌ [Persistence] Lỗi lưu history vào disk:', err);
    }
  }

  public static clearHistory(userEmail?: string, userId?: string): void {
    try {
      const p = this.getHistoryFilePath();
      let list = this.loadPersistedHistory();
      if (!userEmail && !userId) return;

      list = list.filter((x) => {
        if (userEmail && x.userEmail.toLowerCase() === userEmail.toLowerCase()) return false;
        if (userId && x.userId === userId) return false;
        return true;
      });

      fs.writeFileSync(p, JSON.stringify(list, null, 2), 'utf-8');
      console.log(`🗑️ [Persistence] Đã xóa lịch sử của user ${userEmail || userId} khỏi ổ cứng.`);
    } catch (err) {
      console.error('❌ [Persistence] Lỗi xóa history từ disk:', err);
    }
  }

  public static updateBookmark(id: string, isBookmarked: boolean, bookmarkNote?: string): void {
    try {
      const p = this.getHistoryFilePath();
      const list = this.loadPersistedHistory();
      const target = list.find((x) => x._id === id);
      if (target) {
        target.isBookmarked = isBookmarked;
        target.bookmarkNote = bookmarkNote;
        target.bookmarkedAt = isBookmarked ? new Date().toISOString() : undefined;
        fs.writeFileSync(p, JSON.stringify(list, null, 2), 'utf-8');
      }
    } catch (err) {
      console.error('❌ [Persistence] Lỗi update bookmark trong disk:', err);
    }
  }

  public static async restoreAllHistory(): Promise<number> {
    try {
      const list = this.loadPersistedHistory();
      if (list.length === 0) return 0;

      let count = 0;
      for (const item of list) {
        if (!item.userEmail || !item.query || !item.response) continue;

        // Tìm user tương ứng để lấy ObjectId hiện tại trong MongoMemoryServer
        const user = await User.findOne({ email: item.userEmail.toLowerCase() });
        const currentUserId = user?._id || item.userId;

        if (!currentUserId) continue;

        await QueryHistory.findOneAndUpdate(
          {
            userEmail: item.userEmail.toLowerCase(),
            query: item.query
          },
          {
            userId: currentUserId,
            userEmail: item.userEmail.toLowerCase(),
            query: item.query,
            intentCode: item.intentCode || 'GENERAL_THEORY',
            response: item.response,
            activityType: item.activityType || 'solver',
            isBookmarked: !!item.isBookmarked,
            bookmarkNote: item.bookmarkNote || '',
            bookmarkedAt: item.bookmarkedAt ? new Date(item.bookmarkedAt) : undefined,
            reviewMetadata: item.reviewMetadata,
            baremAnalysis: item.baremAnalysis,
            citations: item.citations || [],
            verifiedCitationsCount: item.verifiedCitationsCount || 0,
            tier: item.tier || 'Tier 4 - Fine-tuned LoRA',
            latencyMs: item.latencyMs || 250,
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
          },
          { upsert: true, new: true }
        );
        count++;
      }
      console.log(`🔄 [Persistence] Đã khôi phục thành công ${count} mục lịch sử hỏi đáp từ ổ cứng.`);
      return count;
    } catch (err) {
      console.error('❌ [Persistence] Lỗi khôi phục history:', err);
      return 0;
    }
  }
}
