
import React, { useState, useMemo, useEffect } from 'react';
import { QUESTIONS_SPS, QUESTIONS_STT } from './constants';
import { AppMode, TestResult, Question, Subject } from './types';
import { TestRunner } from './components/TestRunner';
import { BrowserQuestionItem } from './components/BrowserQuestionItem';
import { LoginScreen } from './components/LoginScreen';
import { Leaderboard } from './components/Leaderboard';
import { AppUser } from './users';
import { db, auth } from './firebaseConfig';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  const [subject, setSubject] = useState<Subject | null>(null);
  const [mode, setMode] = useState<AppMode>(AppMode.MENU);
  
  // Nový stav pro určení, zda se má tlačítko "Zpět" v žebříčku vrátit do hlavního menu (výběr předmětů)
  const [returnToMainMenu, setReturnToMainMenu] = useState(false);
  
  const [mistakesSPS, setMistakesSPS] = useState<number[]>([]);
  const [mistakesSTT, setMistakesSTT] = useState<number[]>([]);

  const [lastResult, setLastResult] = useState<TestResult | null>(null);
  const [browserSearch, setBrowserSearch] = useState("");
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);
  
  const [lastTestQuestions, setLastTestQuestions] = useState<Question[]>([]);
  const [lastUserAnswers, setLastUserAnswers] = useState<Record<number, number>>({});

  // 1. SLEDOVÁNÍ STAVU PŘIHLÁŠENÍ (Firebase Auth)
  useEffect(() => {
      if(!auth) {
          setLoadingUser(false);
          return;
      }

      const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
              setCurrentUser({
                  uid: user.uid,
                  email: user.email || '',
                  displayName: user.displayName || 'Student'
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

  // 2. NAČTENÍ DAT Z DATABÁZE (Firestore) A KONTROLA SINGLE SESSION
  useEffect(() => {
    if (currentUser && db) {
        const userDocRef = doc(db, "users", currentUser.uid);

        let localSessionId = localStorage.getItem('app_session_id');
        if (!localSessionId) {
             localSessionId = Date.now().toString() + "-" + Math.random().toString(36).substr(2, 9);
             localStorage.setItem('app_session_id', localSessionId);
             setDoc(userDocRef, { sessionId: localSessionId }, { merge: true });
        }
        
        const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setMistakesSPS(data.mistakesSPS || []);
                setMistakesSTT(data.mistakesSTT || []);
                
                // FIX: Automatická aktualizace jména v DB, pokud chybí nebo je jiné než v Auth
                if (currentUser.displayName && data.displayName !== currentUser.displayName) {
                    console.log("Aktualizuji jméno v databázi na:", currentUser.displayName);
                    setDoc(userDocRef, { displayName: currentUser.displayName }, { merge: true });
                }
                
                if (data.sessionId && data.sessionId !== localSessionId) {
                    alert("Byli jste odhlášeni, protože se k tomuto účtu přihlásil někdo jiný na jiném zařízení.");
                    handleLogout();
                }

            } else {
                setDoc(userDocRef, {
                    mistakesSPS: [],
                    mistakesSTT: [],
                    lastLogin: new Date().toISOString(),
                    displayName: currentUser.displayName,
                    sessionId: localSessionId
                }, { merge: true });
            }
        }, (error) => {
            console.error("Chyba při čtení dat:", error instanceof Error ? error.message : error);
        });

        return () => unsubDoc();
    } else {
        setMistakesSPS([]);
        setMistakesSTT([]);
    }
  }, [currentUser]);

  const currentQuestions = useMemo(() => {
    if (subject === 'SPS') return QUESTIONS_SPS;
    if (subject === 'STT') return QUESTIONS_STT;
    return [];
  }, [subject]);

  const currentMistakes = subject === 'SPS' ? mistakesSPS : mistakesSTT;
  
  const setMistakes = async (newMistakes: number[]) => {
      if (subject === 'SPS') setMistakesSPS(newMistakes);
      else if (subject === 'STT') setMistakesSTT(newMistakes);

      if (currentUser && db) {
          try {
              const userDocRef = doc(db, "users", currentUser.uid);
              const updateData = subject === 'SPS' 
                ? { mistakesSPS: newMistakes } 
                : { mistakesSTT: newMistakes };
              
              await setDoc(userDocRef, updateData, { merge: true });
          } catch (e) {
              console.error("Nepodařilo se uložit chyby:", e instanceof Error ? e.message : e);
          }
      }
  };

  const handleTestComplete = (result: TestResult) => {
    setLastResult(result);
    
    if (mode === AppMode.MOCK_TEST) {
        const uniqueMistakes = Array.from(new Set([...currentMistakes, ...result.mistakes]));
        setMistakes(uniqueMistakes);

        setLastTestQuestions(result.questionsUsed);
        setLastUserAnswers(result.userAnswers);
    } else if (mode === AppMode.MISTAKES) {
        setMistakes(result.mistakes);
    }

    setMode(AppMode.MENU);
  };

  const closeBrowser = () => {
      setMode(AppMode.MENU);
      setBrowserSearch("");
      setExpandedQuestionId(null);
  };

  const getMenuButtonClass = (color: string) => 
    `w-full p-6 rounded-xl shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl flex flex-col items-center justify-center gap-3 text-center border border-gray-100 ${color}`;

  const renderBrowser = () => {
      const filtered = currentQuestions.filter(q => 
          q.text.toLowerCase().includes(browserSearch.toLowerCase()) || 
          q.id.toString().includes(browserSearch)
      );

      return (
          <div className="max-w-4xl mx-auto w-full p-4">
               <div className="bg-white sticky top-0 z-10 shadow-sm border-b border-gray-200 px-6 py-4 mb-6 flex justify-between items-center rounded-b-xl gap-4">
                  <button onClick={closeBrowser} className="text-gray-500 hover:text-gray-900 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  </button>
                  <div className="flex-1 relative">
                      <input 
                          type="text" 
                          value={browserSearch}
                          onChange={(e) => setBrowserSearch(e.target.value)}
                          placeholder="Hledat otázku (text nebo číslo)..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                       <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
              </div>

              <div className="space-y-4">
                  {filtered.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                          Nebyly nalezeny žádné otázky odpovídající hledání.
                      </div>
                  ) : (
                      filtered.map(q => (
                          <BrowserQuestionItem 
                              key={q.id} 
                              question={q} 
                              isExpanded={expandedQuestionId === q.id}
                              onToggle={() => setExpandedQuestionId(expandedQuestionId === q.id ? null : q.id)}
                          />
                      ))
                  )}
              </div>
          </div>
      );
  };

  // ----------------------------------------------------------------------
  // RENDER LOGIC
  // ----------------------------------------------------------------------

  if (loadingUser) {
      return <div className="min-h-screen flex items-center justify-center text-gray-500">Načítám...</div>;
  }

  if (!currentUser) {
      return <LoginScreen onLogin={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans relative">
      <div className="fixed bottom-2 right-4 text-[10px] text-gray-300 pointer-events-none z-[100] select-none">
          User: {currentUser.displayName}
      </div>

      {lastResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="text-center">
                    <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${lastResult.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {lastResult.passed ? (
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{lastResult.passed ? "Prošel(a) jsi!" : "Neprošel(a) jsi"}</h2>
                    <p className="text-gray-500 mb-6">
                        Skóre: <span className="font-bold text-gray-800">{Math.round((lastResult.score / lastResult.total) * 100)}%</span> ({lastResult.score}/{lastResult.total})
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500 uppercase">Chyby</div>
                            <div className="text-xl font-bold text-red-500">{lastResult.mistakes.length}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500 uppercase">Čas</div>
                            <div className="text-xl font-bold text-blue-600">{Math.floor(lastResult.timeElapsed / 60)}m {lastResult.timeElapsed % 60}s</div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {lastTestQuestions.length > 0 && (
                            <button
                                onClick={() => {
                                    setLastResult(null);
                                    setMode(AppMode.REVIEW);
                                }}
                                className="w-full py-3 rounded-lg border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                Prohlédnout odpovědi
                            </button>
                        )}
                        <button 
                            onClick={() => setLastResult(null)}
                            className="w-full py-3 rounded-lg bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors"
                        >
                            Zavřít
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* HLAVNÍ MENU (VÝBĚR PŘEDMĚTU) */}
      {!subject && (
      <div className="max-w-6xl mx-auto min-h-screen flex flex-col p-6">
          {/* Header */}
          <div className="flex justify-end items-center gap-4 mb-12">
              <span className="text-gray-600 font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                  👤 {currentUser.displayName}
              </span>
              <button 
                onClick={handleLogout}
                className="text-sm text-red-500 hover:text-red-700 font-semibold border border-red-200 px-4 py-2 rounded-full hover:bg-red-50 transition-colors"
              >
                Odhlásit
              </button>
          </div>

          <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">Maturitní testy</h1>
              <p className="text-xl text-gray-500">Vyberte si předmět, který chcete procvičovat</p>
          </div>

          {/* Tlačítka pro výběr předmětu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto mb-16">
              <button 
                  onClick={() => {
                      setSubject('SPS');
                      setBrowserSearch(""); 
                  }}
                  className="group relative overflow-hidden bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1 text-center"
              >
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                  <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">SPS</h2>
                  <p className="text-gray-500">Stavba a provoz strojů</p>
              </button>

              <button 
                  onClick={() => {
                      setSubject('STT');
                      setBrowserSearch(""); 
                  }}
                  className="group relative overflow-hidden bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-orange-300 transition-all duration-300 transform hover:-translate-y-1 text-center"
              >
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 to-red-600"></div>
                  <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">STT</h2>
                  <p className="text-gray-500">Strojírenská technologie</p>
              </button>
          </div>

          {/* Sekce Síň slávy na hlavní stránce */}
          <div className="w-full max-w-5xl mx-auto">
              <h3 className="text-xl font-bold text-gray-400 uppercase tracking-widest text-center mb-6">Stats</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pro zobrazení celého žebříčku při kliku na "Zobrazit více" v kompaktu, použijeme setSubject a setMode.
                      Zároveň nastavíme příznak returnToMainMenu na true. */}
                  <div 
                    onClick={() => { 
                        setSubject('SPS'); 
                        setMode(AppMode.LEADERBOARD); 
                        setReturnToMainMenu(true);
                    }} 
                    className="cursor-pointer transition-transform hover:-translate-y-1"
                  >
                    <Leaderboard subject="SPS" variant="compact" />
                  </div>
                  <div 
                    onClick={() => { 
                        setSubject('STT'); 
                        setMode(AppMode.LEADERBOARD); 
                        setReturnToMainMenu(true);
                    }} 
                    className="cursor-pointer transition-transform hover:-translate-y-1"
                  >
                    <Leaderboard subject="STT" variant="compact" />
                  </div>
              </div>
          </div>

          <div className="mt-auto pt-16 text-center text-xs text-gray-400">
             © 2026 Matyáš Korec | Verze 2.2.0
          </div>
      </div>
      )}

      {/* ZOBRAZENÍ PLNÉHO ŽEBŘÍČKU (přepnutím na LEADERBOARD mód) */}
      {subject && mode === AppMode.LEADERBOARD && (
          <Leaderboard 
            subject={subject} 
            onBack={() => {
                // Pokud jsme přišli z hlavního menu (returnToMainMenu je true), vrátíme se tam zrušením předmětu.
                if (returnToMainMenu) {
                    setSubject(null);
                    setReturnToMainMenu(false);
                }
                setMode(AppMode.MENU);
            }}
            variant="full"
          />
      )}

      {/* MENU PŘEDMĚTU (SPS/STT) */}
      {subject && mode === AppMode.MENU && (
        <div className="max-w-6xl mx-auto min-h-screen flex flex-col p-4 md:p-8">
            {/* Horní lišta */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div 
                    onClick={() => {
                        setSubject(null);
                        setBrowserSearch("");
                    }}
                    className="group cursor-pointer inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-gray-200 text-gray-600 font-medium text-sm shadow-sm hover:shadow-md hover:border-blue-300 hover:text-blue-600 transition-all duration-300"
                >
                    <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Zpět na výběr předmětu
                </div>
                
                <div className="text-right">
                    <h1 className={`text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${subject === 'SPS' ? 'from-blue-700 to-indigo-600' : 'from-orange-600 to-red-600'}`}>
                        Maturitní test {subject}
                    </h1>
                    <div className="text-sm text-gray-500">Přihlášen: <span className="font-semibold">{currentUser.displayName}</span></div>
                </div>
            </div>

            {/* Grid Layout: Vlevo Menu, Vpravo Žebříček */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Levý sloupec: Akce (zabírá 2/3 na velkém monitoru) */}
                <div className="lg:col-span-2 space-y-4">
                    <button onClick={() => setMode(AppMode.MOCK_TEST)} className={getMenuButtonClass("bg-white hover:bg-blue-50 text-blue-700")}>
                        <div className="bg-blue-100 p-3 rounded-full">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                            <div className="font-bold text-lg">Test nanečisto</div>
                            <div className="text-sm text-gray-500 font-normal">40 otázek • 30 minut</div>
                        </div>
                    </button>

                    <button onClick={() => setMode(AppMode.TRAINING)} className={getMenuButtonClass("bg-white hover:bg-green-50 text-green-700")}>
                        <div className="bg-green-100 p-3 rounded-full">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        </div>
                        <div>
                            <div className="font-bold text-lg">Náhodný trénink</div>
                            <div className="text-sm text-gray-500 font-normal">Okamžitá kontrola</div>
                        </div>
                    </button>

                    <button onClick={() => setMode(AppMode.MISTAKES)} disabled={currentMistakes.length === 0} className={getMenuButtonClass(currentMistakes.length > 0 ? "bg-white hover:bg-orange-50 text-orange-700" : "bg-gray-100 text-gray-400 cursor-not-allowed")}>
                        <div className={`${currentMistakes.length > 0 ? 'bg-orange-100' : 'bg-gray-200'} p-3 rounded-full`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </div>
                        <div>
                            <div className="font-bold text-lg">Oprava chyb</div>
                            <div className="text-sm font-normal">{currentMistakes.length} chyb v paměti</div>
                        </div>
                    </button>

                    <button onClick={() => setMode(AppMode.BROWSER)} className={getMenuButtonClass("bg-white hover:bg-indigo-50 text-indigo-700")}>
                        <div className="bg-indigo-100 p-3 rounded-full">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <div>
                            <div className="font-bold text-lg">Prohlížet otázky</div>
                            <div className="text-sm text-gray-500 font-normal">Databáze otázek</div>
                        </div>
                    </button>
                    
                    {/* Tlačítko na plný žebříček pro mobilní zařízení (na desktopu je vpravo) */}
                    <button 
                        onClick={() => {
                            setMode(AppMode.LEADERBOARD);
                            setReturnToMainMenu(false); // Zde nechceme návrat na hlavní menu
                        }} 
                        className="lg:hidden w-full p-4 rounded-xl bg-yellow-50 text-yellow-700 border border-yellow-200 font-bold mt-4 shadow-sm hover:shadow-md transition-all"
                    >
                        🏆 Zobrazit kompletní žebříček
                    </button>
                </div>

                {/* Pravý sloupec: Žebříček (Widget) */}
                <div className="hidden lg:block lg:col-span-1">
                    <div className="sticky top-8 h-[calc(100vh-100px)]">
                        <Leaderboard 
                            subject={subject} 
                            variant="compact" 
                            onBack={() => {
                                setMode(AppMode.LEADERBOARD);
                                setReturnToMainMenu(false); // Zde nechceme návrat na hlavní menu
                            }} 
                        />
                    </div>
                </div>

            </div>
        </div>
      )}

      {subject && (mode === AppMode.MOCK_TEST || mode === AppMode.TRAINING || mode === AppMode.MISTAKES || mode === AppMode.REVIEW) && (
          <TestRunner 
            key={subject + mode} 
            mode={mode} 
            mistakeIds={mode === AppMode.MISTAKES ? currentMistakes : undefined}
            onComplete={handleTestComplete}
            onExit={() => setMode(AppMode.MENU)}
            initialQuestionsForMode={currentQuestions}
            initialQuestions={mode === AppMode.REVIEW ? lastTestQuestions : undefined}
            initialAnswers={mode === AppMode.REVIEW ? lastUserAnswers : undefined}
            subject={subject}
          />
      )}

      {subject && mode === AppMode.BROWSER && renderBrowser()}
    </div>
  );
};

export default App;
