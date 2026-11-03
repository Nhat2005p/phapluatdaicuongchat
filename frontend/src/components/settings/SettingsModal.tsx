import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Settings,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Zap,
  Sliders,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Save,
  RotateCcw
} from 'lucide-react';
import { Button } from '../ui/Button';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: (value: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  onToggleDarkMode
}) => {
  const [responseStyle, setResponseStyle] = useState<'barem_full' | 'concise'>('barem_full');
  const [enableSound, setEnableSound] = useState(false);
  const [autoSaveHistory, setAutoSaveHistory] = useState(true);
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('vlaw_response_style', responseStyle);
    localStorage.setItem('vlaw_sound', String(enableSound));
    localStorage.setItem('vlaw_auto_save', String(autoSaveHistory));
    localStorage.setItem('vlaw_font_size', fontSize);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    setResponseStyle('barem_full');
    setEnableSound(false);
    setAutoSaveHistory(true);
    setFontSize('normal');
    onToggleDarkMode(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Main Card */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 z-10 my-auto text-slate-800 animate-modal-in max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center shadow-xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Cài đặt & Tùy chọn Hệ thống
              </h2>
              <p className="text-xs text-slate-500">
                Cấu hình giao diện tối (Dark Mode) và tùy biến trải nghiệm học tập của bạn
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

        {/* Feedback message */}
        {savedSuccess && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Đã lưu các cài đặt trải nghiệm người dùng thành công!</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 1. Dark Mode Setting */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-slate-900 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                  {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Chế độ Giao diện (Dark Mode)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Chuyển đổi giao diện sáng hoặc tối để bảo vệ mắt khi học tập ban đêm
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => onToggleDarkMode(!isDarkMode)}
                className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                  isDarkMode ? 'bg-slate-900' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform flex items-center justify-center ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                >
                  {isDarkMode ? <Moon className="w-3 h-3 text-slate-900" /> : <Sun className="w-3 h-3 text-amber-500" />}
                </div>
              </button>
            </div>
          </div>

          {/* 2. AI Response Style */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Độ chi tiết câu trả lời từ Trợ lý</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setResponseStyle('barem_full')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  responseStyle === 'barem_full'
                    ? 'border-red-500 bg-red-50/50 text-slate-900 font-semibold shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="block font-bold text-xs text-[#ec2227]">Chuẩn Giáo trình Bộ GD&ĐT</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block leading-relaxed">
                  Đầy đủ căn cứ điều luật, lý luận và bảng đối chiếu
                </span>
              </button>

              <button
                type="button"
                onClick={() => setResponseStyle('concise')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  responseStyle === 'concise'
                    ? 'border-red-500 bg-red-50/50 text-slate-900 font-semibold shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="block font-bold text-xs text-slate-900">Tóm tắt ngắn gọn</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block leading-relaxed">
                  Trọng tâm cốt lõi, tiết kiệm thời gian đọc
                </span>
              </button>
            </div>
          </div>

          {/* 3. Reading font size & Sound */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3.5">
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 block">Kích thước chữ đọc văn bản</span>
                <span className="text-slate-500 text-[11px]">Tùy chỉnh kích thước hiển thị của bài giảng và điều luật</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setFontSize('normal')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    fontSize === 'normal' ? 'bg-white font-bold text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Chuẩn
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('large')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    fontSize === 'large' ? 'bg-white font-bold text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Lớn
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 block">Tự động ghi vết vào Lịch sử sử dụng</span>
                <span className="text-slate-500 text-[11px]">Lưu lại câu hỏi sau khi Trợ lý giải xong</span>
              </div>
              <button
                type="button"
                onClick={() => setAutoSaveHistory(!autoSaveHistory)}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                  autoSaveHistory ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    autoSaveHistory ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 text-xs">
          <button
            type="button"
            onClick={handleReset}
            className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục mặc định</span>
          </button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-[#ec2227] hover:bg-[#d01c21] text-white text-xs font-bold gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu cài đặt</span>
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
