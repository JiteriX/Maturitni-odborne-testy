
import React, { useState, useEffect } from 'react';
import { Question } from '../types';

interface Props {
  question: Question;
  isExpanded: boolean;
  onToggle: () => void;
}

export const BrowserQuestionItem: React.FC<Props> = ({ question, isExpanded, onToggle }) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
      if (isExpanded) {
          setImgError(false);
      }
  }, [isExpanded]);

  return (
    <div 
        className={`bg-white p-5 rounded-xl shadow-sm border transition-all ${isExpanded ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100 hover:border-blue-200 hover:shadow-md'}`}
    >
        <div className="cursor-pointer" onClick={onToggle}>
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                    <span className="font-bold text-blue-600 text-sm block mb-1">Otázka #{question.id}</span>
                    <p className="text-gray-800 font-medium text-lg leading-snug">{question.text}</p>
                </div>
                <div className="text-gray-400 mt-1">
                    {isExpanded ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    )}
                </div>
            </div>
        </div>

        {isExpanded && (
            <div className="mt-6 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                {question.imageUrl && !imgError && (
                    <div className="mb-6 bg-gray-50 rounded-lg p-2 border border-gray-200 min-h-[200px] flex items-center justify-center">
                        <img 
                            src={question.imageUrl} 
                            alt="Obrázek k otázce" 
                            className="max-h-80 w-full object-contain mx-auto"
                            onError={() => setImgError(true)}
                            loading="lazy"
                        />
                    </div>
                )}
                
                {question.imageUrl && imgError && (
                    <div className="mb-6 p-4 text-center text-sm text-gray-400 italic bg-gray-50 rounded-lg border border-gray-100">
                        Obrázek se nepodařilo načíst
                    </div>
                )}

                <div className="space-y-2">
                    {question.options.map((opt, idx) => {
                        const isCorrect = idx === question.correctAnswerIndex;
                        return (
                            <div 
                                key={idx} 
                                className={`p-4 rounded-lg text-base border flex items-center gap-3 ${
                                    isCorrect 
                                        ? 'bg-green-50 border-green-500 text-green-900 font-semibold' 
                                        : 'bg-white border-gray-200 text-gray-500'
                                }`}
                            >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                    isCorrect ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300'
                                }`}>
                                    {isCorrect && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <span>{opt}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        )}
    </div>
  );
};
