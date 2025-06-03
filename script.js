import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
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
window.db = db;
window.storage = storage;

// Tab Switching
document.querySelectorAll("nav button").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.tab;
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.getElementById(target).classList.add("active");
    document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// Dark Mode Toggle
const darkToggle = document.getElementById("darkModeToggle");
const themeLabel = document.getElementById("theme-label");
function applyDarkMode(isDark) {
  document.body.classList.toggle("dark", isDark);
  darkToggle.checked = isDark;
  themeLabel.textContent = isDark ? "🌙" : "🌞";
}
const savedTheme = localStorage.getItem("theme");
const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
applyDarkMode(savedTheme ? savedTheme === "dark" : systemDark);
darkToggle.addEventListener("change", () => {
  const isDark = darkToggle.checked;
  applyDarkMode(isDark);
  localStorage.setItem("theme", isDark ? "dark" : "light");
});
// ===== NOTES =====
const lastSavedContent = {};

async function saveNotes(tab) {
  const content = document.getElementById(`notes-${tab}`).value;
  const statusEl = document.getElementById(`saveStatus-${tab}`);
  statusEl.textContent = "Saving...";
  statusEl.style.opacity = 1;
  try {
    await setDoc(doc(db, "dashboardNotes", tab), { content });
    statusEl.textContent = "✔ Saved!";
  } catch (err) {
    console.error("Error saving notes:", err);
    statusEl.textContent = "❌ Save failed!";
  }
  setTimeout(() => statusEl.style.opacity = 0, 2000);
}

function setupAutosave(tab) {
  const textarea = document.getElementById(`notes-${tab}`);
  let debounceTimer;
  textarea.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (lastSavedContent[tab] !== textarea.value) {
        saveNotes(tab);
        lastSavedContent[tab] = textarea.value;
      }
    }, 2000);
  });
  textarea.addEventListener("blur", () => {
    if (lastSavedContent[tab] !== textarea.value) {
      saveNotes(tab);
      lastSavedContent[tab] = textarea.value;
    }
  });
}

async function loadNotes(tab) {
  const snap = await getDoc(doc(db, "dashboardNotes", tab));
  if (snap.exists()) {
    const data = snap.data();
    document.getElementById(`notes-${tab}`).value = data.content || "";
    lastSavedContent[tab] = data.content || "";
  }
}

// ===== BOOKMARKS =====
async function loadBookmarks(tab) {
  const snap = await getDoc(doc(db, "dashboardBookmarks", tab));
  if (snap.exists()) renderBookmarks(tab, snap.data());
}

async function addBookmark(tab) {
  const input = document.getElementById(`newBookmarkUrl-${tab}`);
  const url = input.value.trim();
  try {
    new URL(url);
  } catch {
    alert("Invalid URL");
    return;
  }

  const docRef = doc(db, "dashboardBookmarks", tab);
  const snap = await getDoc(docRef);
  const data = snap.exists() ? snap.data() : {};
  const urls = data.urls || [];
  const favicons = data.favicons || {};

  if (!urls.includes(url)) {
    urls.push(url);
    await setDoc(docRef, { urls, favicons });
    renderBookmarks(tab, { urls, favicons });
    input.value = "";
    closeBookmarkModal(tab);
  } else {
    alert("Bookmark already exists.");
  }
}

async function removeBookmark(tab, url) {
  const snap = await getDoc(doc(db, "dashboardBookmarks", tab));
  if (!snap.exists()) return;

  const data = snap.data();
  const urls = (data.urls || []).filter(u => u !== url);
  const favicons = data.favicons || {};
  delete favicons[url];

  await setDoc(doc(db, "dashboardBookmarks", tab), { urls, favicons });
  renderBookmarks(tab, { urls, favicons });
}

function renderBookmarks(tab, data) {
  const container = document.getElementById(`bookmarks-${tab}`);
  if (!container) return;

  container.innerHTML = "";
  const urls = data.urls || [];
  const favicons = data.favicons || {};

  urls.forEach(url => {
    const a = document.createElement("a");
    a.className = "bookmark-link";
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.title = url;

    const img = document.createElement("img");
    img.src = favicons[url] || `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`;
    img.alt = "icon";

    const removeBtn = document.createElement("span");
    removeBtn.className = "remove";
    removeBtn.textContent = "×";
    removeBtn.onclick = (e) => {
      e.preventDefault();
      removeBookmark(tab, url);
    };

    a.appendChild(img);
    a.appendChild(removeBtn);
    container.appendChild(a);
  });
}

// ===== QUICK COMMENTS =====
const quickCommentsData = {};

async function loadQuickComments(tab) {
  const snap = await getDoc(doc(db, "quickComments", tab));
  quickCommentsData[tab] = snap.exists() ? snap.data().comments || [] : [];
  renderQuickComments(tab);
}

async function saveQuickComments(tab) {
  await setDoc(doc(db, "quickComments", tab), {
    comments: quickCommentsData[tab]
  });
}

function renderQuickComments(tab) {
  const container = document.getElementById(`quick-comments-${tab}`);
  container.innerHTML = "";
  quickCommentsData[tab].forEach((comment, index) => {
    const button = document.createElement("button");
    button.className = "quick-comment-button";
    button.textContent = comment.label;
    button.title = comment.text;
    button.addEventListener("click", () => {
      navigator.clipboard.writeText(comment.text);
      const original = button.textContent;
      button.textContent = "Copied!";
      setTimeout(() => button.textContent = original, 1000);
    });
    container.appendChild(button);
  });
}

document.querySelectorAll(".addCommentBtn").forEach(btn => {
  btn.addEventListener("click", async () => {
    const tab = btn.dataset.tab;
    const label = prompt("Label for comment:");
    const text = prompt("Comment text:");
    if (label && text) {
      quickCommentsData[tab].push({ label, text });
      await saveQuickComments(tab);
      renderQuickComments(tab);
    }
  });
});

// ===== CLOCKS =====
function updateClocks() {
  const clocks = [
    { city: "Shanghai", timeZone: "Asia/Shanghai" },
    { city: "Chennai", timeZone: "Asia/Kolkata" },
    { city: "London", timeZone: "Europe/London" },
    { city: "New York", timeZone: "America/New_York" },
    { city: "Dallas", timeZone: "America/Chicago" },
    { city: "Honolulu", timeZone: "Pacific/Honolulu" }
  ];
  const container = document.getElementById("world-clocks-work") || document.getElementById("world-clocks-secondjob");
  if (!container) return;
  container.innerHTML = clocks.map(({ city, timeZone }) => {
    const time = new Date().toLocaleTimeString("en-US", {
      timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    });
    return `<div class="clock-card"><h4>${city}</h4><div class="time">${time}</div></div>`;
  }).join("");
}

setInterval(updateClocks, 1000);
updateClocks();

// ===== INITIALIZE TABS =====
["work", "personal", "secondjob", "charity"].forEach(tab => {
  loadNotes(tab);
  setupAutosave(tab);
  loadBookmarks(tab);
  loadQuickComments(tab);
});

// ===== Expose globals for inline calls =====
window.saveNotes = saveNotes;
window.addBookmark = addBookmark;
window.removeBookmark = removeBookmark;
window.openBookmarkModal = tab => document.getElementById(`bookmarkModal-${tab}`).style.display = 'flex';
window.closeBookmarkModal = tab => document.getElementById(`bookmarkModal-${tab}`).style.display = 'none';
