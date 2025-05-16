import { Model } from 'sequelize';

export interface ManagedAccountAttributes extends Model {
  id: number;
  userId: number;
  managedGoogleId: string;
  managedEmail: string;
  accessToken?: string;
  refreshToken?: string;
  adsAccountId?: string;
}
