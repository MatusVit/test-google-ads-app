import { OAuth2Client } from 'google-auth-library';
import config from '../config/app';

// @ts-expect-error - Dynamic import of CommonJS module
const googleAdsApi = await import('google-ads-api');
const { Client, CustomerService } = googleAdsApi.default;

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

// Получение списка всех доступных аккаунтов
export const listAccessibleAccounts = async (accessToken: string): Promise<GoogleAdsAccount[]> => {
  try {
    const client = new Client({
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      developer_token: config.google.adsDeveloperToken,
    });

    client.setAccessToken(accessToken);

    const customerService = new CustomerService(client);
    const customers = await customerService.listAccessibleCustomers();
    
    if (!customers || customers.length === 0) {
      return [];
    }

    const accounts = await Promise.all(
      customers.map(async (customer: { resourceName: string }) => {
        try {
          const customerId = customer.resourceName.split('/')[1];
          const details = await customerService.getCustomer(customerId);

          if (!details) return null;

          return {
            customerId,
            descriptiveName: details.descriptiveName || '',
            currencyCode: details.currencyCode || '',
            timeZone: details.timeZone || '',
            status: details.status || '',
          };
        } catch (error) {
          console.error(`Error getting account details for ${customer.resourceName}:`, error);
          return null;
        }
      }),
    );

    return accounts.filter((account): account is GoogleAdsAccount => account !== null);
  } catch (error) {
    console.error('Error listing accessible accounts:', error);
    return [];
  }
};

// Проверка существования аккаунта Google Ads
export const checkGoogleAdsAccount = async (
  accessToken: string,
): Promise<GoogleAdsAccount | null> => {
  try {
    const accounts = await listAccessibleAccounts(accessToken);
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('Error checking Google Ads account:', error);
    return null;
  }
};

// Проверка прав доступа к аккаунту
export const checkAccountAccess = async (
  accessToken: string,
  customerId: string,
): Promise<GoogleAdsAccountAccess | null> => {
  try {
    const client = new Client({
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      developer_token: config.google.adsDeveloperToken,
    });

    client.setAccessToken(accessToken);

    const customerService = new CustomerService(client);
    const customers = await customerService.listAccessibleCustomers();

    const hasAccess = customers?.some(
      (customer: { resourceName: string }) => customer.resourceName.split('/')[1] === customerId,
    );

    if (!hasAccess) {
      return null;
    }

    // Since we have access, we'll return ADMIN level by default
    // In a production environment, you should implement proper role checking
    return {
      emailAddress: '', // Email address is not available in API v14
      accessRole: 'ADMIN',
      accessLevel: 'ADMIN',
    };
  } catch (error) {
    console.error('Error checking account access:', error);
    return null;
  }
};

export const getGoogleAdsAccountCreationLink = (): string => {
  return 'https://ads.google.com/nav/selectaccount';
}; 