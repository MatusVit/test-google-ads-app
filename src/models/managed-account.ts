import { Model, DataTypes, Sequelize } from 'sequelize';
import {
  ManagedAccountAttributes,
  ManagedAccountInstance,
  ManagedAccountModel,
} from './managed-account.types';

export class ManagedAccount
  extends Model<ManagedAccountAttributes>
  implements ManagedAccountAttributes
{
  public id!: number;
  public userId!: number;
  public managedGoogleId!: string;
  public managedEmail!: string;
  public accessToken!: string;
  public refreshToken!: string;
  public adsAccountId!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static associate(models: any) {
    ManagedAccount.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    ManagedAccount.hasMany(models.Campaign, {
      foreignKey: 'managedAccountId',
      as: 'campaigns',
    });
  }
}

export default function (sequelize: Sequelize): typeof ManagedAccount {
  ManagedAccount.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      managedGoogleId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      managedEmail: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      accessToken: {
        type: DataTypes.TEXT,
      },
      refreshToken: {
        type: DataTypes.TEXT,
      },
      adsAccountId: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      tableName: 'ManagedAccounts',
      indexes: [
        {
          unique: true,
          fields: ['userId', 'managedGoogleId'],
        },
      ],
    },
  );

  return ManagedAccount;
}
