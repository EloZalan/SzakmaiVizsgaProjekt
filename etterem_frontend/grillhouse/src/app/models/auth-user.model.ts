import { UserRole } from './user-role.model';

export interface AuthUser {
  username: string;
  role: UserRole;
}