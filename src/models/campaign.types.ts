import { Model, Optional } from 'sequelize';

export interface CampaignAttributes {
  id: number;
  managedAccountId: number;
  campaignId: string;
  name: string;
  status: string;
  budget: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type CampaignCreationAttributes = Optional<CampaignAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export interface CampaignInstance extends Model<CampaignAttributes, CampaignCreationAttributes>, CampaignAttributes {}
