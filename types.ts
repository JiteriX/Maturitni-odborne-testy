
export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswerIndex: number; // 0-3
  imageUrl?: string;
}

export type Subject = 'SPS' | 'STT';

export enum AppMode {
  MENU = 'MENU',
  MOCK_TEST = 'MOCK_TEST',     // 1. Test nanečisto (40 questions, 30 min, hidden answers)
  TRAINING = 'TRAINING',       // 2. Náhodný trénink (Instant feedback)
  BROWSER = 'BROWSER',         // 3. Prohlížení (Search)
  MISTAKES = 'MISTAKES',       // 4. Oprava chyb
  REVIEW = 'REVIEW',           // 5. Prohlédnutí výsledků testu
}

export interface TestResult {
  score: number;
  total: number;
  passed: boolean;
  mistakes: number[]; // IDs of wrong questions
  timeElapsed: number;
  userAnswers: Record<number, number>; // Map of QuestionID -> SelectedIndex
  questionsUsed: Question[]; // The specific list of questions used in that test run
}
