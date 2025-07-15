// === Quick Comments ===
import { app } from './firebase.js';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = getFirestore(app);


import { framesData } from './frames.js';

export function setupQuickCommentsFrame(frameEl, data, tab, id) {
  const frameContent = frameEl.querySelector(".frame-content");
  if (!frameContent) return;

  let container = frameContent.querySelector(".quick-comments-container");

  if (container) {
    container.innerHTML = '';
  } else {
    container = document.createElement("div");
    container.className = "quick-comments-container";
    container.dataset.frameId = id;
    frameContent.appendChild(container);
  }

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

  if (window.Sortable && !container.classList.contains("sortable-init")) {
    Sortable.create(container, {
      animation: 150,
      onEnd: () => {
        updateOrderInData(container, tab, id);
        saveFrameData(tab);
      }
    });
    container.classList.add("sortable-init");
  }
}

function createCommentButton(entry, tab, id) {
  const { caption = "Button", text = "" } = entry;

  const btn = document.createElement("button");
  btn.className = "quick-comment-btn";
  btn.textContent = caption;
  btn.title = text;

  btn.addEventListener("click", () => {
    navigator.clipboard.writeText(text).catch(console.error);

    const originalText = btn.textContent;
    btn.textContent = "Copied";

    setTimeout(() => {
      btn.textContent = originalText;
    }, 1000); 
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
    <div class="textarea-group">
      <label>Text to Copy:</label>
      <textarea class="quick-text">${existing?.text || ""}</textarea>
    </div>
    <div class="quick-dialog-actions">
      <button class="quick-save-btn">✅ Save</button>
      <button class="quick-cancel-btn">❌ Cancel</button>
    </div>
  `;
  document.body.appendChild(dialog);

  const rect = container.getBoundingClientRect();
  dialog.style.top = `${rect.bottom + window.scrollY}px`;
  dialog.style.left = `${rect.left + window.scrollX}px`;

  const captionInput = dialog.querySelector(".quick-caption");
  const textInput = dialog.querySelector(".quick-text");
  const saveBtn = dialog.querySelector(".quick-save-btn");
  const cancelBtn = dialog.querySelector(".quick-cancel-btn");

  const closeDialog = () => dialog.remove();

  saveBtn.addEventListener("click", () => {
    const caption = captionInput.value.trim();
    const text = textInput.value.trim();
    if (!caption || !text) return;

    const frame = framesData?.[tab]?.find(f => f.id === id);
    if (!frame?.data?.comments) frame.data.comments = [];

    if (existing) {
      existing.caption = caption;
      existing.text = text;
      if (btnEl) {
        btnEl.textContent = caption;
        btnEl.title = text;
      }
    } else {
      const newEntry = { caption, text };
      frame.data.comments.push(newEntry);
      const newBtn = createCommentButton(newEntry, tab, id);
      container.appendChild(newBtn);
    }
    saveFrameData(tab);
    closeDialog();
  });

  cancelBtn.addEventListener("click", () => closeDialog());

  const outsideClickHandler = (e) => {
    if (!dialog.contains(e.target)) {
      closeDialog();
      document.removeEventListener("click", outsideClickHandler);
    }
  };

  setTimeout(() => document.addEventListener("click", outsideClickHandler), 10);
}

function updateOrderInData(container, tab, id) {
  const frame = framesData?.[tab]?.find(f => f.id === id);
  if (!frame?.data?.comments) return;

  const buttons = Array.from(container.querySelectorAll(".quick-comment-btn"));
  const newOrder = buttons.map(btn => {
    return frame.data.comments.find(c => c.caption === btn.textContent && c.text === btn.title);
  }).filter(Boolean);

  frame.data.comments = newOrder;
}

function saveFrameData(tab) {
  const docRef = doc(db, "tabFrames", tab);
  setDoc(docRef, { frames: framesData[tab] }).catch(console.error);
}

function removeComment(tab, id, entry) {
  const frame = framesData?.[tab]?.find(f => f.id === id);
  if (!frame?.data?.comments) return;
  frame.data.comments = frame.data.comments.filter(c => c !== entry);
  saveFrameData(tab);
}


// ✅ Added Export for Bookmark Dialog:
export function openBookmarkEditDialog(linkEl, tab, id, bookmark) {
  document.querySelector(".bookmark-edit-dialog")?.remove();

  const originalUrl = bookmark.url;

  const dialog = document.createElement("div");
  dialog.className = "bookmark-edit-dialog";
  dialog.innerHTML = `
    <label>URL: <input type="text" class="edit-bookmark-url" value="${bookmark.url}"></label>
    <label>Tooltip: <input type="text" class="edit-bookmark-tooltip" value="${bookmark.tooltip}"></label>
    <label>Icon filename (e.g., myicon.png): <input type="text" class="edit-bookmark-icon" value="${bookmark.icon}"></label>
  `;
  document.body.appendChild(dialog);

  const rect = linkEl.getBoundingClientRect();
  dialog.style.top = `${rect.bottom + window.scrollY}px`;
  dialog.style.left = `${rect.left + window.scrollX}px`;

  const urlInput = dialog.querySelector(".edit-bookmark-url");
  const tooltipInput = dialog.querySelector(".edit-bookmark-tooltip");
  const iconInput = dialog.querySelector(".edit-bookmark-icon");

  const applyChanges = () => {
    const newUrl = urlInput.value.trim();
    const newTooltip = tooltipInput.value.trim() || getShortName(newUrl);
    const newIcon = iconInput.value.trim();

    const hasChanges = newUrl !== bookmark.url || newTooltip !== bookmark.tooltip || newIcon !== bookmark.icon;

    if (newUrl && isValidUrl(newUrl) && hasChanges) {
      bookmark.url = newUrl;
      bookmark.tooltip = newTooltip;
      bookmark.icon = newIcon;

      linkEl.href = newUrl;
      linkEl.title = newTooltip;
      const imgEl = linkEl.querySelector("img");
      imgEl.src = newIcon
        ? `https://raw.githubusercontent.com/woodywilliams42/my-dashboard/main/favicons/${newIcon}`
        : `https://www.google.com/s2/favicons?domain=${new URL(newUrl).hostname}`;

      // You can optionally trigger save here if needed
    }
  };

  [urlInput, tooltipInput, iconInput].forEach(input => {
    input.addEventListener("blur", applyChanges);
  });

  const outsideClickHandler = (e) => {
    if (!dialog.contains(e.target)) {
      applyChanges();
      dialog.remove();
      document.removeEventListener("click", outsideClickHandler);
    }
  };

  setTimeout(() => document.addEventListener("click", outsideClickHandler), 10);
}

function isValidUrl(url) {
  try { new URL(url); return true; } catch { return false; }
}

function getShortName(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}
