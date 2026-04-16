import { TableOrderItemDto } from './waiter-table-order-item-dto.model';

export interface TableOrderDetailsDto {
  order_id?: number;
  table_id?: number;
  reservation_id: number | null;
  status?: 'in_progress' | 'ready_to_pay' | 'done';
  total_price: number;
  opened_at?: string | null;
  items: TableOrderItemDto[];
  message?: string;
}
