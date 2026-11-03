import React, { useState, useRef, useEffect } from 'react';
import {
  Scale,
  ShieldCheck,
  Settings,
  LogIn,
  LogOut,
  UserPlus,
  Sparkles,
  BookOpen,
  ShieldAlert,
  Crown,
  GraduationCap,
  Clock,
  User,
  Package,
  History,
  Bookmark,
  KeyRound,
  Moon,
  X,
  Award,
  CheckCircle2,
  PhoneCall,
  Code2,
  Headphones,
  Sliders,
  Sun,
  Search,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { QuickTooltip } from '../ui/Tooltip';
import { useToast } from '../ui/Toast';
import { CommandPalette, CommandItem } from '../ui/CommandPalette';
import { ProfileModal } from '../profile/ProfileModal';
import { ChangePasswordModal } from '../profile/ChangePasswordModal';
import { UsageHistoryModal } from '../history/UsageHistoryModal';
import { SavedConversationsModal } from '../history/SavedConversationsModal';
import { TransactionHistoryModal } from '../billing/TransactionHistoryModal';
import { PricingPackagesModal } from '../pricing/PricingPackagesModal';
import { ApiIntegrationModal } from '../api/ApiIntegrationModal';
import { SupportFeedbackModal } from '../support/SupportFeedbackModal';
import { SettingsModal } from '../settings/SettingsModal';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onSelectQuery?: (query: string) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: (dark: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenAuth,
  onSelectQuery,
  isDarkMode: propIsDarkMode,
  onToggleDarkMode: propOnToggleDarkMode
}) => {
  const { user, isAuthenticated, role, logout, remainingQuestions, totalQuestions } = useAuth();
  const { toast } = useToast();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [localDarkMode, setLocalDarkMode] = useState(() => {
    return localStorage.getItem('vlaw_theme') === 'dark';
  });

  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : localDarkMode;

  const handleToggleDarkMode = (dark: boolean) => {
    if (propOnToggleDarkMode) {
      propOnToggleDarkMode(dark);
    } else {
      setLocalDarkMode(dark);
      if (dark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('vlaw_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('vlaw_theme', 'light');
      }
    }
  };
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showSavedConversationsModal, setShowSavedConversationsModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Global Ctrl+K / Cmd+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commandItems: CommandItem[] = [
    {
      id: 'ai-chat',
      title: 'Hỏi đáp Pháp luật',
      description: 'Tương tác giải đề thi, tình huống tự luận theo Barem chuẩn',
      icon: <Sparkles className="w-4 h-4" />,
      category: 'Tính năng chính',
      action: () => onTabChange('study')
    },
    {
      id: 'law-search',
      title: 'Tra cứu Văn bản Quy phạm',
      description: 'Tìm kiếm điều luật, Nghị định, Thông tư hiện hành',
      icon: <BookOpen className="w-4 h-4" />,
      category: 'Tính năng chính',
      action: () => onTabChange('laws')
    },
    {
      id: 'ai-review',
      title: 'Rà soát Hợp đồng & Văn bản',
      description: 'Rà soát lỗi pháp lý, đối chiếu rủi ro và điều khoản',
      icon: <ShieldAlert className="w-4 h-4" />,
      category: 'Tính năng chính',
      action: () => onTabChange('review')
    },
    ...(isAuthenticated && role === 'admin' ? [
      {
        id: 'council',
        title: 'Hội đồng Thẩm định Barem',
        description: 'Chấm điểm barem, đối sánh mô hình và phân tích rủi ro',
        icon: <ShieldCheck className="w-4 h-4" />,
        category: 'Hệ thống' as const,
        action: () => onTabChange('council')
      },
      {
        id: 'admin',
        title: 'Bảng Quản trị Hệ thống',
        description: 'Quản lý người dùng, hạn mức, crawler và cấu hình gói cước',
        icon: <Settings className="w-4 h-4" />,
        category: 'Hệ thống' as const,
        action: () => onTabChange('admin')
      }
    ] : []),
    {
      id: 'pricing',
      title: 'Gói dịch vụ & Bảng giá',
      description: 'Xem bảng giá, nâng cấp gói lượt hỏi (Cơ bản, Nâng cao, VIP)',
      icon: <Crown className="w-4 h-4" />,
      category: 'Tài khoản & Dịch vụ',
      action: () => setShowPricingModal(true)
    },
    {
      id: 'api-integration',
      title: 'Tích hợp API & API Key',
      description: 'Tài liệu kết nối và quản lý khóa API cho đối tác bên ngoài',
      icon: <Code2 className="w-4 h-4" />,
      category: 'Tài khoản & Dịch vụ',
      action: () => setShowApiModal(true)
    },
    {
      id: 'history',
      title: 'Lịch sử sử dụng',
      description: 'Nhật ký các lần hỏi đáp và tra cứu pháp luật',
      icon: <History className="w-4 h-4" />,
      category: 'Tài khoản & Dịch vụ',
      action: () => setShowUsageModal(true)
    },
    {
      id: 'saved-chats',
      title: 'Danh sách hội thoại đã lưu',
      description: 'Các phiên giải đáp pháp luật quan trọng đã đánh dấu',
      icon: <Bookmark className="w-4 h-4" />,
      category: 'Tài khoản & Dịch vụ',
      action: () => setShowSavedConversationsModal(true)
    },
    {
      id: 'transactions',
      title: 'Lịch sử giao dịch',
      description: 'Tra cứu hóa đơn thanh toán và kích hoạt gói cước',
      icon: <CreditCard className="w-4 h-4" />,
      category: 'Tài khoản & Dịch vụ',
      action: () => setShowTransactionsModal(true)
    },
    {
      id: 'support',
      title: 'Tổng đài Hotline & Hỗ trợ (0366 015 348)',
      description: 'Gửi góp ý hoặc liên hệ tổng đài hỗ trợ trực tiếp',
      icon: <Headphones className="w-4 h-4" />,
      category: 'Hệ thống',
      action: () => setShowSupportModal(true)
    },
    {
      id: 'settings',
      title: 'Cài đặt giao diện & Hệ thống',
      description: 'Tùy chỉnh Dark Mode và cấu hình trải nghiệm người dùng',
      icon: <Sliders className="w-4 h-4" />,
      category: 'Hệ thống',
      action: () => setShowSettingsModal(true)
    }
  ];

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const profileRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpgradeClick = () => {
    setIsProfileOpen(false);
    if (currentTab !== 'home') {
      onTabChange('home');
      setTimeout(() => {
        const el = document.getElementById('dichvu');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    } else {
      const el = document.getElementById('dichvu');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const currentEmail = user?.email || 'longvu24112005@gmail.com';
  const currentFullName = user?.fullName || currentEmail;
  const progressPercent = Math.max(0, Math.min(100, (remainingQuestions / totalQuestions) * 100));

  const isDarkTheme = isDarkMode;

  return (
    <header className={`sticky top-0 z-40 w-full transition-colors ${
      isDarkTheme 
        ? 'border-b border-[#272967] bg-[#181818]/95 backdrop-blur-md shadow-xs' 
        : 'border-b border-[#d8d8d8] bg-white/95 backdrop-blur-md shadow-xs'
    }`}>
      <div className="w-full max-w-[1440px] mx-auto px-2.5 sm:px-4 lg:px-6 h-16 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Brand & Logo - VLAW / Chatbot Hỗ Trợ Pháp Luật Đại Cương */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0" 
          onClick={() => onTabChange('home')}
        >
          <div className="relative">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-xs text-white transition-transform group-hover:scale-105 duration-200 bg-slate-900 dark:bg-indigo-600 border border-slate-700/50">
              <Scale className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className={`font-extrabold text-sm sm:text-base tracking-tight whitespace-nowrap ${
                isDarkTheme ? 'text-white' : 'text-slate-900'
              }`}>
                VLAW
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hidden sm:inline-block">
                GD&ĐT
              </span>
            </div>
            <p className={`text-[10px] whitespace-nowrap hidden 2xl:block leading-none mt-0.5 ${
              isDarkTheme ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Trợ lý Trực Tuyến • Tra cứu & Giải Đề thi Chuẩn Barem
            </p>
          </div>
        </div>

        {/* Navigation Tabs - 4 Core AI Features */}
        <nav className={`hidden lg:flex items-center gap-1 p-1 rounded-xl border shrink-0 ${
          isDarkTheme 
            ? 'bg-slate-900/90 border-slate-800' 
            : 'bg-slate-100/90 border-slate-200 shadow-inner'
        }`}>
          <button
            onClick={() => onTabChange('home')}
            className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all select-none ${
              currentTab === 'home'
                ? isDarkTheme ? 'bg-slate-800 text-white border border-slate-700 shadow-xs' : 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : isDarkTheme ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <span>Trang chủ</span>
          </button>

          <button
            onClick={() => onTabChange('study')}
            className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all select-none ${
              currentTab === 'study'
                ? isDarkTheme ? 'bg-slate-800 text-white border border-slate-700 shadow-xs' : 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                : isDarkTheme ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isDarkTheme ? 'text-indigo-400' : 'text-indigo-600'}`} />
            <span>Hỏi đáp</span>
          </button>

          <button
            onClick={() => onTabChange('laws')}
            className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all select-none ${
              currentTab === 'laws'
                ? isDarkTheme ? 'bg-slate-800 text-white border border-slate-700 shadow-xs' : 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                : isDarkTheme ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <BookOpen className={`w-3.5 h-3.5 ${isDarkTheme ? 'text-indigo-400' : 'text-indigo-600'}`} />
            <span>Tra cứu</span>
          </button>

          <button
            onClick={() => onTabChange('review')}
            className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all select-none relative ${
              currentTab === 'review'
                ? isDarkTheme ? 'bg-slate-800 text-white border border-slate-700 shadow-xs' : 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                : isDarkTheme ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${isDarkTheme ? 'text-indigo-400' : 'text-indigo-600'}`} />
            <span>Rà soát</span>
            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full text-white tracking-wider ml-0.5 bg-indigo-600 dark:bg-indigo-500">
              Mới
            </span>
          </button>

          {/* Admin / Council only tabs (Chỉ hiển thị khi đã đăng nhập với vai trò Admin) */}
          {isAuthenticated && role === 'admin' && (
            <>
              <button
                onClick={() => onTabChange('council')}
                className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all select-none ${
                  currentTab === 'council'
                    ? isDarkTheme ? 'bg-slate-800 text-white border border-slate-700 shadow-xs' : 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                    : isDarkTheme ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                <span>Hội đồng</span>
              </button>

              <button
                onClick={() => onTabChange('admin')}
                className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all select-none ${
                  currentTab === 'admin'
                    ? isDarkTheme ? 'bg-slate-800 text-white border border-slate-700 shadow-xs' : 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                    : isDarkTheme ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-indigo-500" />
                <span>Quản trị</span>
              </button>
            </>
          )}
        </nav>

        {/* Quick Command Search Button (Ctrl + K) & THEME TOGGLE & USER AUTH SECTION */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0" ref={profileRef}>
          {/* Nút tìm kiếm nhanh Ctrl+K */}
          <QuickTooltip content="Mở tìm kiếm nhanh (Ctrl + K)">
            <button
              type="button"
              onClick={() => setIsCommandOpen(true)}
              className={`whitespace-nowrap flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shadow-xs cursor-pointer select-none shrink-0 ${
                isDarkTheme
                  ? 'bg-[#0a0b0f] hover:bg-[#151822] text-[#b2b8cd] hover:text-white border border-[#1f1e2a]'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 border border-slate-200/90'
              }`}
            >
              <Search className={`w-3.5 h-3.5 ${isDarkTheme ? 'text-[#8f94a6]' : 'text-slate-400'}`} />
              <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-mono shadow-2xs ${
                isDarkTheme ? 'bg-[#151822] border border-[#1f1e2a] text-[#8f94a6]' : 'bg-white border border-slate-200 text-slate-500'
              }`}>
                Ctrl K
              </kbd>
            </button>
          </QuickTooltip>

          {/* NÚT CHUYỂN ĐỔI CHẾ ĐỘ SÁNG / TỐI (LIGHT / DARK THEME TOGGLE) */}
          <QuickTooltip content={isDarkMode ? "Chuyển sang Giao diện Sáng (Light Mode)" : "Chuyển sang Giao diện Tối (Dark Mode)"}>
            <button
              type="button"
              onClick={() => handleToggleDarkMode(!isDarkMode)}
              aria-label="Chuyển chế độ Sáng / Tối"
              className={`px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shadow-xs cursor-pointer select-none flex items-center gap-1.5 border ${
                isDarkTheme
                  ? 'bg-[#0a0b0f] hover:bg-[#151822] text-amber-300 border-[#1f1e2a] hover:border-amber-400/40 hover:shadow-[0_0_12px_rgba(251,191,36,0.2)]'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200/90 hover:border-amber-500/40'
              }`}
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 transition-transform hover:rotate-90 duration-300" />
                  <span className="hidden xl:inline text-[11px] text-[#dee1ea]">Sáng</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700 transition-transform hover:-rotate-12 duration-300" />
                  <span className="hidden xl:inline text-[11px] text-slate-700">Tối</span>
                </>
              )}
            </button>
          </QuickTooltip>

          {isAuthenticated && user ? (
            <>
              {/* Nút 👑 Nâng cấp (chỉ hiển thị cho sinh viên / người dùng) */}
              {role !== 'admin' && (
                <QuickTooltip content="Xem bảng giá và nâng cấp số lượt hỏi">
                  <button
                    type="button"
                    onClick={handleUpgradeClick}
                    className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0"
                  >
                    <Crown className="w-3.5 h-3.5 fill-current shrink-0" />
                    <span>Nâng cấp</span>
                  </button>
                </QuickTooltip>
              )}

              {/* Pill "X câu hỏi còn lại" (30 câu/tháng) */}
              <QuickTooltip content={`Hạn mức còn lại: ${remainingQuestions}/${totalQuestions} câu trong chu kỳ`}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="whitespace-nowrap px-2.5 sm:px-3 py-1.5 rounded-full bg-[#e0f2fe] hover:bg-[#bae6fd] text-[#0369a1] border border-[#bae6fd] text-xs font-semibold transition-all select-none hidden xl:flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span className="font-extrabold text-[#0284c7]">{remainingQuestions}</span>
                  <span className="hidden 2xl:inline"> câu hỏi</span>
                  <span> còn lại</span>
                </button>
              </QuickTooltip>


              {/* Avatar Icon (Hình người vòng tròn xanh lá) */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#70ad47] hover:ring-2 hover:ring-emerald-400 p-0.5 border-2 border-white shadow-xs flex items-center justify-center transition-all cursor-pointer overflow-hidden shrink-0"
                  title="Tài khoản cá nhân"
                >
                  <svg className="w-full h-full" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="20" fill="#70ad47" />
                    <path d="M10 40 C10 31 15 27 20 27 C25 27 30 31 30 40 Z" fill="#ffffff" />
                    <polygon points="18.5,27 21.5,27 20.5,35 19.5,35" fill="#c00000" />
                    <circle cx="20" cy="18" r="7" fill="#fde3c8" />
                    <path d="M13 18 C13 11 17 9.5 20 9.5 C23 9.5 27 11 27 18 C26 13.5 24 12.5 20 12.5 C16 12.5 14 13.5 13 18 Z" fill="#2d241e" />
                  </svg>
                </button>

                {/* =========================================================================
                    DROPDOWN MENU CARD (CHÍNH XÁC THEO ẢNH CHỤP MÀN HÌNH CỦA NGƯỜI DÙNG)
                    ========================================================================= */}
                {isProfileOpen && (
                  <div className="absolute right-0 top-12 w-[295px] sm:w-[315px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 z-50 animate-modal-in text-slate-800">
                    {/* 1. Header: Avatar + Tên tài khoản / Email */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-emerald-300">
                        <svg className="w-full h-full" viewBox="0 0 40 40">
                          <circle cx="20" cy="20" r="20" fill="#70ad47" />
                          <path d="M10 40 C10 31 15 27 20 27 C25 27 30 31 30 40 Z" fill="#ffffff" />
                          <polygon points="18.5,27 21.5,27 20.5,35 19.5,35" fill="#c00000" />
                          <circle cx="20" cy="18" r="7" fill="#fde3c8" />
                          <path d="M13 18 C13 11 17 9.5 20 9.5 C23 9.5 27 11 27 18 C26 13.5 24 12.5 20 12.5 C16 12.5 14 13.5 13 18 Z" fill="#2d241e" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-900 truncate">
                          {currentEmail}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {currentFullName}
                        </div>
                      </div>
                    </div>

                    {/* 2. Quota Box: "Số câu hỏi còn lại" (Miễn phí 30 câu/tháng) */}
                    <div className="my-4 p-4 rounded-2xl bg-[#edf7ff] border border-[#d6ebff] space-y-2">
                      <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                        <span>Số câu hỏi còn lại</span>
                        <span className="text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.2 rounded-full">30 câu/tháng</span>
                      </div>
                      <div className="text-sm font-semibold text-slate-700">
                        <span className={`font-extrabold text-base ${remainingQuestions <= 5 ? 'text-red-500' : 'text-[#ec2227]'}`}>
                          {remainingQuestions}
                        </span>
                        <span className="text-slate-500">/{totalQuestions}</span>
                      </div>
                      {/* Dynamic Blue Progress Bar */}
                      <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden my-2">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            remainingQuestions <= 5 ? 'bg-red-500' : 'bg-[#0055ff]'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      {/* Expiration date row */}
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Hết hạn:</span>
                        </span>
                        <span className="font-bold text-slate-800">12/11/2026 19:54</span>
                      </div>
                    </div>

                    {/* 3. Navigation List Items */}
                    <div className="space-y-0.5 text-xs font-medium text-slate-700">
                      {/* Nhóm Tài khoản & Lịch sử */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          setShowProfileModal(true);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors text-left"
                      >
                        <User className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>Thông tin tài khoản</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          setShowUsageModal(true);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors text-left"
                      >
                        <History className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>Lịch sử sử dụng</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          setShowSavedConversationsModal(true);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors text-left"
                      >
                        <Bookmark className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>Danh sách hội thoại đã lưu</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          setShowTransactionsModal(true);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors text-left"
                      >
                        <Package className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>Lịch sử giao dịch & Hóa đơn</span>
                      </button>

                      {/* Divider */}
                      <div className="border-t border-slate-100 my-1.5" />

                      {/* Nhóm Gói dịch vụ & Tích hợp API */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          setShowPricingModal(true);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-rose-50 text-slate-700 hover:text-[#ec2227] transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="font-semibold text-slate-900 group-hover:text-[#ec2227]">Gói dịch vụ & Bảng giá</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-[#ec2227]">Mới</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          setShowApiModal(true);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors text-left"
                      >
                        <Code2 className="w-4 h-4 text-sky-500 shrink-0" />
                        <span>Tích hợp API hệ thống</span>
                      </button>

                      {/* Divider */}
                      <div className="border-t border-slate-100 my-1.5" />

                      {/* Nhóm Cài đặt, Hỗ trợ & Bảo mật */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          setShowSettingsModal(true);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors text-left"
                      >
                        <Settings className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>Cài đặt hệ thống</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          setShowSupportModal(true);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <Headphones className="w-4 h-4 text-[#ec2227] shrink-0" />
                          <span>Hỗ trợ & Góp ý</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          0366 015 348
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          setShowChangePasswordModal(true);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors text-left"
                      >
                        <KeyRound className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>Đổi mật khẩu</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          logout();
                          onTabChange('home');
                          toast.success('Đã đăng xuất tài khoản', 'Phiên làm việc đã kết thúc an toàn. Đã chuyển về Trang chủ.');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-50 text-slate-700 hover:text-[#ec2227] transition-colors text-left font-semibold cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-red-500 shrink-0" />
                        <span>Thoát (Đăng xuất)</span>
                      </button>
                    </div>

                    {/* 4. Divider */}
                    <div className="border-t border-slate-100 my-2.5" />

                    {/* 5. Dark Mode Toggle Switch */}
                    <div className="flex items-center justify-between px-3 py-1 text-xs text-slate-700 font-medium">
                      <div className="flex items-center gap-3">
                        {isDarkMode ? <Moon className="w-4 h-4 text-amber-400 shrink-0" /> : <Sun className="w-4 h-4 text-amber-500 shrink-0" />}
                        <span>Giao diện tối</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleDarkMode(!isDarkMode)}
                        className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                          isDarkMode ? 'bg-slate-900' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                            isDarkMode ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Logout Button */}
              <button
                type="button"
                onClick={() => {
                  logout();
                  onTabChange('home');
                  toast.success('Đã đăng xuất tài khoản', 'Đã chuyển về Trang chủ an toàn.');
                }}
                className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/90 hover:bg-[#ec2227] text-rose-700 hover:text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
                title="Đăng xuất khỏi hệ thống"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>Đăng xuất</span>
              </button>
            </>
          ) : (
            /* Khi CHƯA ĐĂNG NHẬP: Hiển thị lời kêu gọi và các nút Đăng nhập / Đăng ký */
            <div className="flex items-center gap-2 shrink-0">
              <span className={`whitespace-nowrap shrink-0 hidden 2xl:inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border ${
                isDarkTheme
                  ? 'text-[#9182f8] bg-[#7064f2]/10 border-[#7064f2]/20'
                  : 'text-rose-600 bg-rose-50 border-rose-200'
              }`}>
                <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isDarkTheme ? 'text-[#7064f2]' : 'text-rose-500'}`} />
                <span>30 câu hỏi miễn phí</span>
              </span>

              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className={`whitespace-nowrap shrink-0 flex items-center gap-1.5 text-xs font-medium rounded-xl h-8 px-3 transition-all ${
                  isDarkTheme
                    ? 'border border-[#1f1e2a] bg-[#151822] hover:bg-[#1f1e2a] text-[#dee1ea]'
                    : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <LogIn className={`w-3.5 h-3.5 shrink-0 ${isDarkTheme ? 'text-[#8f94a6]' : 'text-slate-500'}`} />
                <span>Đăng nhập</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="whitespace-nowrap shrink-0 flex items-center gap-1.5 text-xs font-bold rounded-xl h-8 px-3.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 shadow-sm transition-all"
              >
                <UserPlus className="w-3.5 h-3.5 shrink-0 text-white" />
                <span>Đăng ký</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile & Change Password Modals */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />

      {/* History & Bookmarking & Transactions Modals */}
      <UsageHistoryModal
        isOpen={showUsageModal}
        onClose={() => setShowUsageModal(false)}
        onSelectQuery={onSelectQuery}
      />

      <SavedConversationsModal
        isOpen={showSavedConversationsModal}
        onClose={() => setShowSavedConversationsModal(false)}
        onSelectQuery={onSelectQuery}
      />

      <TransactionHistoryModal
        isOpen={showTransactionsModal}
        onClose={() => setShowTransactionsModal(false)}
      />

      {/* Services, API, Support & Settings Modals */}
      <PricingPackagesModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
      />

      <ApiIntegrationModal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
      />

      <SupportFeedbackModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Global Command Palette (Ctrl + K) */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        items={commandItems}
      />
    </header>
  );
};
