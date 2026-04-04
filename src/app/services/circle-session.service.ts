import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
} from '@angular/fire/firestore';
import { serverTimestamp, getDocs } from 'firebase/firestore';
import { authState } from '@angular/fire/auth';
import { Observable, of, Subscription } from 'rxjs';

import { HiyveService, RoomService } from '@hiyve/angular';
import { CircleSession } from '../circles/circle.models';

interface HiyveJoinToken {
  joinToken: string;
  roomRegion: string;
}

@Injectable({ providedIn: 'root' })
export class CircleSessionService {
  private hiyve = inject(HiyveService);
  private room = inject(RoomService);
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private destroyRef = inject(DestroyRef);

  readonly isInRoom$ = this.room.isInRoom$;
  readonly activeSession = signal<CircleSession | null>(null);
  readonly hasConnected = signal(false);

  private sessionSub?: Subscription;

  constructor() {
    this.room.isInRoom$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((inRoom) => {
      if (inRoom) this.hasConnected.set(true);
    });

    // Clean up stale sessions this user started but never properly ended
    authState(this.auth)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        if (user) this.cleanupStaleSessions(user.uid);
      });
  }

  private async cleanupStaleSessions(uid: string): Promise<void> {
    const sessionsCol = collection(this.firestore, 'circleSessions');
    const q = query(
      sessionsCol,
      where('startedBy', '==', uid),
      where('status', '==', 'active'),
    );
    const snap = await getDocs(q).catch(() => null);
    if (!snap || snap.empty) return;

    const updates = snap.docs.map((d) =>
      updateDoc(doc(this.firestore, `circleSessions/${d.id}`), { status: 'ended' }).catch(() => {}),
    );
    await Promise.all(updates);
  }

  /** Start a new session for a circle — admin creates the room. */
  async startSession(circleId: string, circleName: string): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const sessionsCol = collection(this.firestore, 'circleSessions');
    const sessionRef = await addDoc(sessionsCol, {
      circleId,
      circleName,
      roomName: '', // will be set to docId below
      startedBy: user.uid,
      startedByName: user.displayName || user.email || 'Unknown',
      status: 'active',
      participantCount: 1,
      startedAt: serverTimestamp(),
    });

    await updateDoc(sessionRef, { roomName: sessionRef.id });

    const session: CircleSession = {
      id: sessionRef.id,
      circleId,
      circleName,
      roomName: sessionRef.id,
      startedBy: user.uid,
      startedByName: user.displayName || user.email || 'Unknown',
      status: 'active',
      participantCount: 1,
      startedAt: null,
    };

    this.activeSession.set(session);
    this.hasConnected.set(false);

    await new Promise((r) => setTimeout(r, 100));

    const displayName = user.displayName || user.email || user.uid;
    await this.hiyve.createRoom(sessionRef.id, displayName);

    return sessionRef.id;
  }

  /** Join an existing active session. */
  async joinSession(session: CircleSession): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;

    this.activeSession.set(session);
    this.hasConnected.set(false);

    await new Promise((r) => setTimeout(r, 100));

    const displayName = user.displayName || user.email || user.uid;
    const token = await this.fetchJoinToken(session.roomName, displayName);
    if (!token) return;

    await this.hiyve.joinRoomWithToken({
      joinToken: token.joinToken,
      roomRegion: token.roomRegion,
      userId: displayName,
    });
  }

  /** Leave the current session. Host leaving ends the session. */
  async leaveSession(): Promise<void> {
    const session = this.activeSession();
    const uid = this.auth.currentUser?.uid;
    this.activeSession.set(null);
    this.hasConnected.set(false);
    this.sessionSub?.unsubscribe();

    if (!session?.id) return;

    if (uid && session.startedBy === uid) {
      await this.endSession(session.id).catch(() => {});
    } else {
      await updateDoc(doc(this.firestore, `circleSessions/${session.id}`), {
        participantCount: Math.max(0, (session.participantCount ?? 1) - 1),
      }).catch(() => {});
    }
  }

  /** Get active sessions for a set of circle IDs. */
  getActiveSessions$(circleIds: string[]): Observable<CircleSession[]> {
    if (!circleIds.length) return of([]);
    const sessionsCol = collection(this.firestore, 'circleSessions');
    const q = query(
      sessionsCol,
      where('circleId', 'in', circleIds.slice(0, 30)),
      where('status', '==', 'active'),
    );
    return collectionData(q, { idField: 'id' }) as Observable<CircleSession[]>;
  }

  /** Get active sessions for a single circle. */
  getActiveSessionsForCircle$(circleId: string): Observable<CircleSession[]> {
    const sessionsCol = collection(this.firestore, 'circleSessions');
    const q = query(
      sessionsCol,
      where('circleId', '==', circleId),
      where('status', '==', 'active'),
    );
    return collectionData(q, { idField: 'id' }) as Observable<CircleSession[]>;
  }

  /** End a session (admin action). */
  async endSession(sessionId: string): Promise<void> {
    await updateDoc(doc(this.firestore, `circleSessions/${sessionId}`), { status: 'ended' });
  }

  private async fetchJoinToken(
    roomName: string,
    userId: string,
  ): Promise<HiyveJoinToken | null> {
    try {
      const res = await fetch('/api/create-join-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, userId }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return { joinToken: data.joinToken, roomRegion: data.roomRegion };
    } catch {
      return null;
    }
  }
}
