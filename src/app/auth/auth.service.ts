// auth.service.ts
import { Injectable, inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);

  // Emits the user object when logged in, or null when logged out
  user$: Observable<any | null> = authState(this.auth);

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider);
  }
}
