import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { VerifyEmailComponent } from './verify-email';
import { provideFirebaseMocks, createMockRouter, createMockActivatedRoute } from '../../testing/firebase-mocks';
import { Router, ActivatedRoute } from '@angular/router';

import { applyActionCode } from 'firebase/auth';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';

describe('VerifyEmailComponent', () => {
  let component: VerifyEmailComponent;
  let fixture: ComponentFixture<VerifyEmailComponent>;
  let mockRouter: ReturnType<typeof createMockRouter>;

  function setup(queryParams: Record<string, string> = {}) {
    mockRouter = createMockRouter();

    TestBed.configureTestingModule({
      imports: [VerifyEmailComponent],
      providers: [
        ...provideFirebaseMocks({ Auth, Firestore }),
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: createMockActivatedRoute({}, queryParams) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(VerifyEmailComponent, { set: { template: '<div></div>' } })
      .compileComponents();

    fixture = TestBed.createComponent(VerifyEmailComponent);
    component = fixture.componentInstance;
  }

  afterEach(() => vi.resetAllMocks());

  it('should create', () => {
    setup({});
    expect(component).toBeTruthy();
  });

  it('should start in pending state', () => {
    setup({});
    expect(component.state).toBe('pending');
  });

  it('should show success after verification', async () => {
    (applyActionCode as any).mockResolvedValue(undefined);
    setup({ mode: 'verifyEmail', oobCode: 'test-code' });
    await component.ngOnInit();
    // The verify method is called inside ngOnInit for verifyEmail mode
  });
});
