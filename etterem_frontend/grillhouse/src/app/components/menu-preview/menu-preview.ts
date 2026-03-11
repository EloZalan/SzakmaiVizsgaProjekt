import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { GrillhouseActionsService } from '../../services/grillhouse-actions';
import { MenuCard } from '../../models/menu-card.model';

@Component({
  selector: 'app-menu-preview',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './menu-preview.html',
})
export class MenuPreviewComponent {
  items: MenuCard[] = [
    { name: 'Signature Ribeye', price: 48, desc: '16oz prime cut, flame-grilled to perfection' },
    { name: 'BBQ Brisket Platter', price: 36, desc: 'Slow-smoked for 14 hours, served with house sauce' },
    { name: 'Tomahawk Steak', price: 89, desc: '32oz bone-in ribeye, served for two' },
    { name: 'Fall-Off-The-Bone Ribs', price: 42, desc: 'Full rack of St. Louis style ribs' },
    { name: 'Smoked Pulled Pork', price: 28, desc: 'Hickory-smoked shoulder with coleslaw' },
    { name: 'Grilled Chicken Platter', price: 24, desc: 'Half chicken, charcoal-grilled with BBQ glaze' },
  ];

  starters: MenuCard[] = [
    { name: 'Buffalo Wings', price: 14, desc: 'Spicy wings with ranch dip' },
    { name: 'Cheddar Jalapeño Bites', price: 11, desc: 'Crispy bites with smoky cheese filling' },
    { name: 'Onion Rings', price: 9, desc: 'Golden fried onion rings with BBQ dip' },
  ];

  sides: MenuCard[] = [
    { name: 'Mac & Cheese', price: 8, desc: 'Creamy baked mac with cheddar crust' },
    { name: 'Coleslaw', price: 6, desc: 'Fresh, crunchy house slaw' },
    { name: 'Sweet Potato Fries', price: 7, desc: 'Crispy fries with chipotle mayo' },
  ];

  desserts: MenuCard[] = [
    { name: 'Chocolate Brownie', price: 10, desc: 'Warm brownie with vanilla ice cream' },
    { name: 'Cheesecake', price: 9, desc: 'Classic creamy cheesecake' },
  ];

  drinks: MenuCard[] = [
    { name: 'House Lemonade', price: 5, desc: 'Freshly squeezed lemon drink' },
    { name: 'Iced Tea', price: 4, desc: 'Classic sweet iced tea' },
    { name: 'Craft Beer', price: 7, desc: 'Locally brewed draft beer' },
    { name: 'Cola', price: 4, desc: 'Chilled soft drink' },
  ];

  constructor(private actions: GrillhouseActionsService) {}

  onViewFullMenu(): void {
    this.actions.viewFullMenu();
  }

  isFullMenuVisible(): boolean {
    return this.actions.isFullMenuVisible();
  }
}