import { Injectable, inject, OnDestroy } from '@angular/core';
import { Firestore, collection, collectionData, doc, updateDoc } from '@angular/fire/firestore';
import { Auth, authState } from '@angular/fire/auth';
import { serverTimestamp } from 'firebase/firestore';
import { Observable, map, of, switchMap, interval, Subscription } from 'rxjs';

const HEARTBEAT_MS = 60_000; // update every 60 s
const ONLINE_THRESHOLD_MS = 2 * 60_000; // consider online if seen in last 2 min

@Injectable({ providedIn: 'root' })
export class PresenceService implements OnDestroy {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private heartbeatSub?: Subscription;
  private authSub?: Subscription;

  /** Set of UIDs currently considered online — updates every 30 s */
  onlineUsers$: Observable<Set<string>> = this.getOnlineUsers$();

  constructor() {
    this.startHeartbeat();
  }

  private startHeartbeat(): void {
    this.authSub = authState(this.auth).subscribe((user) => {
      this.heartbeatSub?.unsubscribe();
      if (!user) return;

      // Write immediately, then every HEARTBEAT_MS
      this.writePresence(user.uid);
      this.heartbeatSub = interval(HEARTBEAT_MS).subscribe(() => {
        this.writePresence(user.uid);
      });
    });
  }

  private async writePresence(uid: string): Promise<void> {
    const userRef = doc(this.firestore, `users/${uid}`);
    await updateDoc(userRef, { lastSeen: serverTimestamp() }).catch(() => {});
  }

  private getOnlineUsers$(): Observable<Set<string>> {
    const usersCol = collection(this.firestore, 'users');
    return collectionData(usersCol, { idField: 'uid' }).pipe(
      map((users) => {
        const now = Date.now();
        const online = new Set<string>();
        for (const u of users) {
          const ts = (u as any).lastSeen;
          if (!ts) continue;
          const millis = ts.toDate ? ts.toDate().getTime() : ts;
          if (now - millis < ONLINE_THRESHOLD_MS) {
            online.add((u as any).uid);
          }
        }
        return online;
      }),
    );
  }

  ngOnDestroy(): void {
    this.heartbeatSub?.unsubscribe();
    this.authSub?.unsubscribe();
  }
}
