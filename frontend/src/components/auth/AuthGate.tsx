import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Scale,
  Lock,
  LogIn,
  UserPlus,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';

export const AuthGate: React.FC = () => {
  const { login, demoLogin } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Form states: Login
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Form states: Register
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const resetMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMsg('Vui lòng điền đầy đủ tài khoản và mật khẩu.');
      return;
    }
    setIsLoading(true);
    resetMessages();
    const ok = await login(loginIdentifier.trim(), loginPassword);
    setIsLoading(false);
    if (ok) {
      setSuccessMsg('Đăng nhập thành công! Đang chuyển tiếp...');
    } else {
      setErrorMsg('Tên đăng nhập/email hoặc mật khẩu không chính xác.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!regUsername.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg('Vui lòng điền đầy đủ thông tin đăng ký.');
      return;
    }
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
        studentId: regStudentId.trim() || 'DUT-' + Math.floor(1000 + Math.random() * 9000),
        role: 'student'
      });

      if (res.success) {
        setSuccessMsg('Tạo tài khoản thành công! Đang tự động đăng nhập...');
        await login(regEmail.trim(), regPassword);
      } else {
        setErrorMsg(res.message || 'Không thể đăng ký, vui lòng thử lại.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (targetRole: 'student' | 'admin') => {
    setIsLoading(true);
    resetMessages();
    const ok = await demoLogin(targetRole);
    setIsLoading(false);
    if (!ok) {
      setErrorMsg('Không thể đăng nhập bằng tài khoản Demo. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] flex flex-col justify-between text-slate-800">
      {/* 1. Header Bar with Prominent Login / Register Buttons */}
      <header className="w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-4 sm:px-6 h-16 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-red-600 to-amber-500 flex items-center justify-center text-white shadow-sm">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-base text-slate-900 tracking-tight block">
              Chatbot Pháp Luật
            </span>
            <span className="text-[10px] text-slate-500 hidden sm:block leading-none mt-0.5">
              Trợ lý AI Trực Tuyến • Môn Pháp luật đại cương
            </span>
          </div>
        </div>

        {/* Visible Auth Toggle Buttons on Top Right */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              resetMessages();
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === 'login'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đăng nhập</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('register');
              resetMessages();
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              tab === 'register'
                ? 'bg-rose-700 text-white ring-2 ring-rose-400/40'
                : 'bg-[#ec2227] hover:bg-[#d01c21] text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Đăng ký</span>
          </button>
        </div>
      </header>

      {/* 2. Main Centered Authentication Gate Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-[460px] bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8 animate-fadeIn">
          {/* Top Brand Banner */}
          <div className="text-center space-y-1.5 mb-6">
            <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600 mb-1">
              <Lock className="w-3.5 h-3.5 text-rose-500" />
              <span>Yêu cầu đăng nhập</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {tab === 'login' ? 'Đăng nhập vào hệ thống' : 'Tạo tài khoản mới'}
            </h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Hệ thống yêu cầu xác thực để cấp hạn mức hỏi đáp AI và lưu lịch sử bài giải của bạn.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-5 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                resetMessages();
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                tab === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                resetMessages();
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                tab === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Đăng ký
            </button>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: LOGIN FORM */}
          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email hoặc Tên đăng nhập
                </label>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Ví dụ: student@dut.udn.vn"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Nhập mật khẩu của bạn"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 bg-slate-50/50 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}
              </button>

              {/* Quick Demo Logins Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-[11px] uppercase font-bold tracking-wider text-slate-400">
                  <span className="bg-white px-2">Hoặc đăng nhập nhanh 1-Click</span>
                </div>
              </div>

              {/* Demo Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('student')}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition-all cursor-pointer"
                  title="Tài khoản Sinh viên (30 câu/tháng)"
                >
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>Sinh viên (Demo)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('admin')}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold transition-all cursor-pointer"
                  title="Tài khoản Quản trị viên"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Quản trị (Admin)</span>
                </button>
              </div>
            </form>
          ) : (
            /* TAB 2: REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên / Tên đăng nhập
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã sinh viên / Trường (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={regStudentId}
                  onChange={(e) => setRegStudentId(e.target.value)}
                  placeholder="Ví dụ: DUT-2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu (Ít nhất 6 ký tự)
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 bg-slate-50/50 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nhập lại mật khẩu
                </label>
                <input
                  type="password"
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu để xác nhận"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-[#ec2227] hover:bg-[#d01c21] text-white font-bold text-sm shadow-md transition-all disabled:opacity-60 cursor-pointer mt-2"
              >
                {isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản ngay'}
              </button>
            </form>
          )}

          {/* Card Footer Help */}
          <div className="text-center mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
            <span>Gặp khó khăn khi đăng nhập? Liên hệ hỗ trợ: </span>
            <span className="font-bold text-slate-700">0366 015 348</span>
          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <span>© 2026 Chatbot Hỗ Trợ Pháp Luật Đại Cương — Trợ lý AI Pháp luật</span>
      </footer>
    </div>
  );
};
