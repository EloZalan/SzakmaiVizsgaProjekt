import { TableStatus } from './table-status.model';
import { OrderItem } from './order-item.model';

export interface TableInfo {
  id: number;
  name: string;
  status: TableStatus;
  guests: number;
  server: string;
  updatedAt: string;
  items: OrderItem[];
  note?: string;
}