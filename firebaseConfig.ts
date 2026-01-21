
// added comment above fix: Using a namespace import for 'firebase/app' can resolve issues where named exports are not correctly identified by the module loader or TypeScript compiler.
import * as FirebaseApp from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Konfigurace pro projekt "Maturita app"
const firebaseConfig = {
  apiKey: "AIzaSyC9vto5dYtih7Pfly514ksV76I0QuSiTd8",
  authDomain: "maturita-app.firebaseapp.com",
  projectId: "maturita-app",
  storageBucket: "maturita-app.firebasestorage.app",
  messagingSenderId: "909624724152",
  appId: "1:909624724152:web:be96f539ee963878afc24d",
  measurementId: "G-4CT3YBS8FQ"
};

// added comment above fix: Initialize the Firebase app using the initializeApp function from the namespace to ensure member availability.
const app = FirebaseApp.initializeApp(firebaseConfig);

// Export služeb pro zbytek aplikace
export const auth = getAuth(app);
export const db = getFirestore(app);
