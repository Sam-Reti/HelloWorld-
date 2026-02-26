import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { RouterLink } from '@angular/router';
import { ThemeService, Theme } from '../services/theme.service';

type UserProfile = { displayName: string; bio: string };

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private themeService = inject(ThemeService);
  private cdr = inject(ChangeDetectorRef);

  email = this.auth.currentUser?.email ?? null;
  profile: UserProfile | null = null;
  loading = true;

  async ngOnInit() {
    const user = this.auth.currentUser;
    if (!user) { this.loading = false; return; }
    const snap = await getDoc(doc(this.firestore, `users/${user.uid}`));
    this.profile = snap.exists() ? (snap.data() as UserProfile) : null;
    this.loading = false;
    this.cdr.detectChanges();
  }

  get lightThemes(): Theme[] { return this.themeService.lightThemes; }
  get darkThemes(): Theme[]  { return this.themeService.darkThemes; }
  get activeTheme(): string  { return this.themeService.current(); }

  selectTheme(id: string): void {
    this.themeService.apply(id);
  }

  getInitials(value: string | null | undefined): string {
    if (!value) return 'U';
    const parts = value.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
}
