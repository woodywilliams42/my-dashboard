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

// ✅ Shared image element
const img = document.createElement("img");
img.alt = "Google Sign-In";
img.loading = "lazy";

// ✅ Set consistent size and shape
img.style.width = "28px";
img.style.height = "28px";
img.style.borderRadius = "50%";
img.style.transition = "filter 0.3s ease";

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

    img.src = user.photoURL;
    img.alt = user.displayName || "User Avatar";
    img.style.objectFit = "cover";      // crop avatar to fill circle
    img.style.borderRadius = "50%";     // round the avatar
    img.style.backgroundColor = "transparent"; // prevent white bg
    img.classList.remove("greyscale");

    authBtn.title = `Signed in as ${user.displayName}, click to sign out`;
  } else {
    authBtn.classList.remove("logged-in");
    authBtn.classList.add("logged-out");

    img.src = "/my-dashboard/images/google-icon-grey.png";
    img.alt = "Google Sign-In";
    img.style.objectFit = "contain";    // keep G icon's original shape
    img.style.borderRadius = "50%";     // ensure it's a circle
    img.style.backgroundColor = "transparent"; // no background
    

    authBtn.title = "Sign in to Google";
  }
});

