import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Editprofile } from './editprofile';
import { provideFirebaseMocks, FAKE_USER, createMockRouter } from '../../testing/firebase-mocks';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { Auth, authState } from '@angular/fire/auth';
import { Firestore, getDoc, updateDoc } from '@angular/fire/firestore';

describe('Editprofile', () => {
  let component: Editprofile;
  let fixture: ComponentFixture<Editprofile>;
  let mockRouter: ReturnType<typeof createMockRouter>;

  beforeEach(async () => {
    vi.resetAllMocks();
    (authState as any).mockReturnValue(of(FAKE_USER));
    mockRouter = createMockRouter();

    await TestBed.configureTestingModule({
      imports: [Editprofile],
      providers: [
        ...provideFirebaseMocks({ Auth, Firestore }),
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Editprofile);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('toggleLanguage()', () => {
    it('should add a language', () => {
      component.toggleLanguage('TypeScript');
      expect(component.selectedLanguages).toContain('TypeScript');
    });

    it('should remove a language if already selected', () => {
      component.selectedLanguages = ['TypeScript'];
      component.toggleLanguage('TypeScript');
      expect(component.selectedLanguages).not.toContain('TypeScript');
    });
  });

  describe('isSelected()', () => {
    it('should return true for selected language', () => {
      component.selectedLanguages = ['Python'];
      expect(component.isSelected('Python')).toBe(true);
    });

    it('should return false for unselected language', () => {
      expect(component.isSelected('Rust')).toBe(false);
    });
  });

  describe('getInitials()', () => {
    it('should return "U" for empty string', () => {
      expect(component.getInitials('')).toBe('U');
    });

    it('should return initials for full name', () => {
      expect(component.getInitials('Jane Doe')).toBe('JD');
    });
  });

  describe('saveProfile()', () => {
    it('should show error for empty display name', async () => {
      component.displayName = '';
      await component.saveProfile();
      expect(component.message).toContain('Display name is required');
    });

    it('should show error for display name > 50 chars', async () => {
      component.displayName = 'a'.repeat(51);
      await component.saveProfile();
      expect(component.message).toContain('50 characters');
    });

    it('should show error for bio > 500 chars', async () => {
      component.displayName = 'Valid';
      component.bio = 'a'.repeat(501);
      await component.saveProfile();
      expect(component.message).toContain('500 characters');
    });

    it('should save and navigate on valid profile', async () => {
      (updateDoc as any).mockResolvedValue(undefined);
      component.displayName = 'Test User';
      component.bio = 'Hello';

      await component.saveProfile();

      expect(updateDoc).toHaveBeenCalledWith(
        'docRef',
        expect.objectContaining({ displayName: 'Test User' }),
      );
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app-home/profile');
    });
  });
});
