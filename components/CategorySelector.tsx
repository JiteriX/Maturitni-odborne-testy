
import React, { useMemo } from 'react';
import { Category, Subject, Question } from '../types';
import { CATEGORIES_SPS, CATEGORIES_STT } from '../constants';

interface Props {
  subject: Subject;
  allQuestions: Question[];
  currentMistakes: number[];
  onSelect: (categoryId: string | null) => void;
  onBack: () => void;
}

export const CategorySelector: React.FC<Props> = ({ subject, allQuestions, currentMistakes, onSelect, onBack }) => {
  const categories = subject === 'SPS' ? CATEGORIES_SPS : CATEGORIES_STT;

  const getCategoryStats = (cat: Category) => {
    // Zjistíme, které otázky patří do této kategorie
    const questionsInCat = allQuestions.filter(q => 
        cat.questionRanges.some(range => q.id >= range[0] && q.id <= range[1])
    );

    const totalCount = questionsInCat.length;
    
    // Zjistíme, kolik z těchto otázek je v seznamu chyb
    const mistakesInCatCount = questionsInCat.filter(q => currentMistakes.includes(q.id)).length;

    return { totalCount, mistakesInCatCount };
  };

  const globalStats = useMemo(() => {
      return {
          total: allQuestions.length,
          mistakes: currentMistakes.length
      };
  }, [allQuestions, currentMistakes]);

  return (
    <div className="max-w-2xl mx-auto p-6 animate-in fade-in zoom-in duration-300">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Co chceš procvičit?</h2>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Tlačítko pro všechny otázky */}
        <button 
          onClick={() => onSelect(null)}
          className="w-full p-5 text-left bg-white border-2 border-blue-100 rounded-2xl hover:border-blue-500 hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div>
            <div className="font-bold text-lg text-gray-900 flex items-center gap-2">
                Všechny otázky náhodně
            </div>
            <div className="text-sm text-gray-500 mt-1 flex items-center gap-3">
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold border border-gray-200">
                    {globalStats.total} otázek
                </span>
                {globalStats.mistakes > 0 && (
                    <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-xs font-bold border border-red-100">
                        {globalStats.mistakes} chyb k opravě
                    </span>
                )}
            </div>
          </div>
          <span className="text-2xl group-hover:translate-x-1 transition-transform">🚀</span>
        </button>

        <div className="py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Nebo konkrétní okruh:</div>

        {categories.map((cat) => {
          const stats = getCategoryStats(cat);
          
          return (
            <button 
                key={cat.id}
                onClick={() => onSelect(cat.id)}
                className="w-full p-4 text-left bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/30 transition-all flex items-center gap-4 group"
            >
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-xl group-hover:bg-blue-100 transition-colors flex-shrink-0">
                📚
                </div>
                <div className="flex-1">
                    <div className="font-semibold text-gray-700">{cat.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                            {stats.totalCount} otázek
                        </span>
                        {stats.mistakesInCatCount > 0 ? (
                            <span className="text-[10px] uppercase font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 flex items-center gap-1">
                                <span>⚠️</span> {stats.mistakesInCatCount} chyb
                            </span>
                        ) : (
                            <span className="text-[10px] uppercase font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 flex items-center gap-1">
                                <span>✅</span> Čistý štít
                            </span>
                        )}
                    </div>
                </div>
                <div className="text-gray-300 group-hover:text-blue-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
