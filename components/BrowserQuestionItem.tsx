import React, { useState, useEffect } from 'react';
import { Question } from '../types';

interface Props {
  question: Question;
  isExpanded: boolean;
  onToggle: () => void;
  onReportRequest?: (qId: number) => void;
}

export const BrowserQuestionItem: React.FC<Props> = ({ question, isExpanded, onToggle, onReportRequest }) => {
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

  const renderText = (text: string) => {
    if (!text) return text;

    if (text.includes('<') && text.includes('>')) {
        return <span dangerouslySetInnerHTML={{ __html: text }} />;
    }
    
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

  const getOptionClass = (idx: number) => {
    const isCorrect = idx === question.correctAnswerIndex;
    const isAcceptable = idx === question.acceptableAnswerIndex;

    if (isCorrect) {
      return 'bg-green-50 border-green-500 text-green-900 font-semibold';
    }
    if (isAcceptable) {
      return 'bg-yellow-50 border-yellow-500 text-yellow-900 font-semibold';
    }
    return 'bg-white border-gray-200 text-gray-500';
  };

  const getIconClass = (idx: number) => {
    const isCorrect = idx === question.correctAnswerIndex;
    const isAcceptable = idx === question.acceptableAnswerIndex;

    if (isCorrect) {
      return 'border-green-600 bg-green-600 text-white';
    }
    if (isAcceptable) {
      return 'border-yellow-600 bg-yellow-600 text-white';
    }
    return 'border-gray-300';
  };

  return (
    <div 
        className={`bg-white p-5 rounded-xl shadow-sm border transition-all ${isExpanded ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100 hover:border-blue-200 hover:shadow-md'}`}
    >
        <div className="flex justify-between items-start gap-4">
            <div className="flex-1 cursor-pointer" onClick={onToggle}>
                <span className="font-bold text-blue-600 text-sm block mb-1">Otázka #{question.id}</span>
                <p className="text-gray-800 font-medium text-lg leading-snug">{renderText(question.text)}</p>
            </div>
            <div className="flex items-center gap-3 mt-1">
                {onReportRequest && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onReportRequest(question.id);
                    }}
                    className="text-gray-300 hover:text-red-400 transition-colors p-1"
                    title="Nahlásit chybu"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                  </button>
                )}
                <div onClick={onToggle} className="text-gray-400 cursor-pointer">
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
                        Obrázek se nepodařilo načíst
                    </div>
                )}

                <div className="space-y-2">
                    {question.options.map((opt, idx) => {
                        const isCorrect = idx === question.correctAnswerIndex;
                        const isAcceptable = idx === question.acceptableAnswerIndex;
                        return (
                            <div 
                                key={idx} 
                                className={`p-4 rounded-lg text-base border flex items-center gap-3 ${getOptionClass(idx)}`}
                            >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${getIconClass(idx)}`}>
                                    {(isCorrect || isAcceptable) && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <span className="flex-1">{renderText(opt)}</span>
                            </div>
                        )
                    })}
                </div>

                {/* Speciální vysvětlení pro otázky s více správnými odpověďmi i v prohlížeči */}
                {((question.id === 224) || (question.id === 422)) && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-[11px] text-blue-700 italic">
                            {question.id === 224 && "Poznámka: Pokud vyberete odpověď C, je také uznána jako správná. Odpověď A je však technicky přesnější preference."}
                            {question.id === 422 && "Poznámka: Odpovědi B i D jsou v tomto testu identické a obě jsou uznávány jako správné."}
                        </p>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};