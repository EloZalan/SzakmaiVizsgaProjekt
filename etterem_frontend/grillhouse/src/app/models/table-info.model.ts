export type WaiterTableStatus = 'Szabad' | 'Foglalt' | 'Asztalnál' | 'Fizetésre vár' | 'CLOSED';

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
