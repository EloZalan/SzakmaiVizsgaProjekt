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
  category_id: number;
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

  createCategory(name: string): Observable<MenuCategory> {
    return this.http.post<MenuCategory>(`${this.config.apiUrl}/admin/menu-categories`, { name });
  }

  updateCategory(id: number, name: string): Observable<MenuCategory> {
    return this.http.put<MenuCategory>(`${this.config.apiUrl}/admin/menu-categories/${id}`, { name });
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.config.apiUrl}/admin/menu-categories/${id}`);
  }

  createMenuItem(categoryId: number, name: string, description: string, price: number): Observable<MenuItemDto> {
    return this.http.post<MenuItemDto>(`${this.config.apiUrl}/admin/menu-items`, {
      category_id: categoryId,
      name,
      description,
      price,
    });
  }

  updateMenuItem(id: number, name: string, description: string, price: number, categoryId: number): Observable<MenuItemDto> {
    return this.http.put<MenuItemDto>(`${this.config.apiUrl}/admin/menu-items/${id}`, {
      name,
      description,
      price,
      category_id: categoryId,
    });
  }

  deleteMenuItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.config.apiUrl}/admin/menu-items/${id}`);
  }
}
