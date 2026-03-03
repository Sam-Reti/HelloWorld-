import { ApplicationConfig } from '@angular/core';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
// TODO: uncomment once @hiyve/* registry issue is resolved
// import { provideHiyve } from '@hiyve/angular';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideRouter(routes),
    provideAnimationsAsync(),
    // TODO: uncomment once @hiyve/* packages are installed
    // provideHiyve({
    //   apiKey: environment.hiyveApiKey,
    //   apiSecret: environment.hiyveApiSecret,
    // }),
  ],
};
