
import React, { useState } from 'react';
import { AppUser, REGISTRATION_CODE } from '../users';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

interface Props {
  onLogin: (user: AppUser) => void;
}

export const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [name, setName] = useState(''); 
  const [password, setPassword] = useState('');
  const [regCode, setRegCode] = useState(''); // Přejmenováno z teacherCode
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Vytvoříme technický email na pozadí, uživatele to nezajímá
  const createFakeEmail = (username: string) => {
      const cleanName = username.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '').toLowerCase();
      return `${cleanName}@maturita.app`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!auth) {
        setError("Chyba: Firebase není připojen.");
        setLoading(false);
        return;
    }

    try {
        const fakeEmail = createFakeEmail(name);

        if (isRegistering) {
            // REGISTRACE
            if (regCode !== REGISTRATION_CODE) {
                setError("Neplatný registrační kód.");
                setLoading(false);
                return;
            }
            if (password.length < 6) {
                setError("Heslo musí mít alespoň 6 znaků.");
                setLoading(false);
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, password);
            await updateProfile(userCredential.user, { displayName: name });
            
            onLogin({
                uid: userCredential.user.uid,
                email: fakeEmail,
                displayName: name
            });

        } else {
            // PŘIHLÁŠENÍ
            const userCredential = await signInWithEmailAndPassword(auth, fakeEmail, password);
            onLogin({
                uid: userCredential.user.uid,
                email: fakeEmail,
                displayName: userCredential.user.displayName || name
            });
        }

    } catch (err: any) {
        console.error(err);
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
            setError("Špatné jméno nebo heslo.");
        } else if (err.code === 'auth/email-already-in-use') {
            setError("Toto jméno je už zabrané. Zvolte jiné.");
        } else if (err.code === 'auth/network-request-failed') {
            setError("Chyba připojení k internetu.");
        } else {
            setError("Chyba: " + err.message);
        }
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
              {isRegistering ? "Registrace" : "Přihlášení"}
          </h1>
          <p className="text-gray-500 text-sm mt-2">Maturitní testy SPS a STT</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRegistering ? "Zvolte si uživatelské jméno" : "Vaše jméno"}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="např. Novak"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                 {isRegistering ? "Zvolte si heslo" : "Vaše heslo"}
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

          {isRegistering && (
             <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-1">Registrační kód</label>
                <input
                type="text"
                value={regCode}
                onChange={(e) => setRegCode(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-center font-mono text-lg uppercase"
                placeholder="01"
                maxLength={2}
                required
                />
                <p className="text-[10px] text-gray-400 mt-1 text-center">Ochrana proti spamu. Zadejte: 01</p>
             </div>
          )}

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-bold py-3 rounded-lg transition-colors shadow-md ${isRegistering ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} ${loading ? 'opacity-70 cursor-wait' : ''}`}
          >
            {loading ? "Pracuji..." : (isRegistering ? "Vytvořit účet" : "Přihlásit se")}
          </button>
          
          <div className="text-center mt-4">
              <button 
                type="button"
                onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError('');
                    setRegCode('');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                  {isRegistering ? "Už mám účet -> Přihlásit se" : "Nemám účet -> Registrovat"}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};
