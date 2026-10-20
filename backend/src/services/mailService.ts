import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { config } from '../config/env.js';

interface OtpEntry {
  otp: string;
  expiresAt: number;
}

// In-memory OTP storage with TTL
const otpStore = new Map<string, OtpEntry>();

export class MailService {
  private static transporter: Transporter | null = null;

  private static reloadEnvPass(): string {
    try {
      const envCandidates = [
        path.resolve(process.cwd(), '../.env'),
        path.resolve(process.cwd(), '.env'),
        path.resolve(__dirname, '../../../.env')
      ];
      for (const p of envCandidates) {
        if (fs.existsSync(p)) {
          const content = fs.readFileSync(p, 'utf-8');
          const m = content.match(/^SMTP_PASS=(.*)$/m);
          if (m && m[1] && m[1].trim()) {
            process.env.SMTP_PASS = m[1].trim();
            return m[1].trim();
          }
        }
      }
    } catch (_) {}
    return process.env.SMTP_PASS || config.smtp.pass || '';
  }

  private static getTransporter(): Transporter {
    const rawPass = this.reloadEnvPass();
    const cleanPass = rawPass.trim().replace(/\s+/g, '');
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.smtp.user,
        pass: cleanPass
      }
    });
  }

  // Generate 6-digit numeric OTP
  public static generateOtp(email: string): string {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    otpStore.set(email.toLowerCase(), { otp, expiresAt });
    return otp;
  }

  // Verify OTP
  public static verifyOtp(email: string, inputOtp: string): boolean {
    const entry = otpStore.get(email.toLowerCase());
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return false;
    }
    const isValid = entry.otp === inputOtp.trim();
    if (isValid) {
      otpStore.delete(email.toLowerCase());
    }
    return isValid;
  }

  // Send OTP Email via nhatpham.241105@gmail.com
  public static async sendOtpEmail(toEmail: string, otp: string, purpose: 'RESET_PASSWORD' | 'REGISTER'): Promise<{ success: boolean; message: string; realSent?: boolean }> {
    const rawPass = this.reloadEnvPass();
    const cleanPass = rawPass.trim().replace(/\s+/g, '');

    if (!cleanPass) {
      console.warn(`⚠️ [SMTP Gmail] Chưa cấu hình SMTP_PASS trong file .env.`);
      return {
        success: false,
        realSent: false,
        message: `Hệ thống chưa có Mật khẩu ứng dụng (SMTP_PASS) của Gmail ${config.smtp.user} trong file .env. Vui lòng dán mật khẩu ứng dụng 16 ký tự vào .env để gửi email thật.`
      };
    }

    const subject = purpose === 'RESET_PASSWORD'
      ? '🔒 [VietLawAssist] Mã OTP Đặt lại Mật khẩu'
      : '✨ [VietLawAssist] Mã OTP Xác thực Tài khoản';

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #ef4444;">
          <div style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 4px 12px; border-radius: 8px; font-weight: bold; font-size: 14px; margin-bottom: 8px;">
            AI VIETLAW ASSIST
          </div>
          <h2 style="color: #0f172a; margin: 4px 0 0 0; font-size: 20px;">Trợ lý Học tập & Ôn thi Pháp luật Đại cương</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Đề tài PBL6 — Trường Đại học Bách Khoa, ĐH Đà Nẵng</p>
        </div>

        <div style="padding: 28px 12px; text-align: center;">
          <h3 style="color: #1e293b; font-size: 17px; margin-top: 0;">Mã OTP Đặt lại Mật khẩu của bạn</h3>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 12px 0 20px 0;">
            Hệ thống nhận được yêu cầu đổi mật khẩu cho tài khoản liên kết với email: <strong style="color: #0f172a;">${toEmail}</strong>.<br/>
            Email này được gửi trực tiếp từ hòm thư quản trị hệ thống: <span style="color: #ef4444; font-weight: 600;">${config.smtp.user}</span>.
          </p>

          <div style="margin: 24px auto; padding: 16px 36px; display: inline-block; background: #ef4444; color: #ffffff; border-radius: 12px; letter-spacing: 8px; font-size: 34px; font-weight: 800; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);">
            ${otp}
          </div>

          <p style="font-size: 13px; color: #64748b; margin-top: 20px; line-height: 1.5;">
            ⏱️ Mã OTP này có thời hạn sử dụng trong <strong>10 phút</strong>.<br/>
            🛡️ Vì lý do bảo mật, vui lòng không chia sẻ mã này cho bất kỳ ai khác.
          </p>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.6;">
          Thư gửi tự động từ máy chủ quản trị hệ thống VietLawAssist: <strong>${config.smtp.user}</strong>.<br/>
          Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.
        </div>
      </div>
    `;

    console.log(`\n======================================================`);
    console.log(`[EMAIL DISPATCH] Đang gửi từ: ${config.smtp.user} ➔ Tới: ${toEmail}...`);
    console.log(`======================================================\n`);

    try {
      const transporter = this.getTransporter();
      await transporter.sendMail({
        from: `"VietLawAssist System" <${config.smtp.user}>`,
        to: toEmail,
        subject,
        html: htmlContent
      });
      console.log(`✅ [SMTP Gmail] Đã gửi email thành công từ ${config.smtp.user} tới ${toEmail}`);
      return {
        success: true,
        realSent: true,
        message: `Mã OTP đã được gửi thành công từ hòm thư ${config.smtp.user} đến ${toEmail}. Vui lòng mở email để lấy mã xác thực.`
      };
    } catch (err: any) {
      console.error(`❌ [SMTP Gmail Error] Gửi mail thất bại: ${err.message}`);
      return {
        success: false,
        realSent: false,
        message: `Không thể gửi email từ Gmail (${err.message}). Vui lòng kiểm tra lại mật khẩu ứng dụng SMTP_PASS trong file .env.`
      };
    }
  }
}
