import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
} from '@angular/fire/firestore';
import { collectionData, docData } from '@angular/fire/firestore';
import { serverTimestamp } from 'firebase/firestore';
import { Observable, Subscription } from 'rxjs';

import { HiyveService, RoomService } from '@hiyve/angular';

export interface CallDoc {
  id: string;
  callerId: string;
  callerName: string;
  calleeId: string;
  calleeName: string;
  roomName: string;
  status: 'ringing' | 'active' | 'ended';
  createdAt: any;
}

interface HiyveJoinToken {
  joinToken: string;
  roomRegion: string;
}

@Injectable({ providedIn: 'root' })
export class VideoCallService {
  private hiyve = inject(HiyveService);
  private room = inject(RoomService);
  readonly isInRoom$ = this.room.isInRoom$;

  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private destroyRef = inject(DestroyRef);

  readonly activeCall = signal<CallDoc | null>(null);

  get localUserName(): string {
    const u = this.auth.currentUser;
    return u?.displayName || u?.email || 'Me';
  }
  readonly incomingCall = signal<CallDoc | null>(null);

  private listenerStarted = false;
  private callWatcher?: Subscription;
  private incomingCallsSub?: Subscription;

  constructor() {
    this.room.isInRoom$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((v) => {
      console.log('[VideoCall] isInRoom$ changed:', v);
    });
  }

  /** Call once from AppHome to watch for incoming calls app-wide. */
  listenForIncomingCalls(): void {
    if (this.listenerStarted) return;
    this.listenerStarted = true;

    const uid = this.auth.currentUser?.uid;
    if (!uid) return;

    const q = query(
      collection(this.firestore, 'calls'),
      where('calleeId', '==', uid),
      where('status', '==', 'ringing'),
    );

    this.incomingCallsSub = (collectionData(q, { idField: 'id' }) as Observable<CallDoc[]>)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((calls) => {
        // Don't surface incoming call while already in a call
        if (!this.activeCall()) {
          this.incomingCall.set(calls[0] ?? null);
        }
      });
  }

  stopListening(): void {
    this.incomingCallsSub?.unsubscribe();
    this.incomingCallsSub = undefined;
    this.callWatcher?.unsubscribe();
    this.callWatcher = undefined;
    this.listenerStarted = false;
    this.activeCall.set(null);
    this.incomingCall.set(null);
  }

  async initiateCall(otherUid: string, otherName: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;

    const callsRef = collection(this.firestore, 'calls');
    const docRef = doc(callsRef);
    await setDoc(docRef, {
      callerId: user.uid,
      callerName: user.displayName || user.email || 'Unknown',
      calleeId: otherUid,
      calleeName: otherName,
      roomName: docRef.id,
      status: 'ringing',
      createdAt: serverTimestamp(),
    });

    const call: CallDoc = {
      id: docRef.id,
      callerId: user.uid,
      callerName: user.displayName || user.email || 'Unknown',
      calleeId: otherUid,
      calleeName: otherName,
      roomName: docRef.id,
      status: 'ringing',
      createdAt: null,
    };

    this.activeCall.set(call);
    this.watchCallDoc(docRef.id);

    // Wait one render cycle so Angular mounts hiyve-video-grid first
    await new Promise((r) => setTimeout(r, 100));

    console.log('[VideoCall] initiateCall: creating room', docRef.id);
    console.log('[VideoCall] local-video el:', document.getElementById('local-video'));
    try {
      const displayName = user.displayName || user.email || user.uid;
      await this.hiyve.createRoom(docRef.id, displayName);
      console.log('[VideoCall] initiateCall: createRoom resolved');
      // Warm up device enumeration now that getUserMedia has run, so the settings
      // panel shows labeled devices on its very first open.
      navigator.mediaDevices.enumerateDevices().catch(() => {});
    } catch (err) {
      console.error('[VideoCall] initiateCall: createRoom failed', err);
    }
  }

  async acceptCall(call: CallDoc): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;

    await updateDoc(doc(this.firestore, `calls/${call.id}`), { status: 'active' });
    this.activeCall.set({ ...call, status: 'active' });
    this.incomingCall.set(null);
    this.watchCallDoc(call.id);

    // Wait one render cycle so Angular mounts hiyve-video-grid first
    await new Promise((r) => setTimeout(r, 100));

    console.log('[VideoCall] acceptCall: getting join token for room', call.roomName);
    const displayName = user.displayName || user.email || user.uid;
    const token = await this.fetchJoinToken(call.roomName, displayName);
    if (!token) {
      console.error('[VideoCall] acceptCall: failed to get join token');
      return;
    }

    console.log('[VideoCall] acceptCall: joining with token, region', token.roomRegion);
    console.log('[VideoCall] local-video el:', document.getElementById('local-video'));
    try {
      await this.hiyve.joinRoomWithToken({
        joinToken: token.joinToken,
        roomRegion: token.roomRegion,
        userId: displayName,
      });
      console.log('[VideoCall] acceptCall: joinRoomWithToken resolved');
      // Warm up device enumeration now that getUserMedia has run.
      navigator.mediaDevices.enumerateDevices().catch(() => {});
    } catch (err) {
      console.error('[VideoCall] acceptCall: joinRoomWithToken failed', err);
    }
  }

  async rejectCall(call: CallDoc): Promise<void> {
    await deleteDoc(doc(this.firestore, `calls/${call.id}`)).catch(() => {});
    this.incomingCall.set(null);
  }

  async endCall(): Promise<void> {
    const call = this.activeCall();
    this.callWatcher?.unsubscribe();
    this.callWatcher = undefined;
    // Setting activeCall to null unmounts hiyve-video-grid synchronously.
    // The SDK's ngOnDestroy on that component calls leaveRoom() — let it own that.
    this.activeCall.set(null);
    if (call) {
      await deleteDoc(doc(this.firestore, `calls/${call.id}`)).catch(() => {});
    }
  }

  /** Get a join token from Hiyve's signaling server for the given room. */
  private async fetchJoinToken(roomName: string, userId: string): Promise<HiyveJoinToken | null> {
    try {
      const res = await fetch('/api/create-join-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, userId }),
      });
      console.log('[VideoCall] fetchJoinToken: status', res.status);
      if (!res.ok) {
        const text = await res.text();
        console.error('[VideoCall] fetchJoinToken: error body', text);
        return null;
      }
      const data = await res.json();
      console.log('[VideoCall] fetchJoinToken: roomRegion', data.roomRegion);
      return { joinToken: data.joinToken, roomRegion: data.roomRegion };
    } catch (err) {
      console.error('[VideoCall] fetchJoinToken: failed', err);
      return null;
    }
  }

  /** Watch the call doc so we detect if the other side hangs up or rejects. */
  private watchCallDoc(callId: string): void {
    this.callWatcher?.unsubscribe();
    this.callWatcher = (
      docData(doc(this.firestore, `calls/${callId}`)) as Observable<CallDoc | undefined>
    ).subscribe((data) => {
      if (!data && this.activeCall()) {
        // Other side deleted the doc — they hung up or rejected.
        // Setting activeCall to null unmounts hiyve-video-grid, which calls leaveRoom via ngOnDestroy.
        this.activeCall.set(null);
      }
    });
  }
}
