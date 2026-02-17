import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-editprofile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './editprofile.html',
  styleUrl: './editprofile.css',
})
export class Editprofile implements OnInit {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private router = inject(Router);

  displayName = '';
  bio = '';
  private cdr = inject(ChangeDetectorRef);

  async ngOnInit() {
    const user = this.auth.currentUser;
    if (!user) return;

    const userRef = doc(this.firestore, `users/${user.uid}`);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data() as any;
      this.displayName = data.displayName ?? '';
      this.bio = data.bio ?? '';

      this.cdr.detectChanges(); // ✅ force view update
    }
  }

  async saveProfile() {
    const user = this.auth.currentUser;
    if (!user) return;

    const userRef = doc(this.firestore, `users/${user.uid}`);

    await updateDoc(userRef, {
      displayName: this.displayName.trim(),
      bio: this.bio.trim(),
      needsOnboarding: false,
    });

    this.router.navigateByUrl('/app-home/profile');
  }
}
