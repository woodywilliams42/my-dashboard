import { framesData } from './frames.js';
import { db } from './firebase.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

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

  textarea.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(save, 2000);
  });

  textarea.addEventListener("blur", save);

  function save() {
    const frame = framesData[tab].find(f => f.id === id);
    if (!frame) return;

    const newText = textarea.value;
    if (newText === lastSaved) return;

    frame.data.content = newText;
    lastSaved = newText;

    statusEl.textContent = "Saving...";
    statusEl.style.opacity = 1;

    const docRef = doc(db, "tabFrames", tab);
    setDoc(docRef, { frames: framesData[tab] })
      .then(() => {
        statusEl.textContent = "✔ Saved!";
      })
      .catch(err => {
        console.error(err);
        statusEl.textContent = "❌ Save failed!";
      });

    setTimeout(() => {
      statusEl.style.opacity = 0;
    }, 2000);
  }
}
