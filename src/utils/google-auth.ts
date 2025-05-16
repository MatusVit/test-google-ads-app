import { OAuth2Client } from 'google-auth-library';
import config from '../config/app';
import { GoogleUserInfo, GoogleTokens } from '../middleware/auth.types';

const client = new OAuth2Client({
  clientId: config.google.clientId,
  clientSecret: config.google.clientSecret,
  redirectUri: config.google.callbackUrl,
});

export const getGoogleAuthUrl = (): string => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/adwords',
  ];

  return client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
};

export const getGoogleTokens = async (code: string): Promise<GoogleTokens> => {
  const { tokens } = await client.getToken(code);
  return {
    access_token: tokens.access_token || undefined,
    refresh_token: tokens.refresh_token || undefined,
    id_token: tokens.id_token || undefined,
  };
};

export const getGoogleUserInfo = async (idToken: string): Promise<GoogleUserInfo | null> => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();
    if (!payload) return null;

    return {
      sub: payload.sub,
      email: payload.email!,
      name: payload.name!,
      picture: payload.picture,
    };
  } catch (error) {
    console.error('Error verifying Google token:', error);
    return null;
  }
};
