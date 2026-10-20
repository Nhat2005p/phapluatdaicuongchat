import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Bookmark,
  Sparkles,
  Search,
  Copy,
  Check,
  Edit3,
  Save,
  Trash2,
  ExternalLink,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { QueryHistoryItem } from '../../types';
import { api } from '../../services/api';
import { Button } from '../ui/Button';

interface SavedConversationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuery?: (query: string) => void;
}

export const SavedConversationsModal: React.FC<SavedConversationsModalProps> = ({
  isOpen,
  onClose,
  onSelectQuery
}) => {
  const [bookmarks, setBookmarks] = useState<QueryHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDetail, setSelectedDetail] = useState<QueryHistoryItem | null>(null);

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchBookmarks = async () => {
    setIsLoading(true);
    try {
      const res = await api.getBookmarks();
      if (res.success) {
        setBookmarks(res.bookmarks || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBookmarks();
      setSelectedDetail(null);
      setEditingNoteId(null);
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

  const handleUnbookmark = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await api.toggleBookmark(id);
      if (res.success) {
        setBookmarks((prev) => prev.filter((b) => b._id !== id));
        if (selectedDetail?._id === id) {
          setSelectedDetail(null);
        }
        setFeedbackMsg('Đã bỏ lưu hội thoại khỏi danh sách.');
        setTimeout(() => setFeedbackMsg(''), 2500);
      }
    } catch {
      setFeedbackMsg('Không thể bỏ lưu trữ.');
    }
  };

  const handleSaveNote = async (id: string) => {
    try {
      const res = await api.toggleBookmark(id, tempNote);
      if (res.success) {
        setBookmarks((prev) =>
          prev.map((b) => (b._id === id ? { ...b, bookmarkNote: tempNote } : b))
        );
        if (selectedDetail?._id === id) {
          setSelectedDetail((prev) => (prev ? { ...prev, bookmarkNote: tempNote } : null));
        }
        setEditingNoteId(null);
        setFeedbackMsg('Đã lưu ghi chú ôn tập thành công!');
        setTimeout(() => setFeedbackMsg(''), 2500);
      }
    } catch {
      setFeedbackMsg('Lỗi khi lưu ghi chú.');
    }
  };

  const handleCopyText = (item: QueryHistoryItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const fullText = `[CÂU HỎI]: ${item.query}\n\n[LỜI GIẢI BAREM CHUẨN]:\n${item.response}`;
    navigator.clipboard.writeText(fullText);
    setCopiedId(item._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredBookmarks = bookmarks.filter((item) => {
    if (!searchTerm.trim()) return true;
    const lower = searchTerm.toLowerCase();
    return (
      item.query.toLowerCase().includes(lower) ||
      item.response.toLowerCase().includes(lower) ||
      (item.bookmarkNote && item.bookmarkNote.toLowerCase().includes(lower))
    );
  });

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Main Modal Card */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 z-10 my-auto text-slate-800 animate-modal-in max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center border border-amber-200 shadow-xs">
              <Bookmark className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Danh sách hội thoại đã lưu
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {bookmarks.length} câu hỏi ôn tập
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Các phiên giải đáp pháp luật và tình huống tự luận quan trọng bạn đã đánh dấu để ôn thi
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

        {/* Search Bar */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm trong danh sách bài lưu hoặc ghi chú..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200 transition-all"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <span>Đang tải các hội thoại đã lưu...</span>
            </div>
          ) : filteredBookmarks.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
              <Bookmark className="w-10 h-10 text-amber-200 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Chưa có hội thoại nào được lưu</p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Khi hỏi đáp AI hoặc xem lịch sử, bạn có thể bấm biểu tượng bookmark ⭐ để lưu các câu hỏi quan trọng phục vụ ôn thi vào danh mục này.
              </p>
            </div>
          ) : (
            filteredBookmarks.map((item) => (
              <div
                key={item._id}
                onClick={() => setSelectedDetail(item)}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 hover:shadow-md cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <Bookmark className="w-3 h-3 fill-amber-500" />
                      <span>{item.intentCode || 'BÀI TẬP PHÁP LUẬT'}</span>
                    </span>

                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(item.bookmarkedAt || item.createdAt).toLocaleDateString('vi-VN')}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Copy button */}
                    <button
                      type="button"
                      onClick={(e) => handleCopyText(item, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Sao chép câu hỏi & đáp án"
                    >
                      {copiedId === item._id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    {/* Unbookmark */}
                    <button
                      type="button"
                      onClick={(e) => handleUnbookmark(item._id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Bỏ lưu khỏi danh sách"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question */}
                <h3 className="font-bold text-sm text-slate-900 mt-2.5 leading-relaxed">
                  {item.query}
                </h3>

                {/* Answer Preview */}
                <p className="text-xs text-slate-600 mt-1.5 line-clamp-3 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
                  {item.response}
                </p>

                {/* Personal Study Note */}
                <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                  {editingNoteId === item._id ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={tempNote}
                        onChange={(e) => setTempNote(e.target.value)}
                        placeholder="Thêm ghi chú ôn tập cá nhân (vd: Đề thi K63)..."
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-200"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSaveNote(item._id)}
                        className="text-xs bg-amber-500 hover:bg-amber-600 text-white gap-1 py-1"
                      >
                        <Save className="w-3 h-3" />
                        <span>Lưu</span>
                      </Button>
                      <button
                        onClick={() => setEditingNoteId(null)}
                        className="text-xs text-slate-400 hover:text-slate-600"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-amber-800 bg-amber-50/70 px-3 py-1.5 rounded-xl border border-amber-100">
                      <div className="flex items-center gap-1.5 line-clamp-1">
                        <Tag className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>
                          {item.bookmarkNote
                            ? `Ghi chú: ${item.bookmarkNote}`
                            : 'Chưa có ghi chú cá nhân'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNoteId(item._id);
                          setTempNote(item.bookmarkNote || '');
                        }}
                        className="text-amber-600 hover:text-amber-700 font-semibold text-[11px] flex items-center gap-1 ml-2 shrink-0"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Sửa ghi chú</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div className="flex items-center justify-between mt-3 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
                  <span>
                    Trích dẫn:{' '}
                    <strong className="text-slate-700">
                      {item.verifiedCitationsCount || (item.citations ? item.citations.length : 0)} điều luật
                    </strong>
                  </span>
                  <span className="text-amber-600 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>Xem toàn văn bài giải Barem</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white text-xs">
          <div className="text-slate-500">
            Hội thoại được lưu vĩnh viễn trên tài khoản của bạn để ôn thi môn Pháp luật đại cương.
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Đóng
          </Button>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedDetail && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={() => setSelectedDetail(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 z-10 max-h-[85vh] flex flex-col animate-modal-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 flex items-center gap-1">
                  <Bookmark className="w-3 h-3 fill-amber-500" />
                  <span>HỘI THOẠI ĐÃ LƯU</span>
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
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Đề bài / Tình huống ôn tập:
                </p>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium leading-relaxed">
                  {selectedDetail.query}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Lời giải đáp & Phân tích Barem chi tiết:
                  </p>
                  <button
                    onClick={() => handleCopyText(selectedDetail)}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
                  >
                    {copiedId === selectedDetail._id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === selectedDetail._id ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 text-slate-100 leading-relaxed font-mono text-xs whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {selectedDetail.response}
                </div>
              </div>

              {selectedDetail.citations && selectedDetail.citations.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Căn cứ pháp lý trích dẫn:
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
                          Đã xác minh
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
                onClick={() => handleUnbookmark(selectedDetail._id)}
                className="text-xs gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bỏ lưu hội thoại này</span>
              </Button>

              {onSelectQuery && (
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
