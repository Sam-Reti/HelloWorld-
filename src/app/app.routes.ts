import { Routes } from '@angular/router';
import { SignupComponent } from './signup/signup';
import { LoginComponent } from './login/login';
import { HomeComponent } from './home/home';
import { AppHome } from './app-home/app-home';
import { VerifyEmailComponent } from './verify-email/verify-email';
import { authGuard } from './auth/auth.guard';
import { guestGuard } from './auth/guest.guard';
import { Feed } from './feed/feed';
import { Editprofile } from './editprofile/editprofile';
import { Profile } from './profile/profile';
import { Discover } from './discover/discover';
import { UserProfile } from './user-profile/user-profile';
import { ChatInbox } from './chat-inbox/chat-inbox';
import { Following } from './following/following';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  { path: 'home', component: HomeComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
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
      { path: 'discover', component: Discover },
      { path: 'following', component: Following },
      { path: 'user/:uid', component: UserProfile },
      { path: 'messages', component: ChatInbox },
    ],
  },
  { path: '**', redirectTo: 'home' },
];
