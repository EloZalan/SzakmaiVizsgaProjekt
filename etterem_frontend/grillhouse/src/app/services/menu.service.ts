import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { ConfigService } from './config.service';
import { Language, LanguageService } from './language.service';
import type { MenuCategory } from '../models/menu-category.model';
import type { MenuItemDto } from '../models/menu-item-dto.model';

export type { MenuCategory } from '../models/menu-category.model';
export type { MenuItemDto } from '../models/menu-item-dto.model';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);
  private languageService = inject(LanguageService);

  private adminCategoriesCache$?: Observable<MenuCategory[]>;
  private adminMenuItemsCache$?: Observable<MenuItemDto[]>;

  invalidateAdminMenuCache(): void {
    this.adminCategoriesCache$ = undefined;
    this.adminMenuItemsCache$ = undefined;
  }

  private publicLanguageHeaders(): { headers: HttpHeaders } {
    return {
      headers: new HttpHeaders({
        'Accept-Language': this.languageService.currentLanguageValue,
      }),
    };
  }

  private fixedLanguageHeaders(language: Language): { headers: HttpHeaders } {
    return {
      headers: new HttpHeaders({
        'Accept-Language': language,
      }),
    };
  }

  getCategories(): Observable<MenuCategory[]> {
    return this.http.get<MenuCategory[]>(`${this.config.apiUrl}/menu-categories`, this.publicLanguageHeaders());
  }

  getMenuItems(): Observable<MenuItemDto[]> {
    return this.http.get<MenuItemDto[]>(`${this.config.apiUrl}/menu-items`, this.publicLanguageHeaders());
  }

  getAdminCategories(): Observable<MenuCategory[]> {
    if (!this.adminCategoriesCache$) {
      this.adminCategoriesCache$ = this.http
        .get<MenuCategory[]>(`${this.config.apiUrl}/menu-categories`, this.fixedLanguageHeaders('hu'))
        .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    }

    return this.adminCategoriesCache$;
  }

  getAdminMenuItems(): Observable<MenuItemDto[]> {
    if (!this.adminMenuItemsCache$) {
      this.adminMenuItemsCache$ = this.http
        .get<MenuItemDto[]>(`${this.config.apiUrl}/admin/menu-items`, this.fixedLanguageHeaders('hu'))
        .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    }

    return this.adminMenuItemsCache$;
  }

  createCategory(nameHu: string, nameEn?: string): Observable<MenuCategory> {
    const payload = {
      name: nameHu,
      name_hu: nameHu,
      name_en: (nameEn && nameEn.trim()) || nameHu,
    };

    return this.http
      .post<MenuCategory>(`${this.config.apiUrl}/admin/menu-categories`, payload, this.fixedLanguageHeaders('hu'))
      .pipe(tap(() => this.invalidateAdminMenuCache()));
  }

  updateCategory(id: number, nameHu: string, nameEn?: string): Observable<MenuCategory> {
    const payload = {
      name: nameHu,
      name_hu: nameHu,
      name_en: (nameEn && nameEn.trim()) || nameHu,
    };

    return this.http
      .put<MenuCategory>(`${this.config.apiUrl}/admin/menu-categories/${id}`, payload, this.fixedLanguageHeaders('hu'))
      .pipe(tap(() => this.invalidateAdminMenuCache()));
  }

  deleteCategory(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.config.apiUrl}/admin/menu-categories/${id}`, this.fixedLanguageHeaders('hu'))
      .pipe(tap(() => this.invalidateAdminMenuCache()));
  }

  createMenuItem(
    categoryId: number | null,
    nameHu: string,
    descriptionHu: string,
    price: number,
    imageFile: File | null = null,
    sourceItemId: number | null = null,
    nameEn?: string,
    descriptionEn?: string,
  ): Observable<MenuItemDto> {
    return this.http.post<MenuItemDto>(
      `${this.config.apiUrl}/admin/menu-items`,
      this.buildMenuItemFormData(
        categoryId,
        nameHu,
        descriptionHu,
        price,
        imageFile,
        false,
        sourceItemId,
        nameEn,
        descriptionEn,
      ),
      this.fixedLanguageHeaders('hu')
    ).pipe(tap(() => this.invalidateAdminMenuCache()));
  }

  updateMenuItem(
    id: number,
    nameHu: string,
    descriptionHu: string,
    price: number,
    categoryId: number | null,
    imageFile: File | null = null,
    removeImage = false,
    nameEn?: string,
    descriptionEn?: string,
  ): Observable<MenuItemDto> {
    const formData = this.buildMenuItemFormData(
      categoryId,
      nameHu,
      descriptionHu,
      price,
      imageFile,
      removeImage,
      null,
      nameEn,
      descriptionEn,
    );
    formData.append('_method', 'PUT');

    return this.http.post<MenuItemDto>(`${this.config.apiUrl}/admin/menu-items/${id}`, formData, this.fixedLanguageHeaders('hu'))
      .pipe(tap(() => this.invalidateAdminMenuCache()));
  }

  deleteMenuItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.config.apiUrl}/admin/menu-items/${id}`, this.fixedLanguageHeaders('hu'))
      .pipe(tap(() => this.invalidateAdminMenuCache()));
  }

  private buildMenuItemFormData(
    categoryId: number | null,
    nameHu: string,
    descriptionHu: string,
    price: number,
    imageFile: File | null,
    removeImage: boolean,
    sourceItemId: number | null = null,
    nameEn?: string,
    descriptionEn?: string,
  ): FormData {
    const formData = new FormData();

    formData.append('name', nameHu);
    formData.append('name_hu', nameHu);
    formData.append('name_en', (nameEn && nameEn.trim()) || nameHu);
    formData.append('description', descriptionHu);
    formData.append('description_hu', descriptionHu);
    formData.append('description_en', (descriptionEn && descriptionEn.trim()) || descriptionHu);
    formData.append('price', `${Math.round(price)}`);
    formData.append('category_id', categoryId === null ? '' : `${categoryId}`);
    formData.append('remove_image', removeImage ? '1' : '0');

    if (imageFile) {
      formData.append('image', imageFile);
    }

    if (sourceItemId !== null) {
      formData.append('source_item_id', `${sourceItemId}`);
    }

    return formData;
  }
}
