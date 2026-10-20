import { Request, Response } from 'express';
import { Transaction } from '../models/Transaction.js';
import { User } from '../models/User.js';

export class TransactionController {
  /**
   * Lấy danh sách giao dịch & hóa đơn của người dùng
   */
  public static async getTransactions(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập.' });
        return;
      }

      let transactions = await Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 });

      // Nếu người dùng chưa có giao dịch nào, tự động tạo hóa đơn chào mừng miễn phí
      if (transactions.length === 0) {
        const welcomeTxn = await Transaction.create({
          userId: req.user.id,
          userEmail: req.user.email,
          transactionCode: `INV-${Date.now().toString().slice(-6)}-INIT`,
          planName: 'Gói Sinh viên Cơ bản (30 câu hỏi / tháng)',
          amount: 0,
          currency: 'VNĐ',
          paymentMethod: 'Cấp phát hệ thống (Miễn phí)',
          status: 'completed',
          description: 'Kích hoạt hạn mức 30 câu hỏi ôn tập & tra cứu chuẩn Barem Điểm 10',
          billingCycle: 'Chu kỳ tháng',
          questionsAdded: 30
        });
        transactions = [welcomeTxn];
      }

      res.json({
        success: true,
        transactions
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Lỗi khi lấy lịch sử giao dịch.' });
    }
  }

  /**
   * Tạo giao dịch nạp tiền hoặc nâng cấp gói dịch vụ
   */
  public static async createUpgradeTransaction(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập.' });
        return;
      }

      const { planType, paymentMethod } = req.body;

      let planName = 'Gói Cử nhân VIP (100 câu hỏi ôn thi)';
      let amount = 99000;
      let questionsToAdd = 100;

      if (planType === 'unlimited') {
        planName = 'Gói Không giới hạn (Luyện thi Điểm 10 toàn diện)';
        amount = 199000;
        questionsToAdd = 500;
      } else if (planType === 'booster') {
        planName = 'Gói Bổ sung Lượt hỏi (+50 câu)';
        amount = 49000;
        questionsToAdd = 50;
      }

      const txnCode = `INV-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newTxn = await Transaction.create({
        userId: req.user.id,
        userEmail: req.user.email,
        transactionCode: txnCode,
        planName,
        amount,
        currency: 'VNĐ',
        paymentMethod: paymentMethod || 'Chuyển khoản QR Napas 24/7',
        status: 'completed',
        description: `Thanh toán thành công ${planName}. Hệ thống đã cộng thêm ${questionsToAdd} câu hỏi vào tài khoản.`,
        billingCycle: 'Gia hạn 30 ngày',
        questionsAdded: questionsToAdd
      });

      // Cập nhật hạn mức câu hỏi cho người dùng
      const user = await User.findById(req.user.id);
      if (user) {
        user.questionsQuota = (user.questionsQuota ?? 30) + questionsToAdd;
        await user.save();
      }

      res.json({
        success: true,
        message: `Nâng cấp thành công ${planName}!`,
        transaction: newTxn,
        updatedQuota: user?.questionsQuota
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Lỗi khi thực hiện giao dịch.' });
    }
  }
}
