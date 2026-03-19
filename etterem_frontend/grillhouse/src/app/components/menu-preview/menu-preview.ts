import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { forkJoin } from 'rxjs';
import { GrillhouseActionsService } from '../../services/grillhouse-actions';
import { LanguageService, Language } from '../../services/language.service';
import { MenuCard } from '../../models/menu-card.model';
import { MenuCategory, MenuItemDto, MenuService } from '../../services/menu.service';

interface CategorySlide {
  category: MenuCategory;
  items: MenuCard[];
}

interface CategoryPreviewCard {
  category: MenuCategory;
  item: MenuCard;
}

interface ChefDayOption {
  key: number;
  labelHu: string;
  labelEn: string;
}

@Component({
  selector: 'app-menu-preview',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './menu-preview.html',
  styleUrl: './menu-preview.css',
})
export class MenuPreviewComponent implements OnInit {
  categorySlides: CategorySlide[] = [];
  activeCategoryIndex = 0;
  selectedChefDayKey = 1;

  readonly chefDays: ChefDayOption[] = [
    { key: 1, labelHu: 'Hétfő', labelEn: 'Monday' },
    { key: 2, labelHu: 'Kedd', labelEn: 'Tuesday' },
    { key: 3, labelHu: 'Szerda', labelEn: 'Wednesday' },
    { key: 4, labelHu: 'Csütörtök', labelEn: 'Thursday' },
    { key: 5, labelHu: 'Péntek', labelEn: 'Friday' },
    { key: 6, labelHu: 'Szombat', labelEn: 'Saturday' },
    { key: 0, labelHu: 'Vasárnap', labelEn: 'Sunday' },
  ];

  categories: MenuCategory[] = [];
  loading = false;
  errorMessage = '';
  currentLanguage: Language = 'hu';

  constructor(
    private actions: GrillhouseActionsService,
    private menuService: MenuService,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.selectedChefDayKey = new Date().getDay();
    this.loadMenu();
    this.languageService.language$.subscribe(lang => {
      this.currentLanguage = lang;
    });
  }

  onViewFullMenu(): void {
    this.actions.viewFullMenu();

    if (this.isFullMenuVisible() && this.activeCategoryIndex >= this.categorySlides.length) {
      this.activeCategoryIndex = 0;
    }
  }

  isFullMenuVisible(): boolean {
    return this.actions.isFullMenuVisible();
  }

  get activeCategorySlide(): CategorySlide | null {
    if (this.categorySlides.length === 0) {
      return null;
    }

    return this.categorySlides[this.activeCategoryIndex] ?? null;
  }

  get chefRecommendations(): CategoryPreviewCard[] {
    return this.categorySlides
      .filter((slide) => !this.isDailyMenuCategory(slide.category.name))
      .map((slide) => {
        const index = (this.selectedChefDayKey + slide.category.id) % slide.items.length;
        return {
          category: slide.category,
          item: slide.items[index],
        };
      });
  }

  selectChefDay(dayKey: number): void {
    this.selectedChefDayKey = dayKey;
  }

  getChefDayLabel(day: ChefDayOption): string {
    return this.currentLanguage === 'hu' ? day.labelHu : day.labelEn;
  }

  prevCategory(): void {
    if (this.categorySlides.length <= 1) {
      return;
    }

    this.activeCategoryIndex =
      (this.activeCategoryIndex - 1 + this.categorySlides.length) % this.categorySlides.length;
  }

  nextCategory(): void {
    if (this.categorySlides.length <= 1) {
      return;
    }

    this.activeCategoryIndex =
      (this.activeCategoryIndex + 1) % this.categorySlides.length;
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

        this.categorySlides = this.categories
          .map((category) => ({
            category,
            items: mappedItems.filter((item) => item.categoryId === category.id),
          }))
          .filter((slide) => slide.items.length > 0);

        if (this.activeCategoryIndex >= this.categorySlides.length) {
          this.activeCategoryIndex = 0;
        }

        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.currentLanguage === 'hu' ? 'Nem sikerült betölteni a menüt.' : 'Failed to load menu.';
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

  private isDailyMenuCategory(categoryName: string): boolean {
    const normalized = categoryName
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');

    return normalized.includes('napi menu') || normalized.includes('daily menu');
  }
}