
import React, { useState, useEffect } from 'react';
import { Question, AppMode } from '../types';

// Definice pro globální objekt KaTeX, který načítáme v index.html
declare global {
  interface Window {
    katex: any;
  }
}

interface Props {
  question: Question;
  mode: AppMode;
  onAnswer: (questionId: number, selectedIndex: number, isCorrect: boolean) => void;
  showFeedback: boolean;
  userAnswer?: number | null;
  onReportRequest?: (qId: number) => void;
}

export const QuestionCard: React.FC<Props> = ({
  question,
  mode,
  onAnswer,
  showFeedback,
  userAnswer,
  onReportRequest
}) => {
  const [selected, setSelected] = useState<number | null>(userAnswer ?? null);
  const [imgError, setImgError] = useState(false);
  const [currentImgSrc, setCurrentImgSrc] = useState<string | undefined>(question.imageUrl);

  useEffect(() => {
    setSelected(userAnswer ?? null);
    setImgError(false);
    setCurrentImgSrc(question.imageUrl);
  }, [question, userAnswer]);

  const handleSelect = (index: number) => {
    if (showFeedback && selected !== null) return;
    if (mode === AppMode.REVIEW) return;
    
    setSelected(index);
    // Považujeme za správné, pokud je to preference NEBO uznatelná alternativa
    const isCorrect = index === question.correctAnswerIndex || index === question.acceptableAnswerIndex;
    onAnswer(question.id, index, isCorrect);
  };

  const handleImageError = () => {
      if (!currentImgSrc) return;

      // Zkoušíme postupně: .png -> .PNG -> .jpg -> .JPG
      if (currentImgSrc.endsWith('.png')) {
          setCurrentImgSrc(currentImgSrc.replace('.png', '.PNG'));
      } else if (currentImgSrc.endsWith('.PNG')) {
          setCurrentImgSrc(currentImgSrc.replace('.PNG', '.jpg'));
      } else if (currentImgSrc.endsWith('.jpg')) {
          setCurrentImgSrc(currentImgSrc.replace('.jpg', '.JPG'));
      } else {
          setImgError(true);
      }
  };

  // --- VYLEPŠENÝ PARSER MATEMATICKÝCH VZORCŮ S KATEX ---
  const renderMathText = (text: string) => {
    if (!text) return text;

    // 1. PRIORITA: HTML (např. pro červený text v STT otázce 273)
    if (text.includes('<') && text.includes('>')) {
        return <span dangerouslySetInnerHTML={{ __html: text }} />;
    }
    
    // 2. PRIORITA: KaTeX (Matematika)
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

    // 3. FALLBACK: Jednoduché náhrady
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

  const getOptionClass = (index: number) => {
    const base = "w-full p-4 text-left border rounded-lg transition-all duration-200 flex items-center gap-3 ";
    
    if (mode === AppMode.MOCK_TEST) {
      return base + (selected === index 
        ? "border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-200" 
        : "border-gray-200 hover:bg-gray-50 text-gray-700");
    }

    if (showFeedback || mode === AppMode.TRAINING || mode === AppMode.MISTAKES || mode === AppMode.REVIEW) {
        if (selected === null && mode !== AppMode.REVIEW) return base + "border-gray-200 hover:bg-gray-50 text-gray-700";

        // 1. Preferovaná správná odpověď (Zelená)
        if (index === question.correctAnswerIndex) {
            return base + "border-green-500 bg-green-50 text-green-900 ring-2 ring-green-200 font-medium";
        }
        // 2. Uznatelná alternativní odpověď (Žlutá)
        if (index === question.acceptableAnswerIndex) {
            // Pokud je vybrána uživatelem, svítí žlutě. V Review módu svítí žlutě vždy.
            if (selected === index || mode === AppMode.REVIEW) {
               return base + "border-yellow-500 bg-yellow-50 text-yellow-900 ring-2 ring-yellow-200 font-medium";
            }
        }
        // 3. Špatná vybraná odpověď (Červená)
        if (selected === index && index !== question.correctAnswerIndex && index !== question.acceptableAnswerIndex) {
            return base + "border-red-500 bg-red-50 text-red-900 ring-2 ring-red-200";
        }
        return base + "border-gray-200 opacity-60";
    }

    return base + "border-gray-200";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-3xl mx-auto mb-6">
      <div className="flex justify-between items-start mb-4 gap-4">
        <h3 className="text-lg font-semibold text-gray-900 leading-relaxed flex-1">
          <span className="text-blue-600 mr-2">#{question.id}</span>
          {renderMathText(question.text)}
        </h3>
        {onReportRequest && (
          <button 
            onClick={() => onReportRequest(question.id)}
            className="text-gray-300 hover:text-red-400 p-1 transition-colors group"
            title="Nahlásit chybu v otázce"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
          </button>
        )}
      </div>

      {question.imageUrl && !imgError && currentImgSrc && (
        <div className="mb-6 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 min-h-[200px] flex items-center justify-center relative">
          <img 
            src={currentImgSrc} 
            alt="Ilustrace k otázce" 
            className="w-full h-auto max-h-80 object-contain mx-auto"
            onError={handleImageError}
            loading="lazy"
          />
        </div>
      )}
      
      {question.imageUrl && imgError && (
          <div className="mb-6 p-4 text-center text-sm text-red-400 italic bg-red-50 rounded-lg border border-red-100">
             Obrázek se nepodařilo načíst (zkoušeno .png, .PNG, .jpg)
          </div>
      )}

      <div className="space-y-3">
        {question.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            disabled={((mode === AppMode.TRAINING || mode === AppMode.MISTAKES) && selected !== null) || mode === AppMode.REVIEW}
            className={getOptionClass(idx)}
          >
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 
                ${selected === idx ? 'border-current' : 'border-gray-300'}`}>
                {selected === idx && <div className="w-2.5 h-2.5 rounded-full bg-current" />}
            </div>
            <span className="flex-1">{renderMathText(opt)}</span>
          </button>
        ))}
      </div>

      {/* Speciální vysvětlení pro vybrané otázky s více správnými odpověďmi */}
      {((question.id === 224) || (question.id === 422)) && (showFeedback || mode === AppMode.REVIEW || (selected !== null && mode !== AppMode.MOCK_TEST)) && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-[11px] text-blue-700 italic">
            {question.id === 224 && "Poznámka: Pokud vyberete odpověď C, je také uznána jako správná. Odpověď A je však technicky přesnější preference."}
            {question.id === 422 && "Poznámka: Odpovědi B i D jsou v tomto testu identické a obě jsou uznávány jako správné."}
          </p>
        </div>
      )}
    </div>
  );
};
