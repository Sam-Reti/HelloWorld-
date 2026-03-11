import { TestBed } from '@angular/core/testing';
import { PracticeService } from './practice.service';
import { provideFirebaseMocks, FAKE_USER } from '../../testing/firebase-mocks';

import { Auth } from '@angular/fire/auth';
import { Firestore, addDoc } from '@angular/fire/firestore';
import { FirebaseApp } from '@angular/fire/app';
import { getGenerativeModel } from 'firebase/ai';

describe('PracticeService', () => {
  let service: PracticeService;
  let mockModel: { generateContent: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.resetAllMocks();
    mockModel = { generateContent: vi.fn() };
    (getGenerativeModel as any).mockReturnValue(mockModel);

    TestBed.configureTestingModule({
      providers: [...provideFirebaseMocks({ Auth, Firestore, FirebaseApp })],
    });
    service = TestBed.inject(PracticeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('generateChallenge()', () => {
    it('should call AI and parse JSON response', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: { text: () => '{"code": "let x = 1;", "description": "Fix the bug"}' },
      });

      const result = await service.generateChallenge('JavaScript', 'Logic Bugs', 'Easy');
      expect(result).toEqual({ code: 'let x = 1;', description: 'Fix the bug' });
    });

    it('should handle markdown-fenced JSON', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: { text: () => '```json\n{"code": "x", "description": "d"}\n```' },
      });

      const result = await service.generateChallenge('Python', 'Logic Bugs', 'Easy');
      expect(result).toEqual({ code: 'x', description: 'd' });
    });

    it('should throw on invalid JSON', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: { text: () => 'not valid json' },
      });

      await expect(
        service.generateChallenge('JavaScript', 'Logic Bugs', 'Easy'),
      ).rejects.toThrow('AI returned invalid JSON');
    });
  });

  describe('gradeSubmission()', () => {
    it('should return F for empty submission', async () => {
      const result = await service.gradeSubmission('JavaScript', 'Logic Bugs', 'original', '  ');
      expect(result.grade).toBe('F');
      expect(result.score).toBe(0);
      expect(result.feedback).toBe('No code was submitted.');
    });

    it('should call AI and return grade for non-empty submission', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => '{"score": 85, "grade": "B", "feedback": "Good fix", "correctedCode": "fixed"}',
        },
      });

      const result = await service.gradeSubmission('JavaScript', 'Logic Bugs', 'buggy', 'fixed');
      expect(result.score).toBe(85);
      expect(result.grade).toBe('B');
    });
  });

  describe('gradeBuildSubmission()', () => {
    it('should return F for empty submission', async () => {
      const result = await service.gradeBuildSubmission('Python', 'Logic Bugs', 'desc', '');
      expect(result.grade).toBe('F');
      expect(result.score).toBe(0);
    });
  });

  describe('saveSession()', () => {
    it('should throw when not authenticated', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [...provideFirebaseMocks({ Auth, Firestore, FirebaseApp }, { auth: { currentUser: null } as any })],
      });
      const svc = TestBed.inject(PracticeService);

      await expect(
        svc.saveSession({
          uid: '', mode: 'fix', language: 'JavaScript', category: 'Logic Bugs',
          level: 'Easy', challenge: 'c', challengeDescription: 'd', submission: 's',
          score: 0, grade: 'F', feedback: 'f', correctedCode: 'cc',
        }),
      ).rejects.toThrow('Not authenticated');
    });

    it('should write session to Firestore', async () => {
      (addDoc as any).mockResolvedValue({ id: 'session-1' });

      await service.saveSession({
        uid: FAKE_USER.uid, mode: 'fix', language: 'JavaScript', category: 'Logic Bugs',
        level: 'Easy', challenge: 'code', challengeDescription: 'desc', submission: 'sub',
        score: 90, grade: 'A', feedback: 'Great!', correctedCode: 'fixed',
      });

      expect(addDoc).toHaveBeenCalledWith(
        'col',
        expect.objectContaining({ uid: FAKE_USER.uid, score: 90, grade: 'A' }),
      );
    });
  });
});
