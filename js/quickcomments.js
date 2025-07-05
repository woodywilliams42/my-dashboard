import { framesData } from './frames.js'; 
import { db } from './firebase.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const GITHUB_USER = 'woodywilliams42';
const GITHUB_REPO = 'my-dashboard';
const ICONS_PATH = 'favicons';

export async function fetchAvailableIcons() {
  try {
    const resp = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${ICONS_PATH}`);
    if (!resp.ok) return [];
    const files = await resp.json();
    return files.filter(f => f.type === 'file').map(f => f.name);
  } catch (e) { console.error(e); return []; }
}

export async function openBookmarkEditDialog(targetBtn, tab, id, existing = null) {
  document.querySelector(".bookmark-edit-dialog")?.remove();
  const availableIcons = await fetchAvailableIcons();

  const dialog = document.createElement("div");
  dialog.className = "bookmark-edit-dialog";
  dialog.innerHTML = `
    <label>Label: <input type="text" class="bookmark-label" value="${existing?.tooltip||''}"></label>
    <label>URL: <input type="text" class="bookmark-url" value="${existing?.url||''}"></label>
    <label>Icon Filename: <input type="text" class="bookmark-icon-filename" value="${existing?.icon||''}"></label>
    <button class="show-icon-picker">🖼️ Pick Icon</button>
    <div class="icon-picker-grid" style="display:none;"></div>
    <div class="dialog-actions">
      <button class="save-btn">✅ Save</button>
      <button class="cancel-btn">❌ Cancel</button>
    </div>
  `;
  document.body.appendChild(dialog);

  const rect = targetBtn.getBoundingClientRect();
  dialog.style.top = `${rect.bottom + window.scrollY}px`;
  dialog.style.left = `${rect.left + window.scrollX}px`;

  const labelInput = dialog.querySelector(".bookmark-label");
  const urlInput = dialog.querySelector(".bookmark-url");
  const iconInput = dialog.querySelector(".bookmark-icon-filename");
  const pickerBtn = dialog.querySelector(".show-icon-picker");
  const iconGrid = dialog.querySelector(".icon-picker-grid");
  const saveBtn = dialog.querySelector(".save-btn");
  const cancelBtn = dialog.querySelector(".cancel-btn");

  pickerBtn.addEventListener("click", () => {
    iconGrid.style.display = iconGrid.style.display === 'none' ? 'flex' : 'none';
    if (!iconGrid.childElementCount) {
      availableIcons.forEach(fn => {
        const img = document.createElement("img");
        img.src = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/${ICONS_PATH}/${fn}`;
        img.title = fn;
        img.addEventListener("click", () => {
          iconInput.value = fn;
          iconGrid.style.display = 'none';
        });
        iconGrid.appendChild(img);
      });
    }
  });

  saveBtn.addEventListener("click", () => {
    const tooltip = labelInput.value.trim();
    const url = urlInput.value.trim();
    const icon = iconInput.value.trim();

    if (!url) return;
    if (icon && !availableIcons.includes(icon)) {
      alert("Icon filename not found!");
      return;
    }

    const frame = framesData[tab].find(f => f.id === id);
    frame.data.urls = frame.data.urls || [];
    if (existing) {
      existing.tooltip = tooltip;
      existing.url = url;
      existing.icon = icon;
    } else {
      frame.data.urls.push({ tooltip, url, icon });
    }
    const docRef = doc(db, "tabFrames", tab);
    setDoc(docRef, { frames: framesData[tab] }).catch(console.error);
    dialog.remove();
  });

  cancelBtn.addEventListener("click", () => dialog.remove());
  const outsideClick = e => {
    if (!dialog.contains(e.target)) {
      dialog.remove();
      document.removeEventListener("click", outsideClick);
    }
  };
  setTimeout(() => document.addEventListener("click", outsideClick), 10);
}
