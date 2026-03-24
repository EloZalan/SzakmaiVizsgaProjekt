import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

export interface MenuCategory {
  id: number;
  name: string;
}

export interface MenuItemDto {
  id: number;
  name: string;
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

  getCategories(): Observable<MenuCategory[]> {
    return this.http.get<MenuCategory[]>(`${this.config.apiUrl}/menu-categories`);
  }

  getMenuItems(): Observable<MenuItemDto[]> {
    return this.http.get<MenuItemDto[]>(`${this.config.apiUrl}/menu-items`);
  }

  getAdminMenuItems(): Observable<MenuItemDto[]> {
    return this.http.get<MenuItemDto[]>(`${this.config.apiUrl}/admin/menu-items`);
  }

  createCategory(name: string): Observable<MenuCategory> {
    return this.http.post<MenuCategory>(`${this.config.apiUrl}/admin/menu-categories`, { name });
  }

  updateCategory(id: number, name: string): Observable<MenuCategory> {
    return this.http.put<MenuCategory>(`${this.config.apiUrl}/admin/menu-categories/${id}`, { name });
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.config.apiUrl}/admin/menu-categories/${id}`);
  }

  createMenuItem(
    categoryId: number | null,
    name: string,
    description: string,
    price: number,
    imageFile: File | null = null,
    sourceItemId: number | null = null,
  ): Observable<MenuItemDto> {
    return this.http.post<MenuItemDto>(
      `${this.config.apiUrl}/admin/menu-items`,
      this.buildMenuItemFormData(categoryId, name, description, price, imageFile, false, sourceItemId)
    );
  }

  updateMenuItem(
    id: number,
    name: string,
    description: string,
    price: number,
    categoryId: number | null,
    imageFile: File | null = null,
    removeImage = false,
  ): Observable<MenuItemDto> {
    const formData = this.buildMenuItemFormData(categoryId, name, description, price, imageFile, removeImage);
    formData.append('_method', 'PUT');

    return this.http.post<MenuItemDto>(`${this.config.apiUrl}/admin/menu-items/${id}`, formData);
  }

  deleteMenuItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.config.apiUrl}/admin/menu-items/${id}`);
  }

  private buildMenuItemFormData(
    categoryId: number | null,
    name: string,
    description: string,
    price: number,
    imageFile: File | null,
    removeImage: boolean,
    sourceItemId: number | null = null,
  ): FormData {
    const formData = new FormData();

    formData.append('name', name);
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
