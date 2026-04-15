import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, interval, Subscription } from 'rxjs';
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
  imports: [NgFor, NgIf, MatIconModule],
  templateUrl: './menu-preview.html',
  styleUrl: './menu-preview.css',
})
export class MenuPreviewComponent implements OnInit, OnDestroy {
  categorySlides: CategorySlide[] = [];
  chefRecommendationsVisible: CategoryPreviewCard[] = [];
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
  private hasLoadedMenuOnce = false;
  private isMenuRequestInFlight = false;
  private lastMenuDataSignature = '';
  private preloadedImageUrls = new Set<string>();
  private chefRecommendationsByDay = new Map<number, CategoryPreviewCard[]>();
  private languageSubscription: Subscription | null = null;
  private pollSubscription: Subscription | null = null;

  constructor(
    private actions: GrillhouseActionsService,
    private menuService: MenuService,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.selectedChefDayKey = new Date().getDay();
    this.currentLanguage = this.languageService.currentLanguageValue;
    this.loadMenu(true);
    this.languageSubscription = this.languageService.language$.subscribe(lang => {
      const languageChanged = this.currentLanguage !== lang;
      this.currentLanguage = lang;

      if (languageChanged) {
        this.loadMenu();
      }
    });

    this.pollSubscription = interval(10000).subscribe(() => {
      this.loadMenu();
    });
  }

  ngOnDestroy(): void {
    this.languageSubscription?.unsubscribe();
    this.languageSubscription = null;

    this.pollSubscription?.unsubscribe();
    this.pollSubscription = null;
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

  selectChefDay(dayKey: number): void {
    this.selectedChefDayKey = dayKey;
    this.updateVisibleChefRecommendations();
  }

  trackByChefDay(_index: number, day: ChefDayOption): number {
    return day.key;
  }

  trackByChefRecommendation(_index: number, card: CategoryPreviewCard): string {
    return `${card.category.id}:${card.item.id}`;
  }

  trackByMenuItem(_index: number, item: MenuCard): number {
    return item.id;
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

  private loadMenu(forceShowLoader = false): void {
    if (this.isMenuRequestInFlight) {
      return;
    }

    this.isMenuRequestInFlight = true;

    const shouldShowLoader = forceShowLoader || !this.hasLoadedMenuOnce;
    if (shouldShowLoader) {
      this.loading = true;
    }
    this.errorMessage = '';

    forkJoin({
      categories: this.menuService.getCategories(),
      items: this.menuService.getMenuItems(),
    }).subscribe({
      next: ({ categories, items }) => {
        const menuDataSignature = this.buildMenuDataSignature(categories, items);
        if (this.hasLoadedMenuOnce && menuDataSignature === this.lastMenuDataSignature) {
          this.isMenuRequestInFlight = false;
          this.loading = false;
          return;
        }

        this.lastMenuDataSignature = menuDataSignature;
        this.categories = categories;

        const mappedItems = items.map((item) => this.mapToMenuCard(item));
        this.preloadMenuImages(mappedItems);

        this.categorySlides = this.categories
          .map((category) => ({
            category,
            items: mappedItems.filter((item) => item.categoryId === category.id),
          }))
          .filter((slide) => slide.items.length > 0);

        this.rebuildChefRecommendationsByDay();
        this.updateVisibleChefRecommendations();

        if (this.activeCategoryIndex >= this.categorySlides.length) {
          this.activeCategoryIndex = 0;
        }

        this.hasLoadedMenuOnce = true;
        this.isMenuRequestInFlight = false;
        this.loading = false;
      },
      error: (err) => {
        this.isMenuRequestInFlight = false;
        this.loading = false;

        if (!this.hasLoadedMenuOnce) {
          this.errorMessage = this.currentLanguage === 'hu' ? 'Nem sikerült betölteni a menüt.' : 'Failed to load menu.';
        }

        console.error('Menu loading error:', err);
      },
    });
  }

  private buildMenuDataSignature(categories: MenuCategory[], items: MenuItemDto[]): string {
    const categorySignature = [...categories]
      .sort((a, b) => a.id - b.id)
      .map((category) => `${category.id}|${category.name}|${category.name_hu ?? ''}|${category.name_en ?? ''}`)
      .join('||');

    const itemSignature = [...items]
      .sort((a, b) => a.id - b.id)
      .map(
        (item) =>
          `${item.id}|${item.category_id ?? ''}|${item.name}|${item.name_hu ?? ''}|${item.name_en ?? ''}|${item.description ?? ''}|${item.description_hu ?? ''}|${item.description_en ?? ''}|${item.price}|${item.image_url ?? ''}`
      )
      .join('||');

    return `${categorySignature}###${itemSignature}`;
  }

  private preloadMenuImages(items: MenuCard[]): void {
    for (const item of items) {
      const imageUrl = item.imageUrl?.trim();

      if (!imageUrl || this.preloadedImageUrls.has(imageUrl)) {
        continue;
      }

      this.preloadedImageUrls.add(imageUrl);

      const image = new Image();
      image.decoding = 'async';
      image.src = imageUrl;
    }
  }

  private rebuildChefRecommendationsByDay(): void {
    this.chefRecommendationsByDay.clear();

    const recommendationSlides = this.categorySlides.filter(
      (slide) => !this.isDailyMenuCategory(slide.category.name)
    );

    for (const day of this.chefDays) {
      const recommendations = recommendationSlides.map((slide) => {
        const index = (day.key + slide.category.id) % slide.items.length;

        return {
          category: slide.category,
          item: slide.items[index],
        };
      });

      this.chefRecommendationsByDay.set(day.key, recommendations);
    }
  }

  private updateVisibleChefRecommendations(): void {
    this.chefRecommendationsVisible = this.chefRecommendationsByDay.get(this.selectedChefDayKey) ?? [];
  }

  private mapToMenuCard(item: MenuItemDto): MenuCard {
    return {
      id: item.id,
      name: item.name,
      price: item.price,
      desc: item.description,
      categoryId: item.category_id,
      imageUrl: item.image_url,
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
