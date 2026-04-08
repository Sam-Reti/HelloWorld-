import { TestBed } from '@angular/core/testing';
import { CircleChatComponent } from './circle-chat';
import { provideFirebaseMocks, FAKE_USER } from '../../../testing/firebase-mocks';
import { of } from 'rxjs';

import { Auth, authState } from '@angular/fire/auth';
import { Firestore, collectionData, addDoc, getDoc } from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';

describe('CircleChatComponent', () => {
  let component: CircleChatComponent;

  beforeEach(() => {
    vi.resetAllMocks();
    (authState as any).mockReturnValue(of(FAKE_USER));
    (collectionData as any).mockReturnValue(of([]));

    TestBed.configureTestingModule({
      imports: [CircleChatComponent],
      providers: [...provideFirebaseMocks({ Auth, Firestore, Storage })],
    });
    const fixture = TestBed.createComponent(CircleChatComponent);
    component = fixture.componentInstance;
    component.circleId = 'test-circle';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getInitials()', () => {
    it('should return U for empty name', () => {
      expect(component.getInitials('')).toBe('U');
    });

    it('should return two chars for single word', () => {
      expect(component.getInitials('Alice')).toBe('AL');
    });

    it('should return initials for full name', () => {
      expect(component.getInitials('Alice Bob')).toBe('AB');
    });
  });

  describe('send()', () => {
    it('should not send empty text', async () => {
      component.text = '   ';
      await component.send();
      expect(addDoc).not.toHaveBeenCalled();
    });

    it('should clear text after send', async () => {
      (getDoc as any).mockResolvedValue({ exists: () => true, data: () => ({ displayName: 'User' }) });
      (addDoc as any).mockResolvedValue({ id: 'msg1' });
      component.text = 'Hello';
      await component.send();
      expect(component.text).toBe('');
    });
  });

  describe('onKeydown()', () => {
    it('should call send on Enter without Shift', () => {
      const spy = vi.spyOn(component, 'send').mockResolvedValue();
      const event = { key: 'Enter', shiftKey: false, preventDefault: vi.fn() } as any;
      component.onKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(spy).toHaveBeenCalled();
    });

    it('should not call send on Shift+Enter', () => {
      const spy = vi.spyOn(component, 'send');
      const event = { key: 'Enter', shiftKey: true, preventDefault: vi.fn() } as any;
      component.onKeydown(event);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('ngOnChanges()', () => {
    it('should subscribe to messages when circleId is set', () => {
      component.ngOnChanges();
      expect(component.messages$).toBeDefined();
    });

    it('should not resubscribe for the same circleId', () => {
      component.ngOnChanges();
      const firstMessages$ = component.messages$;
      component.ngOnChanges();
      // Same circleId, same observable reference
      expect(component.messages$).toBe(firstMessages$);
    });
  });
});
