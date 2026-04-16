export interface ReservationDto {
  id: number;
  table_id: number;
  guest_name: string;
  phone_number: string;
  start_time: string;
  end_time: string;
  guest_count: number;
  note?: string | null;
}
