import { ApplicationConfig } from '@angular/core';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';

// TODO: Re-enable App Check once reCAPTCHA Enterprise is properly configured
// in Google Cloud Console. Steps:
// 1. Enable the "reCAPTCHA Enterprise API" at https://console.cloud.google.com/apis/library/recaptchaenterprise.googleapis.com
// 2. Create a reCAPTCHA Enterprise key at https://console.cloud.google.com/security/recaptcha
//    - Key type: "Website", add your domain (dev-world-v1.web.app)
// 3. Register that key in Firebase Console → App Check → Web app
// 4. Put the site key in environment.ts / environment.prod.ts
// 5. Uncomment the provideAppCheck line below
// 6. Turn on enforcement in Firebase Console → App Check

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    // provideAppCheck(() =>
    //   initializeAppCheck(undefined, {
    //     provider: new ReCaptchaEnterpriseProvider(environment.recaptchaSiteKey),
    //     isTokenAutoRefreshEnabled: true,
    //   }),
    // ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideRouter(routes),
  ],
};
