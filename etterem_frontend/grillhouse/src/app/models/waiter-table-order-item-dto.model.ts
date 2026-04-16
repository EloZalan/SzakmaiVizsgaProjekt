export interface TableOrderItemDto {
  id: number;
  menu_item_id: number;
  name: string | null;
  price: number | null;
  quantity: number;
  line_total: number | null;
}
