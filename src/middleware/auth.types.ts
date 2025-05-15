import { Request } from 'express';
import { UserAttributes } from '../models/user.types';

export interface AuthRequest extends Request {
  user?: UserAttributes;
}

export interface JWTPayload {
  id: number;
  email: string;
  name: string;
}

export interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleTokens {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  expiry_date?: number;
}
