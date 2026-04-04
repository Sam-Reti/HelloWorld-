import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, of, switchMap, map, combineLatest } from 'rxjs';

import { CircleService } from '../services/circle.service';
import { CircleSessionService } from '../services/circle-session.service';
import { Circle, CircleSession } from '../circles/circle.models';

@Component({
  selector: 'app-circles-sidebar',
  standalone: true,
  imports: [AsyncPipe, RouterLink],
  templateUrl: './circles-sidebar.html',
  styleUrl: './circles-sidebar.css',
})
export class CirclesSidebar {
  private circleService = inject(CircleService);
  private sessionService = inject(CircleSessionService);

  circles$: Observable<Circle[]> = this.circleService.getMyCircles$();

  /** Map of circleId → active session (if any). */
  private activeSessions$: Observable<Map<string, CircleSession>> = this.circles$.pipe(
    switchMap((circles) => {
      const ids = circles.map((c) => c.id!).filter(Boolean);
      if (!ids.length) return of(new Map<string, CircleSession>());
      return this.sessionService.getActiveSessions$(ids).pipe(
        map((sessions) => {
          const m = new Map<string, CircleSession>();
          for (const s of sessions) m.set(s.circleId, s);
          return m;
        }),
      );
    }),
  );

  private sessionSnapshot = new Map<string, CircleSession>();

  /** Combined view: circles with their active session status. */
  circlesWithSessions$: Observable<(Circle & { activeSession?: CircleSession })[]> = combineLatest([
    this.circles$,
    this.activeSessions$,
  ]).pipe(
    map(([circles, sessions]) =>
      circles.map((c) => ({ ...c, activeSession: sessions.get(c.id!) })),
    ),
  );

  constructor() {
    this.activeSessions$
      .pipe(takeUntilDestroyed())
      .subscribe((s) => (this.sessionSnapshot = s));
  }

  getInitials(name: string): string {
    if (!name) return 'C';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  joinSession(session: CircleSession, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.sessionService.joinSession(session);
  }
}
