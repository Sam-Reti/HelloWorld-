import { Timestamp } from 'firebase/firestore';
import { PracticeLanguage } from '../../practice/practice.models';

export type EditorLanguage = PracticeLanguage;

export const EDITOR_LANGUAGES: readonly EditorLanguage[] = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'Go',
  'Rust',
  'C#',
  'C++',
] as const;

export interface SharedEditorDoc {
  isOpen: boolean;
  language: EditorLanguage;
  content: string;
  lastEditBy: string;
  lastEditAt: Timestamp | null;
}
