import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { MenuService } from './menu.service';
import { ConfigService } from './config.service';
import { LanguageService } from './language.service';

describe('MenuService', () => {
  let service: MenuService;
  let httpMock: HttpTestingController;
  let config: ConfigService;
  let languageService: LanguageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(MenuService);
    httpMock = TestBed.inject(HttpTestingController);
    config = TestBed.inject(ConfigService);
    languageService = TestBed.inject(LanguageService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should request public categories with active language header', () => {
    languageService.setLanguage('en');

    service.getCategories().subscribe();

    const req = httpMock.expectOne(`${config.apiUrl}/menu-categories`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Accept-Language')).toBe('en');
    req.flush([]);
  });

  it('should request public menu items with active language header', () => {
    languageService.setLanguage('hu');

    service.getMenuItems().subscribe();

    const req = httpMock.expectOne(`${config.apiUrl}/menu-items`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Accept-Language')).toBe('hu');
    req.flush([]);
  });

  it('should cache admin categories until invalidation', () => {
    service.getAdminCategories().subscribe();
    service.getAdminCategories().subscribe();

    const req = httpMock.expectOne(`${config.apiUrl}/menu-categories`);
    expect(req.request.headers.get('Accept-Language')).toBe('hu');
    req.flush([{ id: 1, name: 'Levesek' }]);

    httpMock.expectNone(`${config.apiUrl}/menu-categories`);

    service.invalidateAdminMenuCache();
    service.getAdminCategories().subscribe();

    const req2 = httpMock.expectOne(`${config.apiUrl}/menu-categories`);
    req2.flush([{ id: 2, name: 'Főételek' }]);
  });

  it('should cache admin menu items endpoint', () => {
    service.getAdminMenuItems().subscribe();
    service.getAdminMenuItems().subscribe();

    const req = httpMock.expectOne(`${config.apiUrl}/admin/menu-items`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Accept-Language')).toBe('hu');
    req.flush([]);

    httpMock.expectNone(`${config.apiUrl}/admin/menu-items`);
  });

  it('should create category and default english name to hungarian', () => {
    service.createCategory('Gulyás').subscribe();

    const req = httpMock.expectOne(`${config.apiUrl}/admin/menu-categories`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'Gulyás',
      name_hu: 'Gulyás',
      name_en: 'Gulyás',
    });
    req.flush({ id: 1, name: 'Gulyás' });
  });

  it('should update category and trim english name fallback', () => {
    service.updateCategory(3, 'Saláta', '  ').subscribe();

    const req = httpMock.expectOne(`${config.apiUrl}/admin/menu-categories/3`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.name_en).toBe('Saláta');
    req.flush({ id: 3, name: 'Saláta' });
  });

  it('should delete category endpoint', () => {
    service.deleteCategory(8).subscribe();

    const req = httpMock.expectOne(`${config.apiUrl}/admin/menu-categories/8`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should create menu item as FormData', () => {
    service.createMenuItem(4, 'Rántott sajt', 'Friss és ropogós', 2599).subscribe();

    const req = httpMock.expectOne(`${config.apiUrl}/admin/menu-items`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);

    const body = req.request.body as FormData;
    expect(body.get('name')).toBe('Rántott sajt');
    expect(body.get('description')).toBe('Friss és ropogós');
    expect(body.get('price')).toBe('2599');
    expect(body.get('category_id')).toBe('4');
    expect(body.get('remove_image')).toBe('0');
    req.flush({ id: 11 });
  });

  it('should update menu item via method spoofing', () => {
    service.updateMenuItem(9, 'Burger', 'Leírás', 3499, null, null, true).subscribe();

    const req = httpMock.expectOne(`${config.apiUrl}/admin/menu-items/9`);
    expect(req.request.method).toBe('POST');

    const body = req.request.body as FormData;
    expect(body.get('_method')).toBe('PUT');
    expect(body.get('category_id')).toBe('');
    expect(body.get('remove_image')).toBe('1');
    req.flush({ id: 9 });
  });

  it('should delete menu item endpoint', () => {
    service.deleteMenuItem(17).subscribe();

    const req = httpMock.expectOne(`${config.apiUrl}/admin/menu-items/17`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
