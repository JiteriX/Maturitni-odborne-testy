
import React, { useState } from 'react';
import { AppUser } from '../users';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

interface Props {
  onLogin: (user: AppUser) => void;
}

export const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [input, setInput] = useState(''); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Funkce pro zpracování vstupu (buď celé jméno nebo generování domény)
  const processEmail = (userInput: string) => {
      const trimmedInput = userInput.trim();

      // 1. Pokud uživatel zadal celý email (obsahuje @), použijeme ho tak, jak je.
      if (trimmedInput.includes('@')) {
          return trimmedInput;
      }

      // 2. Pokud uživatel zadal jen jméno, vygenerujeme @maturita.app
      let cleanName = trimmedInput.toLowerCase();
      cleanName = cleanName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
      return `${cleanName}@maturita.app`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!auth) {
        setError("Chyba: Firebase není nakonfigurován.");
        setLoading(false);
        return;
    }

    const emailToUse = processEmail(input);

    try {
        console.log("Pokus o přihlášení jako:", emailToUse);
        const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
        
        onLogin({
            uid: userCredential.user.uid,
            email: emailToUse,
            displayName: userCredential.user.displayName || input
        });

    } catch (err: any) {
        console.error("Auth Error:", err);
        
        let msg = "Nastala neznámá chyba.";
        const code = err.code;
        const message = err.message || "";

        if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
            msg = "Nesprávné jméno nebo heslo.";
        } else if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
            msg = "Tento uživatel neexistuje.";
        } else if (code === 'auth/too-many-requests') {
            msg = "Příliš mnoho pokusů. Zkuste to později.";
        } else {
            msg = "Chyba: " + message;
        }
        
        setError(msg);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Přihlášení</h1>
          <p className="text-gray-500 text-sm mt-2">Maturitní testy SPS a STT</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Uživatelské jméno (nebo email)
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Např. Jan Novák"
              autoFocus
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                 Heslo
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="******"
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-bold py-3 rounded-lg transition-colors shadow-md bg-blue-600 hover:bg-blue-700 ${loading ? 'opacity-70 cursor-wait' : ''}`}
          >
            {loading ? "Pracuji..." : "Přihlásit se"}
          </button>
        </form>
      </div>
    </div>
  );
};
