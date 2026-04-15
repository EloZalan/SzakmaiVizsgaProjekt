import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService, User } from './auth';
import { ConfigService } from './config.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let config: ConfigService;

  const mockUser: User = {
    id: 1,
    name: 'Admin',
    email: 'admin@admin.com',
    role: 'admin',
    on_shift: false,
  };

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    config = TestBed.inject(ConfigService);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login and persist token and user', () => {
    const response = { token: 'abc123', user: mockUser };

    service.login('admin@admin.com', 'secret').subscribe((res) => {
      expect(res).toEqual(response);
      expect(service.token).toBe('abc123');
      expect(service.user).toEqual(mockUser);
      expect(sessionStorage.getItem('token')).toBe('abc123');
      expect(sessionStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    });

    const req = httpMock.expectOne(`${config.apiUrl}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'admin@admin.com', password: 'secret' });
    req.flush(response);
  });

  it('should fetch current user and update session user', () => {
    service.fetchCurrentUser().subscribe((user) => {
      expect(user).toEqual(mockUser);
      expect(service.user).toEqual(mockUser);
      expect(sessionStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    });

    const req = httpMock.expectOne(`${config.apiUrl}/user`);
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);
  });

  it('should call take-shift endpoint and update user state', () => {
    const shiftedUser = { ...mockUser, on_shift: true };

    service.takeShift().subscribe((user) => {
      expect(user.on_shift).toBe(true);
      expect(service.isOnShift).toBe(true);
    });

    const req = httpMock.expectOne(`${config.apiUrl}/take-shift`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush(shiftedUser);
  });

  it('should call end-shift endpoint and update user state', () => {
    service.user = { ...mockUser, on_shift: true };
    const shiftedUser = { ...mockUser, on_shift: false };

    service.endShift().subscribe((user) => {
      expect(user.on_shift).toBe(false);
      expect(service.isOnShift).toBe(false);
    });

    const req = httpMock.expectOne(`${config.apiUrl}/end-shift`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush(shiftedUser);
  });

  it('should update user with payload and save the returned user', () => {
    const payload = {
      email: 'new-admin@admin.com',
      password: 'newpass123',
      password_confirmation: 'newpass123',
    };
    const updated = { ...mockUser, email: payload.email };

    service.updateUser(payload).subscribe((user) => {
      expect(user.email).toBe(payload.email);
      expect(service.user?.email).toBe(payload.email);
    });

    const req = httpMock.expectOne(`${config.apiUrl}/user`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush(updated);
  });

  it('should clear session and skip API call on logout without token', () => {
    service.token = null;
    service.user = mockUser;
    sessionStorage.setItem('user', JSON.stringify(mockUser));

    service.logout();

    expect(service.token).toBeNull();
    expect(service.user).toBeNull();
    expect(sessionStorage.getItem('token')).toBeNull();
    expect(sessionStorage.getItem('user')).toBeNull();
    httpMock.expectNone(`${config.apiUrl}/logout`);
  });

  it('should send logout API request with bearer token and clear session', () => {
    service.token = 'persisted-token';
    service.user = mockUser;

    service.logout();

    const req = httpMock.expectOne(`${config.apiUrl}/logout`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer persisted-token');
    req.flush({});

    expect(service.token).toBeNull();
    expect(service.user).toBeNull();
  });

  it('should tolerate logout API error after local session clear', () => {
    service.token = 'persisted-token';
    service.user = mockUser;

    service.logout();

    const req = httpMock.expectOne(`${config.apiUrl}/logout`);
    req.flush({ message: 'server error' }, { status: 500, statusText: 'Server Error' });

    expect(service.token).toBeNull();
    expect(service.user).toBeNull();
  });

  it('should resolve role-based home routes correctly', () => {
    service.user = { ...mockUser, role: 'admin' };
    expect(service.getHomeRouteByRole()).toBe('/admin');

    service.user = { ...mockUser, role: 'waiter' };
    expect(service.getHomeRouteByRole()).toBe('/waiter/user');

    service.user = { ...mockUser, role: 'customer' };
    expect(service.getHomeRouteByRole()).toBe('/');

    service.user = null;
    expect(service.getHomeRouteByRole()).toBe('/login');
  });
});
