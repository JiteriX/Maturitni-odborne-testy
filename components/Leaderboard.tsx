
import React, { useEffect, useState } from 'react';
import { Subject, LeaderboardUser } from '../types';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

interface Props {
  subject: Subject;
  onBack?: () => void;
  variant?: 'full' | 'compact'; // 'full' = celá stránka, 'compact' = widget do menu
}

type SortType = 'SCORE' | 'GRIND';

export const Leaderboard: React.FC<Props> = ({ subject, onBack, variant = 'full' }) => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState<SortType>('SCORE');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!db) return;
        const querySnapshot = await getDocs(collection(db, "users"));
        const loadedUsers: LeaderboardUser[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (subject === 'SPS' && data.statsSPS) {
            loadedUsers.push({ displayName: data.displayName || 'Neznámý', statsSPS: data.statsSPS });
          } else if (subject === 'STT' && data.statsSTT) {
            loadedUsers.push({ displayName: data.displayName || 'Neznámý', statsSTT: data.statsSTT });
          }
        });
        
        setUsers(loadedUsers);
      } catch (error) {
        console.error("Chyba při načítání žebříčku:", error instanceof Error ? error.message : error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [subject]);

  const getStats = (user: LeaderboardUser) => {
    return subject === 'SPS' ? user.statsSPS : user.statsSTT;
  };

  const sortedUsers = [...users].sort((a, b) => {
    const statsA = getStats(a);
    const statsB = getStats(b);

    if (!statsA || !statsB) return 0;

    if (sortType === 'SCORE') {
      // Primárně podle nejlepšího skóre, sekundárně podle průměru
      if (statsB.bestScorePercent !== statsA.bestScorePercent) {
        return statsB.bestScorePercent - statsA.bestScorePercent;
      }
      const avgA = statsA.totalPoints / (statsA.totalMaxPoints || 1);
      const avgB = statsB.totalPoints / (statsB.totalMaxPoints || 1);
      return avgB - avgA;
    } else {
      // Primárně podle počtu testů
      if (statsB.testsTaken !== statsA.testsTaken) {
        return statsB.testsTaken - statsA.testsTaken;
      }
      return statsB.bestScorePercent - statsA.bestScorePercent;
    }
  });

  // V kompaktním režimu ukážeme jen TOP 5
  const displayUsers = variant === 'compact' ? sortedUsers.slice(0, 5) : sortedUsers;

  const getMedalColor = (index: number) => {
    if (index === 0) return "bg-yellow-100 text-yellow-700 border-yellow-300";
    if (index === 1) return "bg-gray-100 text-gray-700 border-gray-300";
    if (index === 2) return "bg-orange-100 text-orange-800 border-orange-300";
    return "bg-white text-gray-600 border-gray-100";
  };

  // Helper funkce pro výpočet průměru
  const calculateAverage = (totalPoints: number, totalMaxPoints: number) => {
      if (!totalMaxPoints || totalMaxPoints === 0) return 0;
      return Math.round((totalPoints / totalMaxPoints) * 100);
  };

  return (
    <div className={`${variant === 'full' ? 'max-w-5xl mx-auto p-4 min-h-screen' : 'w-full h-full flex flex-col'}`}>
      
      {/* Header */}
      <div className={`flex items-center justify-between ${variant === 'full' ? 'mb-8' : 'mb-4'}`}>
        {variant === 'full' && onBack && (
            <button 
                onClick={onBack}
                className="flex items-center text-gray-500 hover:text-gray-900 transition-colors"
            >
                <svg className="w-6 h-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Zpět
            </button>
        )}
        <h1 className={`font-bold ${variant === 'full' ? 'text-2xl' : 'text-lg'} ${subject === 'SPS' ? 'text-blue-600' : 'text-orange-600'}`}>
            {variant === 'full' ? `Žebříček ${subject}` : `Top ${subject}`}
        </h1>
      </div>

      {/* Přepínač řazení pouze pro plnou verzi (ve widgetu je to zbytečné, řadíme podle skóre) */}
      {variant === 'full' && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-gray-500 text-sm">
                Řadit podle:
            </div>
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button 
                    onClick={() => setSortType('SCORE')}
                    className={`px-4 py-2 rounded-md font-medium text-sm transition-all flex items-center gap-2 ${sortType === 'SCORE' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <span>🎯</span> Nejlepší výkon
                </button>
                <button 
                    onClick={() => setSortType('GRIND')}
                    className={`px-4 py-2 rounded-md font-medium text-sm transition-all flex items-center gap-2 ${sortType === 'GRIND' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <span>💪</span> Počet testů
                </button>
            </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Načítám data...</div>
      ) : displayUsers.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-xl shadow-sm border border-gray-200 border-dashed">
            <p className="text-gray-400 text-sm">Zatím žádné statistiky.</p>
        </div>
      ) : (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 ${variant === 'compact' ? 'text-sm' : ''}`}>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                            <th className={`${variant === 'compact' ? 'px-3 py-2' : 'px-6 py-4'} text-center w-8`}>#</th>
                            <th className={`${variant === 'compact' ? 'px-3 py-2' : 'px-6 py-4'}`}>Jméno</th>
                            
                            {/* Sloupce - Plná verze (více místa) */}
                            {variant === 'full' && (
                                <>
                                    <th className="px-6 py-4 text-center">Testy</th>
                                    <th className="px-6 py-4 text-center">Průměr</th>
                                    <th className="px-6 py-4 text-center">Nejlepší</th>
                                </>
                            )}

                            {/* Sloupce - Kompaktní verze (všechny 3, ale úsporněji) */}
                            {variant === 'compact' && (
                                <>
                                    <th className="px-1 py-2 text-center text-[10px] w-12" title="Počet testů">Testy</th>
                                    <th className="px-1 py-2 text-center text-[10px] w-12" title="Průměrná úspěšnost">Ø</th>
                                    <th className="px-1 py-2 text-center text-[10px] w-14" title="Nejlepší výsledek">Max</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {displayUsers.map((user, index) => {
                            const stats = getStats(user)!;
                            const avgPercent = calculateAverage(stats.totalPoints, stats.totalMaxPoints);
                            
                            return (
                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                    <td className={`${variant === 'compact' ? 'px-3 py-2' : 'px-6 py-4'} text-center`}>
                                        <div className={`${variant === 'compact' ? 'w-6 h-6 text-xs' : 'w-8 h-8'} rounded-full flex items-center justify-center mx-auto font-bold border ${getMedalColor(index)}`}>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className={`${variant === 'compact' ? 'px-3 py-2' : 'px-6 py-4'} font-medium text-gray-900 truncate max-w-[100px] sm:max-w-none`}>
                                        {user.displayName}
                                    </td>

                                    {/* Plná verze tabulky */}
                                    {variant === 'full' && (
                                        <>
                                            <td className="px-6 py-4 text-center text-gray-600">
                                                {stats.testsTaken}x
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block px-2 py-1 rounded text-sm ${avgPercent >= 80 ? 'bg-green-100 text-green-800' : avgPercent >= 50 ? 'bg-blue-50 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                                                    {avgPercent}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-gray-800 text-lg">
                                                {Math.round(stats.bestScorePercent)}%
                                            </td>
                                        </>
                                    )}

                                    {/* Kompaktní verze widgetu - zobrazíme vše */}
                                    {variant === 'compact' && (
                                        <>
                                            <td className="px-1 py-2 text-center text-xs text-gray-500">
                                                {stats.testsTaken}
                                            </td>
                                            <td className="px-1 py-2 text-center text-xs text-gray-500">
                                                {avgPercent}%
                                            </td>
                                            <td className="px-1 py-2 text-center text-sm font-bold text-gray-800">
                                                {Math.round(stats.bestScorePercent)}%
                                            </td>
                                        </>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {variant === 'compact' && sortedUsers.length > 5 && (
                <div 
                    onClick={onBack} 
                    className="bg-gray-50 p-2 text-center text-xs text-gray-500 hover:text-blue-600 hover:bg-gray-100 cursor-pointer border-t border-gray-100 transition-colors"
                >
                    Zobrazit všech {sortedUsers.length} studentů...
                </div>
            )}
        </div>
      )}
    </div>
  );
};
