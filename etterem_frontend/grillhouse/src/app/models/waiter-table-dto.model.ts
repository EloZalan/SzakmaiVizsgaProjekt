import { ReservationDto } from './waiter-reservation-dto.model';

export interface TableDto {
  id: number;
  capacity: number;
  status: string;
  waiter_name?: string | null;
  reservation?: ReservationDto | null;
}
