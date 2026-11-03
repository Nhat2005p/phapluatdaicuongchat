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
  Scale,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';
import { ChatMessage } from './StudyMode';
import { ShinyButton } from '../magicui/ShinyButton';

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
    <div className="h-full flex flex-col bg-white/95 dark:bg-[#0f172a]/95 border-r border-slate-200 dark:border-slate-800 select-none text-slate-800 dark:text-slate-200 transition-colors">
      {/* 1. Header with New Chat Button */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0 bg-slate-50/50 dark:bg-slate-900/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <Scale className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <span className="font-bold text-xs tracking-tight text-slate-900 dark:text-white">
              Lịch sử đoạn chat
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#202028] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
              {sessions.length}
            </span>
          </div>

          <button
            onClick={onToggle}
            title="Thu gọn thanh bên"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#202028] transition-all cursor-pointer"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Shiny New Chat Action Button */}
        <ShinyButton
          onClick={onNewChat}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Đoạn chat mới</span>
        </ShinyButton>
      </div>

      {/* 2. Chat Sessions List (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {sessions.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2.5">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-[#181818] border border-slate-200 dark:border-slate-800 text-slate-400 flex items-center justify-center mx-auto shadow-xs">
              <MessageSquare className="w-5 h-5 opacity-70" />
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Chưa có đoạn chat nào</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[200px] mx-auto">
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
                    ? 'border-l-3 border-l-indigo-600 border-t-indigo-500/10 border-r-indigo-500/10 border-b-indigo-500/10 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-[#181818] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-6">
                  <MessageSquare
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                    }`}
                  />
                  <div className="min-w-0">
                    <span className="block truncate text-xs leading-tight" title={session.title}>
                      {session.title || 'Đoạn chat chưa đặt tên'}
                    </span>
                    <span
                      className={`text-[10px] flex items-center gap-1 mt-0.5 ${
                        isActive ? 'text-indigo-600/80 dark:text-indigo-400/80' : 'text-slate-400'
                      }`}
                    >
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
                  className={`opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all cursor-pointer shrink-0 absolute right-2 ${
                    isActive
                      ? 'text-indigo-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                      : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* 3. Footer: User Status & Actions */}
      <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 space-y-2.5 shrink-0 text-xs">
        {/* Quota Indicator with Progress Bar */}
        {isAuthenticated && (
          <div className="space-y-1.5 px-0.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Hạn mức tháng này:</span>
              <span
                className={`font-bold ${
                  remainingQuestions <= 5 ? 'text-rose-600' : 'text-indigo-600 dark:text-indigo-400'
                }`}
              >
                {remainingQuestions}/30 câu
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, (remainingQuestions / 30) * 100))}%` }} 
              />
            </div>
          </div>
        )}

        {/* User Card */}
        <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="block truncate text-xs font-bold text-slate-900 dark:text-white">
                {userName}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                {userRole === 'admin' ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span>Quản trị viên</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-3 h-3 text-emerald-500" />
                    <span>Sinh viên</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {sessions.length > 0 && (
            <button
              onClick={onClearAllSessions}
              title="Xóa tất cả lịch sử phiên"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
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
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-30 lg:hidden"
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
