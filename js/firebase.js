// === Firebase Initialization ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

// === Firestore (Database) ===
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// === Storage (For Hero Images, etc.) ===
import {
  getStorage,
  ref,
  listAll,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// === Your Firebase Project Configuration ===
const firebaseConfig = {
  apiKey: "AIzaSyAFhr8C3o6fEXY1vNkiKq_0tfXp45ekTlU",
  authDomain: "woodydashboard.firebaseapp.com",
  projectId: "woodydashboard",
  storageBucket: "woodydashboard.appspot.com",
  messagingSenderId: "180582118415",
  appId: "1:180582118415:web:447bdf09b42dd16fa15f7a"
};

// === Initialize Firebase App, Firestore, and Storage ===
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// === Export Firestore and Storage for use in other modules ===
export {
  db,
  storage,
  ref,
  listAll,
  uploadBytes,
  getDownloadURL,
  deleteObject
};
