import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class User {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  async ensureUserProfile() {
    const user = this.auth.currentUser;
    if (!user) return;

    const userRef = doc(this.firestore, `users/${user.uid}`);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, {
        displayName: user.email?.split('@')[0] || 'New User',
        bio: '',
        createdAt: new Date(),
      });
    }
  }
}
