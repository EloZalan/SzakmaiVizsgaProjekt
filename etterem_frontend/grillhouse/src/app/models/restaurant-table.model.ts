export interface RestaurantTable {
  id: number;
  name: string;
  seats: number;
  status: 'ACTIVE' | 'DISABLED';
}