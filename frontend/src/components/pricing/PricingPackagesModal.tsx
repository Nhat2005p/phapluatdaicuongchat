import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Zap,
  Check,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Crown,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Button } from '../ui/Button';

interface PricingPackagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessUpgrade?: () => void;
}

export const PricingPackagesModal: React.FC<PricingPackagesModalProps> = ({
  isOpen,
  onClose,
  onSuccessUpgrade
}) => {
  const { user, remainingQuestions, totalQuestions, updateUser } = useAuth();
  const [tabType, setTabType] = useState<'per_query' | 'recurring'>('per_query');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleBuyPlan = async (planType: 'booster' | 'vip' | 'unlimited', planTitle: string) => {
    setIsProcessing(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.upgradePlan(planType, 'Chuyển khoản QR Napas 24/7');
      if (res.success && res.transaction) {
        setSuccessMsg(`Đăng ký thành công ${planTitle}! Bạn đã được cộng thêm câu hỏi.`);
        if (user && res.updatedQuota) {
          updateUser({
            ...user,
            questionsQuota: res.updatedQuota,
            remainingQuestions: Math.max(0, res.updatedQuota - (user.questionsUsed || 0))
          });
        }
        onSuccessUpgrade?.();
        setTimeout(() => {
          setSuccessMsg('');
        }, 3000);
      } else {
        setErrorMsg('Không thể xử lý giao dịch. Vui lòng thử lại sau.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ thanh toán.');
    } finally {
      setIsProcessing(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Main Card */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 z-10 my-auto text-slate-800 animate-modal-in max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-red-50/50 via-rose-50/30 to-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ec2227] text-white flex items-center justify-center shadow-md shadow-red-500/20">
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Gói dịch vụ & Bảng giá Trợ lý AI
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-[#ec2227]">
                  Ưu đãi sinh viên
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Xem danh sách, bảng giá và đăng ký mua các gói tài khoản (theo lượt hỏi hoặc theo tháng/năm)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alert Messages */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Current status bar */}
        <div className="mx-6 mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span>Hạn mức hiện tại:</span>
            <strong className="text-slate-900 font-bold">{remainingQuestions} / {totalQuestions} câu hỏi</strong>
            <span className="text-slate-400">•</span>
            <span className="text-emerald-600 font-semibold">Tự động làm mới 30 câu miễn phí mỗi tháng</span>
          </div>
        </div>

        {/* Package Toggle Tabs */}
        <div className="px-6 pt-4 flex items-center justify-center">
          <div className="p-1 bg-slate-100 rounded-xl flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => setTabType('per_query')}
              className={`px-4 py-2 rounded-lg transition-all ${
                tabType === 'per_query'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gói theo Lượt hỏi (Nạp câu hỏi)
            </button>
            <button
              onClick={() => setTabType('recurring')}
              className={`px-4 py-2 rounded-lg transition-all ${
                tabType === 'recurring'
                  ? 'bg-white text-[#ec2227] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gói Đăng ký Định kỳ (Theo Tháng / Năm)
            </button>
          </div>
        </div>

        {/* Packages Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {tabType === 'per_query' ? (
            /* Tab 1: Gói theo lượt hỏi */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Free Starter */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Gói Sinh viên Cơ bản
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-slate-900">0 đ</span>
                    <span className="text-xs text-slate-500">/tháng</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Miễn phí cố định hàng tháng cho toàn bộ sinh viên ôn tập môn Pháp luật đại cương.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>30 lượt hỏi đáp AI / tháng</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Giải đề chi tiết chuẩn Bộ GD&ĐT</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Tra cứu 20.000+ văn bản luật</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-400 block text-center">
                    Đang kích hoạt
                  </span>
                </div>
              </div>

              {/* Booster +50 queries */}
              <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/30 flex flex-col justify-between relative shadow-sm">
                <div>
                  <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block mb-1">
                    Gói Bổ sung Lượt hỏi
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-slate-900">49.000 đ</span>
                    <span className="text-xs text-slate-500">/lần nạp</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Nạp thêm lượt hỏi tức thì khi đang trong đợt cao điểm ôn thi giữa kỳ hoặc cuối kỳ.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-rose-600" />
                      <span><strong>+50 câu hỏi</strong> không giới hạn thời gian</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-rose-600" />
                      <span>Tốc độ phản hồi cực nhanh ~0.3s</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-rose-600" />
                      <span>Lưu hội thoại và xuất file PDF bài thi</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-5 pt-3 border-t border-rose-100">
                  <Button
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => handleBuyPlan('booster', 'Gói Bổ sung (+50 câu)')}
                    className="w-full bg-[#ec2227] hover:bg-[#d01c21] text-white text-xs font-bold"
                  >
                    {isProcessing ? 'Đang xử lý...' : 'Đăng ký nạp ngay'}
                  </Button>
                </div>
              </div>

              {/* VIP +100 queries */}
              <div className="p-5 rounded-2xl border-2 border-amber-400 bg-amber-50/30 flex flex-col justify-between relative shadow-md">
                <div className="absolute -top-3 right-4 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold uppercase tracking-wider">
                  Phổ biến nhất
                </div>
                <div>
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
                    Gói Cử nhân VIP
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-slate-900">99.000 đ</span>
                    <span className="text-xs text-slate-500">/lần nạp</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Lựa chọn tối ưu cho cả học kỳ, hỗ trợ trọn bộ giải đề thi và AI rà soát tài liệu.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-600 font-bold" />
                      <span><strong>+100 câu hỏi</strong> chuẩn Barem chuyên sâu</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-600" />
                      <span>AI Rà soát Hợp đồng & Tiểu luận pháp luật</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-600" />
                      <span>Xuất hóa đơn điện tử VAT hợp lệ</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-5 pt-3 border-t border-amber-200">
                  <Button
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => handleBuyPlan('vip', 'Gói Cử nhân VIP (+100 câu)')}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20"
                  >
                    {isProcessing ? 'Đang xử lý...' : 'Đăng ký gói VIP'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Gói định kỳ theo tháng / năm */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {/* Monthly Unlimited */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Gói Tháng Không Giới Hạn
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-slate-900">199.000 đ</span>
                    <span className="text-xs text-slate-500">/tháng</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Dành cho sinh viên ôn thi toàn diện hoặc làm khóa luận tốt nghiệp ngành Luật.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Hỏi đáp không giới hạn lượt (Fair use 500 câu/tháng)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Được cung cấp API Key tích hợp hệ sinh thái riêng</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Ưu tiên băng thông GPU cao nhất</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100">
                  <Button
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => handleBuyPlan('unlimited', 'Gói Tháng Không Giới Hạn')}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                  >
                    {isProcessing ? 'Đang xử lý...' : 'Đăng ký Gói Tháng'}
                  </Button>
                </div>
              </div>

              {/* Yearly Pro */}
              <div className="p-5 rounded-2xl border-2 border-red-500 bg-red-50/20 flex flex-col justify-between relative shadow-lg">
                <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-[#ec2227] text-white text-[10px] font-extrabold uppercase tracking-wider">
                  Tiết kiệm 40%
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#ec2227] uppercase tracking-wider block mb-1">
                    Gói Năm Toàn Khóa (12 Tháng)
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-slate-900">890.000 đ</span>
                    <span className="text-xs text-slate-500">/năm</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Đồng hành trọn vẹn suốt năm học, kèm hỗ trợ trực tiếp từ đội ngũ trợ giảng.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-red-600 font-bold" />
                      <span>Toàn bộ quyền lợi gói Không giới hạn trong 12 tháng</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-red-600 font-bold" />
                      <span>Đường dây nóng hỗ trợ 24/7 trực tiếp</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-red-600" />
                      <span>Cập nhật miễn phí các Bộ luật mới sửa đổi</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-5 pt-3 border-t border-red-200">
                  <Button
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => handleBuyPlan('unlimited', 'Gói Năm Toàn Khóa')}
                    className="w-full bg-[#ec2227] hover:bg-[#d01c21] text-white text-xs font-bold shadow-md shadow-red-500/20"
                  >
                    {isProcessing ? 'Đang xử lý...' : 'Đăng ký Gói Năm'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Methods & Guarantee */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Thanh toán an toàn qua QR Napas 24/7, MoMo, Visa/Mastercard. Kích hoạt tự động sau 3 giây.</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Đóng
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
