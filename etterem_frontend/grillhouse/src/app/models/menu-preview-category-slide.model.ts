import { MenuCategory } from './menu-category.model';
import { MenuCard } from './menu-card.model';

export interface CategorySlide {
  category: MenuCategory;
  items: MenuCard[];
}
