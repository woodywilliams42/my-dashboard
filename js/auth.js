// ✅ Import Firebase Modules
import { app } from "./firebase.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// 🔄 Initialize Firebase services
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ✅ Auth button and UI
const authBtn = document.createElement("button");
authBtn.id = "google-auth-btn";
authBtn.classList.add("logged-out");
authBtn.title = "Sign in to Google";

const img = document.createElement("img");
img.alt = "Google Sign-In";
img.loading = "lazy";

img.style.width = "28px";
img.style.height = "28px";
img.style.borderRadius = "50%";
img.style.transition = "filter 0.3s ease";

authBtn.appendChild(img);

// 🔒 Login required message
const loginNotice = document.createElement("div");
loginNotice.id = "login-required";
loginNotice.innerHTML = `<p style="color: gray;">🔒 Please sign in to view your dashboard frames.</p>`;
loginNotice.style.display = "none";
loginNotice.style.textAlign = "center";

// ✅ Insert into DOM
document.addEventListener("DOMContentLoaded", () => {
  const authContainer = document.getElementById("auth-button-container");
  if (authContainer) {
    authContainer.appendChild(authBtn);
    authContainer.appendChild(loginNotice);
  }
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
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("👤 Logged in user UID:", user.uid);
    authBtn.classList.remove("logged-out");
    authBtn.classList.add("logged-in");

    img.src = user.photoURL;
    img.alt = user.displayName || "User Avatar";
    img.style.objectFit = "cover";
    img.style.backgroundColor = "transparent";

    authBtn.title = `Signed in as ${user.displayName}, click to sign out`;
    loginNotice.style.display = "none";

    // 🔄 Reload to fetch protected content (once)
    if (!sessionStorage.getItem("reloadedAfterLogin")) {
      sessionStorage.setItem("reloadedAfterLogin", "true");
      location.reload();
    }

  } else {
    // 👤 Signed out
    authBtn.classList.remove("logged-in");
    authBtn.classList.add("logged-out");

    img.src = "/my-dashboard/images/google-icon-grey.png";
    img.alt = "Google Sign-In";
    img.style.objectFit = "contain";
    img.style.backgroundColor = "transparent";

    authBtn.title = "Sign in to Google";
    loginNotice.style.display = "block";
    sessionStorage.removeItem("reloadedAfterLogin");

// 🔄 Refresh to hide secured content
  location.reload();
  }
});

export { auth };
