export interface CreateReservationPayload {
  guest_name: string;
  phone_number: string;
  guest_count: number;
  start_time: string;
  note?: string | null;
}
