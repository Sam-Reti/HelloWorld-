import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', 'Java',
  'C++', 'C#', 'Swift', 'Kotlin', 'Ruby', 'PHP', 'Dart', 'HTML/CSS', 'SQL',
];

const SKILL_LEVELS = ['Beginner', 'Learning', 'Intermediate', 'Advanced', 'Expert'];

const AVATAR_COLORS = [
  '#22c55e', '#6366f1', '#8b5cf6', '#ec4899',
  '#f59e0b', '#06b6d4', '#f97316', '#64748b',
];

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
  private cdr = inject(ChangeDetectorRef);

  displayName = '';
  bio = '';
  role = '';
  skillLevel = '';
  selectedLanguages: string[] = [];
  githubUrl = '';
  websiteUrl = '';
  location = '';
  avatarColor = AVATAR_COLORS[0];
  showEmail = false;

  readonly LANGUAGES = LANGUAGES;
  readonly SKILL_LEVELS = SKILL_LEVELS;
  readonly AVATAR_COLORS = AVATAR_COLORS;

  async ngOnInit() {
    const user = this.auth.currentUser;
    if (!user) return;

    const snap = await getDoc(doc(this.firestore, `users/${user.uid}`));
    if (!snap.exists()) return;

    const d = snap.data() as any;
    this.displayName = d.displayName ?? '';
    this.bio = d.bio ?? '';
    this.role = d.role ?? '';
    this.skillLevel = d.skillLevel ?? '';
    this.selectedLanguages = d.languages ?? [];
    this.githubUrl = d.githubUrl ?? '';
    this.websiteUrl = d.websiteUrl ?? '';
    this.location = d.location ?? '';
    this.avatarColor = d.avatarColor ?? AVATAR_COLORS[0];
    this.showEmail = d.showEmail ?? false;
    this.cdr.detectChanges();
  }

  isSelected(lang: string): boolean {
    return this.selectedLanguages.includes(lang);
  }

  toggleLanguage(lang: string): void {
    this.selectedLanguages = this.isSelected(lang)
      ? this.selectedLanguages.filter((l) => l !== lang)
      : [...this.selectedLanguages, lang];
  }

  getInitials(value: string): string {
    if (!value) return 'U';
    const parts = value.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  async saveProfile() {
    const user = this.auth.currentUser;
    if (!user) return;

    await updateDoc(doc(this.firestore, `users/${user.uid}`), {
      displayName: this.displayName.trim(),
      bio: this.bio.trim(),
      role: this.role.trim(),
      skillLevel: this.skillLevel,
      languages: this.selectedLanguages,
      githubUrl: this.githubUrl.trim(),
      websiteUrl: this.websiteUrl.trim(),
      location: this.location.trim(),
      avatarColor: this.avatarColor,
      email: user.email ?? '',
      showEmail: this.showEmail,
      needsOnboarding: false,
    });

    this.router.navigateByUrl('/app-home/profile');
  }
}
