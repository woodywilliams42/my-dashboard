// === Firebase Initialization ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export {
  app,
  storage,
  ref,
  listAll,
  uploadBytes,
  getDownloadURL,
  deleteObject
};
