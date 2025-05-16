import { Model, Optional } from 'sequelize';

export interface UserAttributes {
  id: number;
  googleId: string | null;
  email: string;
  password: string | null;
  name: string;
  picture: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type UserCreationAttributes = Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt' | 'googleId' | 'password' | 'picture' | 'accessToken' | 'refreshToken'>;

export interface UserInstance extends Model<UserAttributes, UserCreationAttributes>, UserAttributes {
  comparePassword(candidatePassword: string): Promise<boolean>;
}
