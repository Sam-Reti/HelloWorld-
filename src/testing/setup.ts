/**
 * Global test setup file.
 *
 * Establishes vi.mock() for Firebase and third-party modules ONCE,
 * before any spec files load.
 *
 * CRITICAL: Every mock function is stored on globalThis so that when
 * Angular's esbuild test builder re-evaluates mock factories across
 * different chunks, the SAME vi.fn() instances are returned. Without
 * this, the function the spec configures (e.g. getDoc.mockResolvedValue)
 * and the function the source code actually calls may be different
 * references — leading to non-deterministic test failures.
 *
 * IMPORTANT: Every export used by source or spec files must be listed here.
 * If a new import is added to a source file and it's not mocked here,
 * Vitest will throw "No X export is defined on the mock".
 */

const g = globalThis as any;

// ---------------------------------------------------------------------------
// Helper: create a globalThis-backed vi.fn() singleton.
// If the key already exists on globalThis, return it; otherwise create and store.
// ---------------------------------------------------------------------------
function gFn(key: string, impl?: (...args: any[]) => any): any {
  if (!g[key]) {
    g[key] = impl ? vi.fn(impl) : vi.fn();
  }
  return g[key];
}

// ---------------------------------------------------------------------------
// DI token singletons (classes used by Angular's injector)
// ---------------------------------------------------------------------------
g.__MockAuth ??= class MockAuth {};
g.__MockFirestore ??= class MockFirestore {};
g.__MockStorage ??= class MockStorage {};
g.__MockHiyveService ??= class MockHiyveService {};
g.__MockRoomService ??= class MockRoomService {};
g.__MockFirebaseApp ??= class MockFirebaseApp {};

// ---------------------------------------------------------------------------
// @angular/fire/auth
// ---------------------------------------------------------------------------
vi.mock('@angular/fire/auth', () => ({
  Auth: g.__MockAuth,
  authState: gFn('__mock_authState'),
}));

// ---------------------------------------------------------------------------
// firebase/auth — all exports used by source files
// ---------------------------------------------------------------------------
vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: gFn('__mock_GoogleAuthProvider'),
  signInWithPopup: gFn('__mock_signInWithPopup', () => Promise.resolve({ user: {} })),
  signInWithEmailAndPassword: gFn('__mock_signInWithEmailAndPassword', () =>
    Promise.resolve({ user: {} }),
  ),
  createUserWithEmailAndPassword: gFn('__mock_createUserWithEmailAndPassword', () =>
    Promise.resolve({ user: {} }),
  ),
  updateProfile: gFn('__mock_updateProfile', () => Promise.resolve(undefined)),
  sendEmailVerification: gFn('__mock_sendEmailVerification', () => Promise.resolve(undefined)),
  sendPasswordResetEmail: gFn('__mock_sendPasswordResetEmail', () => Promise.resolve(undefined)),
  verifyPasswordResetCode: gFn('__mock_verifyPasswordResetCode', () => Promise.resolve('')),
  confirmPasswordReset: gFn('__mock_confirmPasswordReset', () => Promise.resolve(undefined)),
  applyActionCode: gFn('__mock_applyActionCode', () => Promise.resolve(undefined)),
  onAuthStateChanged: gFn('__mock_onAuthStateChanged'),
  signOut: gFn('__mock_signOut', () => Promise.resolve(undefined)),
}));

