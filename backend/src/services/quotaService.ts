import mongoose from 'mongoose';
import { User, IUser } from '../models/User.js';
import { PersistenceService } from './persistenceService.js';

const VN_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7 (Asia/Ho_Chi_Minh)
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export class QuotaService {
  /**
   * Tính mốc 07:00:00 sáng Thứ 2 tiếp theo theo giờ Việt Nam (UTC+7).
   * - Nếu hiện tại là Thứ 2 nhưng trước 07:00 sáng -> trả về 07:00 sáng Thứ 2 hôm nay.
   * - Nếu hiện tại là Thứ 2 từ 07:00 sáng trở đi (hoặc các ngày khác trong tuần) -> trả về 07:00 sáng Thứ 2 tuần kế tiếp.
   */
  public static getNextMonday7AM(fromDate: Date = new Date()): Date {
    const vnNow = new Date(fromDate.getTime() + VN_OFFSET_MS);
    const vnDay = vnNow.getUTCDay(); // 0 = Chủ Nhật, 1 = Thứ 2, ..., 6 = Thứ 7

    const today7AMVnMs = Date.UTC(
      vnNow.getUTCFullYear(),
      vnNow.getUTCMonth(),
      vnNow.getUTCDate(),
      7,
      0,
      0,
      0
    );

    let daysUntilMonday: number;
    if (vnDay === 1) {
      daysUntilMonday = vnNow.getTime() < today7AMVnMs ? 0 : 7;
    } else {
      daysUntilMonday = (8 - vnDay) % 7;
    }

    const targetVnMs = today7AMVnMs + daysUntilMonday * ONE_DAY_MS;
    return new Date(targetVnMs - VN_OFFSET_MS);
  }

  /**
   * Tìm người dùng an toàn ngay cả khi MongoMemoryServer khởi động lại làm đổi ObjectId (_id),
   * tự động fallback theo email hoặc username trong JWT.
   */
  public static async findAuthUser(authPayload?: {
    id?: string;
    email?: string;
    username?: string;
  }): Promise<IUser | null> {
    if (!authPayload) return null;

    if (authPayload.id && mongoose.isValidObjectId(authPayload.id)) {
      const byId = await User.findById(authPayload.id);
      if (byId) return byId;
    }

    if (authPayload.email) {
      const byEmail = await User.findOne({ email: authPayload.email.toLowerCase().trim() });
      if (byEmail) return byEmail;
    }

    if (authPayload.username) {
      const byUsername = await User.findOne({ username: authPayload.username });
      if (byUsername) return byUsername;
    }

    return null;
  }

  /**
   * Kiểm tra và làm mới hạn mức câu hỏi NẾU VÀ CHỈ NẾU đã bước qua mốc 07:00 sáng Thứ 2.
   * Tuyệt đối KHÔNG làm mới khi đăng xuất / đăng nhập trong tuần.
   */
  public static async ensureWeeklyQuotaCycle(
    user: IUser,
    autoResetEnabled = true,
    defaultQuota = 30,
    now: Date = new Date()
  ): Promise<IUser> {
    let changed = false;

    if (!user.quotaResetDate || isNaN(new Date(user.quotaResetDate).getTime())) {
      user.quotaResetDate = this.getNextMonday7AM(now);
      changed = true;
    } else if (now.getTime() >= new Date(user.quotaResetDate).getTime()) {
      if (autoResetEnabled && user.role !== 'admin') {
        user.questionsUsed = 0;
        if (user.questionsQuota === undefined || user.questionsQuota === null) {
          user.questionsQuota = defaultQuota;
        }
      }
      user.quotaResetDate = this.getNextMonday7AM(now);
      changed = true;
    }

    if (changed) {
      await user.save();
      PersistenceService.saveUser(user);
    }

    return user;
  }

  /**
   * Tính toán thông tin hạn mức chuẩn trả về cho Frontend.
   * Admin luôn có đặc quyền hỏi không giới hạn (isUnlimited = true).
   */
  public static computeQuotaPayload(user: IUser, defaultQuota = 30) {
    const isUnlimited = user.role === 'admin';
    const questionsQuota = user.questionsQuota ?? defaultQuota;
    const questionsUsed = user.questionsUsed ?? 0;
    const remainingQuestions = isUnlimited
      ? 999999
      : Math.max(0, questionsQuota - questionsUsed);
    const quotaResetDate = user.quotaResetDate || this.getNextMonday7AM();

    return {
      isUnlimited,
      questionsQuota,
      questionsUsed,
      remainingQuestions,
      quotaResetDate
    };
  }

  /**
   * Quét toàn bộ tài khoản đến kỳ 07:00 sáng Thứ 2 để tự động làm mới.
   */
  public static async runWeeklyQuotaResetSweep(
    autoResetEnabled = true,
    defaultQuota = 30
  ): Promise<number> {
    const now = new Date();
    const dueUsers = await User.find({
      $or: [
        { quotaResetDate: { $lte: now } },
        { quotaResetDate: { $exists: false } }
      ]
    });

    let resetCount = 0;
    for (const u of dueUsers) {
      await this.ensureWeeklyQuotaCycle(u, autoResetEnabled, defaultQuota, now);
      resetCount++;
    }

    if (resetCount > 0) {
      console.log(
        `🔄 [QuotaScheduler] Đã cập nhật chu kỳ làm mới 07:00 sáng Thứ 2 cho ${resetCount} tài khoản.`
      );
    }
    return resetCount;
  }

  private static schedulerTimer: NodeJS.Timeout | null = null;

  public static startWeeklyQuotaScheduler(
    getConfig: () => { autoReset: boolean; defaultQuota: number }
  ): void {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
    }

    const tick = () => {
      const { autoReset, defaultQuota } = getConfig();
      this.runWeeklyQuotaResetSweep(autoReset, defaultQuota).catch((err) => {
        console.warn('⚠️ [QuotaScheduler] Lỗi khi quét làm mới quota định kỳ:', err);
      });
    };

    // Chạy kiểm tra ngay khi khởi động và lặp lại mỗi 60 giây
    tick();
    this.schedulerTimer = setInterval(tick, 60 * 1000);
    if (this.schedulerTimer.unref) {
      this.schedulerTimer.unref();
    }
  }
}
