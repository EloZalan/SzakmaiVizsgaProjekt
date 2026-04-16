import { MenuCategory } from './menu-category.model';
import { MenuCard } from './menu-card.model';

export interface CategoryPreviewCard {
  category: MenuCategory;
  item: MenuCard;
}
