import { OAuth2Client } from 'google-auth-library';
import config from '../config/app';
import { GoogleUserInfo, GoogleTokens } from '../middleware/auth.types';

const client = new OAuth2Client({
  clientId: config.google.clientId,
  clientSecret: config.google.clientSecret,
  redirectUri: config.google.callbackUrl,
});

export const getGoogleAuthUrl = (callbackUrl: string): string => {
  const oauth2Client = new OAuth2Client({
    clientId: config.google.clientId,
    clientSecret: config.google.clientSecret,
    redirectUri: callbackUrl,
  });

  const scopes = ['openid', 'profile', 'email', 'https://www.googleapis.com/auth/adwords'].join(' ');

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    include_granted_scopes: true,
    state: Math.random().toString(36).substring(7),
    response_type: 'code',
  });
};

export const getGoogleTokens = async (code: string, callbackUrl: string): Promise<GoogleTokens> => {
  const oauth2Client = new OAuth2Client({
    clientId: config.google.clientId,
    clientSecret: config.google.clientSecret,
    redirectUri: callbackUrl,
  });

  const { tokens } = await oauth2Client.getToken(code);
  return {
    access_token: tokens.access_token || undefined,
    refresh_token: tokens.refresh_token || undefined,
    id_token: tokens.id_token || undefined,
  };
};

export const getGoogleUserInfo = async (idToken: string): Promise<GoogleUserInfo | null> => {
  const oauth2Client = new OAuth2Client({
    clientId: config.google.clientId,
    clientSecret: config.google.clientSecret,
  });

  try {
    const ticket = await oauth2Client.verifyIdToken({
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
