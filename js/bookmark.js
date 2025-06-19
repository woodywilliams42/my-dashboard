// bookmark.js

import { db } from './firebase.js';
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const ICON_SIZE = 32;

export async function setupBookmarkFrame(frameEl, data, tab, id) {
  const container = document.createElement("div");
  container.className = "bookmark-icon-frame";
  container.dataset.frameId = id;
  frameEl.querySelector(".frame-content").appendChild(container);

  // Load bookmarks from frame data
  const bookmarks = data.urls || [];
  const customIcons = data.favicons || {}; // { url: customIconUrl }

  bookmarks.forEach(url => {
    const icon = createBookmarkIcon(url, customIcons[url], tab, id);
    container.appendChild(icon);
  });

  // Right-click on frame background: add bookmark
  container.addEventListener("contextmenu", e => {
    if (e.target === container) {
      e.preventDefault();
      const url = prompt("Enter bookmark URL:");
      if (!url || !isValidUrl(url)) return;

      const icon = createBookmarkIcon(url, null, tab, id);
      container.appendChild(icon);
      saveBookmark(tab, id, url);
    }
  });

  // Enable drag-and-drop (optional: integrate Sortable.js here)
}

function createBookmarkIcon(url, customIcon, tab, id) {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener";
  link.className = "bookmark-icon-button";
  link.title = getShortName(url);

  const img = document.createElement("img");
  img.src = customIcon || `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`;
  img.alt = "bookmark icon";
  img.width = ICON_SIZE;
  img.height = ICON_SIZE;

  link.appendChild(img);

  // Context menu on icon
  link.addEventListener("contextmenu", e => {
    e.preventDefault();
    const action = prompt("Edit, Delete or Change Icon? (e/d/c):");
    if (action === "d") {
      link.remove();
      removeBookmark(tab, id, url);
    } else if (action === "c") {
      const newUrl = prompt("Enter new icon URL:");
      if (newUrl) {
        img.src = newUrl;
        updateFavicon(tab, id, url, newUrl);
      }
    } else if (action === "e") {
      const newUrl = prompt("Edit URL:", url);
      if (newUrl && newUrl !== url) {
        link.href = newUrl;
        link.title = getShortName(newUrl);
        img.src = `https://www.google.com/s2/favicons?domain=${new URL(newUrl).hostname}`;
        updateBookmark(tab, id, url, newUrl);
      }
    }
  });

  return link;
}

function getShortName(url) {
  try {
    const { hostname } = new URL(url);
    return hostname.replace("www.", "");
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

function saveBookmark(tab, id, url) {
  const frame = findFrame(tab, id);
  if (!frame.data.urls) frame.data.urls = [];
  frame.data.urls.push(url);
  saveFrameData(tab);
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

function findFrame(tab, id) {
  return window.framesData?.[tab]?.find(f => f.id === id);
}

function saveFrameData(tab) {
  const docRef = doc(db, "tabFrames", tab);
  setDoc(docRef, { frames: window.framesData[tab] });
}
