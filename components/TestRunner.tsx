
import React, { useState, useEffect, useRef } from 'react';
import { Question, AppMode, TestResult } from '../types';
import { QuestionCard } from './QuestionCard';

interface Props {
  mode: AppMode;
  mistakeIds?: number[]; // IDs for "Oprava chyb" mode
  onComplete: (result: TestResult) => void;
  onExit: () => void;
  
  // The full dataset for the current subject
  initialQuestionsForMode: Question[];

  // New props for Review Mode
  initialQuestions?: Question[];
  initialAnswers?: Record<number, number>;
}

export const TestRunner: React.FC<Props> = ({ mode, mistakeIds, onComplete, onExit, initialQuestionsForMode, initialQuestions, initialAnswers }) => {
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({}); // qId -> selectedIndex
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 mins in seconds
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Initialize Test
  useEffect(() => {
    let q: Question[] = [];
    
    if (initialQuestions && mode === AppMode.REVIEW) {
        q = initialQuestions;
        if (initialAnswers) {
            setAnswers(initialAnswers);
        }
    } else if (mode === AppMode.MOCK_TEST) {
      // Shuffle and pick 40
      const shuffled = [...initialQuestionsForMode].sort(() => 0.5 - Math.random());
      q = shuffled.slice(0, 40);
    } else if (mode === AppMode.MISTAKES && mistakeIds) {
      q = initialQuestionsForMode.filter(q => mistakeIds.includes(q.id));
    } else if (mode === AppMode.TRAINING) {
      // Random training
      q = [...initialQuestionsForMode].sort(() => 0.5 - Math.random());
    } else {
        q = [...initialQuestionsForMode];
    }
    setCurrentQuestions(q);
  }, [mode, mistakeIds, initialQuestions, initialAnswers, initialQuestionsForMode]);

  // Timer Logic (Only for Mock Test)
  useEffect(() => {
    if (mode !== AppMode.MOCK_TEST) return;
    
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
  }, [mode]); // eslint-disable-next-line react-hooks/exhaustive-deps

  const handleAnswer = (qId: number, idx: number, isCorrect: boolean) => {
    setAnswers(prev => ({ ...prev, [qId]: idx }));
  };

  const finishTest = () => {
    let score = 0;
    const mistakes: number[] = [];
    
    currentQuestions.forEach(q => {
      if (answers[q.id] === q.correctAnswerIndex) {
        score++;
      } else {
        mistakes.push(q.id);
      }
    });

    // 44% threshold
    const total = currentQuestions.length;
    const percentage = total === 0 ? 0 : (score / total) * 100;
    const passed = percentage >= 44;

    onComplete({
      score,
      total,
      passed,
      mistakes,
      timeElapsed: (30 * 60) - timeLeft,
      userAnswers: answers,
      questionsUsed: currentQuestions
    });
  };

  if (currentQuestions.length === 0) {
    return (
        <div className="text-center p-12">
            <h2 className="text-xl font-bold text-gray-700">Žádné otázky k zobrazení.</h2>
            <p className="text-gray-500 mb-4">V tomto režimu nejsou dostupné žádné otázky.</p>
            <button onClick={onExit} className="text-blue-600 underline">Zpět do menu</button>
        </div>
    );
  }

  // Formatting time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentQ = currentQuestions[currentIndex];

  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* Header Bar */}
      <div className="bg-white sticky top-0 z-10 shadow-sm border-b border-gray-200 px-6 py-4 mb-6 flex justify-between items-center rounded-b-xl">
        <div className="flex items-center gap-4">
            <button onClick={onExit} className="text-gray-500 hover:text-gray-900 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
                <h2 className="font-bold text-gray-800">
                    {mode === AppMode.MOCK_TEST ? 'Test nanečisto' : 
                     mode === AppMode.TRAINING ? 'Náhodný trénink' : 
                     mode === AppMode.MISTAKES ? 'Oprava chyb' : 
                     mode === AppMode.REVIEW ? 'Kontrola testu' : 'Test'}
                </h2>
                <div className="text-sm text-gray-500">
                    Otázka {currentIndex + 1} z {currentQuestions.length}
                </div>
            </div>
        </div>
        
        {mode === AppMode.MOCK_TEST && (
            <div className={`font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-blue-600'}`}>
                {formatTime(timeLeft)}
            </div>
        )}
      </div>

      <div className="px-4">
          <QuestionCard 
            question={currentQ}
            mode={mode}
            onAnswer={handleAnswer}
            showFeedback={mode !== AppMode.MOCK_TEST} // Show feedback in Review/Training/Mistakes
            userAnswer={answers[currentQ.id]}
          />
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center px-6 py-8">
        <button 
            onClick={() => setCurrentIndex(p => Math.max(0, p - 1))}
            disabled={currentIndex === 0}
            className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium disabled:opacity-50 hover:bg-gray-200 transition-colors"
        >
            Předchozí
        </button>

        {mode === AppMode.TRAINING || mode === AppMode.MISTAKES ? (
             <button 
             onClick={() => {
                 if (currentIndex === currentQuestions.length - 1) {
                     finishTest();
                 } else {
                    setCurrentIndex(p => p + 1);
                 }
             }}
             className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
         >
             {currentIndex === currentQuestions.length - 1 ? 'Ukončit trénink' : 'Další otázka'}
         </button>
        ) : (
            currentIndex === currentQuestions.length - 1 ? (
                <button 
                    onClick={mode === AppMode.REVIEW ? onExit : finishTest}
                    className="px-8 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                >
                    {mode === AppMode.REVIEW ? 'Zpět do menu' : 'Vyhodnotit test'}
                </button>
            ) : (
                <button 
                    onClick={() => setCurrentIndex(p => Math.min(currentQuestions.length - 1, p + 1))}
                    className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                    Další
                </button>
            )
        )}
      </div>
    </div>
  );
};
