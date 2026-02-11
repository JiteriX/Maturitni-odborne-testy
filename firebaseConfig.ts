import * as firebaseApp from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Workaround for potential type definition mismatches
const initializeApp = (firebaseApp as any).initializeApp;
const getAuth = (firebaseAuth as any).getAuth;

const firebaseConfig = {
  apiKey: "AIzaSyC9vto5dYtih7Pfly514ksV76I0QuSiTd8",
  authDomain: "maturita-app.firebaseapp.com",
  projectId: "maturita-app",
  storageBucket: "maturita-app.firebasestorage.app",
  messagingSenderId: "909624724152",
  appId: "1:909624724152:web:be96f539ee963878afc24d",
  measurementId: "G-4CT3YBS8FQ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);