// ✅ Import Firebase Modules
import { app } from "./firebase.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ✅ Create Auth Button
let authBtn = document.getElementById("google-auth-btn");

if (!authBtn) {
  authBtn = document.createElement("button");
  authBtn.id = "google-auth-btn";
  authBtn.classList.add("logged-out");
  authBtn.title = "Sign in to Google";

  const img = document.createElement("img");
  img.src = "images/google-icon.png";
  img.alt = "Google Sign-In";
  authBtn.appendChild(img);
}


// ✅ Insert into DOM (after Add Frame button)
document.addEventListener("DOMContentLoaded", () => {
  const controls = document.querySelector(".frame-controls");
  if (controls) controls.appendChild(authBtn);
});

// ✅ Auth Button Click Handler
authBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  try {
    if (user) {
      await signOut(auth);
      alert("👋 Signed out");
    } else {
      await signInWithPopup(auth, provider);
      alert("✅ Signed in!");
    }
  } catch (err) {
    console.error("Auth Error:", err);
    alert("Authentication failed");
  }
});

// ✅ Update UI When Auth State Changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    authBtn.classList.remove("logged-out");
    authBtn.classList.add("logged-in");
    authBtn.title = `Signed in as ${user.displayName}, click to sign out`;
  } else {
    authBtn.classList.remove("logged-in");
    authBtn.classList.add("logged-out");
    authBtn.title = "Sign in to Google";
  }
});
