import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { config, reloadEnvConfig } from '../config/env.js';
import { MailService } from '../services/mailService.js';
import { getDefaultNewUserQuota, isWeeklyAutoResetEnabled } from './adminController.js';
import { PersistenceService } from '../services/persistenceService.js';
import { QuotaService } from '../services/quotaService.js';

interface OAuthStatePayload {
  provider: 'google' | 'facebook';
  origin: string;
  nonce: string;
}

function sanitizeOrigin(rawOrigin?: unknown): string {
  if (typeof rawOrigin === 'string') {
    try {
      const parsed = new URL(rawOrigin);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.origin;
      }
    } catch {
      // ignore invalid URL
    }
  }
  return config.oauth.frontendUrl || 'http://localhost:3000';
}

function getGoogleRedirectUri(frontendOrigin: string): string {
  return config.oauth.googleRedirectUri || `${frontendOrigin}/api/v1/auth/oauth/google/callback`;
}

function getFacebookRedirectUri(frontendOrigin: string): string {
  return config.oauth.facebookRedirectUri || `${frontendOrigin}/api/v1/auth/oauth/facebook/callback`;
}

function formatUserResponse(user: IUser) {
  const quotaInfo = QuotaService.computeQuotaPayload(user, getDefaultNewUserQuota());
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status || 'active',
    fullName: user.fullName,
    studentId: user.studentId,
    avatarUrl: user.avatarUrl,
    authProvider: user.authProvider || 'local',
    isUnlimited: quotaInfo.isUnlimited,
    questionsQuota: quotaInfo.questionsQuota,
    questionsUsed: quotaInfo.questionsUsed,
    remainingQuestions: quotaInfo.remainingQuestions,
    quotaResetDate: quotaInfo.quotaResetDate
  };
}

function renderOAuthCallbackPage(
  res: Response,
  payload: {
    success: boolean;
    provider: 'google' | 'facebook';
    message: string;
    token?: string;
    user?: any;
  },
  targetOrigin: string
): void {
  const fullPayload = {
    type: 'VLAW_OAUTH_RESULT',
    timestamp: Date.now(),
    ...payload
  };
  const safeJson = JSON.stringify(fullPayload).replace(/</g, '\\u003c');
  const safeOrigin = JSON.stringify(targetOrigin);
  const titleText = payload.success ? 'Đăng nhập thành công' : 'Xác thực không thành công';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titleText} - VLaw</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      max-width: 420px;
      width: 100%;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 20px;
      padding: 28px 24px;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0,0,0,0.45);
    }
    .badge {
      display: inline-flex;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      margin-bottom: 14px;
      background: ${payload.success ? 'rgba(16,185,129,0.18)' : 'rgba(244,63,94,0.18)'};
      color: ${payload.success ? '#34d399' : '#fb7185'};
      border: 1px solid ${payload.success ? 'rgba(16,185,129,0.35)' : 'rgba(244,63,94,0.35)'};
    }
    h2 { margin: 0 0 8px; font-size: 18px; }
    p { margin: 0 0 18px; font-size: 13px; color: #cbd5e1; line-height: 1.5; }
    button {
      background: #4f46e5;
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 10px 18px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">${payload.success ? '✓' : '!'}</div>
    <h2>${titleText}</h2>
    <p id="msg"></p>
    <button type="button" onclick="finishAndClose()">Đóng cửa sổ</button>
  </div>
  <script>
    const payload = ${safeJson};
    const targetOrigin = ${safeOrigin};
    document.getElementById('msg').textContent = payload.message || '';

    function deliverResult() {
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('vlaw_oauth_channel');
          bc.postMessage(payload);
          setTimeout(() => bc.close(), 300);
        }
      } catch (e) {}

      try {
        localStorage.setItem('vlaw_oauth_result', JSON.stringify(payload));
        if (payload.success && payload.token) {
          localStorage.setItem('vietlaw_token', payload.token);
        }
      } catch (e) {}

      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(payload, targetOrigin);
          if (targetOrigin !== window.location.origin) {
            window.opener.postMessage(payload, '*');
          }
        }
      } catch (e) {}
    }

    function finishAndClose() {
      window.close();
      setTimeout(() => {
        window.location.replace(targetOrigin || '/');
      }, 250);
    }

    deliverResult();
    if (payload.success) {
      setTimeout(() => {
        window.close();
        setTimeout(() => {
          if (!window.closed) {
            window.location.replace(targetOrigin || '/');
          }
        }, 350);
      }, 350);
    }
  </script>
