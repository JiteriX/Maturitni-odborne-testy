import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebaseConfig';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { BattleRoom, Question, AppMode, BattlePlayerData } from '../types';
import { AppUser } from '../users';
import { QUESTIONS_SPS } from '../constants';
import { QuestionCard } from './QuestionCard';

interface Props {
  room: BattleRoom;
  currentUser: AppUser;
  onExit: () => void;
  stats: any;
}

export const BattleArena: React.FC<Props> = ({ room, currentUser, onExit, stats }) => {
  const [battleData, setBattleData] = useState<BattleRoom>(room);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [finished, setFinished] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  // added comment above fix: Use 'any' instead of 'NodeJS.Timeout' to avoid namespace issues in browser environment.
  const timerRef = useRef<any>(null);

  // Inicializace otázek při startu
  useEffect(() => {
    const qs = room.questions.map(id => QUESTIONS_SPS.find(q => q.id === id)!).filter(Boolean);
    setCurrentQuestions(qs);
  }, [room.questions]);

  // Sledování změn v bitvě (postup soupeře, stav hry)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "battles", room.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as BattleRoom;
        setBattleData(data);
        
        // added comment above fix: Explicitly cast players to BattlePlayerData array to avoid 'unknown' type errors.
        const players = Object.values(data.players) as BattlePlayerData[];
        // Pokud jsou oba hotoví, nebo je stav v DB 'FINISHED', ukončíme to lokálně
        if ((players.length === 2 && players.every(p => p.finished)) || data.status === 'FINISHED') {
            setFinished(true);
            if (timerRef.current) clearInterval(timerRef.current);
        }
      }
    });
    return () => {
        unsub();
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [room.id]);

  // Logika časovače (30 minut)
  useEffect(() => {
    if (!battleData.expiresAt || finished) return;

    const updateTimer = () => {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((battleData.expiresAt! - now) / 1000));
        setTimeLeft(diff);

        if (diff <= 0) {
            handleTimeOut();
        }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [battleData.expiresAt, finished]);

  const handleTimeOut = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Pokud čas vypršel a já ještě nejsem hotový, označím se za hotového
    try {
        await updateDoc(doc(db, "battles", room.id), {
            [`players.${currentUser.uid}.finished`]: true,
            status: 'FINISHED'
        });
    } catch (e) {
        console.error(e);
    }
    setFinished(true);
  };

  const handleAnswer = async (qId: number, idx: number, isCorrect: boolean) => {
    const newScore = isCorrect ? myScore + 1 : myScore;
    setMyScore(newScore);
    
    const isLast = currentIndex === currentQuestions.length - 1;
    const newProgress = currentIndex + 1;

    // Odeslání postupu do Firebase
    try {
        await updateDoc(doc(db, "battles", room.id), {
            [`players.${currentUser.uid}.progress`]: newProgress,
            [`players.${currentUser.uid}.score`]: newScore,
            [`players.${currentUser.uid}.finished`]: isLast
        });
    } catch (e) {
        console.error("Chyba při ukládání odpovědi:", e);
    }

    if (!isLast) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSurrender = () => {
    // 1. Zeptat se, jestli to vážně chce (systémové okno)
    const confirmExit = window.confirm("Opravdu se chceš vzdát a odejít z bitvy? Tvůj aktuální výsledek bude uložen jako konečný.");
    
    if (confirmExit) {
        // 2. Okamžitě odejít v UI (aby uživatel nečekal)
        onExit();

        // 3. Na pozadí aktualizovat databázi, aby soupeř viděl, že jsi skončil
        updateDoc(doc(db, "battles", room.id), {
            [`players.${currentUser.uid}.finished`]: true
        }).catch(err => console.error("Background update failed:", err));
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // added comment above fix: Explicitly cast players values to BattlePlayerData to resolve 'unknown' property access errors.
  const playersList = Object.values(battleData.players) as BattlePlayerData[];
  const opponent = playersList.find(p => p.uid !== currentUser.uid);
  const me = battleData.players[currentUser.uid] as BattlePlayerData | undefined;

  // Ochrana před neexistujícími daty o hráči při načítání
  if (!me) return <div className="text-center mt-20 text-gray-500 font-medium">Načítám data bitvy...</div>;

  // Obrazovka s výsledky a statistikami po skončení
  if (finished) {
    const myFinalScore = me.score;
    const oppFinalScore = opponent?.score || 0;
    const winner = myFinalScore > oppFinalScore ? 'win' : myFinalScore < oppFinalScore ? 'loss' : 'draw';
    
    return (
        <div className="max-w-xl mx-auto mt-20 text-center p-8 bg-white rounded-3xl shadow-2xl border border-gray-100 animate-in zoom-in duration-300">
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl ${winner === 'win' ? 'bg-yellow-100' : winner === 'loss' ? 'bg-red-100' : 'bg-gray-100'}`}>
                {winner === 'win' ? '🏆' : winner === 'loss' ? '💀' : '🤝'}
            </div>
            <h2 className="text-4xl font-black mb-2">
                {winner === 'win' ? 'Vítězství!' : winner === 'loss' ? 'Prohra' : 'Remíza'}
            </h2>
            <p className="text-gray-500 mb-8 uppercase tracking-widest text-xs font-bold">Bitva SPS dokončena</p>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
                <div className={`p-6 rounded-3xl border-2 ${winner === 'win' ? 'border-yellow-200 bg-yellow-50/30' : 'border-blue-100 bg-blue-50/30'}`}>
                    <p className="text-xs text-blue-600 uppercase font-black mb-2">Ty</p>
                    <p className="text-4xl font-black text-blue-900">{myFinalScore}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{Math.round((myFinalScore / (currentQuestions.length || 1)) * 100)}% úspěšnost</p>
                </div>
                <div className={`p-6 rounded-3xl border-2 ${winner === 'loss' ? 'border-yellow-200 bg-yellow-50/30' : 'border-red-100 bg-red-50/30'}`}>
                    <p className="text-xs text-red-600 uppercase font-black mb-2">{opponent?.displayName || 'Soupeř'}</p>
                    <p className="text-4xl font-black text-red-900">{oppFinalScore}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{Math.round((oppFinalScore / (currentQuestions.length || 20)) * 100)}% úspěšnost</p>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl mb-8 flex justify-around text-sm text-gray-600 font-medium">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase">Otázek</span>
                    <span>{currentQuestions.length}</span>
                </div>
                <div className="w-px bg-gray-200"></div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase">Mód</span>
                    <span>1v1 Bitva</span>
                </div>
            </div>

            <button type="button" onClick={onExit} className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-xl active:scale-[0.98]">
                Zpět do hlavního menu
            </button>
        </div>
    );
  }

  const currentQ = currentQuestions[currentIndex];

  return (
    <div className="max-w-4xl mx-auto w-full px-4 pt-6">
      {/* Horní lišta s časovačem a stavem soupeře */}
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-8 sticky top-4 z-20 border border-gray-100 flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Live Souboj</span>
            </div>
            {timeLeft !== null && (
                <div className={`px-4 py-1 rounded-full font-mono text-lg font-bold flex items-center gap-2 ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-700'}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {formatTime(timeLeft)}
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Můj progres */}
            <div>
                <div className="flex justify-between text-[10px] font-black mb-1">
                    <span className="text-blue-600">TY • {me.score} b.</span>
                    <span className="text-gray-400">{currentIndex}/{currentQuestions.length}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-500" style={{width: `${(currentIndex / (currentQuestions.length || 1)) * 100}%`}}></div>
                </div>
            </div>
            {/* Progres soupeře */}
            <div>
                <div className="flex justify-between text-[10px] font-black mb-1">
                    <span className="text-red-600">{opponent?.displayName?.toUpperCase() || 'ČEKÁM...'} • {(opponent?.score || 0)} b.</span>
                    <span className="text-gray-400">{opponent?.progress || 0}/{currentQuestions.length}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 transition-all duration-500" style={{width: `${((opponent?.progress || 0) / (currentQuestions.length || 1)) * 100}%`}}></div>
                </div>
            </div>
        </div>
      </div>

      {currentQ && !me.finished ? (
          <div className="flex flex-col items-center">
            <QuestionCard 
                key={currentIndex}
                question={currentQ}
                mode={AppMode.MOCK_TEST}
                onAnswer={handleAnswer}
                showFeedback={false}
            />
            
            {/* Tlačítko Vzdát se */}
            <button 
                type="button"
                onClick={handleSurrender}
                className="mt-6 px-8 py-3 text-red-600 hover:text-white font-bold border-2 border-red-100 hover:border-red-600 hover:bg-red-600 rounded-2xl transition-all shadow-sm flex items-center gap-2 group"
            >
                <svg className="w-5 h-5 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Vzdát se a odejít
            </button>
          </div>
      ) : (
          <div className="text-center p-12 bg-white rounded-3xl shadow-sm border border-gray-100 animate-in fade-in duration-700">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-25"></div>
                <div className="relative w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-4xl">🏁</div>
              </div>
              <h3 className="text-2xl font-bold mb-2">Máš dobojováno!</h3>
              <p className="text-gray-500 mb-8 max-w-xs mx-auto">Tvé odpovědi jsou uloženy. Čekáme, až soupeř dokončí test nebo až vyprší časový limit.</p>
              
              <div className="flex flex-col gap-3">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Tvůj výsledek</p>
                    <p className="text-2xl font-black text-gray-800">{me.score} / {currentQuestions.length}</p>
                </div>
                <button type="button" onClick={onExit} className="mt-4 text-sm text-blue-600 font-bold hover:underline">
                    Zrušit čekání a jít do menu
                </button>
              </div>
          </div>
      )}
    </div>
  );
};