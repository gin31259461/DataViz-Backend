import { Request, Response, NextFunction } from 'express';
import { ErrorHandler } from '@/utils/errorHandler';

export async function Middleware(req: Request, res: Response, next: NextFunction) {
  try {
    // console.log('middleware');
    next();
  } catch (err) {
    const error = new ErrorHandler();
    next(error);
  }
}
