export type PracticeLanguage =
  | 'JavaScript'
  | 'TypeScript'
  | 'Python'
  | 'Java'
  | 'Go'
  | 'Rust'
  | 'C#'
  | 'C++';

export type PracticeCategory =
  | 'Logic Bugs'
  | 'Security Vulnerabilities'
  | 'Performance Issues'
  | 'Code Style'
  | 'Algorithm Errors'
  | 'Edge Case Handling';

export type PracticeLevel = 'Easy' | 'Medium' | 'Hard';

export type PracticeState = 'selecting' | 'loading' | 'coding' | 'grading' | 'result';

export interface ChallengePayload {
  code: string;
  description: string;
}

export interface GradePayload {
  score: number;
  grade: string;
  feedback: string;
  correctedCode: string;
}

export interface PracticeSession {
  uid: string;
  language: PracticeLanguage;
  category: PracticeCategory;
  level: PracticeLevel;
  challenge: string;
  challengeDescription: string;
  submission: string;
  score: number;
  grade: string;
  feedback: string;
  createdAt: any;
}
