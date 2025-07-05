import { db } from './firebase.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { framesData } from './frames.js';

const ICON_SIZE = 32;
const CUSTOM_ICON_BASE_URL = "https://raw.githubusercontent.com/woodywilliams42/my-dashboard/main/favicons/";

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

  // Sortable.js integration
  new Sortable(container, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    onEnd: () => {
      const newOrder = Array.from(container.children).map(a => ({
        url: a.href,
        tooltip: a.title,
        icon: a.querySelector('img')?.src.includes(CUSTOM_ICON_BASE_URL)
          ? a.querySelector('img').src.replace(CUSTOM_ICON_BASE_URL, "")
          : ""
      }));
      data.urls = normalizeBookmarks(newOrder);
      saveFrameData(tab);
    }
  });
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
  img.src = icon ? `${CUSTOM_ICON_BASE_URL}${icon}` : `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`;
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
        openBookmarkEditDialog(link, tab, id, entry);
      }
      menu.remove();
    });
  });

  return link;
}

export function openBookmarkEditDialog(linkEl, tab, id, bookmark) {
  document.querySelector(".bookmark-edit-dialog")?.remove();

  const imgEl = linkEl.querySelector("img");
  const originalUrl = bookmark.url;

  const dialog = document.createElement("div");
  dialog.className = "bookmark-edit-dialog";
  dialog.innerHTML = `
    <label>URL: <input type="text" class="edit-bookmark-url" value="${bookmark.url}"></label>
    <label>Tooltip: <input type="text" class="edit-bookmark-tooltip" value="${bookmark.tooltip}"></label>
    <label>Icon filename (e.g., myicon.png): <input type="text" class="edit-bookmark-icon" value="${bookmark.icon}"></label>
    <div class="edit-dialog-actions">
      <button class="edit-save-btn" disabled>✅ Save</button>
      <button class="edit-cancel-btn">❌ Cancel</button>
    </div>
  `;
  document.body.appendChild(dialog);

  const rect = linkEl.getBoundingClientRect();
  dialog.style.top = `${rect.bottom + window.scrollY}px`;
  dialog.style.left = `${rect.left + window.scrollX}px`;

  const urlInput = dialog.querySelector(".edit-bookmark-url");
  const tooltipInput = dialog.querySelector(".edit-bookmark-tooltip");
  const iconInput = dialog.querySelector(".edit-bookmark-icon");
  const saveBtn = dialog.querySelector(".edit-save-btn");
  const cancelBtn = dialog.querySelector(".edit-cancel-btn");

  const validateInputs = () => {
    const urlValid = urlInput.value.trim() && isValidUrl(urlInput.value.trim());
    saveBtn.disabled = !urlValid;
  };

  urlInput.addEventListener("input", validateInputs);
  validateInputs();

  saveBtn.addEventListener("click", () => {
    const newUrl = urlInput.value.trim();
    const newTooltip = tooltipInput.value.trim() || getShortName(newUrl);
    const newIcon = iconInput.value.trim();

    if (!newUrl || !isValidUrl(newUrl)) {
      alert("Please enter a valid URL.");
      return;
    }

    if (newIcon && !/^[\w,\s-]+\.(png|jpg|jpeg|ico)$/i.test(newIcon)) {
      alert("Icon filename is invalid. Use png, jpg, jpeg, or ico formats.");
      return;
    }

    bookmark.url = newUrl;
    bookmark.tooltip = newTooltip;
    bookmark.icon = newIcon;

    linkEl.href = newUrl;
    linkEl.title = newTooltip;
    imgEl.src = newIcon
      ? `${CUSTOM_ICON_BASE_URL}${newIcon}`
      : `https://www.google.com/s2/favicons?domain=${new URL(newUrl).hostname}`;

    updateBookmark(tab, id, originalUrl, { url: newUrl, tooltip: newTooltip, icon: newIcon });
    dialog.remove();
  });

  cancelBtn.addEventListener("click", () => dialog.remove());

  const outsideClickHandler = (e) => {
    if (!dialog.contains(e.target)) {
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
