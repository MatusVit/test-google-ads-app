import { Model, DataTypes, Sequelize } from 'sequelize';
import { CampaignAttributes, CampaignInstance, CampaignModel } from './campaign.types';

export class Campaign extends Model<CampaignAttributes> implements CampaignAttributes {
  public id!: number;
  public managedAccountId!: number;
  public campaignId!: string;
  public name!: string;
  public status!: string;
  public budget!: number;
  public startDate!: Date;
  public endDate!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static associate(models: any) {
    Campaign.belongsTo(models.ManagedAccount, {
      foreignKey: 'managedAccountId',
      as: 'managedAccount',
    });
  }
}

export default function (sequelize: Sequelize): typeof Campaign {
  Campaign.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      managedAccountId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'ManagedAccounts',
          key: 'id',
        },
      },
      campaignId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
      },
      budget: {
        type: DataTypes.DECIMAL(10, 2),
      },
      startDate: {
        type: DataTypes.DATE,
      },
      endDate: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      tableName: 'Campaigns',
      indexes: [
        {
          unique: true,
          fields: ['managedAccountId', 'campaignId'],
        },
      ],
    },
  );

  return Campaign;
}
