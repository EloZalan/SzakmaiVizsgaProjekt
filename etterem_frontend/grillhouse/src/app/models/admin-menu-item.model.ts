export interface MenuItem {
  id: number;
  name: string;
  nameHu: string;
  nameEn: string;
  descriptionHu: string;
  descriptionEn: string;
  price: number;
  categoryId: number | null;
  imageUrl: string | null;
}
