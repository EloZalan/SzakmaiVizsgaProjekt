export type WaiterTableStatus = 'FREE' | 'OCCUPIED' | 'NEEDS_PAYMENT' | 'CLOSED';

export interface TableOrderItem {
  menuItemId: number;
  name: string;
  qty: number;
  price: number;
}

export interface TableInfo {
  id: number;
  name: string;
  status: WaiterTableStatus;
  guests: number;
  server: string;
  updatedAt: string;
  items: TableOrderItem[];
  note?: string;
  orderId?: number | null;
}