// ---------------------------------------------------------------------------
// @angular/fire/firestore — all exports used by source or spec files
// ---------------------------------------------------------------------------
vi.mock('@angular/fire/firestore', () => ({
  Firestore: g.__MockFirestore,
  collection: gFn('__mock_af_collection', () => 'col'),
  collectionData: gFn('__mock_af_collectionData'),
  collectionGroup: gFn('__mock_af_collectionGroup', () => 'colGroupRef'),
  doc: gFn('__mock_af_doc', () => 'docRef'),
  docData: gFn('__mock_af_docData'),
  documentId: gFn('__mock_af_documentId', () => '__name__'),
  getDoc: gFn('__mock_af_getDoc'),
  setDoc: gFn('__mock_af_setDoc', () => Promise.resolve(undefined)),
  addDoc: gFn('__mock_af_addDoc'),
  updateDoc: gFn('__mock_af_updateDoc'),
  deleteDoc: gFn('__mock_af_deleteDoc', () => Promise.resolve(undefined)),
  query: gFn('__mock_af_query', () => 'queryRef'),
  where: gFn('__mock_af_where'),
  orderBy: gFn('__mock_af_orderBy'),
  serverTimestamp: gFn('__mock_af_serverTimestamp', () => 'SERVER_TS'),
}));

// ---------------------------------------------------------------------------
// firebase/firestore — all exports used by source or spec files
// ---------------------------------------------------------------------------
vi.mock('firebase/firestore', () => ({
  doc: gFn('__mock_fb_doc', () => 'docRef'),
  getDoc: gFn('__mock_fb_getDoc'),
  setDoc: gFn('__mock_fb_setDoc'),
  deleteDoc: gFn('__mock_fb_deleteDoc'),
  getDocs: gFn('__mock_fb_getDocs'),
  query: gFn('__mock_fb_query', () => 'queryRef'),
  orderBy: gFn('__mock_fb_orderBy'),
  where: gFn('__mock_fb_where'),
  startAfter: gFn('__mock_fb_startAfter'),
  limit: gFn('__mock_fb_limit'),
  increment: gFn('__mock_fb_increment', (n: number) => n),
  serverTimestamp: gFn('__mock_fb_serverTimestamp', () => 'SERVER_TS'),
  runTransaction: gFn('__mock_fb_runTransaction'),
  arrayUnion: gFn('__mock_fb_arrayUnion', (v: string) => `arrayUnion(${v})`),
  arrayRemove: gFn('__mock_fb_arrayRemove', (v: string) => `arrayRemove(${v})`),
  Timestamp: g.__mock_fb_Timestamp ??= {
    now: vi.fn(() => ({ toMillis: () => Date.now() })),
  },
  QueryDocumentSnapshot: gFn('__mock_fb_QueryDocumentSnapshot'),
  DocumentData: gFn('__mock_fb_DocumentData'),
}));

// ---------------------------------------------------------------------------
// @angular/fire/storage
// ---------------------------------------------------------------------------
vi.mock('@angular/fire/storage', () => ({
  Storage: g.__MockStorage,
  ref: gFn('__mock_ref'),
  uploadBytes: gFn('__mock_uploadBytes'),
  getDownloadURL: gFn('__mock_getDownloadURL'),
}));

// ---------------------------------------------------------------------------
// @hiyve/angular — all exports used by source files
// ---------------------------------------------------------------------------
vi.mock('@hiyve/angular', () => ({
  HiyveService: g.__MockHiyveService,
  RoomService: g.__MockRoomService,
  VideoGridComponent: gFn('__mock_VideoGridComponent'),
  ControlBarComponent: gFn('__mock_ControlBarComponent'),
  provideHiyve: gFn('__mock_provideHiyve', () => []),
}));

// ---------------------------------------------------------------------------
// @angular/fire/app
// ---------------------------------------------------------------------------
vi.mock('@angular/fire/app', () => ({
  FirebaseApp: g.__MockFirebaseApp,
  provideFirebaseApp: gFn('__mock_provideFirebaseApp', () => []),
  getApp: gFn('__mock_getApp'),
  initializeApp: gFn('__mock_initializeApp'),
}));

// ---------------------------------------------------------------------------
// firebase/ai — used by PracticeService
// ---------------------------------------------------------------------------
vi.mock('firebase/ai', () => ({
  getGenerativeModel: gFn('__mock_getGenerativeModel'),
  getAI: gFn('__mock_getAI'),
  GoogleAIBackend: gFn('__mock_GoogleAIBackend'),
}));
