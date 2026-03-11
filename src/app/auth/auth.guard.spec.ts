import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { authGuard } from './auth.guard';
import { firstValueFrom, Observable, of } from 'rxjs';

import { authState } from '@angular/fire/auth';

describe('authGuard', () => {
  let mockRouter: { createUrlTree: ReturnType<typeof vi.fn> };

  function setup(user: any) {
    (authState as any).mockReturnValue(of(user));

    mockRouter = { createUrlTree: vi.fn().mockReturnValue({ toString: () => '/login' } as any) };

    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: {} },
        { provide: Router, useValue: mockRouter },
      ],
    });
  }

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return true for a verified user', async () => {
    setup({ uid: 'u1', emailVerified: true });

    const result = await TestBed.runInInjectionContext(() => {
      return firstValueFrom(authGuard(null as any, null as any) as Observable<boolean | UrlTree>);
    });

    expect(result).toBe(true);
  });

  it('should redirect unverified user to /login', async () => {
    setup({ uid: 'u1', emailVerified: false });

    const result = await TestBed.runInInjectionContext(() => {
      return firstValueFrom(authGuard(null as any, null as any) as Observable<boolean | UrlTree>);
    });

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).not.toBe(true);
  });

  it('should redirect null user to /login', async () => {
    setup(null);

    const result = await TestBed.runInInjectionContext(() => {
      return firstValueFrom(authGuard(null as any, null as any) as Observable<boolean | UrlTree>);
    });

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).not.toBe(true);
  });
});
