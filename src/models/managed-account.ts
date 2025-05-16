import { Model, DataTypes, Sequelize } from 'sequelize';
import { ManagedAccountAttributes, ManagedAccountCreationAttributes, ManagedAccountInstance } from './managed-account.types';

export class ManagedAccount extends Model<ManagedAccountAttributes, ManagedAccountCreationAttributes> implements ManagedAccountInstance {
  declare id: number;
  declare userId: number;
  declare managedGoogleId: string;
  declare managedEmail: string;
  declare accessToken: string | null;
  declare refreshToken: string | null;
  declare adsAccountId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

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
        allowNull: true,
      },
      refreshToken: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      adsAccountId: {
        type: DataTypes.STRING,
        allowNull: true,
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
