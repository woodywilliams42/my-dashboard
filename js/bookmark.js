// === Bookmarks ===
import { app } from './firebase.js';
import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = getFirestore(app);
import { framesData } from './frames.js';

const ICON_SIZE = 32;
const CUSTOM_ICON_BASE_URL = "https://raw.githubusercontent.com/woodywilliams42/my-dashboard/main/favicons/";
const GITHUB_API_URL = "https://api.github.com/repos/woodywilliams42/my-dashboard/contents/favicons";

async function fetchAvailableIcons() {
  try {
    const res = await fetch(GITHUB_API_URL);
    if (!res.ok) throw new Error("Failed to fetch icons");
    const files = await res.json();
    return files
      .filter(f => /\.(png|jpe?g|ico)$/i.test(f.name))
      .map(f => f.name);
  } catch (err) {
    console.error("Error fetching icons from GitHub:", err);
    return [];
  }
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

export function setupBookmarkFrame(frameEl, data, tab, id) {
  const frameContent = frameEl.querySelector(".frame-content");
  if (!frameContent) return;

  const container = document.createElement("div");
  container.className = "bookmark-icon-frame";
  container.dataset.frameId = id;
  frameContent.appendChild(container);

  // Add save status element
  const statusEl = document.createElement("div");
  statusEl.className = "bookmark-save-status";
  frameContent.appendChild(statusEl);

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
      saveFrameData(tab, frameEl);
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
    saveFrameData(tab, frameEl);
  });

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
      saveFrameData(tab, frameEl);
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

    document.querySelector(".bookmark-context-menu")?.remove();

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
      menu.remove();

      if (action === "delete") {
        link.remove();
        removeBookmark(tab, id, url);
      } else if (action === "edit") {
        openBookmarkEditDialog(link, tab, id, entry);
      }
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
    <label>
      Icon:
      <select class="icon-picker"><option>Loading...</option></select>
    </label>
    <div class="icon-preview-grid"></div>
    <label>Custom icon filename (optional): <input type="text" class="edit-bookmark-icon" value=""></label>
    <div class="edit-dialog-actions">
      <button class="start-button edit-save-btn" disabled style="opacity:0.5;cursor:not-allowed;">✅ Save</button>
      <button class="start-button cancel-button edit-cancel-btn">❌ Cancel</button>
    </div>
  `;
  document.body.appendChild(dialog);

  const rect = linkEl.getBoundingClientRect();
  dialog.style.top = `${rect.bottom + window.scrollY}px`;
  dialog.style.left = `${rect.left + window.scrollX}px`;

  const urlInput = dialog.querySelector(".edit-bookmark-url");
  const tooltipInput = dialog.querySelector(".edit-bookmark-tooltip");
  const iconInput = dialog.querySelector(".edit-bookmark-icon");
  const iconPicker = dialog.querySelector(".icon-picker");
  const saveBtn = dialog.querySelector(".edit-save-btn");
  const cancelBtn = dialog.querySelector(".edit-cancel-btn");
  const iconPreviewGrid = dialog.querySelector(".icon-preview-grid");

  const validateInputs = () => {
    const urlValid = urlInput.value.trim() && isValidUrl(urlInput.value.trim());
    saveBtn.disabled = !urlValid;
    saveBtn.style.opacity = urlValid ? "1" : "0.5";
    saveBtn.style.cursor = urlValid ? "pointer" : "not-allowed";
  };

  fetchAvailableIcons().then(iconList => {
    iconPicker.innerHTML = `<option value="">Default (site favicon)</option>`;
    iconList.forEach(file => {
      const opt = document.createElement("option");
      opt.value = file;
      opt.textContent = file;
      if (bookmark.icon === file) opt.selected = true;
      iconPicker.appendChild(opt);

      const img = document.createElement("img");
      img.src = `${CUSTOM_ICON_BASE_URL}${file}`;
      img.dataset.file = file;
      img.className = "icon-preview-img";
      img.style.cssText = "width:32px;height:32px;cursor:pointer;border:1px solid #ccc;margin:2px;";
      iconPreviewGrid.appendChild(img);
    });

    if (!iconList.includes(bookmark.icon) && bookmark.icon) {
      iconInput.value = bookmark.icon;
      iconPicker.value = "";
      iconInput.disabled = false;
    }
  });

  iconPicker.addEventListener("change", () => {
    if (iconPicker.value) {
      iconInput.value = "";
      iconInput.disabled = true;
    } else {
      iconInput.disabled = false;
    }
  });

  iconPreviewGrid.addEventListener("click", e => {
    if (e.target.classList.contains("icon-preview-img")) {
      iconPicker.value = e.target.dataset.file;
      iconInput.value = "";
      iconInput.disabled = true;
    }
  });

  urlInput.addEventListener("input", validateInputs);
  validateInputs();

  saveBtn.addEventListener("click", async () => {
    const newUrl = urlInput.value.trim();
    const newTooltip = tooltipInput.value.trim() || getShortName(newUrl);
    const newIcon = iconPicker.value || iconInput.value.trim();

    if (!newUrl || !isValidUrl(newUrl)) {
      alert("Please enter a valid URL.");
      return;
    }

    if (newIcon && !/^[\w,\s-]+\.(png|jpg|jpeg|ico)$/i.test(newIcon)) {
      alert("Icon filename is invalid. Use png, jpg, jpeg, or ico formats.");
      return;
    }

    const iconExistsFlag = newIcon ? await iconExists(newIcon) : true;
    if (!iconExistsFlag) {
      alert(`Icon file "${newIcon}" not found in GitHub storage.`);
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

    const frameEl = document.querySelector(`.frame[data-id="${id}"]`);
    updateBookmark(tab, id, originalUrl, { url: newUrl, tooltip: newTooltip, icon: newIcon }, frameEl);
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

async function iconExists(filename) {
  const url = `${CUSTOM_ICON_BASE_URL}${filename}`;
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
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

function saveFrameData(tab, frameEl = null) {
  const docRef = doc(db, "tabFrames", tab);
  if (frameEl) showSaveStatus(tab, frameEl, "Saving...");
  setDoc(docRef, { frames: framesData[tab] })
    .then(() => {
      if (frameEl) showSaveStatus(tab, frameEl, "✔ Saved!");
    })
    .catch(err => {
      console.error("Save failed:", err);
      if (frameEl) showSaveStatus(tab, frameEl, "❌ Save failed!");
    });
}

function removeBookmark(tab, id, url) {
  const frame = findFrame(tab, id);
  frame.data.urls = normalizeBookmarks(frame.data.urls).filter(b => b.url !== url);
  const frameEl = document.querySelector(`.frame[data-id="${id}"]`);
  saveFrameData(tab, frameEl);
}

function updateBookmark(tab, id, oldUrl, newEntry, frameEl = null) {
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

  saveFrameData(tab, frameEl);
}

function showSaveStatus(tab, frameEl, status) {
  let statusEl = frameEl.querySelector(".bookmark-save-status");
  if (!statusEl) {
    statusEl = document.createElement("div");
    statusEl.className = "bookmark-save-status";
    frameEl.querySelector(".frame-content")?.appendChild(statusEl);
  }

  statusEl.textContent = status;
  statusEl.style.opacity = 1;

  if (status === "✔ Saved!") {
    setTimeout(() => {
      statusEl.style.opacity = 0;
    }, 2000);
  }
}
