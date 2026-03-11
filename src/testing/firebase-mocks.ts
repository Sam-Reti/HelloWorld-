/**
 * Shared test utilities: Firebase mock providers, fake user, router stubs.
 *
 * IMPORTANT: This file must NOT import from @angular/fire/* to avoid conflicts
 * with vi.mock() hoisting. Callers pass in the DI tokens they import from
 * (possibly mocked) @angular/fire modules.
 */
/// <reference types="vitest/globals" />
import { Provider } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

// ---------------------------------------------------------------------------
// Fake user
// ---------------------------------------------------------------------------
export const FAKE_USER = {
  uid: 'user123',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
};

// ---------------------------------------------------------------------------
// Firebase mock providers
// ---------------------------------------------------------------------------
interface FirebaseTokens {
  Auth: any;
  Firestore: any;
  Storage?: any;
  FirebaseApp?: any;
}

/**
 * Creates Angular DI providers for mocked Firebase services.
 *
 * Provides for BOTH the mock token AND any globalThis singleton token to
 * handle Angular test builder bundling where shared chunks may resolve
 * DI tokens differently from spec entry points.
 */
export function provideFirebaseMocks(
  tokens: FirebaseTokens,
  overrides: Partial<{ auth: any }> = {},
): Provider[] {
  const authValue = { currentUser: FAKE_USER, ...overrides.auth };
  const firestoreValue = {};

  const providers: Provider[] = [
    { provide: tokens.Auth, useValue: authValue },
    { provide: tokens.Firestore, useValue: firestoreValue },
  ];

  // Also provide for globalThis singleton tokens to handle cross-chunk
  // DI token identity mismatches in bundled test environments.
  const g = globalThis as any;
  if (g.__MockAuth && g.__MockAuth !== tokens.Auth) {
    providers.push({ provide: g.__MockAuth, useValue: authValue });
  }
  if (g.__MockFirestore && g.__MockFirestore !== tokens.Firestore) {
    providers.push({ provide: g.__MockFirestore, useValue: firestoreValue });
  }

  if (tokens.Storage) {
    providers.push({ provide: tokens.Storage, useValue: {} });
    if (g.__MockStorage && g.__MockStorage !== tokens.Storage) {
      providers.push({ provide: g.__MockStorage, useValue: {} });
    }
  }
  if (tokens.FirebaseApp) {
    const appValue = { name: '[DEFAULT]', options: {} };
    providers.push({ provide: tokens.FirebaseApp, useValue: appValue });
    if (g.__MockFirebaseApp && g.__MockFirebaseApp !== tokens.FirebaseApp) {
      providers.push({ provide: g.__MockFirebaseApp, useValue: appValue });
    }
  }
  return providers;
}

// ---------------------------------------------------------------------------
// Router stubs
// ---------------------------------------------------------------------------
export function createMockRouter(): Partial<Router> {
  return {
    navigateByUrl: vi.fn().mockResolvedValue(true),
    navigate: vi.fn().mockResolvedValue(true),
    createUrlTree: vi.fn().mockReturnValue({}),
  };
}

export function createMockActivatedRoute(
  params: Record<string, string> = {},
  queryParams: Record<string, string> = {},
): Partial<ActivatedRoute> {
  return {
    params: of(params),
    queryParams: of(queryParams),
    snapshot: {
      params,
      queryParams,
      paramMap: {
        get: (key: string) => params[key] ?? null,
        has: (key: string) => key in params,
        getAll: (key: string) => (params[key] ? [params[key]] : []),
        keys: Object.keys(params),
      },
      queryParamMap: {
        get: (key: string) => queryParams[key] ?? null,
        has: (key: string) => key in queryParams,
        getAll: (key: string) => (queryParams[key] ? [queryParams[key]] : []),
        keys: Object.keys(queryParams),
      },
    } as any,
  };
}
