import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import config from '../config/app';

export interface GoogleAdsAccount {
  customerId: string;
  descriptiveName: string;
  currencyCode: string;
  timeZone: string;
  status: string;
}

export interface GoogleAdsAccountAccess {
  emailAddress: string;
  accessRole: string;
  accessLevel: 'ADMIN' | 'STANDARD' | 'READ_ONLY';
}

// Проверка существования аккаунта Google Ads
export const checkGoogleAdsAccount = async (accessToken: string): Promise<GoogleAdsAccount | null> => {
  try {
    const auth = new OAuth2Client({
      clientId: config.google.clientId,
      clientSecret: config.google.clientSecret,
    });

    auth.setCredentials({
      access_token: accessToken,
    });

    const adsService = google.adwords({
      version: config.google.adsApiVersion,
      auth,
    });

    const response = await adsService.customers.list({});
    
    if (!response.data.resourceNames || response.data.resourceNames.length === 0) {
      console.log('No Google Ads account found for this user');
      return null;
    }

    const accountDetails = await adsService.customers.get({
      resourceName: response.data.resourceNames[0],
    });

    if (!accountDetails.data) {
      return null;
    }

    return {
      customerId: accountDetails.data.id || '',
      descriptiveName: accountDetails.data.descriptiveName || '',
      currencyCode: accountDetails.data.currencyCode || '',
      timeZone: accountDetails.data.timeZone || '',
      status: accountDetails.data.status || '',
    };
  } catch (error) {
    console.error('Error checking Google Ads account:', error);
    return null;
  }
};

// Получение списка всех доступных аккаунтов
export const listAccessibleAccounts = async (accessToken: string): Promise<GoogleAdsAccount[]> => {
  try {
    const auth = new OAuth2Client({
      clientId: config.google.clientId,
      clientSecret: config.google.clientSecret,
    });

    auth.setCredentials({
      access_token: accessToken,
    });

    const adsService = google.adwords({
      version: config.google.adsApiVersion,
      auth,
    });

    const response = await adsService.customers.listAccessible({});
    
    if (!response.data.resourceNames) {
      return [];
    }

    const accounts = await Promise.all(
      response.data.resourceNames.map(async (resourceName) => {
        const details = await adsService.customers.get({
          resourceName,
        });

        return {
          customerId: details.data.id || '',
          descriptiveName: details.data.descriptiveName || '',
          currencyCode: details.data.currencyCode || '',
          timeZone: details.data.timeZone || '',
          status: details.data.status || '',
        };
      })
    );

    return accounts.filter(account => account.customerId);
  } catch (error) {
    console.error('Error listing accessible accounts:', error);
    return [];
  }
};

// Проверка прав доступа к аккаунту
export const checkAccountAccess = async (
  accessToken: string,
  customerId: string
): Promise<GoogleAdsAccountAccess | null> => {
  try {
    const auth = new OAuth2Client({
      clientId: config.google.clientId,
      clientSecret: config.google.clientSecret,
    });

    auth.setCredentials({
      access_token: accessToken,
    });

    const adsService = google.adwords({
      version: config.google.adsApiVersion,
      auth,
    });

    const response = await adsService.customers.getAccessRole({
      customerId,
    });

    if (!response.data) {
      return null;
    }

    return {
      emailAddress: response.data.emailAddress || '',
      accessRole: response.data.role || '',
      accessLevel: response.data.accessLevel || 'READ_ONLY',
    };
  } catch (error) {
    console.error('Error checking account access:', error);
    return null;
  }
};

export const getGoogleAdsAccountCreationLink = (): string => {
  return 'https://ads.google.com/nav/selectaccount';
}; 