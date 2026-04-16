import { MenuItem } from './admin-menu-item.model';

export interface EditingState {
  type: 'category' | 'item' | null;
  id: number | null;
  name: string;
  nameEn: string;
  descriptionHu: string;
  descriptionEn: string;
  price: number;
  categoryId: number | null;
  currentImageUrl: string | null;
  imageFile: File | null;
  imagePreviewUrl: string | null;
  removeImage: boolean;
}
