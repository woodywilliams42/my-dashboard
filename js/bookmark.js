import { db } from './firebase.js'; 
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { framesData } from './frames.js';

const ICON_SIZE = 32;

export function setupBookmarkFrame(frameEl, data, tab, id) {
  console.log(`Setting up bookmark frame for tab=${tab} id=${id}`, data);

  const frameContent = frameEl.querySelector(".frame-content");
  if (!frameContent) return;

  // Bookmark icon container with white background
  const container = document.createElement("div");
  container.className = "bookmark-icon-frame";
  container.dataset.frameId = id;
  frameContent.appendChild(container);

  const bookmarks = data.urls || [];
  const favicons = data.favicons || {};
  bookmarks.forEach(url => {
    const icon = createBookmarkIcon(url, favicons[url], tab, id);
    container.appendChild(icon);
  });

  // Frame header: add "+" button before menu
  const header = frameEl.querySelector(".frame-header");
  if (header && !header.querySelector(".add-bookmark-btn")) {
    const addBtn = document.createElement("button");
    addBtn.textContent = "➕";
    addBtn.className = "add-bookmark-btn";
    addBtn.title = "Add bookmark";

    const menuBtn = header.querySelector(".frame-menu-button");
    if (menuBtn) {
      header.insertBefore(addBtn, menuBtn);  // Place to the left of the 3-dot menu
    } else {
      header.appendChild(addBtn);  // Fallback, unlikely but safe
    }

    addBtn.addEventListener("click", () => {
      const url = prompt("Enter bookmark URL:");
      if (!url || !isValidUrl(url)) return;

      const icon = createBookmarkIcon(url, null, tab, id);
      container.appendChild(icon);

      const frame = findFrame(tab, id);
      if (!frame.data) frame.data = {};
      if (!frame.data.urls) frame.data.urls = [];
      frame.data.urls.push(url);
      saveFrameData(tab);
    });
  }

  // Right-click background adds new bookmark
  container.addEventListener("contextmenu", e => {
    if (e.target !== container) return;
    e.preventDefault();
    const url = prompt("Enter bookmark URL:");
    if (!url || !isValidUrl(url)) return;

    const icon = createBookmarkIcon(url, null, tab, id);
    container.appendChild(icon);

    const frame = findFrame(tab, id);
    if (!frame.data) frame.data = {};
    if (!frame.data.urls) frame.data.urls = [];
    frame.data.urls.push(url);
    saveFrameData(tab);
  });
}

function createBookmarkIcon(entry, tab, id) {
  const { url, tooltip, icon } = typeof entry === 'string' ? { url: entry } : entry;

  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener";
  link.className = "bookmark-icon-button";
  link.title = tooltip || getShortName(url);

  const img = document.createElement("img");
  img.src = icon || `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`;
  img.alt = "Bookmark icon";
  img.width = ICON_SIZE;
  img.height = ICON_SIZE;
  link.appendChild(img);

  // Right-click context menu
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

    // Remove on click outside
    const removeMenu = () => menu.remove();
    setTimeout(() => document.addEventListener("click", removeMenu, { once: true }), 10);

    menu.addEventListener("click", ev => {
      const action = ev.target.dataset.action;
      if (action === "delete") {
        link.remove();
        removeBookmark(tab, id, url);
      } else if (action === "edit") {
        const newUrl = prompt("Edit URL:", url);
        if (!newUrl || !isValidUrl(newUrl)) return;

        const newTooltip = prompt("Optional tooltip:", tooltip || getShortName(newUrl)) || "";
        const newIcon = prompt("Custom icon filename (leave blank to use favicon):", icon || "");

        link.href = newUrl;
        link.title = newTooltip || getShortName(newUrl);
        img.src = newIcon ? `favicons/${newIcon}` : `https://www.google.com/s2/favicons?domain=${new URL(newUrl).hostname}`;

        updateBookmark(tab, id, url, newUrl, newTooltip, newIcon);
      }
      menu.remove();
    });
  });

  return link;
}


function getShortName(url) {
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
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
  frame.data.urls = frame.data.urls.filter(u => u !== url);
  saveFrameData(tab);
}

function updateFavicon(tab, id, url, iconUrl) {
  const frame = findFrame(tab, id);
  if (!frame.data.favicons) frame.data.favicons = {};
  frame.data.favicons[url] = iconUrl;
  saveFrameData(tab);
}

function updateBookmark(tab, id, oldUrl, newUrl) {
  const frame = findFrame(tab, id);
  frame.data.urls = frame.data.urls.map(u => u === oldUrl ? newUrl : u);
  if (frame.data.favicons?.[oldUrl]) {
    frame.data.favicons[newUrl] = frame.data.favicons[oldUrl];
    delete frame.data.favicons[oldUrl];
  }
  saveFrameData(tab);
}
