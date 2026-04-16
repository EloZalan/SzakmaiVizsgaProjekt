import { MenuItem } from './admin-menu-item.model';

export interface DropDecisionState {
  item: MenuItem;
  targetCategoryId: number | null;
  targetLabel: string;
}
