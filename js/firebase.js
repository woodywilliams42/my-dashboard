import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAFhr8C3o6fEXY1vNkiKq_0tfXp45ekTlU",
  authDomain: "woodydashboard.firebaseapp.com",
  projectId: "woodydashboard",
  storageBucket: "woodydashboard.appspot.com",
  messagingSenderId: "180582118415",
  appId: "1:180582118415:web:447bdf09b42dd16fa15f7a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
