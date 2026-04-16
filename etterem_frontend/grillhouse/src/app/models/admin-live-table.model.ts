import { WaiterTableStatus } from './table-info.model';

export interface AdminLiveTable {
  id: number;
  name: string;
  seats: number;
  status: WaiterTableStatus;
  guests: number;
  server: string;
  note?: string;
}
