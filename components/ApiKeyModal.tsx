import React, { useEffect } from 'react';

interface Props {
  onClose: () => void;
}

export const ApiKeyModal: React.FC<Props> = ({ onClose }) => {
  // Check if API key is already selected on mount as per guidelines
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (hasKey) {
          onClose();
        }
      }
    };
    checkKey();
  }, [onClose]);

  const handleConnect = async () => {
    try {
      if (window.aistudio && window.aistudio.openSelectKey) {
        // Trigger key selection dialog
        await window.aistudio.openSelectKey();
        // Assume successful selection and proceed as per guidelines
        onClose();
      } else {
        alert("AI Studio helper not found. Please ensure the script is loaded.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to select key.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Gemini API Klíč</h2>
        <p className="text-gray-600 mb-6">
          Pro využití AI Tutora a vysvětlení otázek je potřeba propojit aplikaci s Google Gemini.
          <br/>
          {/* Link to billing documentation as required by guidelines */}
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
            Informace o cenách a fakturaci
          </a>
        </p>
        
        <button
          onClick={handleConnect}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
        >
          Připojit API Klíč
        </button>
        <button
            onClick={onClose}
            className="mt-4 text-gray-500 hover:text-gray-700 text-sm underline"
        >
            Pokračovat bez AI (omezené funkce)
        </button>
      </div>
    </div>
  );
};
