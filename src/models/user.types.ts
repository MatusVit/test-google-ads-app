import { Model } from 'sequelize';

export interface UserAttributes extends Model {
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
