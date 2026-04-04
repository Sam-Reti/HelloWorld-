import { PracticeLevel } from '../practice.models';

export interface InterviewQuestion {
  id: string;
  title: string;
  difficulty: PracticeLevel;
  category: string;
  description: string;
}

export interface InterviewProgress {
  questionId: string;
  bestScore: number;
  bestGrade: string;
  attempts: number;
  lastAttemptAt: any;
}
