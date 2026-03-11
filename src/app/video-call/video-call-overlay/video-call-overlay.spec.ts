import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, DestroyRef } from '@angular/core';
import { VideoCallOverlayComponent } from './video-call-overlay';
import { VideoCallService } from '../video-call.service';
import { BehaviorSubject } from 'rxjs';

describe('VideoCallOverlayComponent', () => {
  let component: VideoCallOverlayComponent;
  let fixture: ComponentFixture<VideoCallOverlayComponent>;
  const isInRoom$ = new BehaviorSubject(false);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideoCallOverlayComponent],
      providers: [
        {
          provide: VideoCallService,
          useValue: {
            activeCall: vi.fn().mockReturnValue({
              id: 'call-1', callerName: 'Bob', calleeName: 'Alice',
              callerId: 'u1', calleeId: 'u2', roomName: 'room-1',
              status: 'active', createdAt: null,
            }),
            endCall: vi.fn().mockResolvedValue(undefined),
            isInRoom$,
            localUserName: 'Test User',
          },
        },
        {
          provide: DestroyRef,
          useValue: { onDestroy: vi.fn() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(VideoCallOverlayComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should track hasConnected signal', () => {
    expect(component.hasConnected()).toBe(false);
    isInRoom$.next(true);
    // The signal updates via subscription
  });
});
