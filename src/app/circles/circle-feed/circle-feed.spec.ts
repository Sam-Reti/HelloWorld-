import { TestBed } from '@angular/core/testing';
import { CircleFeedComponent } from './circle-feed';
import { provideFirebaseMocks, FAKE_USER } from '../../../testing/firebase-mocks';
import { of } from 'rxjs';

import { Auth, authState } from '@angular/fire/auth';
import { Firestore, collectionData, addDoc, updateDoc, getDoc, deleteDoc } from '@angular/fire/firestore';
import { Storage, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Router, ActivatedRoute } from '@angular/router';
import { createMockRouter, createMockActivatedRoute } from '../../../testing/firebase-mocks';

describe('CircleFeedComponent', () => {
  let component: CircleFeedComponent;

  beforeEach(() => {
    vi.resetAllMocks();
    (authState as any).mockReturnValue(of(FAKE_USER));
    (collectionData as any).mockReturnValue(of([]));

    TestBed.configureTestingModule({
      imports: [CircleFeedComponent],
      providers: [
        ...provideFirebaseMocks({ Auth, Firestore, Storage }),
        { provide: Router, useValue: createMockRouter() },
        { provide: ActivatedRoute, useValue: createMockActivatedRoute() },
      ],
    });
    const fixture = TestBed.createComponent(CircleFeedComponent);
    component = fixture.componentInstance;
    (component as any).circleId = 'test-circle';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getInitials()', () => {
    it('should return U for null/empty', () => {
      expect(component.getInitials(null)).toBe('U');
      expect(component.getInitials('')).toBe('U');
      expect(component.getInitials(undefined)).toBe('U');
    });

    it('should return first two chars for single word', () => {
      expect(component.getInitials('Alice')).toBe('AL');
    });

    it('should return initials for full name', () => {
      expect(component.getInitials('Alice Bob')).toBe('AB');
    });
  });

  describe('toggleComments()', () => {
    it('should toggle show state for a post', () => {
      expect(component.showComments['p1']).toBeFalsy();
      component.toggleComments('p1');
      expect(component.showComments['p1']).toBe(true);
      component.toggleComments('p1');
      expect(component.showComments['p1']).toBe(false);
    });
  });

  describe('isLiked()', () => {
    it('should return false by default', () => {
      expect(component.isLiked('p1')).toBe(false);
    });

    it('should return true when post is in likedPostIds', () => {
      component.likedPostIds = new Set(['p1']);
      expect(component.isLiked('p1')).toBe(true);
    });
  });

  describe('startEdit / cancelEdit', () => {
    it('should set editing state', () => {
      component.startEdit({ id: 'p1', text: 'Hello' } as any);
      expect(component.editingPostId).toBe('p1');
      expect(component.editText).toBe('Hello');
    });

    it('should clear editing state on cancel', () => {
      component.startEdit({ id: 'p1', text: 'Hello' } as any);
      component.cancelEdit();
      expect(component.editingPostId).toBeNull();
      expect(component.editText).toBe('');
    });
  });

  describe('getAvatarColor()', () => {
    it('should use userColors map first', () => {
      component.userColors = { u1: '#ff0000' };
      expect(component.getAvatarColor({ authorId: 'u1', authorAvatarColor: '#00ff00' } as any)).toBe('#ff0000');
    });

    it('should fall back to post authorAvatarColor', () => {
      expect(component.getAvatarColor({ authorId: 'u2', authorAvatarColor: '#00ff00' } as any)).toBe('#00ff00');
    });

    it('should fall back to default', () => {
      expect(component.getAvatarColor({ authorId: 'u3', authorAvatarColor: null } as any)).toBe('#0ea5a4');
    });
  });
});
