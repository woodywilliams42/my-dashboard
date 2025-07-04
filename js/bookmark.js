// bookmark.js - Modular Edit Dialog Integrated

import { db } from './firebase.js'; 
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { framesData } from './frames.js';

const ICON_SIZE = 32;

export function setupBookmarkFrame(frameEl, data, tab, id) {
  console.log(`Setting up bookmark frame for tab=${tab} id=${id}`, data);

  const frameContent = frameEl.querySelector(".frame-content");
  if (!frameContent) return;

  const container = document.createElement("div");
  container.className = "bookmark-icon-frame";
  container.dataset.frameId = id;
  frameContent.appendChild(container);

  const bookmarks = normalizeBookmarks(data.urls || []);
  data.urls = bookmarks;
  const favicons = data.favicons || {};

  bookmarks.forEach(entry => {
    const icon = createBookmarkIcon(entry, tab, id);
    container.appendChild(icon);
  });

  const header = frameEl.querySelector(".frame-header");
  if (header && !header.querySelector(".add-bookmark-btn")) {
    const addBtn = document.createElement("button");
    addBtn.textContent = "➕";
    addBtn.className = "add-bookmark-btn";
    addBtn.title = "Add bookmark";

    const menuBtn = header.querySelector(".frame-menu-button");
    if (menuBtn) header.insertBefore(addBtn, menuBtn);
    else header.appendChild(addBtn);

    addBtn.addEventListener("click", () => {
      const url = prompt("Enter bookmark URL:");
      if (!url || !isValidUrl(url)) return;
      const entry = { url, tooltip: getShortName(url), icon: "" };
      data.urls.push(entry);
      const iconEl = createBookmarkIcon(entry, tab, id);
      container.appendChild(iconEl);
      saveFrameData(tab);
    });
  }

  container.addEventListener("contextmenu", e => {
    if (e.target !== container) return;
    e.preventDefault();
    const url = prompt("Enter bookmark URL:");
    if (!url || !isValidUrl(url)) return;
    const entry = { url, tooltip: getShortName(url), icon: "" };
    data.urls.push(entry);
    const iconEl = createBookmarkIcon(entry, tab, id);
    container.appendChild(iconEl);
    saveFrameData(tab);
  });

  setupEditDialog();
}

function createBookmarkIcon(entry, tab, id) {
  const { url, tooltip = getShortName(url), icon = "" } = entry;

  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener";
  link.className = "bookmark-icon-button";
  link.title = tooltip;

  const img = document.createElement("img");
  img.src = icon || `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`;
  img.alt = "Bookmark icon";
  img.width = ICON_SIZE;
  img.height = ICON_SIZE;
  link.appendChild(img);

  link.addEventListener("contextmenu", e => {
    e.preventDefault();

    const menu = document.createElement("div");
    menu.className = "bookmark-context-menu";
    menu.style.top = `${e.clientY}px`;
    menu.style.left = `${e.clientX}px`;
    menu.innerHTML = `
      <div class="menu-option" data-action="edit">✏️ Edit Bookmark</div>
      <div class="menu-option" data-action="delete">🗑️ Delete Bookmark</div>
    `;
    document.body.appendChild(menu);

    const removeMenu = () => menu.remove();
    setTimeout(() => document.addEventListener("click", removeMenu, { once: true }), 10);

    menu.addEventListener("click", ev => {
      const action = ev.target.dataset.action;
      if (action === "delete") {
        link.remove();
        removeBookmark(tab, id, url);
      } else if (action === "edit") {
        openEditDialog(link, img, { url, tooltip, icon }, tab, id);
      }
      menu.remove();
    });
  });

  return link;
}

function setupEditDialog() {
  if (document.getElementById("bookmarkEditDialog")) return;

  const dialog = document.createElement("div");
  dialog.id = "bookmarkEditDialog";
  dialog.className = "bookmark-edit-dialog hidden";
  dialog.innerHTML = `
    <label>URL: <input type="text" id="editBookmarkUrl"></label>
    <label>Tooltip: <input type="text" id="editBookmarkTooltip"></label>
    <label>Icon: <input type="text" id="editBookmarkIcon"></label>
  `;
  document.body.appendChild(dialog);
}

function openEditDialog(linkEl, imgEl, bookmark, tab, id) {
  const dialog = document.getElementById("bookmarkEditDialog");
  const urlInput = document.getElementById("editBookmarkUrl");
  const tooltipInput = document.getElementById("editBookmarkTooltip");
  const iconInput = document.getElementById("editBookmarkIcon");

  urlInput.value = bookmark.url;
  tooltipInput.value = bookmark.tooltip;
  iconInput.value = bookmark.icon;

  const rect = linkEl.getBoundingClientRect();
  dialog.style.top = `${rect.bottom + window.scrollY}px`;
  dialog.style.left = `${rect.left + window.scrollX}px`;
  dialog.classList.remove("hidden");

  let updated = false;
  function applyChanges() {
    if (updated) return;
    updated = true;

    const newUrl = urlInput.value.trim();
    const newTooltip = tooltipInput.value.trim() || getShortName(newUrl);
    const newIcon = iconInput.value.trim();

    if (newUrl && isValidUrl(newUrl)) {
      linkEl.href = newUrl;
      linkEl.title = newTooltip;
      imgEl.src = newIcon ? `favicons/${newIcon}` : `https://www.google.com/s2/favicons?domain=${new URL(newUrl).hostname}`;
      updateBookmark(tab, id, bookmark.url, { url: newUrl, tooltip: newTooltip, icon: newIcon });
    }
    dialog.classList.add("hidden");
  }

  urlInput.onblur = tooltipInput.onblur = iconInput.onblur = () => setTimeout(() => {
    if (!dialog.contains(document.activeElement)) applyChanges();
  }, 50);

  document.addEventListener("click", function outsideClick(e) {
    if (!dialog.contains(e.target)) {
      applyChanges();
      document.removeEventListener("click", outsideClick);
    }
  }, { once: true });
}

function normalizeBookmarks(arr) {
  return arr.map(b => {
    if (typeof b === "string") return { url: b, tooltip: getShortName(b), icon: "" };
    return {
      url: b.url,
      tooltip: b.tooltip || getShortName(b.url),
      icon: b.icon || ""
    };
  });
}

function isValidUrl(url) {
  try { new URL(url); return true; } catch { return false; }
}

function getShortName(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function findFrame(tab, id) {
  return framesData?.[tab]?.find(f => f.id === id);
}

function saveFrameData(tab) {
  const docRef = doc(db, "tabFrames", tab);
  setDoc(docRef, { frames: framesData[tab] }).catch(console.error);
}

function removeBookmark(tab, id, url) {
  const frame = findFrame(tab, id);
  frame.data.urls = normalizeBookmarks(frame.data.urls).filter(b => b.url !== url);
  saveFrameData(tab);
}

function updateBookmark(tab, id, oldUrl, newEntry) {
  const frame = findFrame(tab, id);
  if (!frame?.data?.urls) return;

  frame.data.urls = normalizeBookmarks(frame.data.urls).map(b => {
    if (b.url === oldUrl) {
      return {
        url: newEntry.url,
        tooltip: newEntry.tooltip || getShortName(newEntry.url),
        icon: newEntry.icon || ""
      };
    }
    return b;
  });

  saveFrameData(tab);
}
