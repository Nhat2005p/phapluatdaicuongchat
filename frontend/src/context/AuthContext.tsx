import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  remainingQuestions: number;
  totalQuestions: number;
  login: (emailOrUser: string, pass: string) => Promise<boolean>;
  googleLogin: (data: { email: string; fullName?: string; googleId?: string; avatarUrl?: string }) => Promise<{ success: boolean; message?: string }>;
  demoLogin: (targetRole: UserRole) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
  decrementQuota: (newRemaining?: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('vietlaw_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [remainingQuestions, setRemainingQuestions] = useState<number>(() => {
    const stored = localStorage.getItem('vietlaw_remaining_quota');
    return stored ? parseInt(stored, 10) : 30;
  });
  const totalQuestions = 30;

  const refreshUser = async () => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        const quota = res.user.remainingQuestions !== undefined ? res.user.remainingQuestions : 30;
        setRemainingQuestions(quota);
        localStorage.setItem('vietlaw_remaining_quota', quota.toString());
      } else {
        logout();
      }
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = async (emailOrUser: string, pass: string): Promise<boolean> => {
    try {
      const res = await api.login(emailOrUser, pass);
      if (res.success && res.token && res.user) {
        localStorage.setItem('vietlaw_token', res.token);
        setToken(res.token);
        setUser(res.user);
        const quota = res.user.remainingQuestions !== undefined ? res.user.remainingQuestions : 30;
        setRemainingQuestions(quota);
        localStorage.setItem('vietlaw_remaining_quota', quota.toString());
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const googleLogin = async (data: { email: string; fullName?: string; googleId?: string; avatarUrl?: string }): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await api.googleLogin(data);
      if (res.success && res.token && res.user) {
        localStorage.setItem('vietlaw_token', res.token);
        setToken(res.token);
        setUser(res.user);
        const quota = res.user.remainingQuestions !== undefined ? res.user.remainingQuestions : 30;
        setRemainingQuestions(quota);
        localStorage.setItem('vietlaw_remaining_quota', quota.toString());
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || 'Đăng nhập Google thất bại.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi kết nối khi đăng nhập Google.' };
    }
  };

  const demoLogin = async (targetRole: UserRole): Promise<boolean> => {
    if (targetRole === 'student') {
      return login('student@dut.udn.vn', 'student123');
    } else {
      return login('admin@dut.udn.vn', 'admin123');
    }
  };

  const logout = () => {
    localStorage.removeItem('vietlaw_token');
    localStorage.removeItem('vietlaw_remaining_quota');
    setToken(null);
    setUser(null);
    setRemainingQuestions(30);
  };

  const decrementQuota = (newRemaining?: number) => {
    if (newRemaining !== undefined) {
      setRemainingQuestions(newRemaining);
      localStorage.setItem('vietlaw_remaining_quota', newRemaining.toString());
    } else {
      setRemainingQuestions((prev) => {
        const next = Math.max(0, prev - 1);
        localStorage.setItem('vietlaw_remaining_quota', next.toString());
        return next;
      });
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    if (updatedUser.remainingQuestions !== undefined) {
      setRemainingQuestions(updatedUser.remainingQuestions);
      localStorage.setItem('vietlaw_remaining_quota', updatedUser.remainingQuestions.toString());
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || 'student',
        isAuthenticated: !!user,
        isLoading,
        remainingQuestions,
        totalQuestions,
        login,
        googleLogin,
        demoLogin,
        logout,
        refreshUser,
        updateUser,
        decrementQuota
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
