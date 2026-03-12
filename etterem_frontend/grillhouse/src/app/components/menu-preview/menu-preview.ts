import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { forkJoin } from 'rxjs';
import { GrillhouseActionsService } from '../../services/grillhouse-actions';
import { MenuCard } from '../../models/menu-card.model';
import { MenuCategory, MenuItemDto, MenuService } from '../../services/menu.service';

@Component({
  selector: 'app-menu-preview',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './menu-preview.html',
  styleUrl: './menu-preview.css',
})
export class MenuPreviewComponent implements OnInit {
  items: MenuCard[] = [];
  starters: MenuCard[] = [];
  sides: MenuCard[] = [];
  desserts: MenuCard[] = [];
  drinks: MenuCard[] = [];

  categories: MenuCategory[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private actions: GrillhouseActionsService,
    private menuService: MenuService
  ) {}

  ngOnInit(): void {
    this.loadMenu();
  }

  onViewFullMenu(): void {
    this.actions.viewFullMenu();
  }

  isFullMenuVisible(): boolean {
    return this.actions.isFullMenuVisible();
  }

  private loadMenu(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      categories: this.menuService.getCategories(),
      items: this.menuService.getMenuItems(),
    }).subscribe({
      next: ({ categories, items }) => {
        this.categories = categories;

        const mappedItems = items.map((item) => this.mapToMenuCard(item));

        this.items = mappedItems.slice(0, 6);

        this.starters = this.getItemsByCategoryNames(mappedItems, ['starter', 'starters', 'előétel', 'előételek']);
        this.sides = this.getItemsByCategoryNames(mappedItems, ['side', 'sides', 'köret', 'köretek']);
        this.desserts = this.getItemsByCategoryNames(mappedItems, ['dessert', 'desserts', 'desszert', 'desszertek']);
        this.drinks = this.getItemsByCategoryNames(mappedItems, ['drink', 'drinks', 'ital', 'italok']);

        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Nem sikerült betölteni a menüt.';
        console.error('Menu loading error:', err);
      },
    });
  }

  private mapToMenuCard(item: MenuItemDto): MenuCard {
    return {
      id: item.id,
      name: item.name,
      price: item.price,
      desc: item.description,
      categoryId: item.category_id,
    };
  }

  private getItemsByCategoryNames(items: MenuCard[], possibleNames: string[]): MenuCard[] {
    const normalizedNames = possibleNames.map((name) => name.trim().toLowerCase());

    const matchedCategoryIds = this.categories
      .filter((category) => normalizedNames.includes(category.name.trim().toLowerCase()))
      .map((category) => category.id);

    return items.filter((item) => matchedCategoryIds.includes(item.categoryId));
  }
}