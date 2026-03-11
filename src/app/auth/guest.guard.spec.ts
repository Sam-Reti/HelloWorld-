import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { guestGuard } from './guest.guard';
import { firstValueFrom, Observable, of } from 'rxjs';

import { authState } from '@angular/fire/auth';

describe('guestGuard', () => {
  let mockRouter: { createUrlTree: ReturnType<typeof vi.fn> };

  function setup(user: any) {
    (authState as any).mockReturnValue(of(user));

    mockRouter = { createUrlTree: vi.fn().mockReturnValue({ toString: () => '/app-home' } as any) };

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

  it('should return true when no user is logged in', async () => {
    setup(null);

    const result = await TestBed.runInInjectionContext(() => {
      return firstValueFrom(guestGuard(null as any, null as any) as Observable<boolean | UrlTree>);
    });

    expect(result).toBe(true);
  });

  it('should return true for unverified user', async () => {
    setup({ uid: 'u1', emailVerified: false });

    const result = await TestBed.runInInjectionContext(() => {
      return firstValueFrom(guestGuard(null as any, null as any) as Observable<boolean | UrlTree>);
    });

    expect(result).toBe(true);
  });

  it('should redirect verified user to /app-home', async () => {
    setup({ uid: 'u1', emailVerified: true });

    const result = await TestBed.runInInjectionContext(() => {
      return firstValueFrom(guestGuard(null as any, null as any) as Observable<boolean | UrlTree>);
    });

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/app-home']);
    expect(result).not.toBe(true);
  });
});
