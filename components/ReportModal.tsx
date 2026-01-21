
import React, { useState } from 'react';
import { Subject } from '../types';
import { db } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

interface Props {
  questionId: number;
  subject: Subject;
  userName: string;
  onClose: () => void;
}

export const ReportModal: React.FC<Props> = ({ questionId, subject, userName, onClose }) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "reports"), {
        questionId,
        subject,
        reason: description, // Ukládáme volný text do pole 'reason'
        userName,
        timestamp: new Date().toISOString()
      });
      setSent(true);
      setTimeout(onClose, 2000);
    } catch (e) {
      console.error("Chyba při odesílání hlášení:", e);
      alert("Hlášení se nepodařilo odeslat. Zkuste to prosím později.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in fade-in duration-200">
        {!sent ? (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Nahlásit chybu</h2>
            <p className="text-sm text-gray-500 mb-4">Otázka #{questionId} ({subject})</p>
            
            <div className="mb-6">
              <label htmlFor="error-desc" className="block text-sm font-medium text-gray-700 mb-2">
                Popište, co je v otázce špatně:
              </label>
              <textarea
                id="error-desc"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Např.: špatná správná odpověď, chybějící obrázek, překlep..."
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-gray-800 placeholder:text-gray-400"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-500 font-medium hover:bg-gray-50 transition-colors"
              >
                Zrušit
              </button>
              <button
                onClick={handleSubmit}
                disabled={!description.trim() || loading}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-100"
              >
                {loading ? "Odesílám..." : "Odeslat"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Nahlášeno!</h3>
            <p className="text-gray-500">Děkujeme za pomoc s vylepšením testu.</p>
          </div>
        )}
      </div>
    </div>
  );
};
