
import React, { useState } from 'react';

interface Props {
  onConfirm: () => void;
}

export const SPSInfoModal: React.FC<Props> = ({ onConfirm }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleConfirm = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideSPSInfo', 'true');
    }
    onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-[440px] w-full animate-in zoom-in fade-in duration-300">
        <div className="flex flex-col items-center">
          {/* Informační ikona podle obrázku */}
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-[#0f172a] mb-6 text-center">Informace k SPS testu</h2>
          
          <p className="text-gray-500 leading-relaxed mb-8 text-center px-2">
            V tomto testu by mělo být všechno dobře, ale v takovém časovém limitu projít 500 otázek není lehké, takže kdyby jste něco našli, tak tu otázku prosím nahlaste.
          </p>

          <div className="w-full mb-6">
            <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
              <input 
                type="checkbox" 
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-600 font-medium">Příště nezobrazovat</span>
            </label>
          </div>

          <button
            onClick={handleConfirm}
            className="w-full bg-[#111827] hover:bg-[#1e293b] text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-[0.98]"
          >
            Rozumím a pokračovat
          </button>
        </div>
      </div>
    </div>
  );
};
