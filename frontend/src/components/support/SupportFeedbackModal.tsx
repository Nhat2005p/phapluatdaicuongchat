import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  PhoneCall,
  Mail,
  Send,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Clock,
  HelpCircle,
  Headphones
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

interface SupportFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportFeedbackModal: React.FC<SupportFeedbackModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [feedbackType, setFeedbackType] = useState('bug');
  const [content, setContent] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  if (!isOpen) return null;

  const HOTLINE_NUMBER = '0366 015 348';

  const handleCopyPhone = () => {
    navigator.clipboard.writeText('0366015348');
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setIsSuccess(true);
      setContent('');
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2500);
    }, 600);
  };

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Main Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 z-10 my-auto text-slate-800 animate-modal-in max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-red-50 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ec2227] text-white flex items-center justify-center shadow-md shadow-red-500/20">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Tổng đài Hỗ trợ & Kênh Góp ý
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Trực tuyến 24/7
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Tiếp nhận phản hồi người dùng, giải đáp thắc mắc môn học và hỗ trợ kỹ thuật
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Direct Hotline Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-red-600 via-[#ec2227] to-rose-600 text-white shadow-lg shadow-red-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                <PhoneCall className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-semibold text-rose-100 uppercase tracking-wider block">
                  Đường dây nóng hỗ trợ trực tiếp
                </span>
                <span className="text-2xl font-black tracking-tight block">
                  {HOTLINE_NUMBER}
                </span>
                <p className="text-[11px] text-rose-100/90 mt-0.5">
                  Tư vấn bài tập & Hỗ trợ kỹ thuật 24/7 (Miễn phí)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`tel:${HOTLINE_NUMBER.replace(/\s+/g, '')}`}
                className="px-4 py-2.5 rounded-xl bg-white text-[#ec2227] font-bold text-xs hover:bg-rose-50 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Gọi ngay</span>
              </a>
              <button
                type="button"
                onClick={handleCopyPhone}
                className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors text-xs flex items-center gap-1 font-semibold"
                title="Sao chép số hotline"
              >
                {copiedPhone ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Feedback Form */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-slate-700" />
              <h3 className="font-bold text-sm text-slate-900">
                Gửi phản hồi & Góp ý về hệ thống:
              </h3>
            </div>

            {isSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2 animate-modal-in">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm text-emerald-900">
                  Gửi ý kiến đóng góp thành công!
                </h4>
                <p className="text-xs text-emerald-700 max-w-md mx-auto">
                  Cảm ơn bạn đã đồng hành và đóng góp xây dựng Chatbot Hỗ Trợ Pháp Luật Đại Cương. Đội ngũ phụ trách sẽ xem xét và phản hồi trong thời gian sớm nhất.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Category Radio/Pills */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Loại nội dung phản hồi:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { id: 'bug', label: 'Báo lỗi câu trả lời' },
                      { id: 'request', label: 'Đề xuất dạng đề mới' },
                      { id: 'account', label: 'Hỗ trợ tài khoản' },
                      { id: 'other', label: 'Góp ý giao diện' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFeedbackType(item.id)}
                        className={`p-2 rounded-xl text-center border font-medium transition-all ${
                          feedbackType === item.id
                            ? 'bg-red-50 border-[#ec2227] text-[#ec2227] font-bold shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email nhận phản hồi:
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="email.sinhvien@example.com"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ec2227] focus:ring-1 focus:ring-red-200"
                  />
                </div>

                {/* Feedback text */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chi tiết ý kiến góp ý hoặc mô tả vấn đề:
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Vui lòng mô tả chi tiết nội dung bạn muốn góp ý, câu hỏi chưa thỏa đáng hoặc tính năng mong muốn bổ sung..."
                    className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#ec2227] focus:ring-1 focus:ring-red-200 resize-none leading-relaxed"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSending}
                  className="w-full py-2.5 bg-[#ec2227] hover:bg-[#d01c21] text-white font-bold text-xs rounded-xl shadow-md shadow-red-500/20 flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Đang gửi phản hồi...' : 'Gửi phản hồi cho Ban quản trị'}</span>
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>Email hỗ trợ: <strong>hotro@phapluatdaicuong.edu.vn</strong></span>
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
