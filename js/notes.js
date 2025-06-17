// notes.js
import { db } from './firebase.js';
import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const lastSavedContent = {};

// === Save Notes ===
async function saveNotes(tab) {
  const contentEl = document.getElementById(`notes-${tab}`);
  const statusEl = document.getElementById(`saveStatus-${tab}`);

  if (!contentEl || !statusEl) return;

  const content = contentEl.value;
  statusEl.textContent = "Saving...";
  statusEl.style.opacity = 1;

  try {
    await setDoc(doc(db, "dashboardNotes", tab), { content });
    statusEl.textContent = "✔ Saved!";
    lastSavedContent[tab] = content;
  } catch (err) {
    console.error("Error saving notes:", err);
    statusEl.textContent = "❌ Save failed!";
  }

  setTimeout(() => {
    statusEl.style.opacity = 0;
  }, 2000);
}

// === Load Notes ===
async function loadNotes(tab) {
  const contentEl = document.getElementById(`notes-${tab}`);
  if (!contentEl) return;

  try {
    const snap = await getDoc(doc(db, "dashboardNotes", tab));
    if (snap.exists()) {
      const data = snap.data();
      contentEl.value = data.content || "";
      lastSavedContent[tab] = data.content || "";
    }
  } catch (err) {
    console.error(`Error loading notes for ${tab}:`, err);
  }
}

// === Autosave Setup ===
function setupAutosave(tab) {
  const textarea = document.getElementById(`notes-${tab}`);
  if (!textarea) return;

  let debounceTimer;

  textarea.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const currentContent = textarea.value;
      if (lastSavedContent[tab] !== currentContent) {
        saveNotes(tab);
      }
    }, 2000);
  });

  textarea.addEventListener("blur", () => {
    const currentContent = textarea.value;
    if (lastSavedContent[tab] !== currentContent) {
      saveNotes(tab);
    }
  });
}

// === Initialize Notes on All Tabs ===
["work", "personal", "secondjob", "charity"].forEach(tab => {
  loadNotes(tab);
  setupAutosave(tab);
});

// Expose save function for manual calls
window.saveNotes = saveNotes;

