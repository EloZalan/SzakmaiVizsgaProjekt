import { WaiterDailyReservationOrderItemDto } from './waiter-daily-reservation-order-item-dto.model';

export interface WaiterDailyReservationOrderDto {
  order_id: number;
  status: 'in_progress' | 'ready_to_pay' | 'done';
  opened_at: string | null;
  total_price: number;
  paid_total: number | null;
  display_total: number;
  tip_amount: number;
  payment_method: 'cash' | 'card' | null;
  items: WaiterDailyReservationOrderItemDto[];
}
