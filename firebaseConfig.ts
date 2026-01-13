
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Údaje opsané z tvého obrázku:
const firebaseConfig = {
  apiKey: "AIzaSyC9vto5dYtih7Pfly514ksV76I0QuSiTd8",
  authDomain: "maturita-app.firebaseapp.com",
  projectId: "maturita-app",
  storageBucket: "maturita-app.firebasestorage.app",
  messagingSenderId: "909624724152",
  appId: "1:909624724152:web:be96f539ee963878afc24d",
  measurementId: "G-4CT3YBS8FQ"
};

// Inicializace Firebase
let app;
let auth;
let db;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (e) {
    console.warn("Chyba při inicializaci Firebase:", e);
}

export { auth, db };
