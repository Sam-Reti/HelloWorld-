import { Injectable, inject } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import {
  PracticeLanguage,
  PracticeCategory,
  PracticeLevel,
  ChallengePayload,
  GradePayload,
  PracticeSession,
} from '../practice/practice.models';

function parseJson<T>(raw: string): T {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleaned) as T;
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

  async gradeSubmission(
    language: PracticeLanguage,
    category: PracticeCategory,
    originalCode: string,
    fixedCode: string,
  ): Promise<GradePayload> {
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
}
