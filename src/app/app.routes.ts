import { Routes } from '@angular/router';
import { SignupComponent } from './signup/signup';
import { LoginComponent } from './login/login';
import { HomeComponent } from './home/home';
import { AppHome } from './app-home/app-home';
import { BackgroundImage } from './background-image/background-image';
import { ExternalNav } from './external-nav/external-nav';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  { path: 'home', component: HomeComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'login', component: LoginComponent },
  { path: 'app-home', component: AppHome },
  { path: 'background-image', component: BackgroundImage },
  { path: 'external-nav', component: ExternalNav },
];
