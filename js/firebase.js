// === Firebase Initialization ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// === Firestore (Database) ===
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// === Storage (For Hero Images, etc.) ===
import {
  getStorage,
  ref,
  listAll,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// === Firebase Project Configuration ===
const firebaseConfig = {
  apiKey: "AIzaSyAFhr8C3o6fEXY1vNkiKq_0tfXp45ekTlU",
  authDomain: "woodydashboard.firebaseapp.com",
  projectId: "woodydashboard",
  storageBucket: "woodydashboard.appspot.com",
  messagingSenderId: "180582118415",
  appId: "1:180582118415:web:447bdf09b42dd16fa15f7a"
};

// === Initialize Firebase Services ===
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// === Export Firebase services for use in other modules ===
export {
  app,
  db,
  storage,
  ref,
  listAll,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  collection,
  getDocs,
  query,
  orderBy
};
