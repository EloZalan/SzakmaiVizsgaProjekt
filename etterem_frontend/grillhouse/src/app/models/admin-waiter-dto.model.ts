export interface AdminWaiterDto {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'waiter' | string;
  on_shift?: boolean;
  invite_pending?: boolean;
  invite_expires_at?: string | null;
  email_verified_at?: string | null;
}
