import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
} from '@angular/fire/firestore';
import { collectionData, docData } from '@angular/fire/firestore';
import { serverTimestamp } from 'firebase/firestore';
import { Observable, Subscription } from 'rxjs';

// TODO: uncomment once @hiyve/* packages are installed
// import { ConnectionService, RoomService } from '@hiyve/angular';

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

@Injectable({ providedIn: 'root' })
export class VideoCallService {
  // TODO: inject once @hiyve/* packages are installed
  // private connection = inject(ConnectionService);
  // private room = inject(RoomService);
  // readonly isInRoom$ = this.room.isInRoom$;

  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private destroyRef = inject(DestroyRef);

  readonly activeCall = signal<CallDoc | null>(null);
  readonly incomingCall = signal<CallDoc | null>(null);

  private listenerStarted = false;
  private callWatcher?: Subscription;

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

    (collectionData(q, { idField: 'id' }) as Observable<CallDoc[]>)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((calls) => {
        // Don't surface incoming call while already in a call
        if (!this.activeCall()) {
          this.incomingCall.set(calls[0] ?? null);
        }
      });
  }

  async initiateCall(otherUid: string, otherName: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;

    const callsRef = collection(this.firestore, 'calls');
    const docRef = await addDoc(callsRef, {
      callerId: user.uid,
      callerName: user.displayName || user.email || 'Unknown',
      calleeId: otherUid,
      calleeName: otherName,
      roomName: '',
      status: 'ringing',
      createdAt: serverTimestamp(),
    });

    // Use the Firestore doc ID as the room name so both sides share it
    await updateDoc(docRef, { roomName: docRef.id });

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

    // TODO: uncomment once @hiyve/* packages are installed
    // await this.connection.joinRoom(docRef.id, user.uid);
  }

  async acceptCall(call: CallDoc): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;

    await updateDoc(doc(this.firestore, `calls/${call.id}`), { status: 'active' });
    this.activeCall.set({ ...call, status: 'active' });
    this.incomingCall.set(null);
    this.watchCallDoc(call.id);

    // TODO: uncomment once @hiyve/* packages are installed
    // await this.connection.joinRoom(call.roomName, user.uid);
  }

  async rejectCall(call: CallDoc): Promise<void> {
    await deleteDoc(doc(this.firestore, `calls/${call.id}`)).catch(() => {});
    this.incomingCall.set(null);
  }

  async endCall(): Promise<void> {
    const call = this.activeCall();
    if (call) {
      await deleteDoc(doc(this.firestore, `calls/${call.id}`)).catch(() => {});
    }
    this.callWatcher?.unsubscribe();
    this.callWatcher = undefined;
    this.activeCall.set(null);

    // TODO: uncomment once @hiyve/* packages are installed
    // this.connection.leaveRoom();
  }

  /** Watch the call doc so we detect if the other side hangs up or rejects. */
  private watchCallDoc(callId: string): void {
    this.callWatcher?.unsubscribe();
    this.callWatcher = (
      docData(doc(this.firestore, `calls/${callId}`)) as Observable<CallDoc | undefined>
    ).subscribe((data) => {
      if (!data && this.activeCall()) {
        // Other side deleted the doc — they hung up or rejected
        this.activeCall.set(null);
        // TODO: this.connection.leaveRoom();
      }
    });
  }
}
