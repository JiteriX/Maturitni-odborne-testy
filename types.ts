
export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswerIndex: number; // 0-3
  acceptableAnswerIndex?: number; // Alternativní uznatelná odpověď
  imageUrl?: string;
}

export type Subject = 'SPS' | 'STT';

export enum AppMode {
  MENU = 'MENU',
  MOCK_TEST = 'MOCK_TEST',
  TRAINING = 'TRAINING',
  BROWSER = 'BROWSER',
  MISTAKES = 'MISTAKES',
  REVIEW = 'REVIEW',
  LEADERBOARD = 'LEADERBOARD',
  BATTLE_HUB = 'BATTLE_HUB', 
  BATTLE = 'BATTLE', 
  SUDDEN_DEATH = 'SUDDEN_DEATH',
  CATEGORY_SELECT = 'CATEGORY_SELECT', // Nový mód pro výběr kategorie
}

export interface Category {
  id: string;
  name: string;
  subject: Subject;
  questionRanges: [number, number][]; // List of [minId, maxId]
}

export interface CategoryResult {
  categoryId: string;
  categoryName: string;
  correct: number;
  total: number;
}

export interface TestResult {
  score: number;
  total: number;
  passed: boolean;
  mistakes: number[];
  timeElapsed: number;
  userAnswers: Record<number, number>;
  questionsUsed: Question[];
  categoryResults?: CategoryResult[]; // Rozbor podle témat
}

export interface SubjectStats {
  testsTaken: number;
  totalPoints: number;
  totalMaxPoints: number;
  bestScorePercent: number;
  battlesPlayedToday?: number;
  lastBattleDate?: string; 
  bestStreak?: number;
}

export interface LeaderboardUser {
  uid: string; 
  displayName: string;
  statsSPS?: SubjectStats;
  statsSTT?: SubjectStats;
}

export interface QuestionReport {
  questionId: number;
  subject: Subject;
  reason: string;
  userName: string;
  timestamp: string;
}

export interface BattlePlayerData {
  uid: string;
  displayName: string;
  progress: number; 
  score: number;
  finished: boolean;
  ready: boolean;
}

export interface BattleRoom {
  id: string;
  code: string;
  subject: Subject;
  status: 'WAITING' | 'STARTING' | 'IN_PROGRESS' | 'FINISHED';
  questions: number[]; 
  players: Record<string, BattlePlayerData>;
  createdAt: any;
  expiresAt?: number; 
}
