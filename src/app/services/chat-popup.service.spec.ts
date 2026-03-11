import { TestBed } from '@angular/core/testing';
import { ChatPopupService, OpenChat } from './chat-popup.service';

describe('ChatPopupService', () => {
  let service: ChatPopupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatPopupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have null openChat initially', () => {
    expect(service.openChat()).toBeNull();
  });

  describe('open()', () => {
    it('should set the openChat signal', () => {
      const chat: OpenChat = {
        conversationId: 'conv-1',
        name: 'Alice',
        color: '#ff0000',
        otherUid: 'uid-alice',
      };
      service.open(chat);
      expect(service.openChat()).toEqual(chat);
    });

    it('should replace the previous chat', () => {
      service.open({ conversationId: 'conv-1', name: 'Alice', color: null, otherUid: 'uid-a' });
      service.open({ conversationId: 'conv-2', name: 'Bob', color: '#00f', otherUid: 'uid-b' });
      expect(service.openChat()?.name).toBe('Bob');
    });
  });

  describe('close()', () => {
    it('should reset openChat to null', () => {
      service.open({ conversationId: 'c', name: 'X', color: null, otherUid: 'u' });
      service.close();
      expect(service.openChat()).toBeNull();
    });
  });
});