</body>
</html>`);
}

async function upsertOAuthUserAndSignJwt(params: {
  provider: 'google' | 'facebook';
  providerId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}): Promise<{ ok: true; token: string; user: any } | { ok: false; status: number; message: string }> {
  const normalizedEmail = params.email.toLowerCase().trim();
  const idField = params.provider === 'google' ? 'googleId' : 'facebookId';

  let user = await User.findOne({
    $or: [
      { [idField]: params.providerId },
      { email: normalizedEmail }
    ]
  });

  if (user) {
    if (user.status === 'locked') {
      return {
        ok: false,
        status: 403,
        message: `Tài khoản của bạn đã bị tạm khóa. Lý do: ${user.lockReason || 'Vi phạm điều khoản'}. Vui lòng liên hệ Hotline 0366 015 348 để được hỗ trợ mở khóa.`
      };
    }

    let isModified = false;
    if (params.provider === 'google' && user.googleId !== params.providerId) {
      user.googleId = params.providerId;
      isModified = true;
    }
    if (params.provider === 'facebook' && user.facebookId !== params.providerId) {
      user.facebookId = params.providerId;
      isModified = true;
    }
    if (params.avatarUrl && (!user.avatarUrl || user.avatarUrl.includes('dicebear'))) {
      user.avatarUrl = params.avatarUrl;
      isModified = true;
    }
    if (!user.authProvider || user.authProvider === 'local') {
      user.authProvider = params.provider;
      isModified = true;
    }
    if (isModified) {
      await user.save();
      PersistenceService.saveUser(user);
    }
  } else {
    const baseUsername =
      normalizedEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || `${params.provider}_user`;
    let uniqueUsername = baseUsername;
    let suffix = 1;
    while (await User.findOne({ username: uniqueUsername })) {
      uniqueUsername = `${baseUsername}${suffix++}`;
    }

    const randomPassword = crypto.randomBytes(16).toString('hex') + 'VLaw#2026';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(randomPassword, salt);

    const displayName = params.fullName?.trim() || normalizedEmail.split('@')[0];
    const defaultAvatar =
      params.avatarUrl ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`;

    user = await User.create({
      username: uniqueUsername,
      email: normalizedEmail,
      passwordHash,
      fullName: displayName,
      role: 'student',
      status: 'active',
      avatarUrl: defaultAvatar,
      googleId: params.provider === 'google' ? params.providerId : '',
      facebookId: params.provider === 'facebook' ? params.providerId : '',
      authProvider: params.provider,
      questionsQuota: getDefaultNewUserQuota(),
      questionsUsed: 0,
      quotaResetDate: QuotaService.getNextMonday7AM()
    });

    PersistenceService.saveUser(user);
  }

  await QuotaService.ensureWeeklyQuotaCycle(
    user,
    isWeeklyAutoResetEnabled(),
    getDefaultNewUserQuota()
  );

  const token = jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
      fullName: user.fullName
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn as any }
  );

  return {
    ok: true,
    token,
    user: formatUserResponse(user)
  };
}

