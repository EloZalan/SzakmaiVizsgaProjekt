import { StaffRole } from './staff-role.model';
import { StaffStatus } from './staff-status.model';

export interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: StaffRole;
  status: StaffStatus;
  shift: string;
  invitePending?: boolean;
  inviteExpiresAt?: string | null;
}
