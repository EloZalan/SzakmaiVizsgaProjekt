import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuService, MenuCategory } from '../../services/menu.service';

interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  categoryId: number | null;
  imageUrl: string | null;
}

type DragDropZone = number | 'uncategorized' | null;
type DropAction = 'copy' | 'move';

interface DropDecisionState {
  item: MenuItem;
  targetCategoryId: number | null;
  targetLabel: string;
}

interface EditingState {
  type: 'category' | 'item' | null;
  id: number | null;
  name: string;
  description: string;
  price: number;
  categoryId: number | null;
  currentImageUrl: string | null;
  imageFile: File | null;
  imagePreviewUrl: string | null;
  removeImage: boolean;
}

@Component({
  selector: 'app-admin-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-menu.html',
  styleUrl: './admin-menu.css',
})
export class AdminMenuComponent implements OnInit, OnDestroy {
  categories: MenuCategory[] = [];
  menuItems: MenuItem[] = [];
  selectedCategory: MenuCategory | null = null;
  selectedMenuItem: MenuItem | null = null;
  expandedCategoryId: number | null = null;
  draggingMenuItem: MenuItem | null = null;
  dragOverZone: DragDropZone = null;
  movingItemId: number | null = null;
  pendingDrop: DropDecisionState | null = null;
  showDropDecisionModal = false;
  decisionLoading = false;

  loading = false;
  error = '';

  editing: EditingState = this.createEmptyEditingState();

  constructor(
    private menuService: MenuService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadMenu();
  }

  ngOnDestroy(): void {
    this.releaseEditingPreviewUrl();
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
          imageUrl: item.image_url,
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
    this.resetEditingState({
      type: 'category',
      id: cat.id,
      name: cat.name,
    });
  }

  startAddCategory(): void {
    this.resetEditingState({
      type: 'category',
    });
  }

