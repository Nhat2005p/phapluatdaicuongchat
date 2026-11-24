import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

export interface OAuthProviderStatus {
  configured: boolean;
  mode: 'code' | 'token' | 'unconfigured';
  clientId?: string;
  appId?: string;
  redirectUri: string;
}

export interface OAuthProvidersMap {
  google: OAuthProviderStatus;
  facebook: OAuthProviderStatus;
}

export interface SocialLoginResult {
  success: boolean;
  message?: string;
  cancelled?: boolean;
  unconfigured?: boolean;
  provider?: 'google' | 'facebook';
  redirectUri?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  isUnlimited: boolean;
  remainingQuestions: number;
  totalQuestions: number;
  oauthProviders: OAuthProvidersMap | null;
  login: (emailOrUser: string, pass: string) => Promise<boolean>;
  socialLogin: (provider: 'google' | 'facebook') => Promise<SocialLoginResult>;
  refreshOAuthProviders: () => Promise<OAuthProvidersMap | null>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
  decrementQuota: (newRemaining?: number, newTotalQuota?: number) => void;
}

declare global {
  interface Window {
    google?: any;
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

function loadExternalScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Không thể tải SDK: ${src}`)), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`Không thể tải SDK xác thực: ${src}`));
    document.head.appendChild(script);
  });
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('vietlaw_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [oauthProviders, setOauthProviders] = useState<OAuthProvidersMap | null>(null);
  const isUnlimited = user?.role === 'admin' || Boolean(user?.isUnlimited);
  const totalQuestions = user?.questionsQuota ?? 30;
  const remainingQuestions = isUnlimited
    ? 999999
    : user?.remainingQuestions !== undefined
      ? user.remainingQuestions
      : Math.max(0, totalQuestions - (user?.questionsUsed ?? 0));

  const applyAuthenticatedSession = useCallback((jwtToken: string, authUser: User) => {
    localStorage.setItem('vietlaw_token', jwtToken);
    localStorage.removeItem('vietlaw_remaining_quota');
    setToken(jwtToken);
    setUser(authUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('vietlaw_token');
    localStorage.removeItem('vietlaw_remaining_quota');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const activeToken = localStorage.getItem('vietlaw_token') || token;
    if (!activeToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        logout();
      }
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [token, logout]);

  const refreshOAuthProviders = useCallback(async (): Promise<OAuthProvidersMap | null> => {
    try {
      const res = await api.getOAuthProviders(window.location.origin);
      if (res.success && res.google && res.facebook) {
        const map: OAuthProvidersMap = {
          google: res.google,
          facebook: res.facebook
        };
        setOauthProviders(map);

        if (map.google.mode === 'token' && map.google.clientId) {
          loadExternalScript('https://accounts.google.com/gsi/client', 'google-gsi-sdk').catch(() => {});
        }
        if (map.facebook.mode === 'token' && map.facebook.appId) {
          loadExternalScript('https://connect.facebook.net/vi_VN/sdk.js', 'facebook-jssdk')
            .then(() => {
              if (window.FB && map.facebook.appId) {
                window.FB.init({
                  appId: map.facebook.appId,
                  cookie: true,
                  xfbml: false,
                  version: 'v19.0'
                });
              }
            })
            .catch(() => {});
        }
        return map;
      }
    } catch {
      // ignore network error during background probe
    }
    return null;
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    refreshOAuthProviders();
  }, [refreshOAuthProviders]);

  const login = async (emailOrUser: string, pass: string): Promise<boolean> => {
    try {
      const res = await api.login(emailOrUser, pass);
      if (res.success && res.token && res.user) {
        applyAuthenticatedSession(res.token, res.user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const runServerOAuthPopup = (provider: 'google' | 'facebook'): Promise<SocialLoginResult> => {
    return new Promise((resolve) => {
      const width = 520;
      const height = 640;
      const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
      const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));

      localStorage.removeItem('vlaw_oauth_result');

      const oauthUrl = `/api/v1/auth/oauth/${provider}?origin=${encodeURIComponent(window.location.origin)}`;
      const popup = window.open(
        oauthUrl,
        `vlaw_oauth_${provider}`,
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      if (!popup) {
        resolve({
          success: false,
          message: 'Trình duyệt đã chặn cửa sổ bật lên (Popup). Vui lòng cho phép Popup trên trang này và thử lại.'
        });
        return;
      }

      let settled = false;
      let bc: BroadcastChannel | null = null;

      const cleanup = () => {
        window.removeEventListener('message', onMessage);
        window.removeEventListener('storage', onStorage);
        if (bc) {
          try {
            bc.close();
          } catch {}
        }
        clearInterval(closeWatchTimer);
        clearTimeout(timeoutTimer);
      };

      const handlePayload = (data: any) => {
        if (!data || data.type !== 'VLAW_OAUTH_RESULT' || data.provider !== provider || settled) {
          return;
        }
        settled = true;
        cleanup();
        localStorage.removeItem('vlaw_oauth_result');

        if (data.success && data.token && data.user) {
          applyAuthenticatedSession(data.token, data.user);
          resolve({
            success: true,
            provider,
            message: data.message || 'Đăng nhập thành công!'
          });
        } else {
          resolve({
            success: false,
            provider,
            message: data.message || 'Xác thực không thành công.'
          });
        }
      };

      const onMessage = (event: MessageEvent) => {
        handlePayload(event.data);
      };

      const onStorage = (event: StorageEvent) => {
        if (event.key === 'vlaw_oauth_result' && event.newValue) {
          try {
            handlePayload(JSON.parse(event.newValue));
          } catch {}
        }
      };

      window.addEventListener('message', onMessage);
      window.addEventListener('storage', onStorage);

      if (typeof BroadcastChannel !== 'undefined') {
        try {
          bc = new BroadcastChannel('vlaw_oauth_channel');
          bc.onmessage = (ev) => handlePayload(ev.data);
        } catch {}
      }

      const closeWatchTimer = window.setInterval(() => {
        if (popup.closed && !settled) {
          // Đợi 350ms để nhận nốt postMessage / BroadcastChannel cuối cùng trước khi kết luận hủy
          window.setTimeout(() => {
            if (!settled) {
              const rawStored = localStorage.getItem('vlaw_oauth_result');
              if (rawStored) {
                try {
                  handlePayload(JSON.parse(rawStored));
                  return;
                } catch {}
              }
              settled = true;
              cleanup();
              resolve({
                success: false,
                cancelled: true,
                provider,
                message: 'Đã đóng cửa sổ xác thực trước khi hoàn tất đăng nhập.'
              });
            }
          }, 350);
        }
      }, 450);

      const timeoutTimer = window.setTimeout(() => {
        if (!settled) {
          settled = true;
          cleanup();
          try {
            popup.close();
          } catch {}
          resolve({
            success: false,
            provider,
            message: 'Quá thời gian chờ xác thực OAuth. Vui lòng thử lại.'
          });
        }
      }, 5 * 60 * 1000);
    });
  };

  const runGoogleTokenFlow = async (clientId: string): Promise<SocialLoginResult> => {
    try {
      await loadExternalScript('https://accounts.google.com/gsi/client', 'google-gsi-sdk');
      if (!window.google?.accounts?.oauth2) {
        return {
          success: false,
          provider: 'google',
          message: 'Không thể khởi tạo Google Identity Services. Vui lòng kiểm tra kết nối mạng.'
        };
      }

      return await new Promise<SocialLoginResult>((resolve) => {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          prompt: 'select_account',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.error || !tokenResponse?.access_token) {
              resolve({
                success: false,
                provider: 'google',
                message: tokenResponse?.error_description || 'Đã hủy hoặc từ chối đăng nhập Google.'
              });
              return;
            }
            const verifyRes = await api.googleTokenLogin({ accessToken: tokenResponse.access_token });
            if (verifyRes.success && verifyRes.token && verifyRes.user) {
              applyAuthenticatedSession(verifyRes.token, verifyRes.user);
              resolve({
                success: true,
                provider: 'google',
                message: verifyRes.message
              });
            } else {
              resolve({
                success: false,
                provider: 'google',
                message: verifyRes.message || 'Xác thực Google thất bại.'
              });
            }
          },
          error_callback: (err: any) => {
            resolve({
              success: false,
              cancelled: err?.type === 'popup_closed',
              provider: 'google',
              message:
                err?.type === 'popup_failed_to_open'
                  ? 'Trình duyệt đã chặn cửa sổ bật lên (Popup) của Google.'
                  : 'Đã đóng cửa sổ đăng nhập Google.'
            });
          }
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
      });
    } catch (err: any) {
      return {
        success: false,
        provider: 'google',
        message: err.message || 'Lỗi kết nối dịch vụ xác thực Google.'
      };
    }
  };

  const runFacebookTokenFlow = async (appId: string): Promise<SocialLoginResult> => {
    try {
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        return {
          success: false,
          provider: 'facebook',
          message: 'Facebook OAuth yêu cầu truy cập qua localhost hoặc HTTPS.'
        };
      }

      await loadExternalScript('https://connect.facebook.net/vi_VN/sdk.js', 'facebook-jssdk');
      if (!window.FB) {
        return {
          success: false,
          provider: 'facebook',
          message: 'Không thể tải Facebook Login SDK (có thể bị chặn bởi trình chặn quảng cáo).'
        };
      }

      window.FB.init({
        appId,
        cookie: true,
        xfbml: false,
        version: 'v19.0'
      });

      return await new Promise<SocialLoginResult>((resolve) => {
        window.FB.login(
          async (response: any) => {
            const accessToken = response?.authResponse?.accessToken;
            if (!accessToken) {
              resolve({
                success: false,
                cancelled: true,
                provider: 'facebook',
                message: 'Bạn đã hủy hoặc chưa cấp quyền đăng nhập Facebook.'
              });
              return;
            }
            const verifyRes = await api.facebookTokenLogin({ accessToken });
            if (verifyRes.success && verifyRes.token && verifyRes.user) {
              applyAuthenticatedSession(verifyRes.token, verifyRes.user);
              resolve({
                success: true,
                provider: 'facebook',
                message: verifyRes.message
              });
            } else {
              resolve({
                success: false,
                provider: 'facebook',
                message: verifyRes.message || 'Xác thực Facebook thất bại.'
              });
            }
          },
          { scope: 'public_profile,email' }
        );
      });
    } catch (err: any) {
      return {
        success: false,
        provider: 'facebook',
        message: err.message || 'Lỗi kết nối dịch vụ xác thực Facebook.'
      };
    }
  };

  const socialLogin = async (provider: 'google' | 'facebook'): Promise<SocialLoginResult> => {
    let currentMap = oauthProviders;
    let info = currentMap?.[provider];

    // Nếu đã cấu hình mode === 'code', mở popup ngay lập tức trong call-stack click để tránh bị chặn popup
    if (info?.mode === 'code') {
      return runServerOAuthPopup(provider);
    }

    if (info?.mode === 'token') {
      if (provider === 'google' && info.clientId) {
        return runGoogleTokenFlow(info.clientId);
      }
      if (provider === 'facebook' && info.appId) {
        return runFacebookTokenFlow(info.appId);
      }
    }

    // Kiểm tra lại cấu hình từ máy chủ (phòng trường hợp người dùng vừa cập nhật file .env)
    currentMap = await refreshOAuthProviders();
    info = currentMap?.[provider];

    if (!info || !info.configured || info.mode === 'unconfigured') {
      const defaultCallback = `${window.location.origin}/api/v1/auth/oauth/${provider}/callback`;
      return {
        success: false,
        unconfigured: true,
        provider,
        redirectUri: info?.redirectUri || defaultCallback,
        message:
          provider === 'google'
            ? 'Chưa cấu hình khóa xác thực Google OAuth 2.0 (GOOGLE_CLIENT_ID) trong tệp .env.'
            : 'Chưa cấu hình khóa xác thực Facebook OAuth (FACEBOOK_APP_ID) trong tệp .env.'
      };
    }

    if (info.mode === 'code') {
      return runServerOAuthPopup(provider);
    }
    if (provider === 'google' && info.clientId) {
      return runGoogleTokenFlow(info.clientId);
    }
    if (provider === 'facebook' && info.appId) {
      return runFacebookTokenFlow(info.appId);
    }

    return {
      success: false,
      provider,
      message: 'Cấu hình OAuth chưa đầy đủ.'
    };
  };

  const decrementQuota = (newRemaining?: number, newTotalQuota?: number) => {
    setUser((prev) => {
      if (!prev) return prev;
      if (prev.role === 'admin' || prev.isUnlimited) {
        return {
          ...prev,
          questionsUsed: (prev.questionsUsed ?? 0) + 1
        };
      }
      const nextQuota = newTotalQuota !== undefined ? newTotalQuota : (prev.questionsQuota ?? 30);
      const currentRem =
        prev.remainingQuestions !== undefined
          ? prev.remainingQuestions
          : Math.max(0, nextQuota - (prev.questionsUsed ?? 0));
      const nextRem = newRemaining !== undefined ? Math.max(0, newRemaining) : Math.max(0, currentRem - 1);
      const nextUsed = Math.max(0, nextQuota - nextRem);
      return {
        ...prev,
        questionsQuota: nextQuota,
        questionsUsed: nextUsed,
        remainingQuestions: nextRem
      };
    });
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  useEffect(() => {
    const handleFocus = () => {
      if (localStorage.getItem('vietlaw_token')) {
        refreshUser();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || 'student',
        isAuthenticated: !!user,
        isLoading,
        isUnlimited,
        remainingQuestions,
        totalQuestions,
        oauthProviders,
        login,
        socialLogin,
        refreshOAuthProviders,
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
