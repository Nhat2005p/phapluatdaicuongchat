import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Mail
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialTab = 'login' }) => {
  const { login, demoLogin } = useAuth();
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>(initialTab);

  // Form states: Login
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Form states: Register
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Form states: Forgot Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Visibility toggles
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Loading & status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      resetMessages();
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  const resetMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  const resetAll = () => {
    resetMessages();
    setLoginIdentifier('');
    setLoginPassword('');
    setRegUsername('');
    setRegEmail('');
    setRegPhone('');
    setRegPassword('');
    setRegConfirmPassword('');
    setForgotEmail('');
    setForgotStep(1);
    setOtpCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setDevOtpHint(null);
  };

  // 1. Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    resetMessages();
    const success = await login(loginIdentifier.trim(), loginPassword);
    setIsLoading(false);
    if (success) {
      setSuccessMsg('Đăng nhập thành công!');
      setTimeout(() => {
        onClose();
        resetAll();
      }, 600);
    } else {
      setErrorMsg('Tên đăng nhập/email hoặc mật khẩu không chính xác.');
    }
  };

  // 2. Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Mật khẩu nhập lại không trùng khớp.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.register({
        username: regUsername.trim(),
        email: regEmail.trim(),
        password: regPassword,
        fullName: regUsername.trim(),
        studentId: regPhone.trim(),
        role: 'student'
      });

      if (res.success) {
        setSuccessMsg('Tạo tài khoản thành công! Đang tự động đăng nhập...');
        await login(regEmail.trim(), regPassword);
        setTimeout(() => {
          onClose();
          resetAll();
        }, 1000);
      } else {
        setErrorMsg(res.message || 'Không thể tạo tài khoản, vui lòng thử lại.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Send OTP (Forgot Password)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ email hoặc tên đăng nhập của bạn.');
      return;
    }
    setIsLoading(true);
    resetMessages();
    try {
      const res = await api.sendForgotOtp(forgotEmail.trim());
      if (res.success) {
        setForgotStep(2);
        const target = res.targetEmail || forgotEmail;
        setForgotEmail(target);
        setOtpCode('');
        setDevOtpHint(null);
        setSuccessMsg(res.message || `Mã xác thực OTP đã được gửi từ nhatpham.241105@gmail.com đến ${target}!`);
      } else {
        setErrorMsg(res.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi gửi mã xác thực.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Handle Verify OTP and Reset Password
  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Mật khẩu nhập lại không trùng khớp.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.verifyOtpAndReset(forgotEmail.trim(), otpCode.trim(), newPassword);
      if (res.success) {
        setSuccessMsg('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.');
        setTimeout(() => {
          setTab('login');
          setLoginIdentifier(forgotEmail);
          resetMessages();
        }, 1200);
      } else {
        setErrorMsg(res.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi đặt lại mật khẩu.');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Quick 1-Click Demo for Testing / Presentation
  const handleQuickDemo = async (targetRole: 'student' | 'admin') => {
    setIsLoading(true);
    resetMessages();
    const success = await demoLogin(targetRole);
    setIsLoading(false);
    if (success) {
      onClose();
      resetAll();
    } else {
      setErrorMsg('Không thể đăng nhập tài khoản mẫu.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Dimmed Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Main White Card Container */}
      <div className="relative w-full max-w-[480px] bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 z-10 my-auto text-slate-800 transition-all animate-modal-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* =========================================================================
            HEADER TITLE & ICON (Phỏng theo chuẩn giao diện mẫu)
            ========================================================================= */}
        <div className="text-center pt-2 pb-5">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <span className="w-7 h-7 rounded-lg bg-[#ec2227] text-white flex items-center justify-center font-black text-xs shadow-sm">
              AI
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {tab === 'register' && 'Tạo tài khoản miễn phí'}
              {tab === 'login' && 'Đăng nhập tài khoản'}
              {tab === 'forgot' && 'Khôi phục mật khẩu'}
            </h2>
          </div>

          {/* Subtext Navigation Switch */}
          <div className="text-xs sm:text-sm text-slate-500">
            {tab === 'register' && (
              <span>
                Bạn đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    resetMessages();
                  }}
                  className="text-[#ec2227] font-semibold hover:underline"
                >
                  Đăng nhập tại đây!
                </button>
              </span>
            )}
            {tab === 'login' && (
              <span>
                Bạn chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    resetMessages();
                  }}
                  className="text-[#ec2227] font-semibold hover:underline"
                >
                  Đăng ký tại đây!
                </button>
              </span>
            )}
            {tab === 'forgot' && (
              <span>
                Đã nhớ lại mật khẩu?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    resetMessages();
                  }}
                  className="text-[#ec2227] font-semibold hover:underline"
                >
                  Đăng nhập tại đây!
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Alert Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* =========================================================================
            TAB 1: FORM ĐĂNG KÝ (ĐÚNG THEO ẢNH SCREENSHOT 2 CỦA NGƯỜI DÙNG)
            ========================================================================= */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                * Tên tài khoản
              </label>
              <input
                type="text"
                placeholder="Nhập tên tài khoản của bạn"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#ec2227] focus:ring-2 focus:ring-red-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                * Email của bạn
              </label>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#ec2227] focus:ring-2 focus:ring-red-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                * Số điện thoại
              </label>
              <input
                type="tel"
                placeholder="0987654321"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#ec2227] focus:ring-2 focus:ring-red-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                * Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#ec2227] focus:ring-2 focus:ring-red-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                * Nhập lại mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showRegConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#ec2227] focus:ring-2 focus:ring-red-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Terms and conditions disclaimer (Chính xác như ảnh screenshot 1) */}
            <div className="pt-2 text-center text-[11px] leading-relaxed text-slate-500">
              Bạn xác nhận rằng bạn đã đọc và đồng ý với{' '}
              <span className="text-[#ec2227] cursor-pointer hover:underline">Quy ước sử dụng</span> và{' '}
              <span className="text-[#ec2227] cursor-pointer hover:underline">Chính sách bảo vệ dữ liệu cá nhân</span>{' '}
              của Chatbot Hỗ Trợ Pháp Luật Đại Cương.
            </div>

            {/* Submit Red Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#ec2227] hover:bg-[#d01c21] text-white font-bold text-sm tracking-wide shadow-md shadow-red-500/25 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
            </button>
          </form>
        )}

        {/* =========================================================================
            TAB 2: FORM ĐĂNG NHẬP
            ========================================================================= */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                * Tên tài khoản hoặc Email
              </label>
              <input
                type="text"
                placeholder="Nhập username hoặc email"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#ec2227] focus:ring-2 focus:ring-red-100 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  * Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTab('forgot');
                    resetMessages();
                  }}
                  className="text-xs font-medium text-[#ec2227] hover:underline"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#ec2227] focus:ring-2 focus:ring-red-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#ec2227] focus:ring-red-400 accent-[#ec2227]"
              />
              <label htmlFor="rememberMe" className="text-xs text-slate-600 cursor-pointer select-none">
                Ghi nhớ đăng nhập
              </label>
            </div>

            {/* Submit Red Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#ec2227] hover:bg-[#d01c21] text-white font-bold text-sm tracking-wide shadow-md shadow-red-500/25 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>
          </form>
        )}

        {/* =========================================================================
            TAB 3: FORM QUÊN MẬT KHẨU
            ========================================================================= */}
        {tab === 'forgot' && (
          <div className="space-y-4">
            {forgotStep === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-3.5">
                <div className="p-3 bg-red-50/70 rounded-xl border border-red-100 flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-[#ec2227] shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hệ thống sẽ gửi mã OTP xác thực 6 số từ hòm thư quản trị <strong className="text-slate-900 font-semibold">nhatpham.241105@gmail.com</strong> tới email tài khoản của bạn để đặt lại mật khẩu mới.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    * Email hoặc Tên đăng nhập của bạn
                  </label>
                  <input
                    type="text"
                    placeholder="example@gmail.com hoặc tên đăng nhập"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#ec2227] focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-[#ec2227] hover:bg-[#d01c21] text-white font-bold text-sm tracking-wide shadow-md shadow-red-500/25 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Đang gửi mã...' : 'Gửi mã OTP qua Email'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtpAndReset} className="space-y-3.5">
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Mã xác thực đã được gửi từ <strong className="text-blue-900 font-semibold">nhatpham.241105@gmail.com</strong> tới hộp thư <strong className="text-slate-900 font-semibold">{forgotEmail}</strong>. Vui lòng mở email của bạn, lấy mã 6 chữ số và nhập vào ô bên dưới.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    * Mã OTP xác thực (6 số nhận từ email)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Nhập 6 số từ email"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-mono tracking-widest text-center placeholder:text-slate-400 placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:border-[#ec2227] focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    * Mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#ec2227] focus:ring-2 focus:ring-red-100 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    * Nhập lại mật khẩu mới
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#ec2227] focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-[#ec2227] hover:bg-[#d01c21] text-white font-bold text-sm tracking-wide shadow-md shadow-red-500/25 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Đang đổi mật khẩu...' : 'Xác nhận & Đổi mật khẩu'}
                </button>
              </form>
            )}

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  resetMessages();
                }}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại trang Đăng nhập</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            DIVIDER: "HOẶC" (CHÍNH XÁC NHƯ ẢNH SCREENSHOT 1)
            ========================================================================= */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-slate-400 font-medium">Hoặc</span>
          </div>
        </div>

        {/* =========================================================================
            SOCIAL BUTTONS: GOOGLE & FACEBOOK (CHÍNH XÁC NHƯ ẢNH SCREENSHOT 1)
            ========================================================================= */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Google Button */}
          <button
            type="button"
            onClick={() => handleQuickDemo('student')}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            {/* Official Google G Logo SVG */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="truncate">Đăng nhập bằng Google</span>
          </button>

          {/* Facebook Button */}
          <button
            type="button"
            onClick={() => handleQuickDemo('student')}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            {/* Official Facebook Logo SVG */}
            <svg className="w-4 h-4 shrink-0" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span className="truncate">Đăng nhập bằng Facebook</span>
          </button>
        </div>

        {/* 1-Click Fast Demo Login for Evaluation & Grading */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between gap-1 text-[11px] text-slate-500 mb-1.5">
            <span className="flex items-center gap-1 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Tài khoản nghiệm thu & test nhanh:
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('student')}
              className="py-1.5 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <GraduationCap className="w-3 h-3 text-emerald-600" />
              <span>Sinh viên</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className="py-1.5 px-2.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-3 h-3 text-purple-600" />
              <span>Hội đồng / Admin</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            SUPPORT FOOTER (CHÍNH XÁC NHƯ ẢNH SCREENSHOT 1)
            ========================================================================= */}
        <div className="mt-5 text-center text-xs text-slate-500">
          Cần hỗ trợ?{' '}
          <a
            href="https://zalo.me/0938361919"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#ec2227] font-semibold hover:underline"
          >
            Chat Zalo
          </a>{' '}
          hoặc gọi{' '}
          <a href="tel:0938361919" className="text-[#ec2227] font-bold hover:underline">
            0938 36 1919
          </a>
        </div>
      </div>
    </div>
  );
};