  cancelEdit(): void {
    this.resetEditingState();
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
      currentImageUrl: item.imageUrl,
      imageFile: null,
      imagePreviewUrl: null,
      removeImage: false,
    };
  }

  startAddMenuItem(): void {
    if (!this.selectedCategory) {
      alert('Válassz ki egy kategóriát!');
      return;
    }
    this.resetEditingState({
      type: 'item',
      categoryId: this.selectedCategory.id,
    });
  }

  startAddUncategorizedMenuItem(): void {
    this.selectedCategory = null;
    this.expandedCategoryId = null;
    this.resetEditingState({
      type: 'item',
      categoryId: null,
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;

    this.releaseEditingPreviewUrl();

    if (!file) {
      this.editing.imageFile = null;
      this.editing.imagePreviewUrl = null;
      return;
    }

    this.editing.imageFile = file;
    this.editing.imagePreviewUrl = URL.createObjectURL(file);
    this.editing.removeImage = false;
  }

  clearSelectedImage(): void {
    this.releaseEditingPreviewUrl();
    this.editing.imageFile = null;
    this.editing.imagePreviewUrl = null;
  }

  removeCurrentImage(): void {
    this.clearSelectedImage();
    this.editing.removeImage = true;
  }

  restoreCurrentImage(): void {
    this.editing.removeImage = false;
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

    const categoryId = this.editing.categoryId;

    if (this.editing.id === null) {
      this.menuService
        .createMenuItem(
          categoryId,
          this.editing.name.trim(),
          this.editing.description.trim(),
          Math.round(this.editing.price),
          this.editing.imageFile,
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
          categoryId,
          this.editing.imageFile,
          this.editing.removeImage
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

    if (draggedItem.categoryId === null) {
      this.moveItemToCategory(draggedItem, targetCategory.id);
      return;
    }

    this.openDropDecisionModal(draggedItem, targetCategory.id, targetCategory.name);
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

  closeDropDecisionModal(): void {
    if (this.decisionLoading) {
      return;
    }

    this.pendingDrop = null;
    this.showDropDecisionModal = false;
    this.draggingMenuItem = null;
    this.dragOverZone = null;
    this.cdr.markForCheck();
  }

  confirmDropAsMove(): void {
    this.executeDropDecision('move');
  }

  confirmDropAsCopy(): void {
    this.executeDropDecision('copy');
  }

  private openDropDecisionModal(item: MenuItem, targetCategoryId: number | null, targetLabel: string): void {
    this.pendingDrop = {
      item,
      targetCategoryId,
      targetLabel,
    };
    this.showDropDecisionModal = true;
    this.cdr.markForCheck();
  }

  private executeDropDecision(action: DropAction): void {
    if (!this.pendingDrop) {
      return;
    }

    const { item, targetCategoryId } = this.pendingDrop;

    if (action === 'move' && item.categoryId === targetCategoryId) {
      this.closeDropDecisionModal();
      return;
    }

    this.decisionLoading = true;

    if (action === 'move') {
      this.moveItemToCategory(item, targetCategoryId);
      return;
    }

    this.copyItemToCategory(item, targetCategoryId);
  }

  private moveItemToCategory(item: MenuItem, targetCategoryId: number | null): void {
    this.movingItemId = item.id;

    this.menuService
      .updateMenuItem(
        item.id,
        item.name,
        item.description || '',
        Math.round(item.price),
        targetCategoryId,
        null,
        false
      )
      .subscribe({
        next: () => {
          this.menuItems = this.menuItems.map((menuItem) =>
            menuItem.id === item.id
              ? { ...menuItem, categoryId: targetCategoryId }
              : menuItem
          );

          this.selectedCategory = targetCategoryId === null
            ? null
            : this.categories.find((category) => category.id === targetCategoryId) || null;
          this.expandedCategoryId = targetCategoryId;
          this.draggingMenuItem = null;
          this.pendingDrop = null;
          this.showDropDecisionModal = false;
          this.movingItemId = null;
          this.decisionLoading = false;
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.draggingMenuItem = null;
          this.pendingDrop = null;
          this.showDropDecisionModal = false;
          this.movingItemId = null;
          this.decisionLoading = false;
          console.error('MOVE MENU ITEM ERROR:', err);
          alert('Nem sikerült áthelyezni a menü tételt.');
          this.cdr.markForCheck();
        },
      });
  }

  private copyItemToCategory(item: MenuItem, targetCategoryId: number | null): void {
    this.movingItemId = item.id;

    this.menuService
      .createMenuItem(
        targetCategoryId,
        item.name,
        item.description || '',
        Math.round(item.price),
        null,
        item.id
      )
      .subscribe({
        next: () => {
          this.pendingDrop = null;
          this.showDropDecisionModal = false;
          this.decisionLoading = false;
          this.draggingMenuItem = null;
          this.movingItemId = null;
          this.loadMenu();
        },
        error: (err: any) => {
          this.pendingDrop = null;
          this.showDropDecisionModal = false;
          this.decisionLoading = false;
          this.draggingMenuItem = null;
          this.movingItemId = null;
          console.error('COPY MENU ITEM ERROR:', err);
          alert('Nem sikerült lemásolni a menü tételt.');
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

  get editingImagePreview(): string | null {
    if (this.editing.imagePreviewUrl) {
      return this.editing.imagePreviewUrl;
    }

    if (this.editing.removeImage) {
      return null;
    }

    return this.editing.currentImageUrl;
  }

  private createEmptyEditingState(overrides: Partial<EditingState> = {}): EditingState {
    return {
      type: null,
      id: null,
      name: '',
      description: '',
      price: 0,
      categoryId: null,
      currentImageUrl: null,
      imageFile: null,
      imagePreviewUrl: null,
      removeImage: false,
      ...overrides,
    };
  }

  private resetEditingState(overrides: Partial<EditingState> = {}): void {
    this.releaseEditingPreviewUrl();
    this.editing = this.createEmptyEditingState(overrides);
  }

  private releaseEditingPreviewUrl(): void {
    if (this.editing.imagePreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.editing.imagePreviewUrl);
    }
  }
}
