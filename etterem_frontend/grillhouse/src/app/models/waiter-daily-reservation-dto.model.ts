import { WaiterDailyReservationOrderDto } from './waiter-daily-reservation-order-dto.model';

export interface WaiterDailyReservationDto {
  reservation_id: number;
  table_id: number;
  table_capacity: number | null;
  guest_name: string;
  guest_count: number;
  start_time: string;
  end_time: string;
  closed_at: string | null;
  note: string | null;
  order: WaiterDailyReservationOrderDto | null;
}
