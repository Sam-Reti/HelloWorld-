import { TestBed } from '@angular/core/testing';
import { CirclesListComponent } from './circles-list';
import { provideFirebaseMocks, FAKE_USER } from '../../../testing/firebase-mocks';
import { of, Subject } from 'rxjs';

import { Auth, authState } from '@angular/fire/auth';
import { Firestore, collectionData } from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';
import { provideRouter } from '@angular/router';

describe('CirclesListComponent', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (authState as any).mockReturnValue(of(FAKE_USER));
    (collectionData as any).mockReturnValue(of([]));

    TestBed.configureTestingModule({
      imports: [CirclesListComponent],
      providers: [
        ...provideFirebaseMocks({ Auth, Firestore, Storage }),
        provideRouter([]),
      ],
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(CirclesListComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('getInitials()', () => {
    it('should return C for empty name', () => {
      const fixture = TestBed.createComponent(CirclesListComponent);
      expect(fixture.componentInstance.getInitials('')).toBe('C');
    });

    it('should return first two chars for single word', () => {
      const fixture = TestBed.createComponent(CirclesListComponent);
      expect(fixture.componentInstance.getInitials('Angular')).toBe('AN');
    });

    it('should return initials for two words', () => {
      const fixture = TestBed.createComponent(CirclesListComponent);
      expect(fixture.componentInstance.getInitials('Dev World')).toBe('DW');
    });
  });

  describe('filterCircles()', () => {
    it('should return all circles when search is empty', () => {
      const fixture = TestBed.createComponent(CirclesListComponent);
      const circles = [
        { name: 'Circle A', description: 'desc' },
        { name: 'Circle B', description: 'other' },
      ] as any[];
      fixture.componentInstance.searchTerm = '';
      expect(fixture.componentInstance.filterCircles(circles)).toEqual(circles);
    });

    it('should filter by name', () => {
      const fixture = TestBed.createComponent(CirclesListComponent);
      const circles = [
        { name: 'Angular Devs', description: 'desc' },
        { name: 'React Devs', description: 'other' },
      ] as any[];
      fixture.componentInstance.searchTerm = 'angular';
      const result = fixture.componentInstance.filterCircles(circles);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Angular Devs');
    });

    it('should filter by description', () => {
      const fixture = TestBed.createComponent(CirclesListComponent);
      const circles = [
        { name: 'Circle', description: 'Learn TypeScript' },
        { name: 'Other', description: 'General' },
      ] as any[];
      fixture.componentInstance.searchTerm = 'typescript';
      const result = fixture.componentInstance.filterCircles(circles);
      expect(result.length).toBe(1);
    });
  });
});
