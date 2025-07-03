import { framesData } from './frames.js';
import { db } from './firebase.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// Helper functions
function getShortName(url) {
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function saveFrameData(tab) {
  const docRef = doc(db, "tabFrames", tab);
  setDoc(docRef, { frames: framesData[tab] }).catch(console.error);
}

// Main setup function for the bookmark frame
export function setupBookmarkFrame(frameEl, data, tab, id) {
  const container = document.createElement("div");
  container.className = "bookmark-frame-container";
  frameEl.querySelector(".frame-content").appendChild(container);

  // Ensure bookmarks array exists
  if (!data.bookmarks) data.bookmarks = [];

  // Helper to render bookmarks
  function renderBookmarks() {
    container.innerHTML = "";
    data.bookmarks.forEach((bookmark, idx) => {
      const icon = document.createElement("a");
      icon.href = bookmark.url;
      icon.target = "_blank";
      icon.className = "bookmark-icon";
      icon.setAttribute("draggable", "true");
      icon.dataset.idx = idx;
      icon.title = bookmark.tooltip || getShortName(bookmark.url);
      if (bookmark.icon) {
        icon.innerHTML = `<img src="${bookmark.icon}" alt="icon" />`;
      } else {
        icon.textContent = bookmark.tooltip || getShortName(bookmark.url);
      }

      // Drag and drop handlers
      icon.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", idx);
        icon.classList.add("dragging");
      });
      icon.addEventListener("dragend", () => {
        icon.classList.remove("dragging");
      });

      // Allow dropping onto another icon to reorder
      icon.addEventListener("dragover", (e) => {
        e.preventDefault();
        icon.classList.add("drag-over");
      });
      icon.addEventListener("dragleave", () => {
        icon.classList.remove("drag-over");
      });

      icon.addEventListener("drop", (e) => {
        e.preventDefault();
        icon.classList.remove("drag-over");
        const fromIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
        const toIdx = idx;
        if (fromIdx !== toIdx) {
          const [moved] = data.bookmarks.splice(fromIdx, 1);
          data.bookmarks.splice(toIdx, 0, moved);
          saveFrameData(tab);
          renderBookmarks();
        }
      });

      container.appendChild(icon);
    });
  }

  renderBookmarks();
}
