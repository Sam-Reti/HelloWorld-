import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { IncomingCallBannerComponent } from './incoming-call-banner';
import { VideoCallService } from '../video-call.service';

describe('IncomingCallBannerComponent', () => {
  let component: IncomingCallBannerComponent;
  let fixture: ComponentFixture<IncomingCallBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncomingCallBannerComponent],
      providers: [
        {
          provide: VideoCallService,
          useValue: {
            incomingCall: vi.fn().mockReturnValue(null),
            acceptCall: vi.fn().mockResolvedValue(undefined),
            rejectCall: vi.fn().mockResolvedValue(undefined),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(IncomingCallBannerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
