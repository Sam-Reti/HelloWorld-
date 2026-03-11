import { TestBed } from '@angular/core/testing';
import { DestroyRef } from '@angular/core';
import { VideoCallService } from './video-call.service';
import { provideFirebaseMocks, FAKE_USER } from '../../testing/firebase-mocks';
import { of, BehaviorSubject } from 'rxjs';

const mockIsInRoom$ = new BehaviorSubject(false);

import { Auth } from '@angular/fire/auth';
import { HiyveService, RoomService } from '@hiyve/angular';
import { Firestore, setDoc, deleteDoc } from '@angular/fire/firestore';

describe('VideoCallService', () => {
  let service: VideoCallService;
  let destroyCallbacks: (() => void)[];

  beforeEach(() => {
    vi.resetAllMocks();
    destroyCallbacks = [];

    const hiyveValue = {
      createRoom: vi.fn().mockResolvedValue(undefined),
      joinRoomWithToken: vi.fn().mockResolvedValue(undefined),
    };
    const roomValue = { isInRoom$: mockIsInRoom$ };
    const g = globalThis as any;

    TestBed.configureTestingModule({
      providers: [
        ...provideFirebaseMocks({ Auth, Firestore }),
        { provide: HiyveService, useValue: hiyveValue },
        { provide: RoomService, useValue: roomValue },
        // Fallback providers for cross-chunk token identity mismatches
        ...(g.__MockHiyveService && g.__MockHiyveService !== HiyveService
          ? [{ provide: g.__MockHiyveService, useValue: hiyveValue }]
          : []),
        ...(g.__MockRoomService && g.__MockRoomService !== RoomService
          ? [{ provide: g.__MockRoomService, useValue: roomValue }]
          : []),
        {
          provide: DestroyRef,
          useValue: { onDestroy: (fn: () => void) => destroyCallbacks.push(fn) },
        },
      ],
    });
    service = TestBed.inject(VideoCallService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have null activeCall initially', () => {
    expect(service.activeCall()).toBeNull();
  });

  it('should have null incomingCall initially', () => {
    expect(service.incomingCall()).toBeNull();
  });

  describe('stopListening()', () => {
    it('should reset signals to null', () => {
      service.stopListening();
      expect(service.activeCall()).toBeNull();
      expect(service.incomingCall()).toBeNull();
    });
  });

  describe('rejectCall()', () => {
    it('should delete the call doc and clear incomingCall', async () => {
      (deleteDoc as any).mockResolvedValue(undefined);

      const call = {
        id: 'call-1', callerId: 'u2', callerName: 'Bob', calleeId: FAKE_USER.uid,
        calleeName: 'Test', roomName: 'room-1', status: 'ringing' as const, createdAt: null,
      };

      await service.rejectCall(call);
      expect(deleteDoc).toHaveBeenCalled();
      expect(service.incomingCall()).toBeNull();
    });
  });

  describe('endCall()', () => {
    it('should clear activeCall and delete call doc', async () => {
      (deleteDoc as any).mockResolvedValue(undefined);
      // Simulate an active call
      (service as any).activeCall.set({
        id: 'call-1', callerId: FAKE_USER.uid, callerName: 'Test',
        calleeId: 'u2', calleeName: 'Bob', roomName: 'room-1', status: 'active', createdAt: null,
      });

      await service.endCall();
      expect(service.activeCall()).toBeNull();
      expect(deleteDoc).toHaveBeenCalled();
    });

    it('should handle no active call gracefully', async () => {
      await service.endCall();
      expect(service.activeCall()).toBeNull();
    });
  });
});
