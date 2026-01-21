
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
  MOCK_TEST = 'MOCK_TEST',
  TRAINING = 'TRAINING',
  BROWSER = 'BROWSER',
  MISTAKES = 'MISTAKES',
  REVIEW = 'REVIEW',
  LEADERBOARD = 'LEADERBOARD',
  BATTLE_HUB = 'BATTLE_HUB', // Rozcestník pro bojové módy
  BATTLE = 'BATTLE', // 1v1
  SUDDEN_DEATH = 'SUDDEN_DEATH', // Náhlá smrt
}

export interface TestResult {
  score: number;
  total: number;
  passed: boolean;
  mistakes: number[];
  timeElapsed: number;
  userAnswers: Record<number, number>;
  questionsUsed: Question[];
}

export interface SubjectStats {
  testsTaken: number;
  totalPoints: number;
  totalMaxPoints: number;
  bestScorePercent: number;
  // Limity pro bitvy
  battlesPlayedToday?: number;
  lastBattleDate?: string; // YYYY-MM-DD
  // Statistiky pro Sudden Death
  bestStreak?: number;
}

export interface LeaderboardUser {
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

// Rozhraní pro 1v1 Bitvu
export interface BattlePlayerData {
  uid: string;
  displayName: string;
  progress: number; // 0-20
  score: number;
  finished: boolean;
  ready: boolean;
}

export interface BattleRoom {
  id: string;
  code: string;
  subject: Subject;
  status: 'WAITING' | 'STARTING' | 'IN_PROGRESS' | 'FINISHED';
  questions: number[]; // Seznam ID otázek
  players: Record<string, BattlePlayerData>;
  createdAt: any;
  expiresAt?: number; // Timestamp vypršení hry (ms)
}
