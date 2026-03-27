import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { Language, LanguageService } from './language.service';

export interface MenuCategory {
  id: number;
  name: string;
  name_hu?: string;
  name_en?: string;
}

export interface MenuItemDto {
  id: number;
  name: string;
  name_hu?: string;
  name_en?: string;
  description: string | null;
  price: number;
  category_id: number | null;
  image_url: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);
  private languageService = inject(LanguageService);

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
    return this.http.get<MenuCategory[]>(`${this.config.apiUrl}/menu-categories`, this.fixedLanguageHeaders('hu'));
  }

  getAdminMenuItems(): Observable<MenuItemDto[]> {
    return this.http.get<MenuItemDto[]>(`${this.config.apiUrl}/admin/menu-items`, this.fixedLanguageHeaders('hu'));
  }

  createCategory(nameHu: string, nameEn?: string): Observable<MenuCategory> {
    const payload = {
      name: nameHu,
      name_hu: nameHu,
      name_en: (nameEn && nameEn.trim()) || nameHu,
    };

    return this.http.post<MenuCategory>(`${this.config.apiUrl}/admin/menu-categories`, payload, this.fixedLanguageHeaders('hu'));
  }

  updateCategory(id: number, nameHu: string, nameEn?: string): Observable<MenuCategory> {
    const payload = {
      name: nameHu,
      name_hu: nameHu,
      name_en: (nameEn && nameEn.trim()) || nameHu,
    };

    return this.http.put<MenuCategory>(`${this.config.apiUrl}/admin/menu-categories/${id}`, payload, this.fixedLanguageHeaders('hu'));
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.config.apiUrl}/admin/menu-categories/${id}`, this.fixedLanguageHeaders('hu'));
  }

  createMenuItem(
    categoryId: number | null,
    nameHu: string,
    description: string,
    price: number,
    imageFile: File | null = null,
    sourceItemId: number | null = null,
    nameEn?: string,
  ): Observable<MenuItemDto> {
    return this.http.post<MenuItemDto>(
      `${this.config.apiUrl}/admin/menu-items`,
      this.buildMenuItemFormData(categoryId, nameHu, description, price, imageFile, false, sourceItemId, nameEn),
      this.fixedLanguageHeaders('hu')
    );
  }

  updateMenuItem(
    id: number,
    nameHu: string,
    description: string,
    price: number,
    categoryId: number | null,
    imageFile: File | null = null,
    removeImage = false,
    nameEn?: string,
  ): Observable<MenuItemDto> {
    const formData = this.buildMenuItemFormData(categoryId, nameHu, description, price, imageFile, removeImage, null, nameEn);
    formData.append('_method', 'PUT');

    return this.http.post<MenuItemDto>(`${this.config.apiUrl}/admin/menu-items/${id}`, formData, this.fixedLanguageHeaders('hu'));
  }

  deleteMenuItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.config.apiUrl}/admin/menu-items/${id}`, this.fixedLanguageHeaders('hu'));
  }

  private buildMenuItemFormData(
    categoryId: number | null,
    nameHu: string,
    description: string,
    price: number,
    imageFile: File | null,
    removeImage: boolean,
    sourceItemId: number | null = null,
    nameEn?: string,
  ): FormData {
    const formData = new FormData();

    formData.append('name', nameHu);
    formData.append('name_hu', nameHu);
    formData.append('name_en', (nameEn && nameEn.trim()) || nameHu);
    formData.append('description', description);
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
