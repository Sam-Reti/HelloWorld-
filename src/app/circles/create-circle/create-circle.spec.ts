import { TestBed } from '@angular/core/testing';
import { CreateCircleComponent } from './create-circle';
import { provideFirebaseMocks, FAKE_USER, createMockRouter } from '../../../testing/firebase-mocks';
import { of } from 'rxjs';

import { Auth, authState } from '@angular/fire/auth';
import { Firestore, getDoc, addDoc, setDoc } from '@angular/fire/firestore';
import { Storage, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Router } from '@angular/router';

describe('CreateCircleComponent', () => {
  let component: CreateCircleComponent;
  let router: Router;

  beforeEach(() => {
    vi.resetAllMocks();
    (authState as any).mockReturnValue(of(FAKE_USER));

    TestBed.configureTestingModule({
      imports: [CreateCircleComponent],
      providers: [
        ...provideFirebaseMocks({ Auth, Firestore, Storage }),
        { provide: Router, useValue: createMockRouter() },
      ],
    });
    const fixture = TestBed.createComponent(CreateCircleComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('submit()', () => {
    it('should not submit with empty name', async () => {
      component.name = '   ';
      await component.submit();
      expect(addDoc).not.toHaveBeenCalled();
    });

    it('should not submit while already submitting', async () => {
      component.name = 'Test';
      component.submitting = true;
      await component.submit();
      expect(addDoc).not.toHaveBeenCalled();
    });

    it('should navigate to new circle on success', async () => {
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({ displayName: 'User', avatarColor: '#abc' }),
      });
      (addDoc as any).mockResolvedValue({ id: 'new-id' });
      (setDoc as any).mockResolvedValue(undefined);

      component.name = 'My Circle';
      component.description = 'A description';
      await component.submit();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/app-home/circles/new-id');
      expect(component.submitting).toBe(false);
    });
  });

  describe('onBannerSelected()', () => {
    it('should set banner file and preview', () => {
      const file = new File(['img'], 'banner.png', { type: 'image/png' });
      const event = { target: { files: [file] } } as any;
      component.onBannerSelected(event);
      expect(component.bannerFile).toBe(file);
      expect(component.bannerPreview).toBeTruthy();
    });

    it('should do nothing when no file selected', () => {
      const event = { target: { files: [] } } as any;
      component.onBannerSelected(event);
      expect(component.bannerFile).toBeNull();
    });
  });

  describe('removeBanner()', () => {
    it('should clear banner state', () => {
      component.bannerFile = new File(['img'], 'banner.png');
      component.bannerPreview = 'blob:url';
      component.removeBanner();
      expect(component.bannerFile).toBeNull();
      expect(component.bannerPreview).toBeNull();
    });
  });
});
