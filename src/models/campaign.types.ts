import { Model } from 'sequelize';

export interface CampaignAttributes extends Model {
  id: number;
  managedAccountId: number;
  campaignId: string;
  name: string;
  status?: string;
  budget?: number;
  startDate?: Date;
  endDate?: Date;
}
