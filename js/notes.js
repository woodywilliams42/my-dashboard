// notes.js
import { db } from './firebase.js';
import { framesData } from './frames.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Save notes for a specific frame
function saveNoteForFrame(tab, id, content) {
  const frame = framesData[tab]?.find(f => f.id === id);
  if (!frame) return;

  frame.data.content = content;
  const docRef = doc(db, "tabFrames", tab);
  setDoc(docRef, { frames: framesData[tab] }).catch(console.error);
}

// Setup note autosave inside a frame
export function setupNoteFrame(frameEl, data, tab, id) {
  const container = document.createElement("div");
  container.className = "note-frame-container";

  container.innerHTML = `
    <textarea class="note-box" placeholder="Type your notes...">${data.content || ""}</textarea>
    <div class="note-save-status" style="opacity:0;">✔ Saved!</div>
  `;

  const textarea = container.querySelector(".note-box");
  const status = container.querySelector(".note-save-status");

  let lastSaved = data.content || "";
  let debounceTimer;

  textarea.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (textarea.value !== lastSaved) {
        saveNoteForFrame(tab, id, textarea.value);
        lastSaved = textarea.value;
        status.textContent = "✔ Saved!";
        status.style.opacity = 1;
        setTimeout(() => status.style.opacity = 0, 1500);
      }
    }, 1000);
  });

  textarea.addEventListener("blur", () => {
    if (textarea.value !== lastSaved) {
      saveNoteForFrame(tab, id, textarea.value);
      lastSaved = textarea.value;
      status.textContent = "✔ Saved!";
      status.style.opacity = 1;
      setTimeout(() => status.style.opacity = 0, 1500);
    }
  });

  frameEl.querySelector(".frame-content").appendChild(container);
}
