import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, query, where, orderBy } from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { PracticeSession } from '../practice/practice.models';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-practice-sidebar',
  standalone: true,
  imports: [AsyncPipe, RouterLink],
  templateUrl: './practice-sidebar.html',
  styleUrl: './practice-sidebar.css',
})
export class PracticeSidebar {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  sessions$: Observable<PracticeSession[]> = this.getSessions();

  averageScore$: Observable<number | null> = this.sessions$.pipe(
    map((sessions) => {
      if (!sessions.length) return null;
      const total = sessions.reduce((sum, s) => sum + s.score, 0);
      return Math.round(total / sessions.length);
    }),
  );

  private getSessions(): Observable<PracticeSession[]> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return new Observable((s) => s.next([]));

    const ref = collection(this.firestore, 'practiceSessions');
    const q = query(ref, where('uid', '==', uid), orderBy('createdAt', 'desc'));
    return collectionData(q) as Observable<PracticeSession[]>;
  }

  gradeColor(grade: string): string {
    switch (grade) {
      case 'A': return '#22c55e';
      case 'B': return '#84cc16';
      case 'C': return '#eab308';
      case 'D': return '#f97316';
      default:  return '#ef4444';
    }
  }
}
