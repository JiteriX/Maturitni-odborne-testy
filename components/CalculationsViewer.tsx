import React, { useState } from 'react';
import { Subject } from '../types';
import { STT_CALCULATIONS, CalculationData } from '../data/calculations/STT';

interface Props {
  subject: Subject;
  onBack: () => void;
}

export const CalculationsViewer: React.FC<Props> = ({ subject, onBack }) => {
  const [selectedCalcId, setSelectedCalcId] = useState<string | null>(null);

  const calculations: CalculationData[] = subject === 'STT' ? STT_CALCULATIONS : [];

  // Jednoduchý renderer našeho "markdownu"
  const renderContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Image parsing: ![alt](url)
      const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        return (
          <div key={index} className="my-6 flex justify-center">
             <img src={imgMatch[2]} alt={imgMatch[1]} className="max-w-full h-auto rounded-lg shadow-sm border border-gray-100" />
          </div>
        );
      }

      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-xl font-bold text-gray-800 mt-6 mb-3">{line.substring(4)}</h3>;
      }
      if (line.startsWith('- ')) {
        return <li key={index} className="ml-4 mb-1 text-gray-600">{line.substring(2)}</li>;
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      return <p key={index} className="mb-2 text-gray-600">{line}</p>;
    });
  };

  const selectedCalc = calculations.find(c => c.id === selectedCalcId);

  return (
    <div className="max-w-4xl mx-auto min-h-screen flex flex-col p-4 md:p-8 animate-in zoom-in duration-200">
      <div className="flex items-center mb-8 gap-4">
        <button onClick={() => selectedCalcId ? setSelectedCalcId(null) : onBack()} className="text-gray-500 hover:text-gray-800 font-medium flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> {selectedCalcId ? 'Zpět na výběr výpočtu' : 'Zpět do menu'}
        </button>
        <h1 className="text-3xl font-black text-gray-900 tracking-tighter">
          {selectedCalcId ? selectedCalc?.title : `Výpočty - ${subject}`}
        </h1>
      </div>

      <div className="flex-1">
        {!selectedCalcId ? (
          calculations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {calculations.map(calc => (
                <button 
                  key={calc.id}
                  onClick={() => setSelectedCalcId(calc.id)}
                  className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg border border-gray-100 hover:border-blue-300 transition-all text-left flex items-center gap-4 group"
                >
                  <div className="bg-blue-50 text-blue-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 text-lg">{calc.title}</h2>
                    <p className="text-gray-500 text-sm mt-1">Zobrazit vzorový výpočet</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Pro tento předmět zatím nejsou k dispozici žádné výpočty.
            </div>
          )
        ) : (
            <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-gray-100 animate-in slide-in-from-bottom-4 duration-300">
              <div className="prose prose-blue max-w-none">
                {selectedCalc?.content && renderContent(selectedCalc.content)}
              </div>
            </div>
        )}
      </div>
    </div>
  );
};
