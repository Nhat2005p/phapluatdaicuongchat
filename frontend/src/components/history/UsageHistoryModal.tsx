import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  History,
  Sparkles,
  FileCheck,
  Search,
  Trash2,
  Bookmark,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { QueryHistoryItem } from '../../types';
import { api } from '../../services/api';
import { Button } from '../ui/Button';

interface UsageHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuery?: (query: string) => void;
}

export const UsageHistoryModal: React.FC<UsageHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectQuery
}) => {
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'solver' | 'review'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDetail, setSelectedDetail] = useState<QueryHistoryItem | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await api.getHistory();
      if (res.success) {
        setHistory(res.history || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
      setSelectedDetail(null);
      setFeedbackMsg('');
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (selectedDetail) {
            setSelectedDetail(null);
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
  }, [isOpen, selectedDetail, onClose]);

  if (!isOpen) return null;

  const handleToggleBookmark = async (item: QueryHistoryItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await api.toggleBookmark(item._id);
      if (res.success) {
        setHistory((prev) =>
          prev.map((h) => (h._id === item._id ? { ...h, isBookmarked: !h.isBookmarked } : h))
        );
        if (selectedDetail?._id === item._id) {
          setSelectedDetail((prev) => (prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null));
        }
        setFeedbackMsg(res.message);
        setTimeout(() => setFeedbackMsg(''), 2500);
      }
    } catch {
      setFeedbackMsg('Không thể cập nhật trạng thái lưu trữ.');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử sử dụng cá nhân không?')) {
      return;
    }
    try {
      const res = await api.clearHistory();
      if (res.success) {
        setHistory([]);
        setSelectedDetail(null);
        setFeedbackMsg('Đã xóa toàn bộ lịch sử sử dụng thành công.');
        setTimeout(() => setFeedbackMsg(''), 2500);
      }
    } catch {
      setFeedbackMsg('Lỗi khi xóa lịch sử.');
    }
  };

  // Lọc theo loại và từ khóa tìm kiếm
  const filteredList = history.filter((item) => {
    const matchType =
      filterType === 'all'
        ? true
        : filterType === 'review'
        ? item.activityType === 'review' || item.intentCode === 'AI_REVIEW'
        : item.activityType !== 'review' && item.intentCode !== 'AI_REVIEW';

    const matchSearch =
      !searchTerm.trim() ||
      item.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.response.toLowerCase().includes(searchTerm.toLowerCase());

    return matchType && matchSearch;
  });

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Main Modal Card */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 z-10 my-auto text-slate-800 animate-modal-in max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#ec2227] flex items-center justify-center border border-red-100 shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Lịch sử sử dụng hệ thống
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                  {history.length} lượt tương tác
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Nhật ký chi tiết các lần giải đề AI, hỏi đáp pháp lý và rà soát văn bản của bạn
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

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
          {/* Tabs / Filter by Type */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto text-xs font-semibold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({history.length})
            </button>
            <button
              onClick={() => setFilterType('solver')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filterType === 'solver'
                  ? 'bg-white text-[#ec2227] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hỏi đáp AI ({history.filter((h) => h.activityType !== 'review' && h.intentCode !== 'AI_REVIEW').length})</span>
            </button>
            <button
              onClick={() => setFilterType('review')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filterType === 'review'
                  ? 'bg-white text-emerald-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Rà soát ({history.filter((h) => h.activityType === 'review' || h.intentCode === 'AI_REVIEW').length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo nội dung câu hỏi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#ec2227] focus:ring-1 focus:ring-red-200 transition-all"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/40">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <span>Đang tải nhật ký tương tác...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
              <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Chưa có bản ghi hoạt động nào</p>
              <p className="text-xs text-slate-400 mt-1">
                Các câu hỏi bạn thực hiện trên Trợ lý AI và Rà soát văn bản sẽ tự động lưu vết tại đây.
              </p>
            </div>
          ) : (
            filteredList.map((item) => {
              const isReview = item.activityType === 'review' || item.intentCode === 'AI_REVIEW';
              return (
                <div
                  key={item._id}
                  onClick={() => setSelectedDetail(item)}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-red-300 hover:shadow-md cursor-pointer transition-all group relative"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isReview
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-[#ec2227] border border-red-200'
                        }`}
                      >
                        {isReview ? <FileCheck className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                        <span>{isReview ? 'AI RÀ SOÁT VĂN BẢN' : `AI HỎI ĐÁP • ${item.intentCode || 'VPPL'}`}</span>
                      </span>

                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(item.createdAt).toLocaleString('vi-VN')}</span>
                      </span>
                    </div>

                    {/* Bookmark Toggle Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleBookmark(item, e)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        item.isBookmarked
                          ? 'bg-amber-50 text-amber-500 border-amber-300'
                          : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 border-transparent'
                      }`}
                      title={item.isBookmarked ? 'Đã lưu trong Hội thoại quan trọng' : 'Đánh dấu lưu hội thoại'}
                    >
                      <Bookmark className={`w-4 h-4 ${item.isBookmarked ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>

                  {/* Query Question */}
                  <h3 className="font-semibold text-sm text-slate-900 mt-2 line-clamp-2 leading-relaxed">
                    {item.query}
                  </h3>

                  {/* Short snippet of response */}
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {item.response}
                  </p>

                  {/* Metadata footer */}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                    <div className="flex items-center gap-3">
                      <span>
                        Căn cứ trích dẫn:{' '}
                        <strong className="text-slate-700 font-semibold">
                          {item.verifiedCitationsCount || (item.citations ? item.citations.length : 0)} điều luật
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Tốc độ:{' '}
                        <strong className="text-emerald-600 font-semibold">
                          ~{(item.latencyMs / 1000).toFixed(2)}s
                        </strong>
                      </span>
                    </div>

                    <span className="text-[#ec2227] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Xem chi tiết</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white text-xs">
          <div className="text-slate-500">
            Dữ liệu được mã hóa an toàn và chỉ hiển thị cho tài khoản của bạn.
          </div>
          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 text-xs gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa toàn bộ lịch sử</span>
            </Button>
          )}
        </div>
      </div>

      {/* Detail Slide/Modal when clicking an item */}
      {selectedDetail && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={() => setSelectedDetail(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 z-10 max-h-[85vh] flex flex-col animate-modal-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-red-50 text-[#ec2227] text-xs font-bold border border-red-200">
                  CHI TIẾT PHIÊN LÀM VIỆC
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(selectedDetail.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs sm:text-sm">
              {/* Question */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nội dung câu hỏi / Tình huống:
                </p>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium leading-relaxed">
                  {selectedDetail.query}
                </div>
              </div>

              {/* Response */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Kết quả giải đáp từ Trợ lý AI:
                </p>
                <div className="p-4 rounded-xl bg-slate-900 text-slate-100 leading-relaxed font-mono text-xs whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {selectedDetail.response}
                </div>
              </div>

              {/* Citations if available */}
              {selectedDetail.citations && selectedDetail.citations.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Căn cứ pháp lý đối chiếu ({selectedDetail.citations.length} điều luật):
                  </p>
                  <div className="space-y-1.5">
                    {selectedDetail.citations.map((c, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between"
                      >
                        <span className="font-semibold">
                          {c.lawTitle || c.rawText} - {c.lawCode}
                        </span>
                        <span className="text-[10px] bg-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          Đã kiểm định
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleBookmark(selectedDetail)}
                className={`text-xs gap-1.5 ${
                  selectedDetail.isBookmarked
                    ? 'border-amber-300 bg-amber-50 text-amber-700'
                    : 'text-slate-700'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${selectedDetail.isBookmarked ? 'fill-amber-400' : ''}`} />
                <span>{selectedDetail.isBookmarked ? 'Đã lưu trữ' : 'Đánh dấu lưu trữ'}</span>
              </Button>

              {onSelectQuery && selectedDetail.activityType !== 'review' && (
                <Button
                  size="sm"
                  onClick={() => {
                    onSelectQuery(selectedDetail.query);
                    setSelectedDetail(null);
                    onClose();
                  }}
                  className="bg-[#ec2227] hover:bg-[#d01c21] text-white text-xs gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở lại câu hỏi trong AI Hỏi đáp</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
