import { Injectable, inject, signal } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, setDoc, updateDoc } from '@angular/fire/firestore';
import { docData } from '@angular/fire/firestore';
import { serverTimestamp } from 'firebase/firestore';
import { Subscription, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { SharedEditorDoc, EditorLanguage } from './shared-editor.models';

@Injectable()
export class SharedEditorService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  readonly editorOpen = signal(false);
  readonly language = signal<EditorLanguage>('JavaScript');
  readonly remoteContent = signal('');

  private docPath = '';
  private sub?: Subscription;
  private lastKnownContent = '';
  private myUid = '';

  private editSubject = new Subject<string>();
  private editSub?: Subscription;

  attach(callId: string, pathPrefix = 'calls'): void {
    this.detach();
    this.myUid = this.auth.currentUser?.uid ?? '';
    this.docPath = `${pathPrefix}/${callId}/sharedEditor/state`;

    this.sub = (docData(doc(this.firestore, this.docPath)) as any).subscribe(
      (data: SharedEditorDoc | undefined) => {
        if (!data) return;
        this.editorOpen.set(data.isOpen);
        this.language.set(data.language);
        this.lastKnownContent = data.content;
        if (data.lastEditBy !== this.myUid) {
          this.remoteContent.set(data.content);
        }
      },
    );

    this.editSub = this.editSubject
      .pipe(debounceTime(300))
      .subscribe((content) => this.writeContent(content));
  }

  detach(): void {
    this.sub?.unsubscribe();
    this.sub = undefined;
    this.editSub?.unsubscribe();
    this.editSub = undefined;
    this.editorOpen.set(false);
    this.language.set('JavaScript');
    this.remoteContent.set('');
    this.lastKnownContent = '';
    this.docPath = '';
  }

  async toggleEditor(): Promise<void> {
    if (!this.docPath) return;
    const ref = doc(this.firestore, this.docPath);
    const nowOpen = !this.editorOpen();
    if (nowOpen) {
      await setDoc(
        ref,
        {
          isOpen: true,
          language: this.language(),
          content: this.lastKnownContent,
          lastEditBy: this.myUid,
          lastEditAt: serverTimestamp(),
        },
        { merge: true },
      );
    } else {
      await updateDoc(ref, { isOpen: false });
    }
  }

  async setLanguage(lang: EditorLanguage): Promise<void> {
    if (!this.docPath) return;
    await updateDoc(doc(this.firestore, this.docPath), { language: lang });
  }

  sendEdit(content: string): void {
    this.lastKnownContent = content;
    this.editSubject.next(content);
  }

  getDocumentContent(): string {
    return this.lastKnownContent;
  }

  private async writeContent(content: string): Promise<void> {
    if (!this.docPath) return;
    await updateDoc(doc(this.firestore, this.docPath), {
      content,
      lastEditBy: this.myUid,
      lastEditAt: serverTimestamp(),
    });
  }
}
