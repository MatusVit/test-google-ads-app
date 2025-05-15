import { Model } from 'sequelize';

export interface ManagedAccountAttributes {
  id: number;
  userId: number;
  managedGoogleId: string;
  managedEmail: string;
  accessToken?: string;
  refreshToken?: string;
  adsAccountId?: string;
}

export interface ManagedAccountInstance
  extends Model<ManagedAccountAttributes>,
    ManagedAccountAttributes {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ManagedAccountModel
  extends Model<ManagedAccountAttributes, ManagedAccountAttributes> {
  associate(models: any): void;
}
