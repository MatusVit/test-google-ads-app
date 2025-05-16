import { Model, Optional } from 'sequelize';

export interface ManagedAccountAttributes {
  id: number;
  userId: number;
  managedGoogleId: string;
  managedEmail: string;
  accessToken: string | null;
  refreshToken: string | null;
  adsAccountId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ManagedAccountCreationAttributes = Optional<ManagedAccountAttributes, 'id' | 'createdAt' | 'updatedAt' | 'accessToken' | 'refreshToken' | 'adsAccountId'>;

export interface ManagedAccountInstance extends Model<ManagedAccountAttributes, ManagedAccountCreationAttributes>, ManagedAccountAttributes {}
