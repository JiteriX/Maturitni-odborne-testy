
import React, { useState, useMemo, useEffect } from 'react';
import { QUESTIONS_SPS, QUESTIONS_STT, QUESTIONS_SPS_FILTERED, CATEGORIES_SPS, CATEGORIES_STT, getCategoryForQuestion } from './constants';
import { AppMode, TestResult, Question, Subject, CategoryResult } from './types';
import { TestRunner } from './components/TestRunner';
import { BrowserQuestionItem } from './components/BrowserQuestionItem';
import { LoginScreen } from './components/LoginScreen';
import { Leaderboard } from './components/Leaderboard';
import { SPSInfoModal } from './components/SPSInfoModal';
import { STTInfoModal } from './components/STTInfoModal';
import { ReportModal } from './components/ReportModal';
import { BattleManager } from './components/BattleManager';
import { SuddenDeathGame } from './components/SuddenDeathGame';
import { CategorySelector } from './components/CategorySelector';
import { AppUser } from './users';
import { db, auth } from './firebaseConfig';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import * as firebaseAuth from 'firebase/auth';

// Workaround for potential type definition mismatches
const { onAuthStateChanged, signOut } = firebaseAuth as any;

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  const [subject, setSubject] = useState<Subject | null>(null);
  const [mode, setMode] = useState<AppMode>(AppMode.MENU);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  const [showSPSPopup, setShowSPSPopup] = useState(false);
  const [showSTTPopup, setShowSTTPopup] = useState(false);
  const [reportingQuestionId, setReportingQuestionId] = useState<number | null>(null);
  
  const [mistakesSPS, setMistakesSPS] = useState<number[]>([]);
  const [mistakesSTT, setMistakesSTT] = useState<number[]>([]);
  const [statsSPS, setStatsSPS] = useState<any>(null);

  const [lastResult, setLastResult] = useState<TestResult | null>(null);
  const [browserSearch, setBrowserSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [lastTestQuestions, setLastTestQuestions] = useState<Question[]>([]);
  const [lastUserAnswers, setLastUserAnswers] = useState<Record<number, number>>({});

  useEffect(() => {
      if(!auth) {
          setLoadingUser(false);
          return;
      }
      const unsubscribe = onAuthStateChanged(auth, async (user: any) => {
          if (user) {
              let displayName = user.displayName;

              // Pokud jméno chybí v Auth objektu, zkusíme ho načíst z Firestore
              if (!displayName && db) {
                  try {
                      const userDocRef = doc(db, "users", user.uid);
                      const userSnap = await getDoc(userDocRef);
                      if (userSnap.exists() && userSnap.data().displayName) {
                          displayName = userSnap.data().displayName;
                      }
                  } catch (e) {
                      console.error("Error fetching user profile:", e);
                  }
              }

              // Pokud stále nemáme jméno, zkusíme ho vygenerovat z emailu
              if (!displayName && user.email) {
                  displayName = user.email.split('@')[0];
              }

              setCurrentUser({ 
                  uid: user.uid, 
                  email: user.email || '', 
                  displayName: displayName || 'Student' 
              });
          } else {
              setCurrentUser(null);
          }
          setLoadingUser(false);
      });
      return () => unsubscribe();
  }, []);

  const handleLogout = () => {
      localStorage.removeItem('app_session_id');
      if(auth) signOut(auth);
      setSubject(null);
      setMode(AppMode.MENU);
      setLastResult(null);
  };

  const handleSPSSelection = () => {
    if (localStorage.getItem('hideSPSInfo') === 'true') {
      setSubject('SPS');
      setBrowserSearch("");
    } else {
      setShowSPSPopup(true);
    }
  };

  const handleSTTSelection = () => {
    if (localStorage.getItem('hideSTTInfo') === 'true') {
      setSubject('STT');
      setBrowserSearch("");
    } else {
      setShowSTTPopup(true);
    }
  };

  const getMenuButtonClass = (extra: string) => 
    `flex items-center gap-6 p-6 rounded-[2rem] border-2 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl group w-full text-left ${extra}`;

  useEffect(() => {
    if (currentUser && db) {
        const userDocRef = doc(db, "users", currentUser.uid);
        // Ukládáme, ale díky logice v onAuthStateChanged už nepřepisujeme existující jméno na "Student"
        setDoc(userDocRef, { displayName: currentUser.displayName, email: currentUser.email }, { merge: true });
        const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setMistakesSPS(data.mistakesSPS || []);
                setMistakesSTT(data.mistakesSTT || []);
                setStatsSPS(data.statsSPS || null);
            }
        });
        return () => unsubDoc();
    }
  }, [currentUser]);

  const currentQuestions = useMemo(() => {
    const isCompetitive = mode === AppMode.MOCK_TEST || mode === AppMode.BATTLE || mode === AppMode.SUDDEN_DEATH;
    let baseList = [];
    if (subject === 'SPS') {
        baseList = isCompetitive ? QUESTIONS_SPS_FILTERED : QUESTIONS_SPS;
    } else if (subject === 'STT') {
        baseList = QUESTIONS_STT;
    } else {
        return [];
    }

    if (mode === AppMode.TRAINING && selectedCategoryId) {
        const cat = (subject === 'SPS' ? CATEGORIES_SPS : CATEGORIES_STT).find(c => c.id === selectedCategoryId);
        if (cat) {
            return baseList.filter(q => cat.questionRanges.some(r => q.id >= r[0] && q.id <= r[1]));
        }
    }

    return baseList;
  }, [subject, mode, selectedCategoryId]);

  const currentMistakes = subject === 'SPS' ? mistakesSPS : mistakesSTT;
  
  const setMistakes = async (newMistakes: number[]) => {
      if (subject === 'SPS') setMistakesSPS(newMistakes);
      else if (subject === 'STT') setMistakesSTT(newMistakes);
      if (currentUser && db) {
          const userDocRef = doc(db, "users", currentUser.uid);
          const updateData = subject === 'SPS' ? { mistakesSPS: newMistakes } : { mistakesSTT: newMistakes };
          await setDoc(userDocRef, updateData, { merge: true });
      }
  };

  const handleTestComplete = (result: TestResult) => {
    if (subject) {
        const categoryMap: Record<string, { correct: number, total: number, name: string }> = {};
        result.questionsUsed.forEach(q => {
            const cat = getCategoryForQuestion(q.id, subject);
            if (cat) {
                if (!categoryMap[cat.id]) categoryMap[cat.id] = { correct: 0, total: 0, name: cat.name };
                categoryMap[cat.id].total++;
                const isCorrect = result.userAnswers[q.id] === q.correctAnswerIndex || result.userAnswers[q.id] === q.acceptableAnswerIndex;
                if (isCorrect) categoryMap[cat.id].correct++;
            }
        });
        result.categoryResults = Object.entries(categoryMap).map(([id, data]) => ({
            categoryId: id,
            categoryName: data.name,
            correct: data.correct,
            total: data.total
        }));
    }

    setLastResult(result);
    // Uložíme data posledního testu vždy, aby šlo kliknout na "Zkontrolovat chyby" u jakéhokoliv testu
    setLastTestQuestions(result.questionsUsed);
    setLastUserAnswers(result.userAnswers);

    if (mode === AppMode.MOCK_TEST || mode === AppMode.TRAINING) {
        // V režimu Test nanečisto I V REŽIMU TRÉNINKU přidáváme nové chyby k těm stávajícím
        setMistakes(Array.from(new Set([...currentMistakes, ...result.mistakes])));
    } else if (mode === AppMode.MISTAKES) {
        // V režimu opravy chyb nahradíme seznam chyb pouze těmi, které uživatel znovu spletl
        // (tzn. ty co měl dobře, se ze seznamu odstraní)
        setMistakes(result.mistakes);
    }
    
    // Neměníme hned mode na MENU, uživatel to udělá tlačítkem "HOTOVO" v modálním okně
  };

  if (loadingUser) return <div className="min-h-screen flex items-center justify-center text-gray-500">Načítám...</div>;
  if (!currentUser) return <LoginScreen onLogin={(user) => setCurrentUser(user)} />;

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans relative">
      <div className="fixed bottom-2 right-4 text-[10px] text-gray-300 pointer-events-none z-[100] select-none">User: {currentUser.displayName}</div>

      {reportingQuestionId !== null && subject && (
        <ReportModal questionId={reportingQuestionId} subject={subject} userName={currentUser.displayName} onClose={() => setReportingQuestionId(null)} />
      )}

      {showSPSPopup && (
        <SPSInfoModal onConfirm={() => { setShowSPSPopup(false); setSubject('SPS'); setBrowserSearch(""); }} />
      )}

      {showSTTPopup && (
        <STTInfoModal onConfirm={() => { setShowSTTPopup(false); setSubject('STT'); setBrowserSearch(""); }} />
      )}

      {lastResult && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[150] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
                <div className="text-center mb-8">
                    <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${lastResult.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {lastResult.passed ? <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>}
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-1">{lastResult.passed ? "PROŠEL JSI" : "NEPROŠEL JSI"}</h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Celkový výsledek testu</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                        <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Úspěšnost</p>
                        <p className={`text-3xl font-black ${lastResult.passed ? 'text-green-600' : 'text-red-600'}`}>{Math.round((lastResult.score / lastResult.total) * 100)}%</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                        <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Body</p>
                        <p className="text-3xl font-black text-gray-800">{lastResult.score} / {lastResult.total}</p>
                    </div>
                </div>

                {lastResult.categoryResults && lastResult.categoryResults.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 px-2">Analýza témat:</h3>
                        <div className="space-y-2">
                            {lastResult.categoryResults.map(cat => {
                                const percent = Math.round((cat.correct / cat.total) * 100);
                                return (
                                    <div key={cat.categoryId} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-bold text-gray-700 truncate mr-2">{cat.categoryName}</span>
                                            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${percent >= 44 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{percent}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full transition-all duration-1000 ${percent >= 44 ? 'bg-green-500' : 'bg-red-500'}`} style={{width: `${percent}%`}}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <button onClick={() => {
                        setLastResult(null);
                        // Pokud jsme byli v tréninku, vracíme se do výběru kategorií, jinak do menu
                        if (mode === AppMode.TRAINING) {
                            setMode(AppMode.CATEGORY_SELECT);
                        } else {
                            setMode(AppMode.MENU);
                        }
                    }} className="w-full py-4 rounded-2xl bg-gray-900 text-white font-black hover:bg-black transition-all shadow-xl">HOTOVO</button>
                    
                    <button onClick={() => { setLastResult(null); setMode(AppMode.REVIEW); }} className="w-full py-4 rounded-2xl bg-blue-50 text-blue-700 font-black hover:bg-blue-100 transition-all">ZKONTROLOVAT CHYBY</button>
                </div>
            </div>
        </div>
      )}

      {!subject && (
      <div className="max-w-7xl mx-auto min-h-screen flex flex-col p-6">
          <div className="flex justify-end items-center gap-4 mb-12">
              <span className="text-gray-600 font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">👤 {currentUser.displayName}</span>
              <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 font-semibold border border-red-200 px-4 py-2 rounded-full hover:bg-red-50 transition-colors">Odhlásit</button>
          </div>
          <div className="text-center mb-12"><h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">Maturitní testy</h1></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto mb-16">
              <button onClick={handleSPSSelection} className="group relative overflow-hidden bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1 text-center">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                  <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300"><svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">SPS</h2><p className="text-gray-500">Stavba a provoz strojů</p>
              </button>
              <button onClick={handleSTTSelection} className="group relative overflow-hidden bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-orange-300 transition-all duration-300 transform hover:-translate-y-1 text-center">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 to-red-600"></div>
                  <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300"><svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg></div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">STT</h2><p className="text-gray-500">Strojírenská technologie</p><p className="text-red-500 font-bold mt-4">Není hotové</p>
              </button>
          </div>
          <div className="w-full max-w-5xl mx-auto mb-10"><h2 className="text-center text-2xl font-bold text-slate-400 uppercase tracking-widest mb-10">Statistiky</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-12"><div><Leaderboard subject="SPS" variant="compact" currentUserId={currentUser.uid} /></div><div><Leaderboard subject="STT" variant="compact" currentUserId={currentUser.uid} /></div></div></div>
          <footer className="mt-auto py-12 text-center text-[#94a3b8] text-base font-normal select-none">© 2026 Matyáš Korec | Verze 2.4.3</footer>
      </div>
      )}

      {subject && mode === AppMode.CATEGORY_SELECT && (
        <CategorySelector 
            subject={subject} 
            allQuestions={subject === 'SPS' ? QUESTIONS_SPS : QUESTIONS_STT}
            currentMistakes={currentMistakes}
            onBack={() => setMode(AppMode.MENU)} 
            onSelect={(catId) => { setSelectedCategoryId(catId); setMode(AppMode.TRAINING); }} 
        />
      )}

      {subject && mode === AppMode.BATTLE_HUB && (
        <div className="max-w-4xl mx-auto min-h-screen flex flex-col p-4 md:p-8 animate-in zoom-in duration-200">
           <div className="flex justify-between items-center mb-8">
              <button onClick={() => setMode(AppMode.MENU)} className="text-gray-500 hover:text-gray-800 font-medium flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> Zpět do menu
              </button>
              <h1 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter">ARÉNA</h1>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <button onClick={() => setMode(AppMode.BATTLE)} className="group relative overflow-hidden bg-white rounded-3xl p-8 shadow-xl border-2 border-transparent hover:border-blue-500 transition-all duration-300 text-left hover:shadow-2xl hover:-translate-y-1">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><span className="text-9xl">⚔️</span></div>
                 <div className="relative z-10"><div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-3xl shadow-sm group-hover:scale-110 transition-transform">⚔️</div><h2 className="text-2xl font-black text-gray-900 mb-2">1v1 Duel</h2><p className="text-gray-500 mb-4 font-medium">1v1 souboj v reálném čase.</p></div>
              </button>
              <button onClick={() => setMode(AppMode.SUDDEN_DEATH)} className="group relative overflow-hidden bg-gray-900 rounded-3xl p-8 shadow-xl border-2 border-transparent hover:border-red-500 transition-all duration-300 text-left hover:shadow-2xl hover:-translate-y-1">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><span className="text-9xl">☠️</span></div>
                 <div className="relative z-10"><div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-6 text-3xl shadow-lg shadow-red-900/50 group-hover:scale-110 transition-transform">☠️</div><h2 className="text-2xl font-black text-white mb-2">Náhlá smrt</h2><p className="text-gray-400 mb-4 font-medium">Jedna chyba = konec, hraje se o největší streak, omezeno časem.</p></div>
              </button>
           </div>
        </div>
      )}

      {subject && mode === AppMode.MENU && (
        <div className="max-w-6xl mx-auto min-h-screen flex flex-col p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div onClick={() => {setSubject(null); setBrowserSearch("");}} className="group cursor-pointer inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-gray-200 text-gray-600 font-medium text-sm shadow-sm hover:shadow-md hover:border-blue-300 hover:text-blue-600 transition-all duration-300">
                    <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> Zpět na výběr předmětu
                </div>
                <div className="text-right"><h1 className={`text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${subject === 'SPS' ? 'from-blue-700 to-indigo-600' : 'from-orange-600 to-red-600'}`}>Maturitní test {subject}</h1></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    {subject === 'SPS' && (
                        <button onClick={() => setMode(AppMode.BATTLE_HUB)} className={getMenuButtonClass("bg-gradient-to-br from-gray-800 to-gray-900 text-white border-none")}>
                            <div className="bg-white/10 p-3 rounded-full border border-white/20"><span className="text-2xl">🏆</span></div>
                            <div><div className="font-bold text-lg text-white uppercase tracking-wider">ARÉNA</div><div className="text-gray-400 text-sm font-normal">1v1 Duel & Náhlá smrt</div></div>
                        </button>
                    )}
                    <button onClick={() => setMode(AppMode.MOCK_TEST)} className={getMenuButtonClass("bg-white hover:bg-blue-50 text-blue-700")}>
                        <div className="bg-blue-100 p-3 rounded-full"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                        <div><div className="font-bold text-lg">Test nanečisto</div><div className="text-sm text-gray-500 font-normal">40 otázek • 30 minut</div></div>
                    </button>
                    <button onClick={() => setMode(AppMode.CATEGORY_SELECT)} className={getMenuButtonClass("bg-white hover:bg-green-50 text-green-700")}>
                        <div className="bg-green-100 p-3 rounded-full"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg></div>
                        <div><div className="font-bold text-lg">Trénink otázek a témat</div><div className="text-sm text-gray-500 font-normal">Okamžitá kontrola</div></div>
                    </button>
                </div>
                <div className="space-y-4">
                    <button onClick={() => setMode(AppMode.MISTAKES)} disabled={mistakesSPS.length === 0 && mistakesSTT.length === 0} className={getMenuButtonClass(currentMistakes.length > 0 ? "bg-white hover:bg-orange-50 text-orange-700" : "bg-gray-100 text-gray-400 cursor-not-allowed")}>
                        <div className={`${currentMistakes.length > 0 ? 'bg-orange-100' : 'bg-gray-200'} p-3 rounded-full`}><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></div>
                        <div><div className="font-bold text-lg">Oprava chyb</div><div className="text-sm font-normal">{currentMistakes.length} chyb v paměti</div></div>
                    </button>
                    <button onClick={() => { setMode(AppMode.BROWSER); setBrowserSearch(""); setExpandedIds(new Set()); }} className={getMenuButtonClass("bg-white hover:bg-indigo-50 text-indigo-700")}>
                        <div className="bg-indigo-100 p-3 rounded-full"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
                        <div><div className="font-bold text-lg">Prohlížet otázky</div><div className="text-sm text-gray-500 font-normal">Databáze {subject === 'SPS' ? QUESTIONS_SPS.length : QUESTIONS_STT.length} otázek</div></div>
                    </button>
                </div>
            </div>
        </div>
      )}

      {subject && mode === AppMode.BROWSER && (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="flex items-center gap-4 mb-8 sticky top-0 bg-slate-50 py-4 z-20">
                <button onClick={() => { setMode(AppMode.MENU); setBrowserSearch(""); setExpandedIds(new Set()); }} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white rounded-full transition-all shadow-none hover:shadow-sm" title="Zpět do menu"><svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
                <div className="relative flex-1"><input type="text" placeholder="Hledat otázku..." value={browserSearch} onChange={(e) => setBrowserSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm transition-all" /><svg className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
                <button onClick={expandedIds.size > 0 ? () => setExpandedIds(new Set()) : () => setExpandedIds(new Set((subject === 'SPS' ? QUESTIONS_SPS : QUESTIONS_STT).map(q => q.id)))} className="flex items-center gap-2 px-5 py-3 bg-[#f0f7ff] text-[#2563eb] rounded-xl font-bold hover:bg-blue-100 transition-colors shadow-sm whitespace-nowrap">{expandedIds.size > 0 ? "Zabalit vše" : "Rozbalit vše"}</button>
            </div>
            <div className="space-y-4">
                {(mode === AppMode.BROWSER ? (browserSearch.trim() ? (subject === 'SPS' ? QUESTIONS_SPS : QUESTIONS_STT).filter(q => q.id.toString() === browserSearch || q.text.toLowerCase().includes(browserSearch.toLowerCase())) : (subject === 'SPS' ? QUESTIONS_SPS : QUESTIONS_STT)) : []).map(q => (
                    <BrowserQuestionItem key={q.id} question={q} isExpanded={expandedIds.has(q.id)} onToggle={() => setExpandedIds(prev => { const next = new Set(prev); if (next.has(q.id)) next.delete(q.id); else next.add(q.id); return next; })} onReportRequest={(id) => setReportingQuestionId(id)} />
                ))}
            </div>
        </div>
      )}

      {subject && mode === AppMode.BATTLE && currentUser && <BattleManager currentUser={currentUser} subject={subject} stats={statsSPS} onExit={() => setMode(AppMode.MENU)} />}
      {subject && mode === AppMode.SUDDEN_DEATH && currentUser && <SuddenDeathGame initialQuestions={currentQuestions} currentUser={currentUser} onExit={() => setMode(AppMode.MENU)} />}
      {subject && (mode === AppMode.MOCK_TEST || mode === AppMode.TRAINING || mode === AppMode.MISTAKES || mode === AppMode.REVIEW) && (
        <TestRunner 
            key={subject + mode + selectedCategoryId} 
            mode={mode} 
            mistakeIds={mode === AppMode.MISTAKES ? currentMistakes : undefined} 
            onComplete={handleTestComplete} 
            onExit={() => {
                if (mode === AppMode.TRAINING) {
                    setMode(AppMode.CATEGORY_SELECT);
                } else {
                    setMode(AppMode.MENU);
                }
            }} 
            onReportRequest={(id) => setReportingQuestionId(id)} 
            initialQuestionsForMode={currentQuestions} 
            initialQuestions={mode === AppMode.REVIEW ? lastTestQuestions : undefined} 
            initialAnswers={mode === AppMode.REVIEW ? lastUserAnswers : undefined} 
            subject={subject} 
        />
      )}
    </div>
  );
};

export default App;
