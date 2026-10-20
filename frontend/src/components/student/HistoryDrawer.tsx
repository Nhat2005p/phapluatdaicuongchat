import React from 'react';
import { QueryHistoryItem } from '../../types';
import { History, Trash2, ArrowRight, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: QueryHistoryItem[];
  onSelectQuery: (query: string) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectQuery,
  onClearHistory
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md h-full bg-white border-l border-slate-200 shadow-2xl z-10 flex flex-col p-5 text-slate-900">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-base text-slate-900">Lịch sử bài giải</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Chưa có bài tập nào được lưu trong phiên học tập này.
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item._id}
                onClick={() => {
                  onSelectQuery(item.query);
                  onClose();
                }}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/60 cursor-pointer transition-all group shadow-2xs"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                  <span className="font-semibold text-blue-600">{item.intentCode}</span>
                  <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">{item.query}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/80 text-[10px] text-slate-500">
                  <span>Trích dẫn: {item.verifiedCitationsCount} điều luật</span>
                  <span className="flex items-center gap-1 text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Tải lại <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="pt-3 border-t border-slate-200">
            <Button variant="destructive" size="sm" onClick={onClearHistory} className="w-full gap-2 text-xs">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa toàn bộ lịch sử</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
