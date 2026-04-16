export interface OrderDto {
  id: number;
  table_id: number;
  reservation_id: number;
  waiter_id: number;
  total_price: number;
  status: 'in_progress' | 'ready_to_pay' | 'done';
}
