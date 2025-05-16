import { Model, DataTypes, Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';
import { UserAttributes, UserCreationAttributes, UserInstance } from './user.types';

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserInstance {
  declare id: number;
  declare googleId: string | null;
  declare email: string;
  declare password: string | null;
  declare name: string;
  declare picture: string | null;
  declare accessToken: string | null;
  declare refreshToken: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  static associate(models: any) {
    User.hasMany(models.ManagedAccount, {
      foreignKey: 'userId',
      as: 'managedAccounts',
    });
  }

  async comparePassword(candidatePassword: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
  }
}

export default function (sequelize: Sequelize): typeof User {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      googleId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      picture: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      accessToken: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      refreshToken: {
        type: DataTypes.TEXT,
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
      tableName: 'Users',
      hooks: {
        beforeCreate: async (user: User) => {
          if (user.password) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            user.password = hashedPassword;
          }
        },
        beforeUpdate: async (user: User) => {
          if (user.changed('password') && user.password) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            user.password = hashedPassword;
          }
        },
      },
    },
  );

  return User;
}
