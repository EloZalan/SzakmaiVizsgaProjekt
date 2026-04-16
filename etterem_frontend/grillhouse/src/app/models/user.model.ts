import { UserRole } from './user-role.model';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  on_shift?: boolean;
  email_verified_at?: string | null;
}
