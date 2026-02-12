
import React, { useState, useEffect } from 'react';
import { Question, AppMode, TestResult } from '../types';
import { QuestionCard } from './QuestionCard';
import { db, auth } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface Props {
  mode: AppMode;
  mistakeIds?: number[]; 
  onComplete: (result: TestResult) => void;
  onExit: () => void;
  onReportRequest?: (qId: number) => void;
  initialQuestionsForMode: Question[];
  initialQuestions?: Question[];
  initialAnswers?: Record<number, number>;
  subject?: 'SPS' | 'STT'; 
}

export const TestRunner: React.FC<Props> = ({ mode, mistakeIds, onComplete, onExit, onReportRequest, initialQuestionsForMode, initialQuestions, initialAnswers, subject }) => {
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({}); 
  const [timeLeft, setTimeLeft] = useState(30 * 60); 
  const [currentIndex, setCurrentIndex] = useState(0);
  // Nový stav pro sledování, zda byl test již vyhodnocen
  const [isFinished, setIsFinished] = useState(false);
  
  useEffect(() => {
    let q: Question[] = [];
    
    if (initialQuestions && mode === AppMode.REVIEW) {
        q = initialQuestions;
        if (initialAnswers) {
            setAnswers(initialAnswers);
        }
    } else if (mode === AppMode.MOCK_TEST) {
      const shuffled = [...initialQuestionsForMode].sort(() => 0.5 - Math.random());
      q = shuffled.slice(0, 40);
    } else if (mode === AppMode.MISTAKES && mistakeIds) {
      q = initialQuestionsForMode.filter(q => mistakeIds.includes(q.id));
    } else if (mode === AppMode.TRAINING) {
      q = [...initialQuestionsForMode].sort(() => 0.5 - Math.random());
    } else {
        q = [...initialQuestionsForMode];
    }
    setCurrentQuestions(q);
  }, [mode, mistakeIds, initialQuestions, initialAnswers, initialQuestionsForMode]);

  useEffect(() => {
    // Pokud není mód MOCK_TEST nebo pokud je test již dokončen, časovač nespouštíme
    if (mode !== AppMode.MOCK_TEST || isFinished) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          finishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, isFinished]); // Přidána závislost na isFinished

  const handleAnswer = (qId: number, idx: number, isCorrect: boolean) => {
    if (isFinished) return; // Zabrání změně odpovědí po dokončení
    setAnswers(prev => ({ ...prev, [qId]: idx }));
  };

  const saveStats = async (score: number, total: number) => {
      if (mode !== AppMode.MOCK_TEST || !subject || !auth.currentUser) return;
      try {
          const userRef = doc(db, "users", auth.currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
              const data = userSnap.data();
              const fieldName = subject === 'SPS' ? 'statsSPS' : 'statsSTT';
              const currentStats = data[fieldName] || { testsTaken: 0, totalPoints: 0, totalMaxPoints: 0, bestScorePercent: 0 };
              const currentPercent = (score / total) * 100;
              const newStats = {
                  testsTaken: currentStats.testsTaken + 1,
                  totalPoints: currentStats.totalPoints + score,
                  totalMaxPoints: currentStats.totalMaxPoints + total,
                  bestScorePercent: Math.max(currentStats.bestScorePercent, currentPercent)
              };
              await setDoc(userRef, { [fieldName]: newStats }, { merge: true });
          }
      } catch (e) {
          console.error("Chyba při ukládání statistik:", e);
      }
  };

  const finishTest = async () => {
    // Pokud už byl test vyhodnocen, nedělej nic (prevence dvojího vyhodnocení časovačem)
    if (isFinished) return;
    setIsFinished(true);

    let score = 0;
    const mistakes: number[] = [];
    
    // Pro Mock test hodnotíme všechny otázky (nevyplněné = chyba)
    // Pro Training/Mistakes hodnotíme jen ty, na které uživatel odpověděl, aby mohl skončit dříve
    let relevantQuestions = currentQuestions;
    
    if (mode !== AppMode.MOCK_TEST && mode !== AppMode.REVIEW) {
        relevantQuestions = currentQuestions.filter(q => answers[q.id] !== undefined);
        
        // Pokud uživatel nic nevyplnil a dal ukončit, nic se nestane (nebo score 0/0)
        if (relevantQuestions.length === 0 && Object.keys(answers).length === 0) {
             onExit();
             return;
        }
    }

    relevantQuestions.forEach(q => {
      const userAns = answers[q.id];
      const isCorrect = userAns === q.correctAnswerIndex || (q.acceptableAnswerIndex !== undefined && userAns === q.acceptableAnswerIndex);
      if (isCorrect) score++; else mistakes.push(q.id);
    });

    const total = relevantQuestions.length;
    const percentage = total === 0 ? 0 : (score / total) * 100;
    const passed = percentage >= 44;

    // DŮLEŽITÉ: Čekáme na uložení statistik před zobrazením výsledku
    await saveStats(score, total);

    onComplete({ score, total, passed, mistakes, timeElapsed: (30 * 60) - timeLeft, userAnswers: answers, questionsUsed: relevantQuestions });
  };

  if (currentQuestions.length === 0) {
    return (
        <div className="text-center p-12 animate-in fade-in duration-500">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-black text-gray-700 uppercase tracking-tight">Žádné otázky nenalezeny</h2>
            <p className="text-gray-500 mb-6 font-medium">V tomto režimu nebo tématu nejsou žádné otázky.</p>
            <button onClick={onExit} className="px-6 py-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all">ZPĚT DO MENU</button>
        </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentQ = currentQuestions[currentIndex];

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="bg-white sticky top-0 z-10 shadow-sm border-b border-gray-200 px-6 py-4 mb-6 flex justify-between items-center rounded-b-3xl">
        <div className="flex items-center gap-4">
            <button onClick={onExit} className="text-gray-500 hover:text-gray-900 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
                <h2 className="font-black text-gray-800 uppercase tracking-tighter italic">
                    {mode === AppMode.MOCK_TEST ? 'Test nanečisto' : 
                     mode === AppMode.TRAINING ? 'Procvičování' : 
                     mode === AppMode.MISTAKES ? 'Oprava chyb' : 
                     mode === AppMode.REVIEW ? 'Revize' : 'Test'}
                </h2>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Otázka {currentIndex + 1} / {currentQuestions.length}
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-3">
            {(mode === AppMode.TRAINING || mode === AppMode.MISTAKES) && Object.keys(answers).length > 0 && (
                 <button onClick={finishTest} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-2">
                     <span>💾</span> Ukončit a uložit
                 </button>
            )}
            
            {mode === AppMode.MOCK_TEST && (
                <div className={`px-4 py-1.5 rounded-2xl font-mono text-xl font-black border-2 ${timeLeft < 300 ? 'text-red-600 border-red-100 animate-pulse' : 'text-blue-600 border-blue-50'}`}>
                    {formatTime(timeLeft)}
                </div>
            )}
        </div>
      </div>

      <div className="px-4">
          <QuestionCard question={currentQ} mode={mode} onAnswer={handleAnswer} showFeedback={mode !== AppMode.MOCK_TEST} userAnswer={answers[currentQ.id]} onReportRequest={onReportRequest} />
      </div>

      <div className="flex justify-between items-center px-6 py-8">
        <button onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0} className="px-6 py-3 rounded-2xl bg-white border border-gray-200 text-gray-600 font-bold disabled:opacity-30 hover:bg-gray-50 transition-all shadow-sm">PŘEDCHOZÍ</button>
        {mode === AppMode.TRAINING || mode === AppMode.MISTAKES ? (
             <button onClick={() => { if (currentIndex === currentQuestions.length - 1) finishTest(); else setCurrentIndex(p => p + 1); }} className="px-10 py-3 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
                {currentIndex === currentQuestions.length - 1 ? 'UKONČIT' : 'DALŠÍ'}
             </button>
        ) : (
            <button onClick={() => { if (currentIndex === currentQuestions.length - 1) { if (mode === AppMode.REVIEW) onExit(); else finishTest(); } else setCurrentIndex(p => p + 1); }} className={`px-10 py-3 rounded-2xl font-black transition-all shadow-xl ${currentIndex === currentQuestions.length - 1 ? (mode === AppMode.REVIEW ? 'bg-gray-900 text-white hover:bg-black' : 'bg-green-600 text-white hover:bg-green-700 shadow-green-100') : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'}`}>
                {currentIndex === currentQuestions.length - 1 ? (mode === AppMode.REVIEW ? 'DO MENU' : 'VYHODNOTIT') : 'DALŠÍ'}
            </button>
        )}
      </div>
    </div>
  );
};
