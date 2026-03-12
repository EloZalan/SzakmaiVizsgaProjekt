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
}