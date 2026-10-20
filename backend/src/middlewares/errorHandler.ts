import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  console.error('[API Error]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Lỗi hệ thống nội bộ máy chủ.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}
