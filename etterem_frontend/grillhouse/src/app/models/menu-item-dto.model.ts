export interface MenuItemDto {
  id: number;
  name: string;
  name_hu?: string;
  name_en?: string;
  description: string | null;
  description_hu?: string | null;
  description_en?: string | null;
  price: number;
  category_id: number | null;
  image_url: string | null;
}
