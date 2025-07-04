import { framesData } from './frames.js';  
import { db } from './firebase.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

export function setupQuickCommentsFrame(frameEl, data, tab, id) {
  const frameContent = frameEl.querySelector(".frame-content");
  if (!frameContent) return;

  const container = document.createElement("div");
  container.className = "quick-comments-container";
  container.dataset.frameId = id;
  frameContent.appendChild(container);

  const comments = Array.isArray(data.comments) ? data.comments : [];
  data.comments = comments;

  comments.forEach(entry => {
    const btn = createCommentButton(entry, tab, id);
    container.appendChild(btn);
  });

  const header = frameEl.querySelector(".frame-header");
  if (header && !header.querySelector(".add-quick-btn")) {
    const addBtn = document.createElement("button");
    addBtn.textContent = "➕";
    addBtn.className = "add-quick-btn";
    addBtn.title = "Add Quick Comment";

    const menuBtn = header.querySelector(".frame-menu-button");
    if (menuBtn) header.insertBefore(addBtn, menuBtn);
    else header.appendChild(addBtn);

    addBtn.addEventListener("click", () => openQuickDialog(container, tab, id));
  }

  container.addEventListener("contextmenu", e => {
    if (e.target !== container) return;
    e.preventDefault();
    openQuickDialog(container, tab, id);
  });

  // Make buttons sortable
  if (window.Sortable) {
    Sortable.create(container, {
      animation: 150,
      onEnd: () => saveFrameData(tab)
    });
  }
}

function createCommentButton(entry, tab, id) {
  const { caption, text } = entry;

  const btn = document.createElement("button");
  btn.className = "quick-comment-btn";
  btn.textContent = caption;

  btn.addEventListener("click", () => {
    navigator.clipboard.writeText(text);
  });

  btn.addEventListener("contextmenu", e => {
    e.preventDefault();
    const menu = document.createElement("div");
    menu.className = "quick-context-menu";
    menu.style.top = `${e.clientY}px`;
    menu.style.left = `${e.clientX}px`;
    menu.innerHTML = `
      <div class="menu-option" data-action="edit">✏️ Edit</div>
      <div class="menu-option" data-action="delete">🗑️ Delete</div>
    `;
    document.body.appendChild(menu);

    const removeMenu = () => menu.remove();
    setTimeout(() => document.addEventListener("click", removeMenu, { once: true }), 10);

    menu.addEventListener("click", ev => {
      const action = ev.target.dataset.action;
      if (action === "delete") {
        btn.remove();
        removeComment(tab, id, entry);
      } else if (action === "edit") {
        openQuickDialog(btn.parentElement, tab, id, entry, btn);
      }
      menu.remove();
    });
  });

  return btn;
}

function openQuickDialog(container, tab, id, existing = null, btnEl = null) {
  document.querySelector(".quick-dialog")?.remove();

  const dialog = document.createElement("div");
  dialog.className = "quick-dialog";
  dialog.innerHTML = `
    <label>Caption: <input type="text" class="quick-caption" value="${existing?.caption || ""}"></label>
    <label>Text: <textarea class="quick-text">${existing?.text || ""}</textarea></label>
  `;
  document.body.appendChild(dialog);

  const rect = container.getBoundingClientRect();
  dialog.style.top = `${rect.top + window.scrollY + 20}px`;
  dialog.style.left = `${rect.left + window.scrollX + 20}px`;

  const captionInput = dialog.querySelector(".quick-caption");
  const textInput = dialog.querySelector(".quick-text");

  const apply = () => {
    const caption = captionInput.value.trim();
    const text = textInput.value.trim();
    if (!caption || !text) return;

    const frameData = findFrame(tab, id);
    if (!frameData?.data?.comments) frameData.data.comments = [];

    if (existing) {
      existing.caption = caption;
      existing.text = text;
      if (btnEl) btnEl.textContent = caption;
    } else {
      const newEntry = { caption, text };
      frameData.data.comments.push(newEntry);
      container.appendChild(createCommentButton(newEntry, tab, id));
    }
    saveFrameData(tab);
  };

  [captionInput, textInput].forEach(input => {
    input.addEventListener("blur", apply);
  });

  const outsideClick = (e) => {
    if (!dialog.contains(e.target)) {
      apply();
      dialog.remove();
      document.removeEventListener("click", outsideClick);
    }
  };

  setTimeout(() => document.addEventListener("click", outsideClick), 10);
}

function removeComment(tab, id, entry) {
  const frame = findFrame(tab, id);
  if (!frame?.data?.comments) return;
  frame.data.comments = frame.data.comments.filter(c => c !== entry);
  saveFrameData(tab);
}

function saveFrameData(tab) {
  const docRef = doc(db, "tabFrames", tab);
  setDoc(docRef, { frames: framesData[tab] }).catch(console.error);
}

function findFrame(tab, id) {
  return framesData?.[tab]?.find(f => f.id === id);
}
