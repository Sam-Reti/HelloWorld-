import { Injectable, inject } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  getDocs,
} from '@angular/fire/firestore';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import {
  PracticeLanguage,
  PracticeCategory,
  PracticeLevel,
  ChallengePayload,
  GradePayload,
  PracticeSession,
} from '../practice/practice.models';
import { InterviewProgress } from '../practice/interview-prep/interview-prep.models';

function parseJson<T>(raw: string): T {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`AI returned invalid JSON: ${cleaned.slice(0, 200)}`);
  }
}

@Injectable({ providedIn: 'root' })
export class PracticeService {
  private app = inject(FirebaseApp);
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  private getModel() {
    const ai = getAI(this.app, { backend: new GoogleAIBackend() });
    return getGenerativeModel(ai, { model: 'gemini-2.5-flash' });
  }

  async generateChallenge(
    language: PracticeLanguage,
    category: PracticeCategory,
    level: PracticeLevel,
  ): Promise<ChallengePayload> {
    const model = this.getModel();
    const prompt = `Generate a ${language} code snippet in the category '${category}' at difficulty '${level}' with intentional bugs.

Difficulty guide:
- Easy: 5–15 lines, single obvious-type bug, beginner-friendly code
- Medium: 15–25 lines, 1–2 subtler bugs, intermediate patterns
- Hard: 25–40 lines, multiple interacting bugs, advanced patterns

Requirements:
- Code must be syntactically valid but have logical/semantic errors
- CRITICAL: Do NOT include any comments in the code. No inline comments, no block comments, no docstrings, no annotations — zero comments of any kind. The user must find the bugs themselves without any hints.
- The description field should explain what the code is supposed to do without giving away the answer or hinting at where the bugs are

Respond with ONLY valid JSON (no markdown fences), in this shape:
{"code": "...", "description": "..."}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return parseJson<ChallengePayload>(text);
  }

  async generateBuildChallenge(
    language: PracticeLanguage,
    category: PracticeCategory,
    level: PracticeLevel,
  ): Promise<ChallengePayload> {
    const model = this.getModel();
    const prompt = `Generate a ${language} coding challenge in the category '${category}' at difficulty '${level}'. The user will implement it from scratch.

Difficulty guide:
- Easy: single simple function, clear inputs/outputs, beginner-friendly
- Medium: moderate complexity, common algorithms or data structures
- Hard: multi-function solution, advanced patterns, edge-case-heavy

Requirements:
- Write a clear specification describing what to build, what inputs it takes, what it should return or do
- Include 2–3 concrete examples with inputs and expected outputs
- Do NOT include any code or hints about implementation

Respond with ONLY valid JSON (no markdown fences), in this shape:
{"description": "..."}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = parseJson<{ description: string }>(text);
    return { code: '', description: parsed.description };
  }

  async generatePromptChallenge(
    language: PracticeLanguage,
    userPrompt: string,
  ): Promise<ChallengePayload> {
    const model = this.getModel();
    const prompt = `Generate a ${language} coding challenge based on this user request:

"${userPrompt}"

Requirements:
- Write a clear specification describing what to build, what inputs it takes, what it should return or do
- Include 2–3 concrete examples with inputs and expected outputs
- Do NOT include any code or hints about implementation
- Tailor the challenge to what the user asked for

Respond with ONLY valid JSON (no markdown fences), in this shape:
{"description": "..."}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = parseJson<{ description: string }>(text);
    return { code: '', description: parsed.description };
  }

  async gradeSubmission(
    language: PracticeLanguage,
    category: PracticeCategory,
    originalCode: string,
    fixedCode: string,
  ): Promise<GradePayload> {
    if (!fixedCode.trim()) {
      return { score: 0, grade: 'F', feedback: 'No code was submitted.', correctedCode: originalCode };
    }

    const model = this.getModel();
    const prompt = `You are grading a ${language} code fix in category '${category}'.

ORIGINAL (buggy) CODE:
\`\`\`
${originalCode}
\`\`\`

USER'S FIX:
\`\`\`
${fixedCode}
\`\`\`

IMPORTANT: Grade ONLY the code in USER'S FIX above. Do not infer or assume any fixes that are not explicitly present in the submitted code.

Grade the fix. Consider:
- Did they fix the core bug(s)?
- Did they introduce new bugs?
- Did they handle edge cases appropriately?

Grading scale: A=90-100, B=80-89, C=70-79, D=60-69, F=0-59

Respond with ONLY valid JSON (no markdown fences), in this shape:
{"score": <0-100>, "grade": "<A|B|C|D|F>", "feedback": "<explanation of what the bugs were and whether the user fixed them>", "correctedCode": "<the fully correct version of the code>"}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return parseJson<GradePayload>(text);
  }

  async gradeBuildSubmission(
    language: PracticeLanguage,
    category: PracticeCategory | undefined,
    description: string,
    submission: string,
  ): Promise<GradePayload> {
    if (!submission.trim()) {
      return { score: 0, grade: 'F', feedback: 'No code was submitted.', correctedCode: '' };
    }

    const categoryClause = category ? ` in category '${category}'` : '';
    const model = this.getModel();
    const prompt = `You are grading a ${language} implementation${categoryClause}.

CHALLENGE SPECIFICATION:
${description}

USER'S IMPLEMENTATION:
\`\`\`
${submission}
\`\`\`

IMPORTANT: Grade ONLY the code in USER'S IMPLEMENTATION above. Do not give credit for anything not explicitly written in the submitted code.

Grade the implementation. Consider:
- Does it correctly implement what the specification describes?
- Does it handle the example cases and edge cases?
- Did they introduce any bugs or incorrect logic?

Grading scale: A=90-100, B=80-89, C=70-79, D=60-69, F=0-59

Respond with ONLY valid JSON (no markdown fences), in this shape:
{"score": <0-100>, "grade": "<A|B|C|D|F>", "feedback": "<explanation of how well the implementation matches the spec and what could be improved>", "correctedCode": "<a clean, correct reference implementation>"}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return parseJson<GradePayload>(text);
  }

  async saveSession(session: Omit<PracticeSession, 'createdAt'>): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const sessionsRef = collection(this.firestore, 'practiceSessions');
    await addDoc(sessionsRef, {
      ...session,
      uid: user.uid,
      createdAt: serverTimestamp(),
    });
  }

  async loadInterviewProgress(): Promise<Map<string, InterviewProgress>> {
    const user = this.auth.currentUser;
    if (!user) return new Map();

    const colRef = collection(this.firestore, `users/${user.uid}/interviewProgress`);
    const snapshot = await getDocs(colRef);
    const map = new Map<string, InterviewProgress>();
    snapshot.forEach((d) => map.set(d.id, d.data() as InterviewProgress));
    return map;
  }

  async saveInterviewProgress(
    questionId: string,
    score: number,
    grade: string,
  ): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const docRef = doc(this.firestore, `users/${user.uid}/interviewProgress/${questionId}`);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const existing = snap.data() as InterviewProgress;
      if (score > existing.bestScore) {
        await setDoc(docRef, {
          questionId,
          bestScore: score,
          bestGrade: grade,
          attempts: existing.attempts + 1,
          lastAttemptAt: serverTimestamp(),
        });
      } else {
        await setDoc(docRef, {
          ...existing,
          attempts: existing.attempts + 1,
          lastAttemptAt: serverTimestamp(),
        });
      }
    } else {
      await setDoc(docRef, {
        questionId,
        bestScore: score,
        bestGrade: grade,
        attempts: 1,
        lastAttemptAt: serverTimestamp(),
      });
    }
  }
}
