import { Model, DataTypes, Sequelize } from 'sequelize';
import { CampaignAttributes, CampaignCreationAttributes, CampaignInstance } from './campaign.types';

export class Campaign extends Model<CampaignAttributes, CampaignCreationAttributes> implements CampaignInstance {
  declare id: number;
  declare managedAccountId: number;
  declare campaignId: string;
  declare name: string;
  declare status: string;
  declare budget: number;
  declare startDate: Date;
  declare endDate: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

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
        allowNull: false,
      },
      budget: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
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
