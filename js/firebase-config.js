// Firebase Configuration & Initialization
// ANDRASELAMATMOTOR Firebase configuration.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyCLf5k3wtewmB6o4imJ9OdssabGgJ9jrWc",
  authDomain: "selamatmotorplara-cb4d4.firebaseapp.com",
  projectId: "selamatmotorplara-cb4d4",
  storageBucket: "selamatmotorplara-cb4d4.firebasestorage.app",
  messagingSenderId: "701135921057",
  appId: "1:701135921057:web:904c61a21af232d67bb5e0",
  measurementId: "G-7B4LG8FFGC"
};

const firebaseConfigMissingKeys = Object.entries(firebaseConfig)
  .filter(([key, value]) => key !== "measurementId" && !value)
  .map(([key]) => key);
const firebaseConfigured = firebaseConfigMissingKeys.length === 0;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

export { 
  app, 
  analytics,
  db, 
  storage, 
  auth, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail 
};

export { firebaseConfigured, firebaseConfig, firebaseConfigMissingKeys };
