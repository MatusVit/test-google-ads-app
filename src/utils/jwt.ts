import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../config/app';
import { JWTPayload } from '../middleware/auth.types';

export const generateToken = (payload: JWTPayload): string => {
  const options: SignOptions = {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload as object, config.jwt.secret, options);
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, config.jwt.secret) as JWTPayload;
  } catch {
    return null;
  }
};

export const extractToken = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};
