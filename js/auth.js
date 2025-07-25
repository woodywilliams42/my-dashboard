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

// ✅ Create the image element (shared)
const img = document.createElement("img");
img.alt = "Google Sign-In";
img.loading = "lazy";
authBtn.appendChild(img);

// ✅ Insert into DOM
document.addEventListener("DOMContentLoaded", () => {
  const authContainer = document.getElementById("auth-button-container");
  if (authContainer) authContainer.appendChild(authBtn);
});

// ✅ Toggle login/logout
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

// ✅ Auth state listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    authBtn.classList.remove("logged-out");
    authBtn.classList.add("logged-in");
    img.classList.remove("greyscale");

    img.src = user.photoURL || "/my-dashboard/images/google-icon.png";
    img.alt = user.displayName || "User Avatar";
    authBtn.title = `Signed in as ${user.displayName}, click to sign out`;

  } else {
    authBtn.classList.remove("logged-in");
    authBtn.classList.add("logged-out");
    img.classList.add("greyscale");

    img.src = "/my-dashboard/images/google-icon-grey.png";  // ✅ Use grey icon explicitly
    img.alt = "Google Sign-In";
    authBtn.title = "Sign in to Google";
  }
});
