import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let routerSpy: Router;
  let navigateByUrlSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();

    navigateByUrlSpy = vi.fn();
    routerSpy = { navigateByUrl: navigateByUrlSpy } as unknown as Router;

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('should attach Authorization header when token exists', () => {
    sessionStorage.setItem('token', 'test-token');

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush({ ok: true });
  });

  it('should not attach Authorization header when token does not exist', () => {
    http.get('/api/no-token').subscribe();

    const req = httpMock.expectOne('/api/no-token');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ ok: true });
  });

  it('should clear stored auth and navigate to login on 401', () => {
    sessionStorage.setItem('token', 'persisted');
    sessionStorage.setItem('user', '{"id":1}');
    localStorage.setItem('token', 'persisted');
    localStorage.setItem('user', '{"id":1}');

    let capturedStatus: number | null = null;

    http.get('/api/protected').subscribe({
      next: () => {
        throw new Error('expected 401 error');
      },
      error: (err) => {
        capturedStatus = (err as HttpErrorResponse).status;
      },
    });

    const req = httpMock.expectOne('/api/protected');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(capturedStatus).toBe(401);
    expect(sessionStorage.getItem('token')).toBeNull();
    expect(sessionStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(navigateByUrlSpy).toHaveBeenCalledWith('/login');
  });

  it('should not redirect on non-401 error', () => {
    let capturedStatus: number | null = null;

    http.get('/api/server-error').subscribe({
      next: () => {
        throw new Error('expected 500 error');
      },
      error: (err) => {
        capturedStatus = (err as HttpErrorResponse).status;
      },
    });

    const req = httpMock.expectOne('/api/server-error');
    req.flush({ message: 'Error' }, { status: 500, statusText: 'Server Error' });

    expect(capturedStatus).toBe(500);
    expect(navigateByUrlSpy).not.toHaveBeenCalled();
  });
});
