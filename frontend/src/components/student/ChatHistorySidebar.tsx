import React from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  PanelLeftClose,
  Clock,
  Sparkles,
  User as UserIcon,
  HelpCircle,
  Scale
} from 'lucide-react';
import { ChatMessage } from './StudyMode';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onClearAllSessions: () => void;
  isAuthenticated: boolean;
  remainingQuestions: number;
  userName?: string;
  userRole?: string;
}

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  isOpen,
  onToggle,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearAllSessions,
  isAuthenticated,
  remainingQuestions,
  userName = 'Sinh viên',
  userRole = 'student'
}) => {
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) {
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  // Content of the sidebar
  const sidebarContent = (
    <div className="h-full flex flex-col bg-white border-r border-slate-200 select-none">
      {/* 1. Header with New Chat Button */}
      <div className="p-3 border-b border-slate-200/80 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              <Scale className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-xs tracking-tight text-slate-900">
              Lịch sử đoạn chat
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {sessions.length}
            </span>
          </div>

          <button
            onClick={onToggle}
            title="Thu gọn thanh bên"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Big New Chat Action Button */}
        <button
          onClick={onNewChat}
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Đoạn chat mới</span>
        </button>
      </div>

      {/* 2. Chat Sessions List (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {sessions.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <MessageSquare className="w-5 h-5 opacity-60" />
            </div>
            <p className="text-xs font-semibold text-slate-700">Chưa có đoạn chat nào</p>
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-[200px] mx-auto">
              Mỗi câu hỏi bạn gửi trong phiên đăng nhập này sẽ tự động được lưu tại đây.
            </p>
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = activeSessionId === session.id;
            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-blue-50/90 border-blue-200/80 text-blue-900 font-semibold shadow-2xs'
                    : 'bg-transparent border-transparent text-slate-700 hover:bg-slate-50 hover:border-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-6">
                  <MessageSquare
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-blue-600 stroke-[2.5]' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <div className="min-w-0">
                    <span className="block truncate text-xs leading-tight" title={session.title}>
                      {session.title || 'Đoạn chat chưa đặt tên'}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTime(session.updatedAt || session.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Delete button (hover only or active) */}
                <button
                  type="button"
                  title="Xóa đoạn chat này"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer shrink-0 absolute right-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* 3. Footer: User Status & Actions */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70 space-y-2 shrink-0 text-xs">
        {/* Quota Indicator */}
        {isAuthenticated && (
          <div className="flex items-center justify-between text-[11px] px-1">
            <span className="text-slate-500 font-medium">Hạn mức phiên này:</span>
            <span
              className={`font-bold ${
                remainingQuestions <= 5 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {remainingQuestions}/30 câu
            </span>
          </div>
        )}

        {/* User Card */}
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="block truncate text-xs font-semibold text-slate-800">
                {userName}
              </span>
              <span className="text-[10px] text-slate-400 capitalize">
                {userRole === 'admin' ? 'Quản trị viên' : 'Sinh viên'}
              </span>
            </div>
          </div>

          {sessions.length > 0 && (
            <button
              onClick={onClearAllSessions}
              title="Xóa tất cả lịch sử phiên"
              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Desktop view (Inline sidebar)
  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Mobile Offcanvas / Desktop Column */}
      <aside
        className={`fixed top-[65px] bottom-0 left-0 z-40 w-72 lg:static lg:z-10 transition-all duration-300 ease-in-out shrink-0 ${
          isOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden lg:border-r-0'
        }`}
      >
        <div className="w-72 h-full">{sidebarContent}</div>
      </aside>
    </>
  );
};
