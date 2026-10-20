import { Request, Response } from 'express';
import { SystemSetting, ISystemSetting } from '../models/SystemSetting.js';
import { PartnerApiKey } from '../models/PartnerApiKey.js';
import { Transaction } from '../models/Transaction.js';
import crypto from 'crypto';

const DEFAULT_SETTINGS = {
  autoCrawl: {
    enabled: true,
    frequency: 'weekly' as const,
    executionTime: '02:00',
    maxDocsPerCrawl: 50,
    retryAttempts: 3
  },
  pricingPlans: [
    {
      id: 'basic',
      name: 'Gói Sinh viên Cơ bản',
      price: 0,
      questionsLimit: 30,
      durationDays: 30,
      status: 'active' as const,
      description: 'Miễn phí hàng tháng cho mọi sinh viên. Hỗ trợ giải bài tập và tra cứu barem cơ bản.',
      badge: 'Miễn phí'
    },
    {
      id: 'pro',
      name: 'Gói Cử nhân Nâng cao',
      price: 49000,
      questionsLimit: 60,
      durationDays: 30,
      status: 'active' as const,
      description: 'Phù hợp mùa ôn thi cao điểm. Tăng gấp đôi hạn mức và hỗ trợ rà soát hợp đồng thực tế.',
      badge: 'Phổ biến nhất'
    },
    {
      id: 'vip',
      name: 'Gói Luật sư Master (VIP)',
      price: 99000,
      questionsLimit: 150,
      durationDays: 30,
      status: 'active' as const,
      description: 'Tốc độ phản hồi ưu tiên GPU Dedicated, mở rộng kho đề thi môn PLDC và tư vấn chuyên sâu.',
      badge: 'Chuyên gia'
    }
  ],
  contactSupport: {
    hotline: '0366 015 348',
    email: 'hotro@vietlaw.ai',
    workHours: '08:00 - 21:00 (Thứ 2 - Chủ Nhật)',
    copyright: '© 2026 Chatbot Hỗ Trợ Pháp Luật Đại Cương — Barem Chuẩn Điểm 10',
    disclaimer: 'Hệ thống hỗ trợ học tập và ôn thi môn Pháp luật đại cương, không thay thế các văn bản quy phạm pháp luật gốc.'
  }
};

async function ensureSettings(): Promise<ISystemSetting> {
  let setting = await SystemSetting.findOne();
  if (!setting) {
    setting = await SystemSetting.create(DEFAULT_SETTINGS);
  }
  return setting;
}

async function ensurePartnerApiKeys() {
  const count = await PartnerApiKey.countDocuments();
  if (count === 0) {
    await PartnerApiKey.create([
      {
        name: 'Khoa Luật — Trường Đại học Bách Khoa (Đà Nẵng)',
        key: 'vlaw_live_dut_law_faculty_9a8b7c6d5e4f3a2b1c',
        partnerType: 'Trường Đại học',
        rateLimitRpm: 180,
        status: 'active',
        requestsUsed: 4210,
        monthlyLimit: 15000,
        contactEmail: 'khoaluat@dut.udn.vn',
        lastUsedAt: new Date(Date.now() - 25 * 60 * 1000)
      },
      {
        name: 'Viện Pháp lý & Tư vấn Doanh nghiệp Số',
        key: 'vlaw_live_corp_legal_consult_4f3e2d1c0b9a8f7e6d',
        partnerType: 'Doanh nghiệp Tư vấn',
        rateLimitRpm: 120,
        status: 'active',
        requestsUsed: 1850,
        monthlyLimit: 10000,
        contactEmail: 'api@phaplyso.vn',
        lastUsedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        name: 'Cổng Dịch vụ Công Trực tuyến Tích hợp',
        key: 'vlaw_live_gov_portal_integration_1a2b3c4d5e6f7a8b9c',
        partnerType: 'Cơ quan Nhà nước',
        rateLimitRpm: 300,
        status: 'active',
        requestsUsed: 8940,
        monthlyLimit: 50000,
        contactEmail: 'kythuat@dichvucong.gov.vn',
        lastUsedAt: new Date(Date.now() - 5 * 60 * 1000)
      }
    ]);
  }
}

export class SystemSettingsController {
  // 1. Lấy cấu hình hệ thống
  public static async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const setting = await ensureSettings();
      res.json({ success: true, settings: setting });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // 2. Cập nhật cấu hình hệ thống
  public static async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const { autoCrawl, pricingPlans, contactSupport } = req.body;
      const setting = await ensureSettings();

      if (autoCrawl) setting.autoCrawl = { ...setting.autoCrawl, ...autoCrawl };
      if (pricingPlans && Array.isArray(pricingPlans)) setting.pricingPlans = pricingPlans;
      if (contactSupport) setting.contactSupport = { ...setting.contactSupport, ...contactSupport };

      await setting.save();

      res.json({
        success: true,
        message: 'Đã lưu cấu hình hệ thống và dịch vụ gói cước thành công.',
        settings: setting
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // 3. Tra cứu toàn bộ lịch sử giao dịch và doanh thu
  public static async getAllTransactions(req: Request, res: Response): Promise<void> {
    try {
      const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(100);

      // Thống kê doanh thu
      let totalRevenue = 0;
      let completedCount = 0;
      let totalCount = transactions.length;

      transactions.forEach((tx) => {
        if (tx.status === 'completed') {
          totalRevenue += tx.amount || 0;
          completedCount++;
        }
      });

      res.json({
        success: true,
        summary: {
          totalRevenue,
          completedCount,
          totalCount,
          successRate: totalCount > 0 ? Number(((completedCount / totalCount) * 100).toFixed(1)) : 100
        },
        transactions
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // 4. Lấy danh sách API Key
  public static async getPartnerApiKeys(req: Request, res: Response): Promise<void> {
    try {
      await ensurePartnerApiKeys();
      const keys = await PartnerApiKey.find().sort({ createdAt: -1 });
      res.json({ success: true, count: keys.length, apiKeys: keys });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // 5. Cấp mới API Key
  public static async createPartnerApiKey(req: Request, res: Response): Promise<void> {
    try {
      const { name, partnerType, rateLimitRpm, contactEmail, monthlyLimit } = req.body;

      if (!name || !contactEmail) {
        res.status(400).json({ success: false, message: 'Tên đối tác và email liên hệ là bắt buộc.' });
        return;
      }

      const rawKey = `vlaw_live_${crypto.randomBytes(16).toString('hex')}`;
      const newKey = await PartnerApiKey.create({
        name,
        key: rawKey,
        partnerType: partnerType || 'Doanh nghiệp / Trường học',
        rateLimitRpm: Number(rateLimitRpm) || 120,
        monthlyLimit: Number(monthlyLimit) || 10000,
        contactEmail,
        status: 'active'
      });

      res.status(201).json({
        success: true,
        message: `Đã cấp khóa API thành công cho đối tác "${name}".`,
        apiKey: newKey
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // 6. Thu hồi / Kích hoạt lại API Key
  public static async togglePartnerApiKey(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const keyDoc = await PartnerApiKey.findById(id);

      if (!keyDoc) {
        res.status(404).json({ success: false, message: 'Không tìm thấy API Key.' });
        return;
      }

      keyDoc.status = keyDoc.status === 'active' ? 'revoked' : 'active';
      await keyDoc.save();

      res.json({
        success: true,
        message: `Đã ${keyDoc.status === 'active' ? 'kích hoạt lại' : 'thu hồi'} khóa API của "${keyDoc.name}".`,
        apiKey: keyDoc
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
