import { TestBed } from '@angular/core/testing';
import { SearchService } from './search.service';
import { FollowService } from './follow.service';
import { provideFirebaseMocks, FAKE_USER } from '../../testing/firebase-mocks';
import { of, firstValueFrom } from 'rxjs';

import { Auth, authState } from '@angular/fire/auth';
import { Firestore, collectionData } from '@angular/fire/firestore';

describe('SearchService', () => {
  let service: SearchService;
  let mockFollowService: { getFollowingIds$: ReturnType<typeof vi.fn> };

  const users = [
    { uid: 'u1', displayName: 'Alice Dev', role: 'Frontend', languages: ['TypeScript'] },
    { uid: 'u2', displayName: 'Bob Smith', role: 'Backend', languages: ['Python', 'Go'] },
    { uid: 'u3', displayName: 'Charlie', role: 'Designer', languages: [] },
  ];

  const posts = [
    { id: 'p1', text: 'Hello TypeScript', authorId: 'u1', authorDisplayName: 'Alice Dev', authorName: 'alice@test.com' },
    { id: 'p2', text: 'Python is great', authorId: 'u2', authorDisplayName: 'Bob Smith', authorName: 'bob@test.com' },
    { id: 'p3', text: 'CSS tricks', authorId: 'u3', authorDisplayName: 'Charlie', authorName: 'c@test.com' },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    (authState as any).mockReturnValue(of(FAKE_USER));
    mockFollowService = { getFollowingIds$: vi.fn().mockReturnValue(of(['u1', 'u2'])) };

    // collectionData is called twice: once for users, once for posts
    (collectionData as any)
      .mockReturnValueOnce(of(users))
      .mockReturnValueOnce(of(posts));

    TestBed.configureTestingModule({
      providers: [
        ...provideFirebaseMocks({ Auth, Firestore }),
        { provide: FollowService, useValue: mockFollowService },
      ],
    });
    service = TestBed.inject(SearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return empty results for empty term', async () => {
    const result = await firstValueFrom(service.search(''));
    expect(result).toEqual({ people: [], posts: [] });
  });

  it('should return empty results for whitespace-only term', async () => {
    const result = await firstValueFrom(service.search('   '));
    expect(result).toEqual({ people: [], posts: [] });
  });

  it('should filter users by displayName', async () => {
    const result = await firstValueFrom(service.search('alice'));
    expect(result.people.length).toBeGreaterThanOrEqual(1);
    expect(result.people[0].displayName).toBe('Alice Dev');
  });

  it('should filter users by role', async () => {
    const result = await firstValueFrom(service.search('backend'));
    expect(result.people).toHaveLength(1);
    expect(result.people[0].uid).toBe('u2');
  });

  it('should filter users by languages', async () => {
    const result = await firstValueFrom(service.search('typescript'));
    expect(result.people.some((u: any) => u.uid === 'u1')).toBe(true);
  });

  it('should limit users to 5 results', async () => {
    const manyUsers = Array.from({ length: 10 }, (_, i) => ({
      uid: `u${i}`,
      displayName: `Match User ${i}`,
      role: '',
      languages: [],
    }));
    (collectionData as any)
      .mockReturnValueOnce(of(manyUsers))
      .mockReturnValueOnce(of([]));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ...provideFirebaseMocks({ Auth, Firestore }),
        { provide: FollowService, useValue: mockFollowService },
      ],
    });
    const svc = TestBed.inject(SearchService);
    const result = await firstValueFrom(svc.search('match'));
    expect(result.people.length).toBeLessThanOrEqual(5);
  });

  it('should only return posts from followed users', async () => {
    // u3 is not followed
    const result = await firstValueFrom(service.search('css'));
    expect(result.posts).toHaveLength(0);
  });

  it('should filter posts by text content', async () => {
    const result = await firstValueFrom(service.search('typescript'));
    expect(result.posts.some((p: any) => p.id === 'p1')).toBe(true);
  });
});