export class AuthController {
  // 1. Đăng ký tài khoản (hỗ trợ phân quyền role)
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password, fullName, studentId, role } = req.body;

      if (!username || !email || !password || !fullName) {
        res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các thông tin bắt buộc.' });
        return;
      }

      const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
      if (existingUser) {
        res.status(400).json({ success: false, message: 'Tên đăng nhập hoặc Email đã tồn tại trong hệ thống.' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Phân quyền: Mặc định là student, hỗ trợ moderator hoặc admin
      const assignedRole = ['student', 'moderator', 'admin'].includes(role) ? role : 'student';

      const newUser = await User.create({
        username,
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        studentId,
        role: assignedRole,
        status: 'active',
        questionsQuota: getDefaultNewUserQuota(),
        questionsUsed: 0,
        quotaResetDate: QuotaService.getNextMonday7AM()
      });

      // Lưu vĩnh viễn vào ổ cứng để không bị mất khi server khởi động lại
      PersistenceService.saveUser(newUser);

      const token = jwt.sign(
        {
          id: newUser._id.toString(),
          email: newUser.email,
          username: newUser.username,
          role: newUser.role,
          fullName: newUser.fullName
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn as any }
      );

      res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản thành công.',
        token,
        user: formatUserResponse(newUser)
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Lỗi khi đăng ký tài khoản.' });
    }
  }

  // 2. Đăng nhập
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { emailOrUsername, password } = req.body;
      if (!emailOrUsername || !password) {
        res.status(400).json({ success: false, message: 'Vui lòng nhập tài khoản và mật khẩu.' });
        return;
      }

      const user = await User.findOne({
        $or: [{ email: emailOrUsername.toLowerCase() }, { username: emailOrUsername }]
      });

      if (!user) {
        res.status(401).json({ success: false, message: 'Email hoặc tên đăng nhập không chính xác.' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Mật khẩu không chính xác.' });
        return;
      }

      if (user.status === 'locked') {
        res.status(403).json({
          success: false,
          message: `Tài khoản của bạn đã bị tạm khóa. Lý do: ${user.lockReason || 'Vi phạm điều khoản cộng đồng'}. Vui lòng liên hệ Hotline 0366 015 348 để được hỗ trợ mở khóa.`
        });
        return;
      }

      await QuotaService.ensureWeeklyQuotaCycle(
        user,
        isWeeklyAutoResetEnabled(),
        getDefaultNewUserQuota()
      );

      const token = jwt.sign(
        {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          role: user.role,
          fullName: user.fullName
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn as any }
      );

      res.json({
        success: true,
        message: 'Đăng nhập thành công.',
        token,
        user: formatUserResponse(user)
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Lỗi khi đăng nhập.' });
    }
  }

  // 2b. Lấy trạng thái cấu hình OAuth 2.0 (Google & Facebook)
  public static async getOAuthProviders(req: Request, res: Response): Promise<void> {
    try {
      if (!config.oauth.googleClientId || !config.oauth.facebookAppId) {
        reloadEnvConfig();
      }
      const frontendOrigin = sanitizeOrigin(req.query.origin || req.headers.origin);
      const googleClientId = config.oauth.googleClientId;
      const googleClientSecret = config.oauth.googleClientSecret;
      const facebookAppId = config.oauth.facebookAppId;
      const facebookAppSecret = config.oauth.facebookAppSecret;

      res.json({
        success: true,
        google: {
          configured: Boolean(googleClientId),
          mode: googleClientId ? (googleClientSecret ? 'code' : 'token') : 'unconfigured',
          clientId: googleClientId || undefined,
          redirectUri: getGoogleRedirectUri(frontendOrigin)
        },
        facebook: {
          configured: Boolean(facebookAppId),
          mode: facebookAppId ? (facebookAppSecret ? 'code' : 'token') : 'unconfigured',
          appId: facebookAppId || undefined,
          redirectUri: getFacebookRedirectUri(frontendOrigin)
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Lỗi kiểm tra cấu hình OAuth.' });
    }
  }

  // 2c. Khởi tạo luồng OAuth 2.0 thật với Google (Authorization Code Flow)
  public static async startGoogleOAuth(req: Request, res: Response): Promise<void> {
    reloadEnvConfig();
    const frontendOrigin = sanitizeOrigin(req.query.origin || req.headers.origin);
    const { googleClientId, googleClientSecret } = config.oauth;

    if (!googleClientId || !googleClientSecret) {
      renderOAuthCallbackPage(
        res,
        {
          success: false,
          provider: 'google',
          message:
            'Chưa cấu hình GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET trong tệp .env. Vui lòng thêm thông tin từ Google Cloud Console.'
        },
        frontendOrigin
      );
      return;
    }

    const statePayload: OAuthStatePayload = {
      provider: 'google',
      origin: frontendOrigin,
      nonce: crypto.randomBytes(12).toString('hex')
    };
    const state = jwt.sign(statePayload, config.jwtSecret, { expiresIn: '10m' });
    const redirectUri = getGoogleRedirectUri(frontendOrigin);

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', googleClientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('access_type', 'online');
    authUrl.searchParams.set('prompt', 'select_account');
    authUrl.searchParams.set('state', state);

    res.redirect(authUrl.toString());
  }

  // 2d. Xử lý Callback OAuth 2.0 từ Google
  public static async handleGoogleOAuthCallback(req: Request, res: Response): Promise<void> {
    let frontendOrigin = sanitizeOrigin();
    try {
      const { code, state, error } = req.query;

      if (typeof state === 'string') {
        try {
          const decoded = jwt.verify(state, config.jwtSecret) as OAuthStatePayload;
          if (decoded.provider !== 'google') {
            throw new Error('OAuth provider mismatch');
          }
          frontendOrigin = sanitizeOrigin(decoded.origin);
        } catch {
          renderOAuthCallbackPage(
            res,
            {
              success: false,
              provider: 'google',
              message: 'Phiên xác thực OAuth không hợp lệ hoặc đã hết hạn (quá 10 phút). Vui lòng thử lại.'
            },
            frontendOrigin
          );
          return;
        }
      }

      if (error) {
        renderOAuthCallbackPage(
          res,
          {
            success: false,
            provider: 'google',
            message: error === 'access_denied' ? 'Bạn đã hủy đăng nhập Google.' : `Google từ chối xác thực (${String(error)}).`
          },
          frontendOrigin
        );
        return;
      }

      if (typeof code !== 'string' || !code) {
        renderOAuthCallbackPage(
          res,
          {
            success: false,
            provider: 'google',
            message: 'Không nhận được mã xác thực (authorization code) từ Google.'
          },
          frontendOrigin
        );
        return;
      }

      reloadEnvConfig();
      const { googleClientId, googleClientSecret } = config.oauth;
      const redirectUri = getGoogleRedirectUri(frontendOrigin);

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: googleClientId,
          client_secret: googleClientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        }).toString()
      });

      const tokenData: any = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        renderOAuthCallbackPage(
          res,
          {
            success: false,
            provider: 'google',
            message: tokenData.error_description || 'Không thể trao đổi mã xác thực với máy chủ Google.'
          },
          frontendOrigin
        );
        return;
      }

      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const profile: any = await userInfoRes.json();

      if (!userInfoRes.ok || !profile.sub || !profile.email || profile.email_verified === false) {
        renderOAuthCallbackPage(
          res,
          {
            success: false,
            provider: 'google',
            message: 'Tài khoản Google chưa xác minh email hoặc không cung cấp thông tin hợp lệ.'
          },
          frontendOrigin
        );
        return;
      }

      const authResult = await upsertOAuthUserAndSignJwt({
        provider: 'google',
        providerId: String(profile.sub),
        email: String(profile.email),
        fullName: String(profile.name || profile.email.split('@')[0]),
        avatarUrl: profile.picture ? String(profile.picture) : undefined
      });

      if (!authResult.ok) {
        renderOAuthCallbackPage(
          res,
          {
            success: false,
            provider: 'google',
            message: authResult.message
          },
          frontendOrigin
        );
        return;
      }

      renderOAuthCallbackPage(
        res,
        {
          success: true,
          provider: 'google',
          token: authResult.token,
          user: authResult.user,
          message: `Đăng nhập Google thành công! Chào mừng ${authResult.user.fullName}.`
        },
        frontendOrigin
      );
    } catch (err: any) {
      console.error('Google OAuth callback error:', err);
      renderOAuthCallbackPage(
        res,
        {
          success: false,
          provider: 'google',
          message: err.message || 'Lỗi máy chủ khi xác thực với Google.'
        },
        frontendOrigin
      );
    }
  }

  // 2e. Xác thực Google bằng ID Token / Access Token thật từ Google Identity Services
  public static async googleLogin(req: Request, res: Response): Promise<void> {
    try {
      reloadEnvConfig();
      const idToken = req.body?.idToken || req.body?.credential;
      const accessToken = req.body?.accessToken;

      if (!idToken && !accessToken) {
        res.status(401).json({
          success: false,
          message: 'Yêu cầu mã xác thực OAuth (Google ID Token hoặc Access Token) hợp lệ.'
        });
        return;
      }

      const expectedClientId = config.oauth.googleClientId;
      let providerId = '';
      let email = '';
      let fullName = '';
      let avatarUrl = '';

      if (typeof idToken === 'string' && idToken.trim()) {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken.trim())}`
        );
        const info: any = await verifyRes.json();

        if (!verifyRes.ok || !info.sub || !info.email) {
          res.status(401).json({ success: false, message: 'Google ID Token không hợp lệ hoặc đã hết hạn.' });
          return;
        }
        if (expectedClientId && info.aud !== expectedClientId) {
          res.status(401).json({ success: false, message: 'Google ID Token không khớp với GOOGLE_CLIENT_ID của hệ thống.' });
          return;
        }
        if (info.email_verified !== 'true' && info.email_verified !== true) {
          res.status(401).json({ success: false, message: 'Địa chỉ email Google chưa được xác minh.' });
          return;
        }

        providerId = String(info.sub);
        email = String(info.email);
        fullName = String(info.name || email.split('@')[0]);
        avatarUrl = info.picture ? String(info.picture) : '';
      } else if (typeof accessToken === 'string' && accessToken.trim()) {
        const [tokenInfoRes, userInfoRes] = await Promise.all([
          fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken.trim())}`),
          fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken.trim()}` }
          })
        ]);

        const tokenInfo: any = await tokenInfoRes.json();
        const userInfo: any = await userInfoRes.json();

        if (!tokenInfoRes.ok || !userInfoRes.ok || !userInfo.sub || !userInfo.email) {
          res.status(401).json({ success: false, message: 'Google Access Token không hợp lệ hoặc đã hết hạn.' });
          return;
        }
        if (
          expectedClientId &&
          tokenInfo.aud !== expectedClientId &&
          tokenInfo.azp !== expectedClientId
        ) {
          res.status(401).json({ success: false, message: 'Google Access Token không thuộc ứng dụng này.' });
          return;
        }
        if (userInfo.email_verified === false) {
          res.status(401).json({ success: false, message: 'Địa chỉ email Google chưa được xác minh.' });
          return;
        }

        providerId = String(userInfo.sub);
        email = String(userInfo.email);
        fullName = String(userInfo.name || email.split('@')[0]);
        avatarUrl = userInfo.picture ? String(userInfo.picture) : '';
      }

      const authResult = await upsertOAuthUserAndSignJwt({
        provider: 'google',
        providerId,
        email,
        fullName,
        avatarUrl: avatarUrl || undefined
      });

      if (!authResult.ok) {
        res.status(authResult.status).json({ success: false, message: authResult.message });
        return;
      }

      res.json({
        success: true,
        message: `Đăng nhập Google thành công! Chào mừng ${authResult.user.fullName}.`,
        token: authResult.token,
        user: authResult.user
      });
    } catch (err: any) {
      console.error('Google token login error:', err);
      res.status(500).json({ success: false, message: err.message || 'Lỗi xác thực Google OAuth.' });
    }
  }

  // 2f. Khởi tạo luồng OAuth 2.0 thật với Facebook (Authorization Code Flow)
  public static async startFacebookOAuth(req: Request, res: Response): Promise<void> {
    reloadEnvConfig();
    const frontendOrigin = sanitizeOrigin(req.query.origin || req.headers.origin);
    const { facebookAppId, facebookAppSecret } = config.oauth;

    if (!facebookAppId || !facebookAppSecret) {
      renderOAuthCallbackPage(
        res,
        {
          success: false,
          provider: 'facebook',
          message:
            'Chưa cấu hình FACEBOOK_APP_ID và FACEBOOK_APP_SECRET trong tệp .env. Vui lòng thêm thông tin từ Meta for Developers.'
        },
        frontendOrigin
      );
      return;
    }

    const statePayload: OAuthStatePayload = {
      provider: 'facebook',
      origin: frontendOrigin,
      nonce: crypto.randomBytes(12).toString('hex')
    };
    const state = jwt.sign(statePayload, config.jwtSecret, { expiresIn: '10m' });
    const redirectUri = getFacebookRedirectUri(frontendOrigin);

    const authUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth');
    authUrl.searchParams.set('client_id', facebookAppId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'public_profile,email');
    authUrl.searchParams.set('state', state);

    res.redirect(authUrl.toString());
  }

  // 2g. Xử lý Callback OAuth 2.0 từ Facebook
  public static async handleFacebookOAuthCallback(req: Request, res: Response): Promise<void> {
    let frontendOrigin = sanitizeOrigin();
    try {
      const { code, state, error, error_description } = req.query;

      if (typeof state === 'string') {
        try {
          const decoded = jwt.verify(state, config.jwtSecret) as OAuthStatePayload;
          if (decoded.provider !== 'facebook') {
            throw new Error('OAuth provider mismatch');
          }
          frontendOrigin = sanitizeOrigin(decoded.origin);
        } catch {
          renderOAuthCallbackPage(
            res,
            {
              success: false,
              provider: 'facebook',
              message: 'Phiên xác thực Facebook OAuth không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.'
            },
            frontendOrigin
          );
          return;
        }
      }

      if (error) {
        renderOAuthCallbackPage(
          res,
          {
            success: false,
            provider: 'facebook',
            message:
              error === 'access_denied'
                ? 'Bạn đã hủy đăng nhập Facebook.'
                : String(error_description || `Facebook từ chối xác thực (${String(error)}).`)
          },
          frontendOrigin
        );
        return;
      }

      if (typeof code !== 'string' || !code) {
        renderOAuthCallbackPage(
          res,
          {
            success: false,
            provider: 'facebook',
            message: 'Không nhận được mã xác thực (authorization code) từ Facebook.'
          },
          frontendOrigin
        );
        return;
      }

      reloadEnvConfig();
      const { facebookAppId, facebookAppSecret } = config.oauth;
      const redirectUri = getFacebookRedirectUri(frontendOrigin);

      const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
      tokenUrl.searchParams.set('client_id', facebookAppId);
      tokenUrl.searchParams.set('client_secret', facebookAppSecret);
      tokenUrl.searchParams.set('redirect_uri', redirectUri);
      tokenUrl.searchParams.set('code', code);

      const tokenRes = await fetch(tokenUrl.toString());
      const tokenData: any = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.access_token) {
        renderOAuthCallbackPage(
          res,
          {
            success: false,
            provider: 'facebook',
            message: tokenData.error?.message || 'Không thể trao đổi mã xác thực với máy chủ Facebook.'
          },
          frontendOrigin
        );
        return;
      }

      const profileUrl = new URL('https://graph.facebook.com/me');
      profileUrl.searchParams.set('fields', 'id,name,email,picture.type(large)');
      profileUrl.searchParams.set('access_token', tokenData.access_token);

      const profileRes = await fetch(profileUrl.toString());
      const profile: any = await profileRes.json();

      if (!profileRes.ok || !profile.id) {
        renderOAuthCallbackPage(
          res,
          {
            success: false,
            provider: 'facebook',
            message: profile.error?.message || 'Không thể truy xuất thông tin hồ sơ từ Facebook.'
          },
          frontendOrigin
        );
        return;
      }

      const fbId = String(profile.id);
      const email = profile.email ? String(profile.email) : `fb_${fbId}@facebook.oauth.local`;
      const fullName = String(profile.name || `Người dùng Facebook`);
      const avatarUrl = profile.picture?.data?.url ? String(profile.picture.data.url) : undefined;

      const authResult = await upsertOAuthUserAndSignJwt({
        provider: 'facebook',
        providerId: fbId,
        email,
        fullName,
        avatarUrl
      });

      if (!authResult.ok) {
        renderOAuthCallbackPage(
          res,
          {
            success: false,
            provider: 'facebook',
            message: authResult.message
          },
          frontendOrigin
        );
        return;
      }

      renderOAuthCallbackPage(
        res,
        {
          success: true,
          provider: 'facebook',
          token: authResult.token,
          user: authResult.user,
          message: `Đăng nhập Facebook thành công! Chào mừng ${authResult.user.fullName}.`
        },
        frontendOrigin
      );
    } catch (err: any) {
      console.error('Facebook OAuth callback error:', err);
      renderOAuthCallbackPage(
        res,
        {
          success: false,
          provider: 'facebook',
          message: err.message || 'Lỗi máy chủ khi xác thực với Facebook.'
        },
        frontendOrigin
      );
    }
  }

  // 2h. Xác thực Facebook bằng Access Token thật từ Facebook SDK
  public static async facebookLogin(req: Request, res: Response): Promise<void> {
    try {
      reloadEnvConfig();
      const accessToken = req.body?.accessToken;
      if (typeof accessToken !== 'string' || !accessToken.trim()) {
        res.status(401).json({
          success: false,
          message: 'Yêu cầu Facebook Access Token hợp lệ.'
        });
        return;
      }

      const cleanToken = accessToken.trim();
      const { facebookAppId, facebookAppSecret } = config.oauth;

      if (facebookAppId && facebookAppSecret) {
        const debugUrl = new URL('https://graph.facebook.com/debug_token');
        debugUrl.searchParams.set('input_token', cleanToken);
        debugUrl.searchParams.set('access_token', `${facebookAppId}|${facebookAppSecret}`);
        const debugRes = await fetch(debugUrl.toString());
        const debugData: any = await debugRes.json();
        if (
          !debugRes.ok ||
          !debugData.data?.is_valid ||
          String(debugData.data?.app_id) !== String(facebookAppId)
        ) {
          res.status(401).json({
            success: false,
            message: 'Facebook Access Token không hợp lệ hoặc không thuộc ứng dụng này.'
          });
          return;
        }
      } else if (facebookAppId) {
        const appRes = await fetch(
          `https://graph.facebook.com/app?access_token=${encodeURIComponent(cleanToken)}`
        );
        const appData: any = await appRes.json();
        if (!appRes.ok || String(appData.id) !== String(facebookAppId)) {
          res.status(401).json({
            success: false,
            message: 'Facebook Access Token không khớp với FACEBOOK_APP_ID của hệ thống.'
          });
          return;
        }
      }

      const profileUrl = new URL('https://graph.facebook.com/me');
      profileUrl.searchParams.set('fields', 'id,name,email,picture.type(large)');
      profileUrl.searchParams.set('access_token', cleanToken);

      const profileRes = await fetch(profileUrl.toString());
      const profile: any = await profileRes.json();

      if (!profileRes.ok || !profile.id) {
        res.status(401).json({
          success: false,
          message: profile.error?.message || 'Facebook Access Token không hợp lệ hoặc đã hết hạn.'
        });
        return;
      }

      const fbId = String(profile.id);
      const email = profile.email ? String(profile.email) : `fb_${fbId}@facebook.oauth.local`;
      const fullName = String(profile.name || 'Người dùng Facebook');
      const avatarUrl = profile.picture?.data?.url ? String(profile.picture.data.url) : undefined;

      const authResult = await upsertOAuthUserAndSignJwt({
        provider: 'facebook',
        providerId: fbId,
        email,
        fullName,
        avatarUrl
      });

      if (!authResult.ok) {
        res.status(authResult.status).json({ success: false, message: authResult.message });
        return;
      }

      res.json({
        success: true,
        message: `Đăng nhập Facebook thành công! Chào mừng ${authResult.user.fullName}.`,
        token: authResult.token,
        user: authResult.user
      });
    } catch (err: any) {
      console.error('Facebook token login error:', err);
      res.status(500).json({ success: false, message: err.message || 'Lỗi xác thực Facebook OAuth.' });
    }
  }

  // 3. Lấy thông tin tài khoản hiện tại
  public static async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
        return;
      }

      const user = await QuotaService.findAuthUser(req.user);
      if (!user) {
        res.status(404).json({ success: false, message: 'Không tìm thấy thông tin người dùng.' });
        return;
      }

      await QuotaService.ensureWeeklyQuotaCycle(
        user,
        isWeeklyAutoResetEnabled(),
        getDefaultNewUserQuota()
      );

      res.json({
        success: true,
        user: formatUserResponse(user)
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // 4. Bước 1 Quên mật khẩu: Gửi mã OTP từ nhatpham.241105@gmail.com
  public static async sendForgotOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ success: false, message: 'Vui lòng cung cấp địa chỉ email hoặc tên đăng nhập.' });
        return;
      }

      const user = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username: email }]
      });
      if (!user) {
        res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản tương ứng với email hoặc tên đăng nhập này.' });
        return;
      }

      const targetEmail = user.email;
      const otp = MailService.generateOtp(targetEmail);
      const mailResult = await MailService.sendOtpEmail(targetEmail, otp, 'RESET_PASSWORD');

      if (!mailResult.success) {
        res.status(400).json({
          success: false,
          targetEmail,
          sourceEmail: config.smtp.user,
          message: mailResult.message
        });
        return;
      }

      res.json({
        success: true,
        targetEmail,
        sourceEmail: config.smtp.user,
        message: mailResult.message,
        realSent: (mailResult as any).realSent
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Lỗi khi gửi mã OTP.' });
    }
  }

  // 5. Bước 2 Quên mật khẩu: Xác thực OTP và Đổi mật khẩu mới
  public static async verifyOtpAndReset(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp, newPassword } = req.body;
      if (!email || !otp || !newPassword) {
        res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ email/tài khoản, mã OTP và mật khẩu mới.' });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
        return;
      }

      const user = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username: email }]
      });
      if (!user) {
        res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản người dùng.' });
        return;
      }

      const isOtpValid = MailService.verifyOtp(user.email, otp);
      if (!isOtpValid) {
        res.status(400).json({ success: false, message: 'Mã OTP không chính xác hoặc đã hết hạn (quá 10 phút).' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      await user.save();
      PersistenceService.saveUser(user);

      res.json({
        success: true,
        message: 'Đổi mật khẩu thành công! Bạn có thể sử dụng mật khẩu mới để đăng nhập ngay bây giờ.'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Lỗi khi cập nhật mật khẩu.' });
    }
  }

  // 6. Cập nhật hồ sơ cá nhân (Họ tên, Email, Ảnh đại diện)
  public static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập.' });
        return;
      }

      const { fullName, email, avatarUrl } = req.body;
      const user = await QuotaService.findAuthUser(req.user);
      if (!user) {
        res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        return;
      }

      if (email && email.toLowerCase() !== user.email.toLowerCase()) {
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing && existing._id.toString() !== user._id.toString()) {
          res.status(400).json({ success: false, message: 'Email này đã được sử dụng bởi tài khoản khác.' });
          return;
        }
        user.email = email.toLowerCase().trim();
      }

      if (fullName && typeof fullName === 'string') {
        user.fullName = fullName.trim();
      }

      if (avatarUrl !== undefined) {
        user.avatarUrl = avatarUrl;
      }

      await user.save();
      PersistenceService.saveUser(user);

      res.json({
        success: true,
        message: 'Cập nhật hồ sơ cá nhân thành công.',
        user: formatUserResponse(user)
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Lỗi khi cập nhật hồ sơ.' });
    }
  }

  // 7. Đổi mật khẩu đăng nhập (Không cần hỏi lại username/email vì đã xác thực token)
  public static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập.' });
        return;
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.' });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ success: false, message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' });
        return;
      }

      const user = await QuotaService.findAuthUser(req.user);
      if (!user) {
        res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản người dùng.' });
        return;
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác.' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      await user.save();
      PersistenceService.saveUser(user);

      res.json({
        success: true,
        message: 'Đổi mật khẩu thành công! Mật khẩu mới đã được lưu an toàn.'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Lỗi khi đổi mật khẩu.' });
    }
  }
}
