import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { serverTimestamp } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class User {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  async ensureUserProfile(): Promise<boolean> {
    const user = this.auth.currentUser;
    if (!user) return false;

    const defaultName = user.email?.split('@')[0] || 'New User';

    const userRef = doc(this.firestore, `users/${user.uid}`);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, {
        displayName: defaultName,
        bio: '',
        avatarColor: '#22c55e',
        createdAt: serverTimestamp(),
        needsOnboarding: true,
      });
      return false; // brand new user → go edit profile
    }

    const data = snap.data() as any;

    // "Complete" means they've set a real display name (not the default)
    const displayName = (data?.displayName ?? '').trim();
    const needsOnboarding = data?.needsOnboarding === true;

    if (!displayName || displayName === defaultName || needsOnboarding) {
      return false;
    }

    return true;
  }
}
