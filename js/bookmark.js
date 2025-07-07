import { db } from './firebase.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { framesData } from './frames.js';

const ICON_SIZE = 32;
const CUSTOM_ICON_BASE_URL = "https://raw.githubusercontent.com/woodywilliams42/my-dashboard/main/favicons/";

const AVAILABLE_ICONS = [
  "Icon1.png",
  "Icon2.png",
  "StarIcon.jpg",
  "StarIcon2.jpg",
  "StarIcon3.jpg",
  // Add more filenames here
];

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
      data.urls = nor
