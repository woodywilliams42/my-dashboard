// ✅ Import Firebase Modules
import { app } from "./firebase.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ✅ Initialize Auth
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ✅ Create Auth Button
const authBtn = document.createElement("button");
authBtn.id = "google-auth-btn";
authBtn.classList.add("logged-out");
authBtn.title = "Sign in to Google";

// ✅ Create Image Element
const img = document.createElement("img");
img.src = "/my-dashboard/images/google-icon-grey.png"; // default grey G
img.alt = "Google Sign-In";
img.loading = "lazy";
authBtn.appendChild(img);

// ✅ Insert into DOM after Add Frame button
document.addEventListener("DOMContentLoaded", () => {
  const authContainer = document.getElementById("auth-button-container");
  if (authContainer) authContainer.appendChild(authBtn);
});

// ✅ Click handler: toggles login/logout
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

// ✅ Handle login state + update icon
onAuthStateChanged(auth, (user) => {
  if (user) {
    authBtn.classList.remove("logged-out");
    authBtn.classList.add("logged-in");
    authBtn.title = `Signed in as ${user.displayName}, click to sign out`;
    img.src = user.photoURL; // ✅ Use Google avatar
    img.classList.remove("greyscale");
  } else {
    authBtn.classList.remove("logged-in");
    authBtn.classList.add("logged-out");
    authBtn.title = "Sign in to Google";
    img.src = "/my-dashboard/images/google-icon-grey.png";
    img.classList.add("greyscale");
  }
});
