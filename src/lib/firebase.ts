import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBTYHLORHg_HuLzAg74XCanqLE82e92NJI",
  authDomain: "bematch-new.firebaseapp.com",
  projectId: "bematch-new",
  storageBucket: "bematch-new.firebasestorage.app",
  messagingSenderId: "108504362423",
  appId: "1:108504362423:web:3781383a547a09590d8c32",
  measurementId: "G-P6LCQY34GB"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
