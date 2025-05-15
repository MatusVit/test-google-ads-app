import { Model } from 'sequelize';

export interface CampaignAttributes {
  id: number;
  managedAccountId: number;
  campaignId: string;
  name: string;
  status?: string;
  budget?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface CampaignInstance extends Model<CampaignAttributes>, CampaignAttributes {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CampaignModel extends Model<CampaignAttributes, CampaignAttributes> {
  associate(models: any): void;
}
