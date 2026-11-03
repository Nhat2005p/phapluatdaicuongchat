import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User as UserIcon,
  Mail,
  Camera,
  CheckCircle2,
  AlertCircle,
  Save,
  Award,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Button } from '../ui/Button';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Preset avatars including the original green avatar from user screenshot
const PRESET_AVATARS = [
  { id: 'default_green', label: 'Mặc định (Áo trắng cà vạt)', bg: '#70ad47' },
  { id: 'blue_suit', label: 'Xanh dương (Học viện)', bg: '#2563eb' },
  { id: 'purple_scholar', label: 'Tím (Hội đồng)', bg: '#7c3aed' },
  { id: 'amber_law', label: 'Vàng cam (Công lý)', bg: '#d97706' }
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser, remainingQuestions, totalQuestions } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('default_green');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      if (user.avatarUrl) {
        if (PRESET_AVATARS.some((a) => a.id === user.avatarUrl)) {
          setSelectedAvatar(user.avatarUrl);
        } else {
          setCustomAvatarUrl(user.avatarUrl);
        }
      }
    }
    setErrorMsg('');
    setSuccessMsg('');

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [user, isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên của bạn.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const avatarUrl = customAvatarUrl.trim() || selectedAvatar;
      const res = await api.updateProfile({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        avatarUrl
      });

      if (res.success && res.user) {
        updateUser(res.user);
        setSuccessMsg('Cập nhật hồ sơ cá nhân thành công!');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.message || 'Không thể cập nhật hồ sơ.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 z-10 my-auto text-slate-800 animate-modal-in max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-30 cursor-pointer"
          title="Đóng"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="text-center pb-5 border-b border-slate-100">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#ec2227] text-xs font-bold border border-red-200 mb-2">
            <UserIcon className="w-3.5 h-3.5" />
            <span>HỒ SƠ CÁ NHÂN</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Thông tin tài khoản & Cập nhật
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Xem và chỉnh sửa họ tên, email và ảnh đại diện hiển thị của bạn
          </p>
        </div>

        {/* Alert Messages */}
        {errorMsg && (
          <div className="my-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="my-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Avatar Preview & Selection */}
          <div className="flex flex-col items-center justify-center gap-3 pb-2">
            <div className="relative group">
              <div
                className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg flex items-center justify-center text-white"
                style={{
                  backgroundColor:
                    PRESET_AVATARS.find((a) => a.id === selectedAvatar)?.bg || '#70ad47'
                }}
              >
                {customAvatarUrl.trim() ? (
                  <img
                    src={customAvatarUrl.trim()}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={() => setCustomAvatarUrl('')}
                  />
                ) : (
                  <svg className="w-full h-full" viewBox="0 0 40 40">
                    <circle
                      cx="20"
                      cy="20"
                      r="20"
                      fill={
                        PRESET_AVATARS.find((a) => a.id === selectedAvatar)?.bg || '#70ad47'
                      }
                    />
                    <path
                      d="M10 40 C10 31 15 27 20 27 C25 27 30 31 30 40 Z"
                      fill="#ffffff"
                    />
                    <polygon
                      points="18.5,27 21.5,27 20.5,35 19.5,35"
                      fill="#c00000"
                    />
                    <circle cx="20" cy="18" r="7" fill="#fde3c8" />
                    <path
                      d="M13 18 C13 11 17 9.5 20 9.5 C23 9.5 27 11 27 18 C26 13.5 24 12.5 20 12.5 C16 12.5 14 13.5 13 18 Z"
                      fill="#2d241e"
                    />
                  </svg>
                )}
              </div>
            </div>

            {/* Choose Preset Avatar Color / Style */}
            <div className="flex items-center gap-2">
              {PRESET_AVATARS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => {
                    setSelectedAvatar(av.id);
                    setCustomAvatarUrl('');
                  }}
                  className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                    selectedAvatar === av.id && !customAvatarUrl
                      ? 'ring-2 ring-offset-2 ring-slate-800 scale-110'
                      : ''
                  }`}
                  style={{ backgroundColor: av.bg }}
                  title={av.label}
                />
              ))}
            </div>
          </div>

          {/* Read-only account info row */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Tên tài khoản</span>
              <span className="font-bold text-slate-800 font-mono">@{user.username}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Hạn mức tháng này</span>
              <span className="font-bold text-[#ec2227]">
                {remainingQuestions} / {totalQuestions} câu hỏi
              </span>
            </div>
          </div>

          {/* Form Fields: Editable FullName */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              * Họ và tên
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Nguyễn Văn A"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#ec2227] focus:ring-2 focus:ring-red-100 transition-all"
            />
          </div>

          {/* Form Fields: Editable Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              * Địa chỉ Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#ec2227] focus:ring-2 focus:ring-red-100 transition-all"
            />
          </div>

          {/* Custom Avatar URL option */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Link ảnh đại diện tùy chọn (nếu có)
            </label>
            <input
              type="url"
              value={customAvatarUrl}
              onChange={(e) => setCustomAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#ec2227] transition-all"
            />
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#ec2227] hover:bg-[#d01c21] text-white font-bold rounded-xl shadow-md shadow-red-500/20 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Đang lưu thay đổi...' : 'Lưu cập nhật hồ sơ'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
