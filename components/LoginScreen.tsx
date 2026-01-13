
import React, { useState } from 'react';
import { AppUser } from '../users';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

interface Props {
  onLogin: (user: AppUser) => void;
}

export const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [name, setName] = useState(''); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const createFakeEmail = (username: string) => {
      // Vytvoří fiktivní email: Matyas -> matyas@maturita.app
      // Odstraní diakritiku a mezery
      const cleanName = username.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '').toLowerCase();
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

    try {
        const fakeEmail = createFakeEmail(name);

        // Logika přihlášení
        const userCredential = await signInWithEmailAndPassword(auth, fakeEmail, password);
        onLogin({
            uid: userCredential.user.uid,
            email: fakeEmail,
            displayName: userCredential.user.displayName || name
        });

    } catch (err: any) {
        console.error("Login Error:", err);
        
        let msg = "Nastala neznámá chyba.";
        const code = err.code;
        const message = err.message || "";

        if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
            msg = "Špatné heslo.";
        } else if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
            msg = "Tento uživatel neexistuje. Požádejte učitele o vytvoření účtu.";
        } else if (code === 'auth/network-request-failed') {
            msg = "Chyba připojení k internetu. Jste online?";
        } else if (
            code === 'auth/api-key-not-valid' || 
            code === 'auth/invalid-api-key' || 
            message.includes('api-key-not-valid')
        ) {
            msg = "CHYBA KONFIGURACE: Špatný API klíč ve firebaseConfig.ts.";
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
          <h1 className="text-2xl font-bold text-gray-900">
              Přihlášení
          </h1>
          <p className="text-gray-500 text-sm mt-2">Maturitní testy SPS a STT</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Uživatelské jméno
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="např. Novak"
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
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-100">
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-bold py-3 rounded-lg transition-colors shadow-md bg-blue-600 hover:bg-blue-700 ${loading ? 'opacity-70 cursor-wait' : ''}`}
          >
            {loading ? "Ověřuji..." : "Přihlásit se"}
          </button>
        </form>
          
        <div className="text-center mt-6 text-xs text-gray-400">
              Přístup pouze pro registrované studenty.
        </div>

      </div>
    </div>
  );
};
