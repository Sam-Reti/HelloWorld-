// auth.service.ts
import { Injectable, inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { GoogleAuthProvider, signInWithPopup, AuthError } from 'firebase/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  // Emits the user object when logged in, or null when logged out
  user$: Observable<any | null> = authState(this.auth);

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    try {
      const credential = await signInWithPopup(this.auth, provider);
      await this.ensureFirestoreDoc(credential.user);
    } catch (error) {
      const authError = error as AuthError;
      if (authError.code === 'auth/account-exists-with-different-credential') {
        throw new Error(
          'An account with this email already exists. Please sign in with your email and password instead.',
        );
      }
      throw error;
    }
  }

  private async ensureFirestoreDoc(user: { uid: string; displayName: string | null; email: string | null }): Promise<void> {
    const userRef = doc(this.firestore, `users/${user.uid}`);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        displayName: user.displayName || '',
        bio: '',
        email: user.email || '',
        avatarColor: '#0ea5a4',
        followerCount: 0,
        followingCount: 0,
        createdAt: new Date(),
      });
    }
  }
}
