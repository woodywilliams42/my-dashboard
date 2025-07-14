// === Imports ===
import { app } from "./firebase.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// === Initialize Auth ===
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
  try {
    await signOut(auth);
    alert("👋 Signed out");
  } catch (error) {
    console.error("Logout Error:", error);
  }
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
