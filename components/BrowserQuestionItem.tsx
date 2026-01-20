
import React, { useState, useEffect } from 'react';
import { Question } from '../types';

interface Props {
  question: Question;
  isExpanded: boolean;
  onToggle: () => void;
  onReport: (question: Question) => void;
}

export const BrowserQuestionItem: React.FC<Props> = ({ question, isExpanded, onToggle, onReport }) => {
  const [imgError, setImgError] = useState(false);
  const [currentImgSrc, setCurrentImgSrc] = useState<string | undefined>(question.imageUrl);

  useEffect(() => {
      if (isExpanded) {
          setImgError(false);
          setCurrentImgSrc(question.imageUrl);
      }
  }, [isExpanded, question.imageUrl]);

  const handleImageError = () => {
    if (currentImgSrc && currentImgSrc.endsWith('.png')) {
        setCurrentImgSrc(currentImgSrc.replace('.png', '.jpg'));
    } else {
        setImgError(true);
    }
  };

  // Stejná logika pro renderování textu jako v QuestionCard
  const renderText = (text: string) => {
    if (!text) return text;

    // 1. HTML (např. červený text)
    if (text.includes('<') && text.includes('>')) {
        return <span dangerouslySetInnerHTML={{ __html: text }} />;
    }
    
    // 2. KaTeX / Matematika
    const useKatex = text.includes('sqrt') || (text.includes('_') && text.includes('^'));
    if (useKatex && window.katex) {
        try {
            let latex = text;
            latex = latex.replace(/sqrt\((.+?)\)/g, '\\sqrt{$1}');
            latex = latex.replace(/(\d|[a-zA-Z])x([a-zA-Z]|\d)/g, '$1 \\cdot $2');
            latex = latex.replace(/_([a-zA-Z0-9]+)/g, '_{$1}');
            
            const html = window.katex.renderToString(latex, {
                throwOnError: false,
                displayMode: false
            });
            return <span dangerouslySetInnerHTML={{ __html: html }} />;
        } catch (e) {
            console.error("KaTeX error:", e);
        }
    }

    // 3. Fallback formátování
    let html = text;
    if (text.includes('_') || text.includes('^')) {
         html = html.replace(/(\d)x([A-Z])/g, '$1&times;$2');
         html = html.replace(/(\d)x(\d)/g, '$1&times;$2');
         html = html.replace(/ x /g, ' &times; ');
         html = html.replace(/([a-zA-Z0-9])_([a-zA-Z0-9]+)/g, '$1<sub>$2</sub>');
         html = html.replace(/\^([0-9]+)/g, '<sup>$1</sup>');
         return <span dangerouslySetInnerHTML={{ __html: html }} />;
    }

    return text;
  };

  return (
    <div 
        className={`bg-white p-5 rounded-xl shadow-sm border transition-all relative ${isExpanded ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100 hover:border-blue-200 hover:shadow-md'}`}
    >
        {/* Tlačítko nahlásit chybu - viditelné po rozbalení nebo najetí */}
        <button 
            onClick={(e) => {
                e.stopPropagation();
                onReport(question);
            }}
            className="absolute top-4 right-14 text-gray-300 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
            title="Nahlásit chybu"
        >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-8a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11l-3-3m0 0l-3 3m3-3v8" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />
            </svg>
        </button>

        <div className="cursor-pointer" onClick={onToggle}>
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1 pr-12">
                    <span className="font-bold text-blue-600 text-sm block mb-1">Otázka #{question.id}</span>
                    <p className="text-gray-800 font-medium text-lg leading-snug">{renderText(question.text)}</p>
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
                {question.imageUrl && !imgError && currentImgSrc && (
                    <div className="mb-6 bg-gray-50 rounded-lg p-2 border border-gray-200 min-h-[200px] flex items-center justify-center">
                        <img 
                            src={currentImgSrc} 
                            alt="Obrázek k otázce" 
                            className="max-h-80 w-full object-contain mx-auto"
                            onError={handleImageError}
                            loading="lazy"
                        />
                    </div>
                )}
                
                {question.imageUrl && imgError && (
                    <div className="mb-6 p-4 text-center text-sm text-gray-400 italic bg-gray-50 rounded-lg border border-gray-100">
                        Obrázek se nepodařilo načíst (ani .jpg varianta)
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
                                <span className="flex-1">{renderText(opt)}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        )}
    </div>
  );
};
