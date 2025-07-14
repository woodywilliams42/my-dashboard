 // ✅ Firebase Auth Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ✅ Firebase Config (same as firebase.js)
const firebaseConfig = {
  apiKey: "AIzaSyAFhr8C3o6fEXY1vNkiKq_0tfXp45ekTlU",
  authDomain: "woodydashboard.firebaseapp.com",
  projectId: "woodydashboard",
  storageBucket: "woodydashboard.appspot.com",
  messagingSenderId: "180582118415",
  appId: "1:180582118415:web:447bdf09b42dd16fa15f7a"
};

// ✅ Initialize Firebase Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ✅ Login button
document.getElementById("login-btn").addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
    alert("✅ Signed in!");
  } catch (error) {
    console.error("Login Error:", error);
    alert("Login failed");
  }
});

// ✅ Logout button
document.getElementById("logout-btn").addEventListener("click", async () => {
  await signOut(auth);
  alert("👋 Signed out");
});

// ✅ Update UI on auth state change
const userInfoEl = document.getElementById("user-info");
onAuthStateChanged(auth, (user) => {
  if (user) {
    userInfoEl.textContent = `Signed in as ${user.displayName}`;
  } else {
    userInfoEl.textContent = "Not signed in";
  }
});
