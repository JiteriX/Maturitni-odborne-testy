
import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../types';
import { QuestionCard } from './QuestionCard';
import { AppMode } from '../types';
import { db, auth } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface Props {
  initialQuestions: Question[];
  onExit: () => void;
  currentUser: any;
}

export const SuddenDeathGame: React.FC<Props> = ({ initialQuestions, onExit, currentUser }) => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20); // Změna na 20s
  const [gameOver, setGameOver] = useState(false);
  const [usedQuestionIds, setUsedQuestionIds] = useState<Set<number>>(new Set());
  const [bestStreak, setBestStreak] = useState(0);
  
  // added comment above fix: Use 'any' instead of 'NodeJS.Timeout' to avoid namespace errors.
  const timerRef = useRef<any>(null);

  // Načtení nejlepšího streaku při startu
  useEffect(() => {
    const loadBestStreak = async () => {
      if (currentUser && db) {
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          setBestStreak(snap.data().statsSPS?.bestStreak || 0);
        }
      }
    };
    loadBestStreak();
    nextQuestion();
    return () => stopTimer();
  }, []);

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startTimer = () => {
    stopTimer();
    setTimeLeft(20); // Změna na 20s
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const nextQuestion = () => {
    // Vybrat náhodnou otázku, která ještě nebyla
    const available = initialQuestions.filter(q => !usedQuestionIds.has(q.id));
    
    if (available.length === 0) {
      // Došly otázky (teoreticky nemožné v tomto módu, ale pro jistotu)
      setUsedQuestionIds(new Set()); // Reset
      const random = initialQuestions[Math.floor(Math.random() * initialQuestions.length)];
      setCurrentQuestion(random);
    } else {
      const random = available[Math.floor(Math.random() * available.length)];
      setCurrentQuestion(random);
      setUsedQuestionIds(prev => new Set(prev).add(random.id));
    }
    
    startTimer();
  };

  const handleGameOver = async () => {
    stopTimer();
    setGameOver(true);
    
    // Uložení nového rekordu
    if (streak > bestStreak && currentUser) {
      setBestStreak(streak);
      try {
        const userRef = doc(db, "users", currentUser.uid);
        await setDoc(userRef, {
          statsSPS: {
            bestStreak: streak
          }
        }, { merge: true });
      } catch (e) {
        console.error("Failed to save streak", e);
      }
    }
  };

  const handleAnswer = (qId: number, idx: number, isCorrect: boolean) => {
    if (isCorrect) {
      setStreak(s => s + 1);
      nextQuestion();
    } else {
      handleGameOver();
    }
  };

  if (gameOver) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-2xl border-4 border-red-100 text-center animate-in zoom-in duration-300">
        <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center text-5xl">
          ☠️
        </div>
        <h2 className="text-4xl font-black text-gray-900 mb-2">KONEC HRY</h2>
        <p className="text-gray-500 mb-8 font-medium">Jedna chyba a jsi venku...</p>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <p className="text-xs uppercase text-gray-400 font-bold mb-1">Dnešní Streak</p>
            <p className="text-3xl font-black text-blue-600">{streak}</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
            <p className="text-xs uppercase text-yellow-600 font-bold mb-1">Tvůj Rekord</p>
            <p className="text-3xl font-black text-yellow-700">{Math.max(streak, bestStreak)}</p>
          </div>
        </div>

        <button 
          onClick={() => {
            setGameOver(false);
            setStreak(0);
            setUsedQuestionIds(new Set());
            nextQuestion();
          }}
          className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 mb-3"
        >
          Zkusit znovu
        </button>
        <button 
          onClick={onExit}
          className="w-full py-3 text-gray-500 font-bold hover:text-gray-800 transition-colors"
        >
          Zpět do menu
        </button>
      </div>
    );
  }

  if (!currentQuestion) return <div className="text-center mt-20">Načítám arénu...</div>;

  return (
    <div className="max-w-4xl mx-auto w-full px-4 pt-6">
      {/* HUD */}
      <div className="flex items-center justify-between mb-6 bg-gray-900 text-white p-4 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-lg border-2 border-red-400">
            {streak}
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Streak</span>
            <span className="font-bold text-red-400">NÁHLÁ SMRT</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <span className="text-xs text-gray-400 font-mono">ČAS:</span>
           <span className={`text-2xl font-mono font-black ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
             {timeLeft}s
           </span>
        </div>
      </div>

      {/* Progress bar pro čas (upraveno na 20s) */}
      <div className="w-full h-2 bg-gray-200 rounded-full mb-8 overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 7 ? 'bg-red-600' : 'bg-blue-600'}`}
          style={{ width: `${(timeLeft / 20) * 100}%` }}
        ></div>
      </div>

      <QuestionCard 
        question={currentQuestion}
        mode={AppMode.MOCK_TEST} // Používáme mock test mód pro vzhled (bez okamžitého vyhodnocení v kartě)
        onAnswer={handleAnswer}
        showFeedback={false}
      />
      
      <div className="text-center mt-8">
        <button onClick={onExit} className="text-gray-400 hover:text-red-500 text-sm font-medium transition-colors">
          Vzdát to a odejít
        </button>
      </div>
    </div>
  );
};
