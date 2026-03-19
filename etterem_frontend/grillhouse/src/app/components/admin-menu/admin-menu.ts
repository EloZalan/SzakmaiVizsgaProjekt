import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuService, MenuCategory } from '../../services/menu.service';

interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  categoryId: number | null;
}

type DragDropZone = number | 'uncategorized' | null;

interface EditingState {
  type: 'category' | 'item' | null;
  id: number | null;
  name: string;
  description: string;
  price: number;
  categoryId: number | null;
}

@Component({
  selector: 'app-admin-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-menu.html',
  styleUrl: './admin-menu.css',
})
export class AdminMenuComponent implements OnInit {
  categories: MenuCategory[] = [];
  menuItems: MenuItem[] = [];
  selectedCategory: MenuCategory | null = null;
  selectedMenuItem: MenuItem | null = null;
  expandedCategoryId: number | null = null;
  draggingMenuItem: MenuItem | null = null;
  dragOverZone: DragDropZone = null;
  movingItemId: number | null = null;

  loading = false;
  error = '';

  editing: EditingState = { type: null, id: null, name: '', description: '', price: 0, categoryId: null };

  constructor(
    private menuService: MenuService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadMenu();
  }

  loadMenu(): void {
    this.loading = true;
    this.error = '';

    this.menuService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loadMenuItems();
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Nem sikerült betölteni a kategóriákat.';
        console.error('MENU LOAD ERROR:', err);
        this.cdr.markForCheck();
      },
    });
  }

  private loadMenuItems(): void {
    this.menuService.getAdminMenuItems().subscribe({
      next: (items) => {
        this.menuItems = items.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          price: item.price,
          categoryId: item.category_id,
        }));
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Nem sikerült betölteni a menü tételeket.';
        console.error('MENU ITEMS LOAD ERROR:', err);
        this.cdr.markForCheck();
      },
    });
  }

  toggleCategory(catId: number): void {
    this.expandedCategoryId = this.expandedCategoryId === catId ? null : catId;
    if (this.expandedCategoryId === catId) {
      this.selectedCategory = this.categories.find(c => c.id === catId) || null;
    }
  }

  startEditCategory(cat: MenuCategory): void {
    this.editing = { type: 'category', id: cat.id, name: cat.name, description: '', price: 0, categoryId: null };
  }

  startAddCategory(): void {
    this.editing = { type: 'category', id: null, name: '', description: '', price: 0, categoryId: null };
  }

  cancelEdit(): void {
    this.editing = { type: null, id: null, name: '', description: '', price: 0, categoryId: null };
  }

  saveCategory(): void {
    if (!this.editing.name.trim()) {
      alert('Add meg a kategória nevét!');
      return;
    }

    if (this.editing.id === null) {
      // Create new
      this.menuService.createCategory(this.editing.name.trim()).subscribe({
        next: () => {
          this.cancelEdit();
          this.loadMenu();
        },
        error: (err: any) => {
          console.error('CREATE CATEGORY ERROR:', err);
          alert('Nem sikerült létrehozni a kategóriát.');
        },
      });
    } else {
      // Update existing
      this.menuService.updateCategory(this.editing.id, this.editing.name.trim()).subscribe({
        next: () => {
          this.cancelEdit();
          this.loadMenu();
        },
        error: (err: any) => {
          console.error('UPDATE CATEGORY ERROR:', err);
          alert('Nem sikerült módosítani a kategóriát.');
        },
      });
    }
  }

  deleteCategory(catId: number): void {
    const confirmed = confirm('Biztosan törlöd ezt a kategóriát és az összes tételét?');
    if (!confirmed) return;

    this.menuService.deleteCategory(catId).subscribe({
      next: () => {
        if (this.selectedCategory?.id === catId) {
          this.selectedCategory = null;
        }
        if (this.expandedCategoryId === catId) {
          this.expandedCategoryId = null;
        }
        this.loadMenu();
      },
      error: (err: any) => {
        console.error('DELETE CATEGORY ERROR:', err);
        alert('Nem sikerült törölni a kategóriát.');
      },
    });
  }

  startEditMenuItem(item: MenuItem): void {
    this.editing = {
      type: 'item',
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      categoryId: item.categoryId,
    };
  }

  startAddMenuItem(): void {
    if (!this.selectedCategory) {
      alert('Válassz ki egy kategóriát!');
      return;
    }
    this.editing = { type: 'item', id: null, name: '', description: '', price: 0, categoryId: this.selectedCategory.id };
  }

  startAddUncategorizedMenuItem(): void {
    this.editing = { type: 'item', id: null, name: '', description: '', price: 0, categoryId: null };
  }

  saveMenuItem(): void {
    if (!this.editing.name.trim()) {
      alert('Add meg a tétel nevét!');
      return;
    }
    if (this.editing.price < 0 || isNaN(this.editing.price)) {
      alert('Érvényes árat adj meg!');
      return;
    }

    const categoryId = this.editing.categoryId ?? this.selectedCategory?.id ?? null;

    if (this.editing.id === null) {
      this.menuService
        .createMenuItem(
          categoryId,
          this.editing.name.trim(),
          this.editing.description.trim(),
          Math.round(this.editing.price)
        )
        .subscribe({
          next: () => {
            this.cancelEdit();
            this.loadMenu();
          },
          error: (err: any) => {
            console.error('CREATE MENU ITEM ERROR:', err);
            alert('Nem sikerült létrehozni a menü tételt.');
          },
        });
    } else {
      this.menuService
        .updateMenuItem(
          this.editing.id,
          this.editing.name.trim(),
          this.editing.description.trim(),
          Math.round(this.editing.price),
          categoryId
        )
        .subscribe({
          next: () => {
            this.cancelEdit();
            this.loadMenu();
          },
          error: (err: any) => {
            console.error('UPDATE MENU ITEM ERROR:', err);
            alert('Nem sikerült módosítani a menü tételt.');
          },
        });
    }
  }

  deleteMenuItem(itemId: number): void {
    const confirmed = confirm('Biztosan törlöd ezt a menü tételt?');
    if (!confirmed) return;

    this.menuService.deleteMenuItem(itemId).subscribe({
      next: () => {
        if (this.selectedMenuItem?.id === itemId) {
          this.selectedMenuItem = null;
        }
        this.loadMenu();
      },
      error: (err: any) => {
        console.error('DELETE MENU ITEM ERROR:', err);
        alert('Nem sikerült törölni a menü tételt.');
      },
    });
  }

  onMenuItemDragStart(item: MenuItem, event: DragEvent): void {
    if (this.movingItemId !== null) {
      event.preventDefault();
      return;
    }

    this.draggingMenuItem = item;
    this.dragOverZone = null;

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(item.id));
    }

    this.cdr.markForCheck();
  }

  onMenuItemDragEnd(): void {
    this.draggingMenuItem = null;
    this.dragOverZone = null;
    this.cdr.markForCheck();
  }

  onCategoryDragOver(categoryId: number, event: DragEvent): void {
    if (!this.draggingMenuItem) {
      return;
    }

    if (this.draggingMenuItem.categoryId === categoryId) {
      return;
    }

    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    if (this.dragOverZone !== categoryId) {
      this.dragOverZone = categoryId;
      this.cdr.markForCheck();
    }
  }

  onCategoryDragLeave(categoryId: number): void {
    if (this.dragOverZone === categoryId) {
      this.dragOverZone = null;
      this.cdr.markForCheck();
    }
  }

  onCategoryDrop(targetCategory: MenuCategory, event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const draggedItem = this.draggingMenuItem;
    this.dragOverZone = null;

    if (!draggedItem) {
      return;
    }

    if (draggedItem.categoryId === targetCategory.id) {
      this.onMenuItemDragEnd();
      return;
    }

    this.moveItemToCategory(draggedItem, targetCategory);
  }

  onUncategorizedDragOver(event: DragEvent): void {
    if (!this.draggingMenuItem || this.draggingMenuItem.categoryId === null) {
      return;
    }

    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    if (this.dragOverZone !== 'uncategorized') {
      this.dragOverZone = 'uncategorized';
      this.cdr.markForCheck();
    }
  }

  onUncategorizedDragLeave(): void {
    if (this.dragOverZone === 'uncategorized') {
      this.dragOverZone = null;
      this.cdr.markForCheck();
    }
  }

  onUncategorizedDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const draggedItem = this.draggingMenuItem;
    this.dragOverZone = null;

    if (!draggedItem || draggedItem.categoryId === null) {
      return;
    }

    this.moveItemToCategory(draggedItem, null);
  }

  private moveItemToCategory(item: MenuItem, targetCategory: MenuCategory | null): void {
    this.movingItemId = item.id;

    this.menuService
      .updateMenuItem(
        item.id,
        item.name,
        item.description || '',
        Math.round(item.price),
        targetCategory?.id ?? null
      )
      .subscribe({
        next: () => {
          this.menuItems = this.menuItems.map((menuItem) =>
            menuItem.id === item.id
              ? { ...menuItem, categoryId: targetCategory?.id ?? null }
              : menuItem
          );

          this.selectedCategory = targetCategory;
          this.expandedCategoryId = targetCategory?.id ?? null;
          this.draggingMenuItem = null;
          this.movingItemId = null;
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.draggingMenuItem = null;
          this.movingItemId = null;
          console.error('MOVE MENU ITEM ERROR:', err);
          alert('Nem sikerült áthelyezni a menü tételt.');
          this.cdr.markForCheck();
        },
      });
  }

  get filteredMenuItems(): MenuItem[] {
    if (!this.selectedCategory) return [];
    return this.menuItems.filter(item => item.categoryId === this.selectedCategory!.id);
  }

  get uncategorizedMenuItems(): MenuItem[] {
    return this.menuItems.filter((item) => item.categoryId === null);
  }
}
