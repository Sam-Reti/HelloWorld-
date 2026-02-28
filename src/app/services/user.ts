import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { serverTimestamp } from 'firebase/firestore';
import { firstValueFrom } from 'rxjs';
import { authState } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class User {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  /** Make sure a Firestore profile doc exists for the current user. */
  async ensureUserProfile(): Promise<void> {
    const user = await firstValueFrom(authState(this.auth));
    if (!user) return;

    const userRef = doc(this.firestore, `users/${user.uid}`);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      const defaultName = user.email?.split('@')[0] || 'New User';
      await setDoc(userRef, {
        displayName: defaultName,
        bio: '',
        avatarColor: '#0ea5a4',
        createdAt: serverTimestamp(),
      });
    }
  }
}
