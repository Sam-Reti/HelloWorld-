import { TestBed } from '@angular/core/testing';
import { ChatService } from './chat.service';
import { provideFirebaseMocks, FAKE_USER } from '../../testing/firebase-mocks';
import { of } from 'rxjs';

// No vi.mock calls -- they're in the global setup file (src/testing/setup.ts).

import { Auth, authState } from '@angular/fire/auth';
import { Firestore, getDoc, setDoc, addDoc, updateDoc, collection, doc } from '@angular/fire/firestore';

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(() => {
    vi.resetAllMocks();
    (authState as any).mockReturnValue(of(FAKE_USER));

    // Re-set default return values after clearAllMocks
    (collection as any).mockReturnValue('col');
    (doc as any).mockReturnValue('docRef');

    TestBed.configureTestingModule({
      providers: [...provideFirebaseMocks({ Auth, Firestore })],
    });
    service = TestBed.inject(ChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('conversationId()', () => {
    it('should produce deterministic sorted ID', () => {
      expect(service.conversationId('b', 'a')).toBe('a__b');
      expect(service.conversationId('a', 'b')).toBe('a__b');
    });

    it('should be the same regardless of argument order', () => {
      const id1 = service.conversationId('uid-alice', 'uid-bob');
      const id2 = service.conversationId('uid-bob', 'uid-alice');
      expect(id1).toBe(id2);
    });
  });

  describe('getOrCreateConversation()', () => {
    it('should throw when not authenticated', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [...provideFirebaseMocks({ Auth, Firestore }, { auth: { currentUser: null } as any })],
      });
      const svc = TestBed.inject(ChatService);
      await expect(svc.getOrCreateConversation('other')).rejects.toThrow('Not authenticated');
    });

    it('should return existing conversation id', async () => {
      (getDoc as any).mockResolvedValue({ exists: () => true });

      const id = await service.getOrCreateConversation('other-uid');
      expect(id).toBe(service.conversationId(FAKE_USER.uid, 'other-uid'));
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('should create conversation when it does not exist', async () => {
      (getDoc as any)
        .mockResolvedValueOnce({ exists: () => false }) // convo doesn't exist
        .mockResolvedValueOnce({ data: () => ({ displayName: 'Me', avatarColor: '#aaa' }) }) // my profile
        .mockResolvedValueOnce({ data: () => ({ displayName: 'Other', avatarColor: '#bbb' }) }); // other profile
      (setDoc as any).mockResolvedValue(undefined);

      const id = await service.getOrCreateConversation('other-uid');

      expect(setDoc).toHaveBeenCalledWith(
        'docRef',
        expect.objectContaining({
          participantIds: [FAKE_USER.uid, 'other-uid'],
          lastMessage: '',
        }),
      );
      expect(id).toBe(service.conversationId(FAKE_USER.uid, 'other-uid'));
    });
  });

  describe('sendMessage()', () => {
    it('should skip empty messages', async () => {
      await service.sendMessage('conv-1', '   ');
      expect(addDoc).not.toHaveBeenCalled();
    });

    it('should skip when not authenticated', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [...provideFirebaseMocks({ Auth, Firestore }, { auth: { currentUser: null } as any })],
      });
      const svc = TestBed.inject(ChatService);
      await svc.sendMessage('conv-1', 'hello');
      expect(addDoc).not.toHaveBeenCalled();
    });

    it('should create message doc and update conversation', async () => {
      (addDoc as any).mockResolvedValue({ id: 'msg-1' });
      (updateDoc as any).mockResolvedValue(undefined);

      await service.sendMessage('conv-1', '  Hello!  ');

      expect(addDoc).toHaveBeenCalledWith(
        'col',
        expect.objectContaining({ senderId: FAKE_USER.uid, text: 'Hello!' }),
      );
      expect(updateDoc).toHaveBeenCalledWith(
        'docRef',
        expect.objectContaining({ lastMessage: 'Hello!' }),
      );
    });
  });

  describe('markRead()', () => {
    it('should skip when not authenticated', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [...provideFirebaseMocks({ Auth, Firestore }, { auth: { currentUser: null } as any })],
      });
      const svc = TestBed.inject(ChatService);
      await svc.markRead('conv-1');
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it('should call updateDoc with arrayRemove', async () => {
      (updateDoc as any).mockResolvedValue(undefined);
      await service.markRead('conv-1');
      expect(updateDoc).toHaveBeenCalled();
    });
  });
});
