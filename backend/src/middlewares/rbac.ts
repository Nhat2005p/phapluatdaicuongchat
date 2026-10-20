import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User.js';

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực người dùng.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Bạn không có quyền truy cập chức năng này (Yêu cầu vai trò: ${allowedRoles.join(', ')}).`
      });
      return;
    }

    next();
  };
}
