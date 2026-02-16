import { ApplicationConfig } from '@angular/core';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
// Optional later:
// import { provideFirestore, getFirestore } from '@angular/fire/firestore';
// import { provideStorage, getStorage } from '@angular/fire/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyAGf3rdpkKWUy20vKya2OeL6serxb8MJmE',
  authDomain: 'dev-world-v1.firebaseapp.com',
  projectId: 'dev-world-v1',
  storageBucket: 'dev-world-v1.firebasestorage.app',
  messagingSenderId: '1002641470453',
  appId: '1:1002641470453:web:9e94b9617e8f94fd7926bc',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideRouter(routes),
  ],
};
