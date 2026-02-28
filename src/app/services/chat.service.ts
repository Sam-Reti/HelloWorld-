import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { Auth, authState } from '@angular/fire/auth';
import {
  query,
  orderBy,
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { Observable, of, switchMap } from 'rxjs';

export interface Conversation {
  id: string;
  participantIds: string[];
  // Denormalized display names keyed by UID — avoids per-row lookups in the inbox.
  participantNames: Record<string, string>;
  participantColors: Record<string, string>;
  lastMessage: string;
  lastMessageAt: any;
  lastMessageSenderId?: string;
  unreadBy?: string[];
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  // Sort both UIDs so the same two users always produce the same ID,
  // regardless of who opened the chat first.
  conversationId(uid1: string, uid2: string): string {
    return [uid1, uid2].sort().join('__');
  }

  // Find an existing conversation or create one on the spot.
  // Returns the conversation ID so the caller can navigate to the thread.
  async getOrCreateConversation(otherUid: string): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const id = this.conversationId(user.uid, otherUid);
    const convoRef = doc(this.firestore, `conversations/${id}`);
    const snap = await getDoc(convoRef);

    if (!snap.exists()) {
      // Fetch both users' profiles so we can store their names in the conversation.
      // This is denormalization — we duplicate the names here so the inbox
      // never needs a separate lookup per row.
      const [mySnap, otherSnap] = await Promise.all([
        getDoc(doc(this.firestore, `users/${user.uid}`)),
        getDoc(doc(this.firestore, `users/${otherUid}`)),
      ]);
      const myData = mySnap.data() as any;
      const otherData = otherSnap.data() as any;

      await setDoc(convoRef, {
        participantIds: [user.uid, otherUid],
        participantNames: {
          [user.uid]: myData?.displayName || user.email || 'Unknown',
          [otherUid]: otherData?.displayName || 'Unknown',
        },
        participantColors: {
          [user.uid]: myData?.avatarColor || null,
          [otherUid]: otherData?.avatarColor || null,
        },
        lastMessage: '',
        lastMessageAt: serverTimestamp(),
      });
    }

    return id;
  }

  // Live stream of all conversations the current user is part of,
  // newest activity first. collectionData() keeps this updated in real time.
  getConversations$(): Observable<Conversation[]> {
    return authState(this.auth).pipe(
      switchMap((user) => {
        if (!user) return of([]);
        const convoCol = collection(this.firestore, 'conversations');
        const q = query(
          convoCol,
          where('participantIds', 'array-contains', user.uid),
          orderBy('lastMessageAt', 'desc'),
        );
        return collectionData(q, { idField: 'id' }) as Observable<Conversation[]>;
      }),
    );
  }

  // Live stream of messages in a single conversation, oldest first.
  getMessages$(conversationId: string): Observable<Message[]> {
    const messagesCol = collection(this.firestore, `conversations/${conversationId}/messages`);
    const q = query(messagesCol, orderBy('createdAt', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<Message[]>;
  }

  // Write a message then update the conversation's preview fields.
  async sendMessage(conversationId: string, text: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const clean = text.trim();
    if (!clean) return;

    const messagesCol = collection(this.firestore, `conversations/${conversationId}/messages`);
    await addDoc(messagesCol, {
      senderId: user.uid,
      text: clean,
      createdAt: serverTimestamp(),
    });

    // Figure out who the other participant is
    const convoRef = doc(this.firestore, `conversations/${conversationId}`);
    const convoSnap = await getDoc(convoRef);
    const convoData = convoSnap.data() as Conversation | undefined;
    const otherUid = convoData?.participantIds?.find((id) => id !== user.uid);

    // Update conversation preview + mark other user as unread
    await updateDoc(convoRef, {
      lastMessage: clean,
      lastMessageAt: serverTimestamp(),
      lastMessageSenderId: user.uid,
      unreadBy: otherUid ? arrayUnion(otherUid) : [],
    });

    // Send a notification to the other user
    if (otherUid) {
      const senderName =
        convoData?.participantNames?.[user.uid] || user.displayName || user.email || 'Someone';
      const notifCol = collection(this.firestore, `users/${otherUid}/notifications`);
      await addDoc(notifCol, {
        type: 'message',
        conversationId,
        actorId: user.uid,
        actorName: senderName,
        preview: clean.length > 60 ? clean.slice(0, 60) + '...' : clean,
        createdAt: serverTimestamp(),
        read: false,
      }).catch((e) => console.error('message notif failed', e));
    }
  }

  // Remove current user from unreadBy when they open a conversation
  async markRead(conversationId: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;
    const convoRef = doc(this.firestore, `conversations/${conversationId}`);
    await updateDoc(convoRef, {
      unreadBy: arrayRemove(user.uid),
    }).catch(() => {});
  }
}
