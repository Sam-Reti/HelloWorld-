import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.body.removeAttribute('data-theme');
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have 6 themes', () => {
    expect(service.themes).toHaveLength(6);
  });

  it('should have 3 light themes', () => {
    expect(service.lightThemes).toHaveLength(3);
    expect(service.lightThemes.every((t) => t.mode === 'light')).toBe(true);
  });

  it('should have 3 dark themes', () => {
    expect(service.darkThemes).toHaveLength(3);
    expect(service.darkThemes.every((t) => t.mode === 'dark')).toBe(true);
  });

  describe('apply()', () => {
    it('should set data-theme attribute on body', () => {
      service.apply('cyber');
      expect(document.body.getAttribute('data-theme')).toBe('cyber');
    });

    it('should persist theme to localStorage', () => {
      service.apply('ocean');
      expect(localStorage.getItem('hw-theme')).toBe('ocean');
    });
  });

  describe('init()', () => {
    it('should read stored theme from localStorage', () => {
      localStorage.setItem('hw-theme', 'dracula');
      service.init();
      expect(document.body.getAttribute('data-theme')).toBe('dracula');
    });

    it('should default to clean when no stored theme', () => {
      service.init();
      expect(document.body.getAttribute('data-theme')).toBe('clean');
    });
  });

  describe('current()', () => {
    it('should return the current theme id', () => {
      service.apply('rose');
      expect(service.current()).toBe('rose');
    });

    it('should default to clean when no theme set', () => {
      expect(service.current()).toBe('clean');
    });
  });
});
