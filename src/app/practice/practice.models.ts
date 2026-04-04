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

export type PracticeMode = 'fix' | 'build' | 'prompt' | 'interview';

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
  mode?: PracticeMode;
  language: PracticeLanguage;
  category?: PracticeCategory;
  level?: PracticeLevel;
  customPrompt?: string;
  interviewQuestionId?: string;
  challenge: string;
  challengeDescription: string;
  submission: string;
  score: number;
  grade: string;
  feedback: string;
  correctedCode?: string;
  createdAt: any;
}
