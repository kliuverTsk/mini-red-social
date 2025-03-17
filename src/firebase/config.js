import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDmtu3P_PzPuFIA-m01JATdDoOy2MFx9H4",
  authDomain: "red-social-659f3.firebaseapp.com",
  projectId: "red-social-659f3",
  storageBucket: "red-social-659f3.firebasestorage.app",
  messagingSenderId: "937524418410",
  appId: "1:937524418410:web:a211d1c9b28cb86a1fb713"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);