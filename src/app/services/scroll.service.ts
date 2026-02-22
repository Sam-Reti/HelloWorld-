import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ScrollService {
  private scrollToPostSubject = new BehaviorSubject<string | null>(null);
  scrollToPost$ = this.scrollToPostSubject.asObservable();

  scrollToPost(postId: string) {
    this.scrollToPostSubject.next(postId);
    // Reset after a short delay so it can be used again
    setTimeout(() => this.scrollToPostSubject.next(null), 100);
  }
}
