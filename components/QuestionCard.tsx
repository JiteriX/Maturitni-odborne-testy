
import React, { useState, useEffect } from 'react';
import { Question, AppMode } from '../types';

interface Props {
  question: Question;
  mode: AppMode;
  onAnswer: (questionId: number, selectedIndex: number, isCorrect: boolean) => void;
  showFeedback: boolean;
  userAnswer?: number | null;
}

export const QuestionCard: React.FC<Props> = ({
  question,
  mode,
  onAnswer,
  showFeedback,
  userAnswer
}) => {
  const [selected, setSelected] = useState<number | null>(userAnswer ?? null);
  const [imgError, setImgError] = useState(false);
  const [currentImgSrc, setCurrentImgSrc] = useState<string | undefined>(question.imageUrl);

  useEffect(() => {
    setSelected(userAnswer ?? null);
    setImgError(false);
    // Resetujeme zdroj obrázku na výchozí hodnotu (což je obvykle .png z constants.ts)
    setCurrentImgSrc(question.imageUrl);
  }, [question, userAnswer]);

  const handleSelect = (index: number) => {
    if (showFeedback && selected !== null) return;
    if (mode === AppMode.REVIEW) return;
    
    setSelected(index);
    const isCorrect = index === question.correctAnswerIndex;
    onAnswer(question.id, index, isCorrect);
  };

  const handleImageError = () => {
      // Pokud se nepodařilo načíst obrázek a končí na .png, zkusíme .jpg
      if (currentImgSrc && currentImgSrc.endsWith('.png')) {
          setCurrentImgSrc(currentImgSrc.replace('.png', '.jpg'));
      } else {
          // Pokud už to není .png (nebo už jsme zkusili .jpg), tak je to finální chyba
          setImgError(true);
      }
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

        if (index === question.correctAnswerIndex) {
            return base + "border-green-500 bg-green-50 text-green-900 ring-2 ring-green-200 font-medium";
        }
        if (selected === index && index !== question.correctAnswerIndex) {
            return base + "border-red-500 bg-red-50 text-red-900 ring-2 ring-red-200";
        }
        return base + "border-gray-200 opacity-60";
    }

    return base + "border-gray-200";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-3xl mx-auto mb-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900 leading-relaxed">
          <span className="text-blue-600 mr-2">#{question.id}</span>
          {question.text}
        </h3>
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
             Obrázek se nepodařilo načíst: {question.imageUrl} (ani .jpg varianta)
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
            <span>{opt}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
