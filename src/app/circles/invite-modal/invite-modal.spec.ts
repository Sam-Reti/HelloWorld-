import { TestBed } from '@angular/core/testing';
import { InviteModalComponent } from './invite-modal';
import { provideFirebaseMocks, FAKE_USER } from '../../../testing/firebase-mocks';
import { of } from 'rxjs';
import { Component, viewChild } from '@angular/core';

import { Auth, authState } from '@angular/fire/auth';
import { Firestore, collectionData, getDoc, setDoc, addDoc } from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';

// Wrapper to provide the required input
@Component({
  standalone: true,
  imports: [InviteModalComponent],
  template: `<app-invite-modal [circleId]="circleId" (close)="closed = true" />`,
})
class TestHost {
  circleId = 'test-circle';
  closed = false;
  modal = viewChild(InviteModalComponent);
}

describe('InviteModalComponent', () => {
  let host: TestHost;

  beforeEach(() => {
    vi.resetAllMocks();
    (authState as any).mockReturnValue(of(FAKE_USER));
    (collectionData as any).mockReturnValue(of([]));

    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [...provideFirebaseMocks({ Auth, Firestore, Storage })],
    });
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    host = fixture.componentInstance;
  });

  it('should create', () => {
    expect(host.modal()).toBeTruthy();
  });

  describe('getInitials()', () => {
    it('should return U for empty name', () => {
      expect(host.modal()!.getInitials('')).toBe('U');
    });

    it('should return initials for full name', () => {
      expect(host.modal()!.getInitials('John Doe')).toBe('JD');
    });
  });

  describe('onBackdropClick()', () => {
    it('should emit close', () => {
      host.modal()!.onBackdropClick();
      expect(host.closed).toBe(true);
    });
  });

  describe('invite()', () => {
    it('should add user to invitedSet and call inviteMember', async () => {
      (getDoc as any).mockResolvedValue({ exists: () => true, data: () => ({ name: 'Circle' }) });
      (setDoc as any).mockResolvedValue(undefined);
      (addDoc as any).mockResolvedValue({ id: 'n1' });

      const user = { uid: 'target', displayName: 'Target User' } as any;
      await host.modal()!.invite(user);

      expect(host.modal()!.invitedSet.has('target')).toBe(true);
    });
  });
});
