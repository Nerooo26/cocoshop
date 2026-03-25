import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

type AuthedUser = { userId: number; role: 'buyer' | 'seller' | 'admin' };

declare global {
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

const getBearerToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ message: 'Missing token' });
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not set');

    const decoded = jwt.verify(token, secret) as { userId: number; role: 'buyer' | 'seller' | 'admin' };
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const requireRole = (role: 'buyer' | 'seller') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Missing user context' });
    // Admin is allowed to access both buyer and seller protected routes.
    if (req.user.role !== role && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return next();
  };
};

