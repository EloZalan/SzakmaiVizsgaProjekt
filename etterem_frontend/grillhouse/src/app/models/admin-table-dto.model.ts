import { TableReservationDto } from './admin-table-reservation-dto.model';

export interface TableDto {
  id: number;
  capacity: number;
  status: string;
  waiter_name?: string | null;
  reservation?: TableReservationDto | null;
  created_at?: string;
  updated_at?: string;
}
