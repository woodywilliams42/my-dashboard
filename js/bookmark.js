// bookmarks.js
import { db } from './firebase.js';
import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let currentContextUrl = null;
let currentContextTab = null;
let currentContextImg = null;

// === Render Bookmarks ===
function renderBookmarks(tab, data) {
  const container = document.getElementById(`bookmark-bar-${tab}`);
  if (!container) return;

  container.innerHTML = "";
  const urls = data.urls || [];
  const favicons = data.favicons || {};

  urls.forEach(url => {
    const a = document.createElement("a");
    a.className = "bookmark-button";
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.title = url;
    a.classList.add("bookmark-link");

    const img = document.createElement("img");
    img.alt = "icon";

    if (favicons[url]) {
      img.src = favicons[url];
    } else {
      const fallback = new URL("/favicon.ico", url).href;
      img.src = fallback;
      img.onerror = () => {
        img.src = "https://www.google.com/s2/favicons?domain=" + url;
      };
    }

    const removeBtn = document.createElement("span");
    removeBtn.className = "remove";
    removeBtn.textContent = "×";
    removeBtn.onclick = (e) => {
      e.preventDefault();
      removeBookmark(tab, url);
    };

    a.appendChild(img);
    a.appendChild(removeBtn);
    container.appendChild(a);

    a.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      currentContextUrl = url;
      currentContextTab = tab;
      currentContextImg = img;

      const menu = document.getElementById("bookmark-context-menu");
      menu.style.top = `${e.pageY}px`;
      menu.style.left = `${e.pageX}px`;
      menu.style.display = "block";
    });
  });

  Sortable.create(container, {
    animation: 150,
    onEnd: async function () {
      const newOrder = Array.from(container.querySelectorAll("a")).map(a => a.href);
      try {
        await setDoc(doc(db, "dashboardBookmarks", tab), {
          urls: newOrder,
          favicons
        });
      } catch (err) {
        console.error("Error saving new bookmark order:", err);
      }
    }
  });
}

// === Load Bookmarks ===
export async function loadBookmarks(tab) {
  try {
    const snap = await getDoc(doc(db, "dashboardBookmarks", tab));
    if (snap.exists()) {
      const data = snap.data();
      renderBookmarks(tab, data);
    }
  } catch (err) {
    console.error(`Error loading bookmarks for ${tab}:`, err);
  }
}

// === Add Bookmark ===
export async function addBookmark(tab) {
  const input = document.getElementById(`newBookmarkUrl-${tab}`);
  const url = input.value.trim();

  try {
    new URL(url);
  } catch {
    alert("Please enter a valid URL (e.g. https://example.com)");
    return;
  }

  let urls = [];
  let favicons = {};
  try {
    const snap = await getDoc(doc(db, "dashboardBookmarks", tab));
    if (snap.exists()) {
      const data = snap.data();
      urls = Array.isArray(data.urls) ? data.urls : [];
      favicons = data.favicons || {};
    }
  } catch (err) {
    console.error("Error fetching bookmarks before add:", err);
  }

  if (!urls.includes(url)) {
    urls.push(url);
    try {
      await setDoc(doc(db, "dashboardBookmarks", tab), { urls, favicons });
      input.value = "";
      renderBookmarks(tab, { urls, favicons });
      closeBookmarkModal(tab);
    } catch (err) {
      console.error("Error saving bookmark:", err);
    }
  } else {
    alert("Bookmark already exists.");
  }
}

// === Remove Bookmark ===
export async function removeBookmark(tab, url) {
  const snap = await getDoc(doc(db, "dashboardBookmarks", tab));
  if (!snap.exists()) return;

  const urls = snap.data().urls || [];
  const updated = urls.filter(u => u !== url);
  await setDoc(doc(db, "dashboardBookmarks", tab), { urls: updated });
  renderBookmarks(tab, { urls: updated, favicons: snap.data().favicons || {} });
}

// === Bookmark Modal Functions ===
export function showBookmarkModal(tab) {
  document.getElementById(`bookmarkModal-${tab}`).style.display = 'flex';
}

export function closeBookmarkModal(tab) {
  document.getElementById(`bookmarkModal-${tab}`).style.display = 'none';
}

// === Init Modal Events ===
["work", "personal", "secondjob", "charity"].forEach(tab => {
  document.getElementById(`showBookmarkModal-${tab}`)?.addEventListener("click", () => showBookmarkModal(tab));
});

// === Context Menu Events ===
document.addEventListener("contextmenu", (e) => {
  const link = e.target.closest(".bookmark-button");
  if (!link) return;

  e.preventDefault();
  currentContextUrl = link.href;

  const bar = link.closest("[id^='bookmark-bar-']");
  if (bar) {
    currentContextTab = bar.id.replace("bookmark-bar-", "");
  }

  const menu = document.getElementById("bookmark-context-menu");
  menu.style.top = `${e.pageY}px`;
  menu.style.left = `${e.pageX}px`;
  menu.style.display = "block";
});

document.addEventListener("click", () => {
  document.getElementById("bookmark-context-menu").style.display = "none";
});

document.getElementById("bookmark-context-menu").addEventListener("click", async (e) => {
  const action = e.target.dataset.action;
  if (!action) return;

  if (action === "open") {
    window.open(currentContextUrl, "_blank");
  } else if (action === "copy") {
    await navigator.clipboard.writeText(currentContextUrl);
  } else if (action === "edit") {
    const newUrl = prompt("Edit bookmark URL:", currentContextUrl);
    if (newUrl && newUrl !== currentContextUrl) {
      const snap = await getDoc(doc(db, "dashboardBookmarks", currentContextTab));
      if (snap.exists()) {
        const urls = snap.data().urls || [];
        const index = urls.indexOf(currentContextUrl);
        if (index !== -1) {
          urls[index] = newUrl;
          await setDoc(doc(db, "dashboardBookmarks", currentContextTab), {
            urls,
            favicons: snap.data().favicons || {}
          });
          renderBookmarks(currentContextTab, { urls, favicons: snap.data().favicons || {} });
        }
      }
    }
  } else if (action === "remove") {
    await removeBookmark(currentContextTab, currentContextUrl);
  } else if (action === "change-favicon") {
    const newFaviconUrl = prompt("Enter URL of new favicon:");
    if (newFaviconUrl && currentContextImg && currentContextUrl && currentContextTab) {
      currentContextImg.src = newFaviconUrl;

      const snap = await getDoc(doc(db, "dashboardBookmarks", currentContextTab));
      if (snap.exists()) {
        const urls = snap.data().urls || [];
        const favicons = snap.data().favicons || {};
        if (urls.includes(currentContextUrl)) {
          favicons[currentContextUrl] = newFaviconUrl;
          await setDoc(doc(db, "dashboardBookmarks", currentContextTab), { urls, favicons });
        }
      }
    }
  }

  document.getElementById("bookmark-context-menu").style.display = "none";
});

