import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { config } from '../config/env.js';
import { MailService } from '../services/mailService.js';
import { getDefaultNewUserQuota } from './adminController.js';
import { PersistenceService } from '../services/persistenceService.js';

export class AuthController {
  // 1. Đăng ký tài khoản (hỗ trợ phân quyền role)
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password, fullName, studentId, role } = req.body;

      if (!username || !email || !password || !fullName) {
        res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các thông tin bắt buộc.' });
        return;
      }

      const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
      if (existingUser) {
        res.status(400).json({ success: false, message: 'Tên đăng nhập hoặc Email đã tồn tại trong hệ thống.' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Phân quyền: Mặc định là student, hỗ trợ moderator hoặc admin
      const assignedRole = ['student', 'moderator', 'admin'].includes(role) ? role : 'student';

      const newUser = await User.create({
        username,
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        studentId,
        role: assignedRole,
        status: 'active',
        questionsQuota: getDefaultNewUserQuota()
      });

      // Lưu vĩnh viễn vào ổ cứng để không bị mất khi server khởi động lại
      PersistenceService.saveUser(newUser);

      const token = jwt.sign(
        {
          id: newUser._id.toString(),
          email: newUser.email,
          username: newUser.username,
          role: newUser.role,
          fullName: newUser.fullName
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn as any }
      );

      res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản thành công.',
        token,
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          fullName: newUser.fullName,
          studentId: newUser.studentId,
          questionsQuota: newUser.questionsQuota ?? 30,
          questionsUsed: newUser.questionsUsed ?? 0,
          remainingQuestions: Math.max(0, (newUser.questionsQuota ?? 30) - (newUser.questionsUsed ?? 0)),
          quotaResetDate: newUser.quotaResetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Lỗi khi đăng ký tài khoản.' });
    }
  }

  // 2. Đăng nhập
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { emailOrUsername, password } = req.body;
      if (!emailOrUsername || !password) {
        res.status(400).json({ success: false, message: 'Vui lòng nhập tài khoản và mật khẩu.' });
        return;
      }

      const user = await User.findOne({
        $or: [{ email: emailOrUsername.toLowerCase() }, { username: emailOrUsername }]
      });

      if (!user) {
        res.status(401).json({ success: false, message: 'Email hoặc tên đăng nhập không chính xác.' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Mật khẩu không chính xác.' });
        return;
      }

      if (user.status === 'locked') {
        res.status(403).json({
          success: false,
          message: `Tài khoản của bạn đã bị tạm khóa. Lý do: ${user.lockReason || 'Vi phạm điều khoản cộng đồng'}. Vui lòng liên hệ Hotline 0366 015 348 để được hỗ trợ mở khóa.`
        });
        return;
      }

      const token = jwt.sign(
        {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          role: user.role,
          fullName: user.fullName
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn as any }
      );

      res.json({
        success: true,
        message: 'Đăng nhập thành công.',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status || 'active',
          fullName: user.fullName,
          studentId: user.studentId,
          questionsQuota: user.questionsQuota ?? 30,
          questionsUsed: user.questionsUsed ?? 0,
          remainingQuestions: Math.max(0, (user.questionsQuota ?? 30) - (user.questionsUsed ?? 0)),
          quotaResetDate: user.quotaResetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Lỗi khi đăng nhập.' });
    }
  }

  // 2b. Đăng nhập bằng tài khoản Google
  public static async googleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { email, fullName, googleId, avatarUrl } = req.body;

      if (!email) {
        res.status(400).json({ success: false, message: 'Vui lòng cung cấp địa chỉ email Google.' });
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();
      let user = await User.findOne({
        $or: [
          { email: normalizedEmail },
          ...(googleId ? [{ googleId }] : [])
        ]
      });

      if (user) {
        // Kiểm tra xem tài khoản có bị khóa không
        if (user.status === 'locked') {
          res.status(403).json({
            success: false,
            message: `Tài khoản của bạn đã bị tạm khóa. Lý do: ${user.lockReason || 'Vi phạm điều khoản'}. Vui lòng liên hệ Hotline 0366 015 348 để được hỗ trợ mở khóa.`
          });
          return;
        }

        // Cập nhật googleId và avatarUrl nếu có
        let isModified = false;
        if (googleId && !user.googleId) {
          user.googleId = googleId;
          isModified = true;
        }
        if (avatarUrl && (!user.avatarUrl || user.avatarUrl.includes('dicebear'))) {
          user.avatarUrl = avatarUrl;
          isModified = true;
        }
        if (isModified) {
          await user.save();
          PersistenceService.saveUser(user);
        }
      } else {
        // Tạo tài khoản mới từ Google Login
        const baseUsername = normalizedEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'google_user';
        let uniqueUsername = baseUsername;
        let suffix = 1;
        while (await User.findOne({ username: uniqueUsername })) {
          uniqueUsername = `${baseUsername}${suffix++}`;
        }

        const randomPassword = Math.random().toString(36).slice(-8) + 'VLaw#2026';
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(randomPassword, salt);

        const displayName = fullName || normalizedEmail.split('@')[0];
        const defaultAvatar = avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`;

        user = await User.create({
          username: uniqueUsername,
          email: normalizedEmail,
          passwordHash,
          fullName: displayName,
          role: 'student',
          status: 'active',
          avatarUrl: defaultAvatar,
          googleId: googleId || `g_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          authProvider: 'google',
          questionsQuota: getDefaultNewUserQuota(),
          questionsUsed: 0
        });

        PersistenceService.saveUser(user);
      }

      const token = jwt.sign(
        {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          role: user.role,
          fullName: user.fullName
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn as any }
      );

      res.json({
        success: true,
        message: `Đăng nhập Google thành công! Chào mừng ${user.fullName}.`,
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status || 'active',
          fullName: user.fullName,
          studentId: user.studentId,
          avatarUrl: user.avatarUrl,
          questionsQuota: user.questionsQuota ?? 30,
          questionsUsed: user.questionsUsed ?? 0,
          remainingQuestions: Math.max(0, (user.questionsQuota ?? 30) - (user.questionsUsed ?? 0)),
          quotaResetDate: user.quotaResetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
    } catch (err: any) {
      console.error('Google login error:', err);
      res.status(500).json({ success: false, message: err.message || 'Lỗi xử lý đăng nhập Google.' });
    }
  }

  // 3. Lấy thông tin tài khoản hiện tại
  public static async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
        return;
      }

      const user = await User.findById(req.user.id).select('-passwordHash');
      if (!user) {
        res.status(404).json({ success: false, message: 'Không tìm thấy thông tin người dùng.' });
        return;
      }

      res.json({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          studentId: user.studentId,
          questionsQuota: user.questionsQuota ?? 30,
          questionsUsed: user.questionsUsed ?? 0,
          remainingQuestions: Math.max(0, (user.questionsQuota ?? 30) - (user.questionsUsed ?? 0)),
          quotaResetDate: user.quotaResetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // 4. Bước 1 Quên mật khẩu: Gửi mã OTP từ nhatpham.241105@gmail.com
  public static async sendForgotOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ success: false, message: 'Vui lòng cung cấp địa chỉ email hoặc tên đăng nhập.' });
        return;
      }

      const user = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username: email }]
      });
      if (!user) {
        res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản tương ứng với email hoặc tên đăng nhập này.' });
        return;
      }

      const targetEmail = user.email;
      const otp = MailService.generateOtp(targetEmail);
      const mailResult = await MailService.sendOtpEmail(targetEmail, otp, 'RESET_PASSWORD');

      if (!mailResult.success) {
        res.status(400).json({
          success: false,
          targetEmail,
          sourceEmail: config.smtp.user,
          message: mailResult.message
        });
        return;
      }

      res.json({
        success: true,
        targetEmail,
        sourceEmail: config.smtp.user,
        message: mailResult.message,
        realSent: (mailResult as any).realSent
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Lỗi khi gửi mã OTP.' });
    }
  }

  // 5. Bước 2 Quên mật khẩu: Xác thực OTP và Đổi mật khẩu mới
  public static async verifyOtpAndReset(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp, newPassword } = req.body;
      if (!email || !otp || !newPassword) {
        res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ email/tài khoản, mã OTP và mật khẩu mới.' });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
        return;
      }

      const user = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username: email }]
      });
      if (!user) {
        res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản người dùng.' });
        return;
      }

      const isOtpValid = MailService.verifyOtp(user.email, otp);
      if (!isOtpValid) {
        res.status(400).json({ success: false, message: 'Mã OTP không chính xác hoặc đã hết hạn (quá 10 phút).' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      await user.save();
      PersistenceService.saveUser(user);

      res.json({
        success: true,
        message: 'Đổi mật khẩu thành công! Bạn có thể sử dụng mật khẩu mới để đăng nhập ngay bây giờ.'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Lỗi khi cập nhật mật khẩu.' });
    }
  }

  // 6. Cập nhật hồ sơ cá nhân (Họ tên, Email, Ảnh đại diện)
  public static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập.' });
        return;
      }

      const { fullName, email, avatarUrl } = req.body;
      const user = await User.findById(req.user.id);
      if (!user) {
        res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        return;
      }

      if (email && email.toLowerCase() !== user.email.toLowerCase()) {
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing && existing._id.toString() !== user._id.toString()) {
          res.status(400).json({ success: false, message: 'Email này đã được sử dụng bởi tài khoản khác.' });
          return;
        }
        user.email = email.toLowerCase().trim();
      }

      if (fullName && typeof fullName === 'string') {
        user.fullName = fullName.trim();
      }

      if (avatarUrl !== undefined) {
        user.avatarUrl = avatarUrl;
      }

      await user.save();
      PersistenceService.saveUser(user);

      res.json({
        success: true,
        message: 'Cập nhật hồ sơ cá nhân thành công.',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          studentId: user.studentId,
          avatarUrl: user.avatarUrl,
          questionsQuota: user.questionsQuota ?? 30,
          questionsUsed: user.questionsUsed ?? 0,
          remainingQuestions: Math.max(0, (user.questionsQuota ?? 30) - (user.questionsUsed ?? 0)),
          quotaResetDate: user.quotaResetDate
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Lỗi khi cập nhật hồ sơ.' });
    }
  }

  // 7. Đổi mật khẩu đăng nhập (Không cần hỏi lại username/email vì đã xác thực token)
  public static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập.' });
        return;
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.' });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ success: false, message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' });
        return;
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản người dùng.' });
        return;
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác.' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      await user.save();
      PersistenceService.saveUser(user);

      res.json({
        success: true,
        message: 'Đổi mật khẩu thành công! Mật khẩu mới đã được lưu an toàn.'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Lỗi khi đổi mật khẩu.' });
    }
  }
}
