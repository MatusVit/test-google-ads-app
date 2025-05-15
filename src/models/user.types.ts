import { Model } from 'sequelize';

export interface UserAttributes {
  id: number;
  googleId?: string;
  email: string;
  password?: string;
  name: string;
  picture?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface UserCreationAttributes extends Omit<UserAttributes, 'id'> {
  id?: number;
}

export interface UserInstance extends Model<UserAttributes, UserCreationAttributes>, UserAttributes {
  readonly createdAt: Date;
  readonly updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface UserModel extends Model<UserAttributes, UserCreationAttributes> {
  associate(models: any): void;
}
