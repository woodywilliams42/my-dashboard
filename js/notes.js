// === Notes ===
import { app } from './firebase.js';
import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = getFirestore(app);
import { framesData } from './frames.js';

export function setupNoteFrame(frameEl, data, tab, id) {
  const container = document.createElement("div");
  container.className = "note-frame-container";
  frameEl.querySelector(".frame-content").appendChild(container);

  container.innerHTML = `
    <textarea class="note-box">${data.content || ""}</textarea>
    <div class="note-save-status" id="saveStatus-${id}"></div>
  `;

  const textarea = container.querySelector(".note-box");
  const statusEl = container.querySelector(".note-save-status");

  let lastSaved = data.content || "";
  let debounceTimer;
  let pendingSave = false;

  textarea.addEventListener("input", () => {
    pendingSave = true;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      save();
    }, 2000);
  });

  textarea.addEventListener("blur", () => {
    if (pendingSave) {
      clearTimeout(debounceTimer);
      save();
    }
  });

  function save() {
    const frame = framesData[tab].find(f => f.id === id);
    if (!frame) return;

    const newText = textarea.value;
    if (newText === lastSaved) return;

    pendingSave = false;
    frame.data.content = newText;
    lastSaved = newText;

    statusEl.textContent = "Saving...";
    statusEl.style.opacity = 1;

    const docRef = doc(db, "tabFrames", tab);
    setDoc(docRef, { frames: framesData[tab] })
      .then(() => {
        statusEl.textContent = "✔ Saved!";
        setTimeout(() => {
          statusEl.style.opacity = 0;
        }, 2000);
      })
      .catch(err => {
        console.error(err);
        statusEl.textContent = "❌ Save failed!";
        statusEl.style.opacity = 1;
      });
  }
}
