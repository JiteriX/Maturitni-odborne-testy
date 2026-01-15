
import React, { useEffect, useState } from 'react';
import { Subject, LeaderboardUser } from '../types';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

interface Props {
  subject: Subject;
  onBack?: () => void;
  variant?: 'full' | 'compact'; // 'full' = celá stránka, 'compact' = widget do menu
}

export const Leaderboard: React.FC<Props> = ({ subject, onBack, variant = 'full' }) => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Řazení primárně podle nejlepšího skóre, sekundárně podle průměru
  const sortedUsers = [...users].sort((a, b) => {
    const statsA = getStats(a);
    const statsB = getStats(b);

    if (!statsA || !statsB) return 0;

    // 1. Podle nejlepšího skóre (sestupně)
    if (statsB.bestScorePercent !== statsA.bestScorePercent) {
      return statsB.bestScorePercent - statsA.bestScorePercent;
    }
    
    // 2. Podle průměrné úspěšnosti (sestupně)
    const avgA = statsA.totalMaxPoints > 0 ? statsA.totalPoints / statsA.totalMaxPoints : 0;
    const avgB = statsB.totalMaxPoints > 0 ? statsB.totalPoints / statsB.totalMaxPoints : 0;
    
    return avgB - avgA;
  });

  // V kompaktním režimu ukážeme jen TOP 5
  const displayUsers = variant === 'compact' ? sortedUsers.slice(0, 5) : sortedUsers;

  const getMedalColor = (index: number) => {
    if (index === 0) return "bg-yellow-100 text-yellow-700 border-yellow-300";
    if (index === 1) return "bg-gray-100 text-gray-700 border-gray-300";
    if (index === 2) return "bg-orange-100 text-orange-800 border-orange-300";
    return "bg-white text-gray-600 border-gray-100";
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
            {variant === 'full' ? `Statistiky ${subject}` : `Statistiky ${subject}`}
        </h1>
        {variant === 'full' && <div className="w-16"></div>}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Načítám data...</div>
      ) : displayUsers.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-xl shadow-sm border border-gray-200 border-dashed">
            <p className="text-gray-400 text-sm">Zatím žádné statistiky.</p>
        </div>
      ) : (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 ${variant === 'compact' ? 'text-xs sm:text-sm' : ''}`}>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                            <th className={`${variant === 'compact' ? 'px-2 py-2' : 'px-6 py-4'} text-center w-10`}>#</th>
                            <th className={`${variant === 'compact' ? 'px-2 py-2' : 'px-6 py-4'}`}>Jméno</th>
                            <th className={`${variant === 'compact' ? 'px-2 py-2' : 'px-6 py-4'} text-center`} title="Počet testů">
                                Testy
                            </th>
                            <th className={`${variant === 'compact' ? 'px-2 py-2' : 'px-6 py-4'} text-center`} title="Průměrná úspěšnost">
                                Průměr
                            </th>
                            <th className={`${variant === 'compact' ? 'px-2 py-2' : 'px-6 py-4'} text-center font-bold text-gray-700`} title="Nejlepší výsledek">
                                Max
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {displayUsers.map((user, index) => {
                            const stats = getStats(user)!;
                            // Výpočet průměru
                            const avgPercent = stats.totalMaxPoints > 0 
                                ? Math.round((stats.totalPoints / stats.totalMaxPoints) * 100) 
                                : 0;
                            
                            return (
                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                    <td className={`${variant === 'compact' ? 'px-2 py-2' : 'px-6 py-4'} text-center`}>
                                        <div className={`${variant === 'compact' ? 'w-5 h-5 text-[10px]' : 'w-8 h-8'} rounded-full flex items-center justify-center mx-auto font-bold border ${getMedalColor(index)}`}>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className={`${variant === 'compact' ? 'px-2 py-2' : 'px-6 py-4'} font-medium text-gray-900 truncate max-w-[100px]`}>
                                        {user.displayName}
                                    </td>
                                    
                                    {/* Počet testů */}
                                    <td className={`${variant === 'compact' ? 'px-2 py-2' : 'px-6 py-4'} text-center text-gray-600`}>
                                        {stats.testsTaken}
                                    </td>

                                    {/* Průměrná úspěšnost */}
                                    <td className={`${variant === 'compact' ? 'px-2 py-2' : 'px-6 py-4'} text-center text-blue-600 font-medium`}>
                                        {avgPercent}%
                                    </td>

                                    {/* Nejlepší výsledek */}
                                    <td className={`${variant === 'compact' ? 'px-2 py-2' : 'px-6 py-4'} text-center font-bold text-gray-800`}>
                                        {Math.round(stats.bestScorePercent)}%
                                    </td>
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
