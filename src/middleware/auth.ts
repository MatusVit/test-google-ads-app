import { Response, NextFunction } from 'express';
import { verifyToken, extractToken } from '../utils/jwt';
import models from '../models';
import { AuthRequest, JWTPayload } from './auth.types';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = extractToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const decoded = verifyToken(token) as JWTPayload | null;
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  const user = await models.User.findByPk(decoded.id);
  if (!user) {
    return res.status(401).json({ message: 'User not found' });
  }

  req.user = user;
  next();
};
