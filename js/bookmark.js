// bookmark.js
import { db } from './firebase.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const ICON_SIZE = 32;

export function setupBookmarkFrame(frameEl, data, tab, id) {
  const frameContent = frameEl.querySelector(".frame-content");
  if (!frameContent) {
    console.warn("Frame content not found for bookmark frame:", id);
    return;
  }

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

  // Right-click background to add new bookmark
  container.addEventListener("contextmenu", e => {
    if (e.target !== container) return;
    e.preventDefault();

    const url = prompt("Enter bookmark URL:");
    if (!url || !isValidUrl(url)) return;

    const icon = createBookmarkIcon(url, null, tab, id);
    container.appendChild(icon);

    const frame = findFrame(tab, id);
    if (!frame.data.urls) frame.data.urls = [];
    frame.data.urls.push(url);
    saveFrameData(tab);
  });
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
  img.alt = "Bookmark icon";
  img.width = ICON_SIZE;
  img.height = ICON_SIZE;
  link.appendChild(img);

  // Right-click icon menu
  link.addEventListener("contextmenu", e => {
    e.preventDefault();
    const choice = prompt("Edit (e), Delete (d), Change Icon (c):");

    if (choice === "d") {
      link.remove();
      removeBookmark(tab, id, url);
    } else if (choice === "c") {
      const newIconUrl = prompt("New icon URL:");
      if (newIconUrl) {
        img.src = newIconUrl;
        updateFavicon(tab, id, url, newIconUrl);
      }
    } else if (choice === "e") {
      const newUrl = prompt("Edit URL:", url);
      if (newUrl && isValidUrl(newUrl)) {
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
  if (!window.framesData || !window.framesData[tab]) return null;
  return window.framesData[tab].find(f => f.id === id);
}


function saveFrameData(tab) {
  if (!window.framesData || !window.framesData[tab]) return;
  const docRef = doc(db, "tabFrames", tab);
  setDoc(docRef, { frames: window.framesData[tab] }).catch(console.error);
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
