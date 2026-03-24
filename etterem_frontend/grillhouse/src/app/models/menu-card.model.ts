export interface MenuCard {
  id: number;
  name: string;
  price: number;
  desc: string | null;
  categoryId: number | null;
  imageUrl: string | null;
}