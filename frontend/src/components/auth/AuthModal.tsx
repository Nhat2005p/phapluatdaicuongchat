import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Mail,
  Scale,
  Lock,
  User,
  Phone,
  Shield,
  KeyRound,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { BorderBeam } from '../magicui/BorderBeam';
import { ShinyButton } from '../magicui/ShinyButton';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
  isDarkMode?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialTab = 'login',
  isDarkMode = false
}) => {
  const { login, socialLogin, refreshOAuthProviders } = useAuth();
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
  const [oauthLoading, setOauthLoading] = useState<'google' | 'facebook' | null>(null);
  const [oauthSetupHint, setOauthSetupHint] = useState<{
    provider: 'google' | 'facebook';
    redirectUri: string;
  } | null>(null);
  const [copiedUri, setCopiedUri] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      resetMessages();
      refreshOAuthProviders();
    }
  }, [isOpen, initialTab, refreshOAuthProviders]);

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
    setOauthSetupHint(null);
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
    setOauthLoading(null);
    setCopiedUri(false);
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
      setErrorMsg('Mật khẩu nhập lại không khớp.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.register({
        username: regUsername.trim(),
        fullName: regUsername.trim(),
        email: regEmail.trim(),
        password: regPassword
      });

      if (res.success) {
        setSuccessMsg('Đăng ký tài khoản thành công! Tự động đăng nhập...');
        setTimeout(async () => {
          await login(regUsername.trim(), regPassword);
          onClose();
          resetAll();
        }, 900);
      } else {
        setErrorMsg(res.message || 'Đăng ký không thành công. Tên đăng nhập hoặc email đã tồn tại.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Send OTP (Forgot Password Step 1)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ email hoặc username.');
      return;
    }
    setIsLoading(true);
    resetMessages();
    try {
      const res = await api.sendForgotOtp(forgotEmail.trim());
      if (res.success) {
        setForgotStep(2);
        setSuccessMsg(res.message || 'Mã xác thực đã được gửi tới email của bạn!');
        if (res.devOtp) {
          setDevOtpHint(res.devOtp);
        }
      } else {
        setErrorMsg(res.message || 'Không tìm thấy tài khoản tương ứng.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi gửi mã xác thực.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Handle Verify OTP and Reset Password (Forgot Password Step 2)
  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMsg('Vui lòng nhập đúng mã xác thực 6 chữ số.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Mật khẩu mới và mật khẩu xác nhận không khớp.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải có ít nhất 6 ký tự.');
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

  // 5. Xác thực OAuth 2.0 thật với Google & Facebook
  const handleOAuthClick = async (provider: 'google' | 'facebook') => {
    setOauthLoading(provider);
    resetMessages();
    try {
      const res = await socialLogin(provider);
      if (res.success) {
        setSuccessMsg(
          res.message ||
            `Đăng nhập ${provider === 'google' ? 'Google' : 'Facebook'} thành công!`
        );
        setTimeout(() => {
          onClose();
          resetAll();
        }, 650);
      } else if (res.unconfigured) {
        setOauthSetupHint({
          provider,
          redirectUri:
            res.redirectUri ||
            `${window.location.origin}/api/v1/auth/oauth/${provider}/callback`
        });
        setErrorMsg(
          res.message ||
            `Chưa cấu hình OAuth 2.0 cho ${provider === 'google' ? 'Google' : 'Facebook'}.`
        );
      } else if (!res.cancelled) {
        setErrorMsg(
          res.message ||
            `Xác thực ${provider === 'google' ? 'Google' : 'Facebook'} không thành công.`
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối dịch vụ xác thực OAuth.');
    } finally {
      setOauthLoading(null);
    }
  };

  const handleCopyRedirectUri = async (uri: string) => {
    try {
      await navigator.clipboard.writeText(uri);
      setCopiedUri(true);
      setTimeout(() => setCopiedUri(false), 2000);
    } catch {
      // ignore clipboard error
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Dimmed Blur Backdrop with Radial Ambient Glow */}
      <div 
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />

      {/* Main Glassmorphic Container with Magic UI BorderBeam */}
      <div className={`relative w-full max-w-[500px] max-h-[92vh] overflow-y-auto rounded-3xl p-6 sm:p-8 border z-10 my-auto transition-all ${
        isDarkMode 
          ? 'bg-slate-900/98 backdrop-blur-2xl border-slate-800 text-white shadow-[0_25px_70px_rgba(0,0,0,0.65)]' 
          : 'bg-white/98 backdrop-blur-2xl border-slate-200 text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.08)]'
      }`}>
        {/* Magic UI BorderBeam orbiting around the modal */}
        <BorderBeam
          size={280}
          duration={11}
          colorFrom="#4f46e5"
          colorTo="#38bdf8"
          borderWidth={1.5}
        />

        {/* Ambient Top Spotlight Light Mesh */}
        <div 
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-48 bg-gradient-to-b from-indigo-500/15 via-blue-500/5 to-transparent blur-3xl rounded-full"
          aria-hidden="true"
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className={`absolute top-5 right-5 p-2 rounded-full transition-all duration-200 cursor-pointer z-30 hover:rotate-90 active:scale-90 ${
            isDarkMode 
              ? 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10' 
              : 'text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200'
          }`}
          title="Đóng (Esc)"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* =========================================================================
            HEADER TITLE & EMBEDDED LOGO BADGE
            ========================================================================= */}
        <div className="text-center pt-1 pb-4 relative z-10">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <span className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 border border-slate-700/50 dark:border-indigo-400/30">
              <Scale className="w-5 h-5 text-white stroke-[2.2]" />
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase mb-1.5 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300">
            <Shield className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>HỆ THỐNG XÁC THỰC BẢO MẬT</span>
          </div>

          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            {tab === 'register' && 'Tạo Tài Khoản Mới'}
            {tab === 'login' && 'Đăng Nhập Tài Khoản'}
            {tab === 'forgot' && 'Khôi Phục Mật Khẩu'}
          </h2>

          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
            {tab === 'register' && 'Tham gia phòng luyện thi & tra cứu chuẩn Bộ GD&ĐT'}
            {tab === 'login' && 'Chào mừng bạn quay trở lại với VLaw System'}
            {tab === 'forgot' && 'Nhập email hoặc tên đăng nhập để nhận mã OTP'}
          </p>
        </div>

        {/* =========================================================================
            21ST.DEV SEGMENTED TABS: [ ĐĂNG NHẬP | ĐĂNG KÝ ]
            ========================================================================= */}
        {tab !== 'forgot' && (
          <div className={`p-1 rounded-2xl border flex items-center mb-5 relative z-10 ${
            isDarkMode 
              ? 'bg-slate-800/90 border-slate-700' 
              : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => {
                setTab('login');
                resetMessages();
              }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                tab === 'login'
                  ? isDarkMode
                    ? 'bg-indigo-600 text-white shadow-md border border-indigo-500'
                    : 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : isDarkMode
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Đăng nhập</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                resetMessages();
              }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                tab === 'register'
                  ? isDarkMode
                    ? 'bg-indigo-600 text-white shadow-md border border-indigo-500'
                    : 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : isDarkMode
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-300" />
              <span>Đăng ký</span>
            </button>
          </div>
        )}

        {/* Alert Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* =========================================================================
            TAB 1: FORM ĐĂNG KÝ
            ========================================================================= */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3 relative z-10">
            <div>
              <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Tên tài khoản <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Nhập tên tài khoản của bạn"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  required
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/25 transition-all font-medium ${
                    isDarkMode 
                      ? 'border-slate-700 bg-slate-800/80 text-white placeholder:text-slate-500' 
                      : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/25 transition-all font-medium ${
                    isDarkMode 
                      ? 'border-slate-700 bg-slate-800/80 text-white placeholder:text-slate-500' 
                      : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Số điện thoại
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  placeholder="0987654321 (không bắt buộc)"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/25 transition-all font-medium ${
                    isDarkMode 
                      ? 'border-slate-700 bg-slate-800/80 text-white placeholder:text-slate-500' 
                      : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Mật khẩu <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    className={`w-full px-3.5 py-2.5 pr-9 rounded-xl border text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/25 transition-all font-medium ${
                      isDarkMode 
                        ? 'border-slate-700 bg-slate-800/80 text-white placeholder:text-slate-500' 
                        : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Nhập lại mật khẩu <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    required
                    className={`w-full px-3.5 py-2.5 pr-9 rounded-xl border text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/25 transition-all font-medium ${
                      isDarkMode 
                        ? 'border-slate-700 bg-slate-800/80 text-white placeholder:text-slate-500' 
                        : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  >
                    {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Terms and conditions disclaimer */}
            <div className={`pt-1 text-center text-[11px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Bằng việc đăng ký, bạn đồng ý với{' '}
              <span className="text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline font-semibold">Quy ước sử dụng</span> và{' '}
              <span className="text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline font-semibold">Bảo mật dữ liệu</span>.
            </div>

            {/* Shiny Submit Button */}
            <ShinyButton
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 font-bold text-sm tracking-wide shadow-md shadow-slate-900/10 dark:shadow-indigo-600/25 disabled:opacity-50"
            >
              {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản miễn phí'}
            </ShinyButton>
          </form>
        )}

        {/* =========================================================================
            TAB 2: FORM ĐĂNG NHẬP
            ========================================================================= */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5 relative z-10">
            <div>
              <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Tên tài khoản hoặc Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="longvu24112005@gmail.com"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  required
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/25 transition-all font-medium ${
                    isDarkMode 
                      ? 'border-slate-700 bg-slate-800/80 text-white placeholder:text-slate-500' 
                      : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                  }`}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Mật khẩu <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTab('forgot');
                    resetMessages();
                  }}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/25 transition-all font-medium ${
                    isDarkMode 
                      ? 'border-slate-700 bg-slate-800/80 text-white placeholder:text-slate-500' 
                      : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
              />
              <label htmlFor="rememberMe" className={`text-xs cursor-pointer select-none font-medium ${
                isDarkMode ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Ghi nhớ đăng nhập
              </label>
            </div>

            {/* Shiny Submit Button */}
            <ShinyButton
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 font-bold text-sm tracking-wide shadow-md shadow-slate-900/10 dark:shadow-indigo-600/25 disabled:opacity-50"
            >
              {isLoading ? 'Đang xác thực...' : 'Đăng nhập'}
            </ShinyButton>
          </form>
        )}

        {/* =========================================================================
            TAB 3: FORM QUÊN MẬT KHẨU
            ========================================================================= */}
        {tab === 'forgot' && (
          <div className="space-y-4 relative z-10">
            {forgotStep === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-3.5">
                <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 ${
                  isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-indigo-50/70 border-indigo-200'
                }`}>
                  <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Hệ thống sẽ gửi mã OTP xác thực 6 số từ hòm thư quản trị <strong className="font-semibold text-slate-900 dark:text-white">nhatpham.241105@gmail.com</strong> tới email tài khoản của bạn để đặt lại mật khẩu mới.
                  </p>
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Email hoặc Tên đăng nhập của bạn <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="example@gmail.com hoặc tên đăng nhập"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/25 transition-all font-medium ${
                        isDarkMode 
                          ? 'border-slate-700 bg-slate-800/80 text-white placeholder:text-slate-500' 
                          : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                      }`}
                    />
                  </div>
                </div>

                <ShinyButton
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 font-bold text-sm tracking-wide shadow-md shadow-slate-900/10 dark:shadow-indigo-600/25 disabled:opacity-50"
                >
                  {isLoading ? 'Đang gửi mã...' : 'Gửi mã OTP qua Email'}
                </ShinyButton>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtpAndReset} className="space-y-3.5">
                <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    Mã xác thực đã được gửi từ <strong className="text-blue-900 dark:text-blue-300 font-semibold">nhatpham.241105@gmail.com</strong> tới hộp thư <strong className="text-slate-900 dark:text-white font-semibold">{forgotEmail}</strong>. Vui lòng mở email của bạn, lấy mã 6 chữ số và nhập vào ô bên dưới.
                  </p>
                </div>

                {devOtpHint && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs flex items-center justify-between">
                    <span>Mã OTP máy chủ cấp:</span>
                    <strong className="font-mono text-sm tracking-widest bg-amber-500/20 px-2 py-0.5 rounded">{devOtpHint}</strong>
                  </div>
                )}

                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Mã OTP xác thực (6 số) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="••••••"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      required
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm font-mono tracking-widest text-center focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/25 transition-all ${
                        isDarkMode 
                          ? 'border-slate-700 bg-slate-800/80 text-white placeholder:text-slate-500' 
                          : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/25 transition-all font-medium ${
                        isDarkMode 
                          ? 'border-slate-700 bg-slate-800/80 text-white placeholder:text-slate-500' 
                          : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Nhập lại mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/25 transition-all font-medium ${
                        isDarkMode 
                          ? 'border-slate-700 bg-slate-800/80 text-white placeholder:text-slate-500' 
                          : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                      }`}
                    />
                  </div>
                </div>

                <ShinyButton
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 font-bold text-sm tracking-wide shadow-md shadow-slate-900/10 dark:shadow-indigo-600/25 disabled:opacity-50"
                >
                  {isLoading ? 'Đang đổi mật khẩu...' : 'Xác nhận & Đổi mật khẩu'}
                </ShinyButton>
              </form>
            )}

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  resetMessages();
                }}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                  isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Quay lại trang Đăng nhập</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            DIVIDER: "HOẶC TIẾP TỤC VỚI"
            ========================================================================= */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className={`w-full border-t ${isDarkMode ? 'border-[#272967]' : 'border-slate-200'}`} />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className={`px-3 font-bold uppercase tracking-wider text-[10px] ${
              isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-400'
            }`}>
              HOẶC TIẾP TỤC VỚI
            </span>
          </div>
        </div>

        {/* =========================================================================
            SOCIAL BUTTONS: GOOGLE & FACEBOOK (REAL OAUTH 2.0)
            ========================================================================= */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Google Button */}
          <button
            type="button"
            disabled={isLoading || oauthLoading !== null}
            onClick={() => handleOAuthClick('google')}
            className={`w-full py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${
              isDarkMode 
                ? 'border-slate-700 bg-slate-800/80 hover:bg-[#202028] text-slate-200 hover:border-slate-500' 
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:border-slate-300'
            }`}
          >
            {oauthLoading === 'google' ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500 shrink-0" />
            ) : (
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
            )}
            <span className="font-semibold">
              {oauthLoading === 'google' ? 'Đang kết nối...' : 'Google'}
            </span>
          </button>

          {/* Facebook Button */}
          <button
            type="button"
            disabled={isLoading || oauthLoading !== null}
            onClick={() => handleOAuthClick('facebook')}
            className={`w-full py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${
              isDarkMode 
                ? 'border-slate-700 bg-slate-800/80 hover:bg-[#202028] text-slate-200 hover:border-slate-500' 
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:border-slate-300'
            }`}
          >
            {oauthLoading === 'facebook' ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#1877F2] shrink-0" />
            ) : (
              <svg className="w-4 h-4 shrink-0" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            )}
            <span className="font-semibold">
              {oauthLoading === 'facebook' ? 'Đang kết nối...' : 'Facebook'}
            </span>
          </button>
        </div>

        {/* Hướng dẫn nhanh nếu chưa điền Client ID / App ID vào .env */}
        {oauthSetupHint && (
          <div className={`mt-3 p-3 rounded-2xl border text-[11px] leading-relaxed space-y-2 ${
            isDarkMode
              ? 'bg-slate-800/80 border-slate-700 text-slate-300'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <div className="font-bold text-indigo-600 dark:text-indigo-400">
              Hướng dẫn kích hoạt OAuth 2.0 ({oauthSetupHint.provider === 'google' ? 'Google Cloud Console' : 'Meta for Developers'}):
            </div>
            <div>
              1. Mở tệp <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-900 font-mono">.env</code> ở thư mục gốc và điền{' '}
              {oauthSetupHint.provider === 'google' ? (
                <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-900 font-mono">GOOGLE_CLIENT_ID</code>
              ) : (
                <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-900 font-mono">FACEBOOK_APP_ID</code>
              )}{' '}
              (kèm Secret nếu dùng Authorization Code Flow).
            </div>
            <div>
              2. Khai báo Redirect URI sau trên trang quản trị ứng dụng:
              <div className="mt-1 flex items-center gap-1.5">
                <code className={`flex-1 truncate px-2 py-1 rounded-lg font-mono text-[10px] border ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  {oauthSetupHint.redirectUri}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopyRedirectUri(oauthSetupHint.redirectUri)}
                  className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {copiedUri ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUri ? 'Đã chép' : 'Chép'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SUPPORT FOOTER
            ========================================================================= */}
        <div className={`mt-4 text-center text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Cần hỗ trợ?{' '}
          <a
            href="https://zalo.me/0938361919"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
          >
            Chat Zalo
          </a>{' '}
          hoặc gọi{' '}
          <a href="tel:0938361919" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
            0938 36 1919
          </a>
        </div>
      </div>
    </div>
  );
};
