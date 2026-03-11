import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Profile } from './profile';
import { provideFirebaseMocks, FAKE_USER } from '../../testing/firebase-mocks';
import { ThemeService } from '../services/theme.service';
import { provideRouter } from '@angular/router';

import { Auth } from '@angular/fire/auth';
import { Firestore, getDoc } from '@angular/fire/firestore';

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;
  let mockThemeService: any;

  beforeEach(async () => {
    vi.resetAllMocks();
    mockThemeService = {
      themes: [],
      lightThemes: [{ id: 'clean', name: 'Clean', mode: 'light', accent: '#0ea5a4' }],
      darkThemes: [{ id: 'cyber', name: 'Cyber', mode: 'dark', accent: '#00c4a0' }],
      apply: vi.fn(),
      current: vi.fn().mockReturnValue('clean'),
    };

    (getDoc as any).mockResolvedValue({
      exists: () => true,
      data: () => ({ displayName: 'Test', bio: 'Hello', avatarColor: '#0ea5a4' }),
    });

    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        ...provideFirebaseMocks({ Auth, Firestore }),
        provideRouter([]),
        { provide: ThemeService, useValue: mockThemeService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('selectTheme()', () => {
    it('should call themeService.apply', () => {
      component.selectTheme('cyber');
      expect(mockThemeService.apply).toHaveBeenCalledWith('cyber');
    });
  });

  describe('getInitials()', () => {
    it('should return "U" for null', () => {
      expect(component.getInitials(null)).toBe('U');
    });

    it('should return initials for multi-word name', () => {
      expect(component.getInitials('John Doe')).toBe('JD');
    });

    it('should return first 2 chars for single word', () => {
      expect(component.getInitials('Alice')).toBe('AL');
    });
  });

  describe('theme getters', () => {
    it('should return light themes', () => {
      expect(component.lightThemes).toHaveLength(1);
    });

    it('should return dark themes', () => {
      expect(component.darkThemes).toHaveLength(1);
    });

    it('should return active theme', () => {
      expect(component.activeTheme).toBe('clean');
    });
  });
});
