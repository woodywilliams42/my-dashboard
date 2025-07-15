// ✅ Import Firebase Modules
import { app } from "./firebase.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ✅ Initialize Firebase Auth
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ✅ DOM Elements
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const userInfoEl = document.getElementById("user-info");

// ✅ Login
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    try {
      await signInWithPopup(auth, provider);
      alert("✅ Signed in!");
    } catch (error) {
      console.error("Login Error:", error);
      alert("Login failed");
    }
  });
}

// ✅ Logout
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      alert("👋 Signed out");
    } catch (error) {
      console.error("Logout Error:", error);
      alert("Logout failed");
    }
  });
}

// ✅ Update UI on Auth State Change
if (userInfoEl) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      userInfoEl.textContent = `Signed in as ${user.displayName}`;
    } else {
      userInfoEl.textContent = "Not signed in";
    }
  });
}
