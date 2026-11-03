import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CreditCard,
  Package,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  Download,
  Printer,
  ChevronRight,
  ShieldCheck,
  Zap,
  Check
} from 'lucide-react';
import { TransactionItem } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user, remainingQuestions, totalQuestions, updateUser } = useAuth();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<TransactionItem | null>(null);

  const [isUpgrading, setIsUpgrading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTransactions();
      if (res.success) {
        setTransactions(res.transactions || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTransactions();
      setSelectedInvoice(null);
      setSuccessMsg('');
      setErrorMsg('');
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (selectedInvoice) {
            setSelectedInvoice(null);
          } else {
            onClose();
          }
        }
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, selectedInvoice, onClose]);

  if (!isOpen) return null;

  const handleUpgrade = async (planType: 'vip' | 'unlimited') => {
    setIsUpgrading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.upgradePlan(planType, 'Chuyển khoản QR Napas 24/7');
      if (res.success && res.transaction) {
        setTransactions((prev) => [res.transaction, ...prev]);
        setSuccessMsg(`Thanh toán & Nâng cấp thành công! ${res.message}`);
        if (user && res.updatedQuota) {
          updateUser({
            ...user,
            questionsQuota: res.updatedQuota,
            remainingQuestions: Math.max(0, res.updatedQuota - (user.questionsUsed || 0))
          });
        }
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg('Không thể xử lý giao dịch nâng cấp.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi xử lý giao dịch.');
    } finally {
      setIsUpgrading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Main Modal Card */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 z-10 my-auto text-slate-800 animate-modal-in max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#ec2227] flex items-center justify-center border border-red-100 shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Lịch sử giao dịch & Hóa đơn
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                  {transactions.length} hóa đơn
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Tra cứu các hóa đơn điện tử, lịch sử thanh toán nạp tiền và nâng cấp gói dịch vụ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-30 cursor-pointer"
            title="Đóng"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Messages */}
        {successMsg && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Account Current Subscription Status Bar */}
        <div className="mx-6 my-4 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-[#ec2227]">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Gói dịch vụ đang kích hoạt
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Đang hoạt động
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white">
                {totalQuestions > 30 ? 'Gói Nâng cấp Cử nhân VIP' : 'Gói Sinh viên Cơ bản (Miễn phí 30 câu/tháng)'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-left sm:text-right">
              <span className="text-slate-400 block text-[11px]">Hạn mức câu hỏi còn lại:</span>
              <span className="font-extrabold text-lg text-amber-300">
                {remainingQuestions} / {totalQuestions} câu
              </span>
            </div>
          </div>
        </div>

        {/* Fast Upgrade Packages Section */}
        <div className="px-6 pb-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Nâng cấp gói dịch vụ & Nạp thêm lượt hỏi</span>
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* VIP Plan */}
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:border-red-300 transition-all flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-900">Gói Cử nhân VIP</span>
                  <span className="text-[10px] bg-red-100 text-[#ec2227] font-bold px-1.5 py-0.5 rounded">
                    +100 câu hỏi
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Luyện đề Barem chuẩn + Ưu tiên tốc độ cao
                </p>
                <p className="text-xs font-extrabold text-[#ec2227] mt-1">99.000 VNĐ</p>
              </div>
              <Button
                size="sm"
                disabled={isUpgrading}
                onClick={() => handleUpgrade('vip')}
                className="bg-[#ec2227] hover:bg-[#d01c21] text-white text-xs font-bold shrink-0"
              >
                {isUpgrading ? 'Đang xử lý...' : 'Nâng cấp ngay'}
              </Button>
            </div>

            {/* Unlimited Plan */}
            <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/40 hover:border-amber-300 transition-all flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-900">Gói Không giới hạn</span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                    +500 câu hỏi
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Rà soát văn bản không giới hạn + Chuẩn Bộ GD&ĐT
                </p>
                <p className="text-xs font-extrabold text-amber-600 mt-1">199.000 VNĐ</p>
              </div>
              <Button
                size="sm"
                disabled={isUpgrading}
                onClick={() => handleUpgrade('unlimited')}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shrink-0"
              >
                {isUpgrading ? 'Đang xử lý...' : 'Nâng cấp ngay'}
              </Button>
            </div>
          </div>
        </div>

        {/* Transactions Table Section */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Danh sách hóa đơn & Lịch sử thanh toán:
          </p>
          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <span>Đang tải danh sách giao dịch...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Chưa có giao dịch thanh toán nào</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Mã hóa đơn</th>
                    <th className="py-3 px-4">Gói dịch vụ</th>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Số tiền</th>
                    <th className="py-3 px-4">Phương thức</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {tx.transactionCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block">{tx.planName}</span>
                        <span className="text-[11px] text-slate-400 block line-clamp-1">{tx.description}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        {tx.amount === 0 ? '0 đ (Miễn phí)' : `${tx.amount.toLocaleString('vi-VN')} VNĐ`}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {tx.paymentMethod}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3" />
                          <span>Thành công</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedInvoice(tx)}
                          className="text-[#ec2227] hover:bg-red-50 text-xs font-semibold py-1 px-2.5"
                        >
                          Xem hóa đơn
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white text-xs">
          <span className="text-slate-500">
            Hóa đơn điện tử hợp lệ theo quy định lưu trữ dữ liệu của hệ thống.
          </span>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Đóng
          </Button>
        </div>
      </div>

      {/* Invoice Details Popup */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={() => setSelectedInvoice(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 z-10 animate-modal-in max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  HÓA ĐƠN ĐIỆN TỬ HỢP LỆ
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Biên lai giao dịch dịch vụ</h3>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedInvoice(null);
                }}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer z-30"
                title="Đóng"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <div className="flex justify-between py-2 border-b border-dashed border-slate-200">
                <span className="text-slate-500">Mã hóa đơn / Tra cứu:</span>
                <span className="font-mono font-bold text-slate-900">{selectedInvoice.transactionCode}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-slate-200">
                <span className="text-slate-500">Khách hàng:</span>
                <span className="font-semibold text-slate-900">{user?.fullName || selectedInvoice.userEmail}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-slate-200">
                <span className="text-slate-500">Thời gian khởi tạo:</span>
                <span className="text-slate-800">{new Date(selectedInvoice.createdAt).toLocaleString('vi-VN')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-slate-200">
                <span className="text-slate-500">Gói dịch vụ:</span>
                <span className="font-bold text-slate-900">{selectedInvoice.planName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-slate-200">
                <span className="text-slate-500">Phương thức thanh toán:</span>
                <span className="text-slate-800">{selectedInvoice.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-slate-200">
                <span className="text-slate-500">Hạn mức cộng thêm:</span>
                <span className="font-bold text-emerald-600">+{selectedInvoice.questionsAdded} câu hỏi</span>
              </div>
              <div className="flex justify-between py-3 bg-slate-50 px-3 rounded-xl border border-slate-200 text-sm">
                <span className="font-bold text-slate-800">Tổng thanh toán:</span>
                <span className="font-extrabold text-[#ec2227]">
                  {selectedInvoice.amount === 0 ? '0 VNĐ' : `${selectedInvoice.amount.toLocaleString('vi-VN')} VNĐ`}
                </span>
              </div>
            </div>

            {/* Digital Seal */}
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center gap-2.5 text-[11px] text-emerald-800">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Chứng thực điện tử: Giao dịch đã được ghi nhận vào cơ sở dữ liệu và kích hoạt quyền lợi tương ứng.</span>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-100 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="text-xs gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In biên lai</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setSelectedInvoice(null)}
                className="text-xs bg-slate-800 hover:bg-slate-900 text-white"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
