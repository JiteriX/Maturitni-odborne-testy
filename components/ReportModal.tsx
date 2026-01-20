
import React, { useState } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { Subject } from '../types';

interface Props {
  questionId: number;
  subject: Subject;
  questionText: string;
  onClose: () => void;
}

export const ReportModal: React.FC<Props> = ({ questionId, subject, questionText, onClose }) => {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "reports"), {
        questionId,
        subject,
        questionText: questionText.substring(0, 100) + "...", // Uložíme kousek textu pro přehlednost
        description,
        userId: auth.currentUser?.uid || 'anonymous',
        userName: auth.currentUser?.displayName || 'Neznámý',
        userEmail: auth.currentUser?.email || '',
        createdAt: new Date().toISOString(),
        status: 'new'
      });
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Chyba při odesílání hlášení:", error);
      alert("Nepodařilo se odeslat hlášení. Zkuste to prosím znovu.");
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl text-center animate-in zoom-in duration-200">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Díky za nahlášení!</h3>
          <p className="text-gray-500">Chybu prověřím a opravím.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl animate-in zoom-in duration-200">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-red-500">🚩</span> Nahlásit chybu
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
          <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Otázka #{questionId} ({subject})</div>
          <p className="text-sm text-gray-700 line-clamp-2 italic">{questionText}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Popis problému</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Např.: Špatná odpověď, chybí obrázek, překlep..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              autoFocus
              required
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-red-100"
            >
              {isSubmitting ? 'Odesílám...' : 'Odeslat hlášení'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
