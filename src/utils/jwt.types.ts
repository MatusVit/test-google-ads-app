import { JWTPayload } from '../middleware/auth.types';

export interface JWTConfig {
  secret: string;
  expiresIn: string;
}

export type TokenVerificationResult = JWTPayload | null;
