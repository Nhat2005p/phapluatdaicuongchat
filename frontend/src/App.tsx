import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { HomePage } from './components/home/HomePage';
import { StudyMode } from './components/student/StudyMode';
import { LawSearchMode } from './components/student/LawSearchMode';
import { AiReviewMode } from './components/student/AiReviewMode';
import { CouncilBenchmark } from './components/council/CouncilBenchmark';
import { AdminHub } from './components/admin/AdminHub';
import { AuthModal } from './components/auth/AuthModal';

const MainContent: React.FC = () => {
  const { role, isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<'home' | 'study' | 'laws' | 'review' | 'council' | 'admin'>('home');
  const [initialChatQuery, setInitialChatQuery] = useState<string>('');
  const [initialReviewContent, setInitialReviewContent] = useState<string>('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register'>('login');

  const handleOpenAuth = (mode?: 'login' | 'register') => {
    setAuthInitialTab(mode || 'login');
    setIsAuthOpen(true);
  };

  const handleTabChange = (targetTab: string) => {
    // Chức năng cần đăng nhập: AI Hỏi đáp, AI Rà soát, Hội đồng, Quản trị
    if (!isAuthenticated && (targetTab === 'study' || targetTab === 'review' || targetTab === 'council' || targetTab === 'admin')) {
      handleOpenAuth('login');
      return;
    }
    // Chức năng chỉ dành cho Admin
    if ((targetTab === 'council' || targetTab === 'admin') && role !== 'admin') {
      handleOpenAuth('login');
      return;
    }
    setCurrentTab(targetTab as any);
  };

  const handleStartChatFromHome = (query?: string) => {
    if (!isAuthenticated) {
      if (query) setInitialChatQuery(query);
      handleOpenAuth('login');
      return;
    }
    if (query) {
      setInitialChatQuery(query);
    }
    setCurrentTab('study');
  };

  const handleStartReviewWithContent = (text: string) => {
    if (!isAuthenticated) {
      setInitialReviewContent(text);
      handleOpenAuth('login');
      return;
    }
    setInitialReviewContent(text);
    setCurrentTab('review');
  };

  // Tự động out ra trang chủ khi đăng xuất khỏi tài khoản
  React.useEffect(() => {
    if (!isAuthenticated) {
      if (currentTab !== 'home' && currentTab !== 'laws') {
        setCurrentTab('home');
      }
      setInitialChatQuery('');
      setInitialReviewContent('');
    }
  }, [isAuthenticated, currentTab]);

  // Đang tải phiên làm việc
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-600">Đang khởi tạo hệ thống...</span>
        </div>
      </div>
    );
  }

  // Phân quyền bảo vệ các tab:
  // 1. Chưa đăng nhập: chỉ được ở 'home' hoặc 'laws'. Mọi tab khác đều bị out về 'home'
  // 2. Không phải admin: 'council' và 'admin' đều bị out về 'home'
  let safeTab: 'home' | 'study' | 'laws' | 'review' | 'council' | 'admin' = currentTab;
  if (!isAuthenticated && (currentTab === 'study' || currentTab === 'review' || currentTab === 'council' || currentTab === 'admin')) {
    safeTab = 'home';
  } else if (isAuthenticated && role !== 'admin' && (currentTab === 'council' || currentTab === 'admin')) {
    safeTab = 'home';
  }

  // Toàn bộ giao diện người dùng đồng nhất nền sáng Trắng & Xanh
  const isLightTab = safeTab !== 'council' && safeTab !== 'admin';

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isLightTab ? 'bg-[#f8fafc] text-slate-900' : 'bg-slate-950 text-slate-100'
      } selection:bg-blue-500/30 selection:text-blue-700 transition-colors`}
    >
      <Header
        currentTab={safeTab}
        onTabChange={handleTabChange}
        onOpenAuth={handleOpenAuth}
        onSelectQuery={handleStartChatFromHome}
      />

      <main className={`flex-1 ${safeTab === 'study' ? 'pb-0' : 'pb-16'}`}>
        {safeTab === 'home' && (
          <HomePage
            onStartChat={handleStartChatFromHome}
            onOpenAuth={handleOpenAuth}
          />
        )}
        {safeTab === 'study' && (
          <StudyMode
            initialQuery={initialChatQuery}
            onClearInitialQuery={() => setInitialChatQuery('')}
            onOpenAuth={handleOpenAuth}
          />
        )}
        {safeTab === 'laws' && (
          <LawSearchMode
            onAskAi={handleStartChatFromHome}
            onReviewAi={handleStartReviewWithContent}
          />
        )}
        {safeTab === 'review' && (
          <AiReviewMode
            initialContent={initialReviewContent}
            onAskAi={handleStartChatFromHome}
            onOpenAuth={handleOpenAuth}
          />
        )}
        {safeTab === 'council' && <CouncilBenchmark />}
        {safeTab === 'admin' && <AdminHub />}
      </main>

      {safeTab !== 'study' && (
        <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 no-print transition-colors">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Chatbot Hỗ Trợ Pháp Luật Đại Cương</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">Trợ lý AI Pháp Luật</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Hệ thống Trợ lý Trí tuệ Nhân tạo hỗ trợ sinh viên tra cứu và giải đề thi môn Pháp luật đại cương chuẩn Giáo trình Bộ GD&ĐT
            </div>
          </div>
        </footer>
      )}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialTab={authInitialTab}
      />
    </div>
  );
};

import { ToastProvider } from './components/ui/Toast';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainContent />
      </ToastProvider>
    </AuthProvider>
  );
}
