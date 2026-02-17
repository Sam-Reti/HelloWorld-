import { Routes } from '@angular/router';
import { SignupComponent } from './signup/signup';
import { LoginComponent } from './login/login';
import { HomeComponent } from './home/home';
import { AppHome } from './app-home/app-home';
import { authGuard } from './auth/auth.guard';
import { guestGuard } from './auth/guest.guard';
import { Feed } from './feed/feed';
import { Editprofile } from './editprofile/editprofile';
import { Profile } from './profile/profile';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  { path: 'home', component: HomeComponent },
  {
    path: 'signup',
    component: SignupComponent,
    canActivate: [guestGuard], // logged-in users blocked
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
  },
  {
    path: 'app-home',
    component: AppHome,
    canActivate: [authGuard], // must be logged in
    children: [
      { path: '', redirectTo: 'feed', pathMatch: 'full' },
      { path: 'feed', component: Feed },
      { path: 'edit-profile', component: Editprofile },
      { path: 'profile', component: Profile },
    ],
  },
  { path: '**', redirectTo: 'home' },
];
