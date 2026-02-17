import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { RouterLink } from '@angular/router';

type UserProfile = { displayName: string; bio: string };

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  email = this.auth.currentUser?.email ?? null;

  profile$: Observable<UserProfile | null> = (() => {
    const user = this.auth.currentUser;
    if (!user) return of(null);
    return docData(doc(this.firestore, `users/${user.uid}`)) as Observable<UserProfile>;
  })();

  getInitials(value: string | null | undefined): string {
    if (!value) return 'U';
    const parts = value.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
}
