// === Frames ===
import { app } from './firebase.js';
import {
  getFirestore,
  getDoc,
  setDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const db = getFirestore(app);
const auth = getAuth(app);

import { setupBookmarkFrame } from './bookmark.js';
import { setupTimerFrame } from './timer.js';
import { setupNoteFrame } from './notes.js';
import { setupQuickCommentsFrame } from './quickcomments.js';

let currentTab = null;
export let framesData = window.framesData = {};

// Setup Context Menu if missing
if (!document.getElementById("frame-context-menu")) {
  const menu = document.createElement("div");
  menu.id = "frame-context-menu";
  menu.className = "frame-context-menu";
  menu.style.display = "none";
  menu.style.position = "absolute";
  menu.style.zIndex = 999;
  menu.innerHTML = `
    <ul>
      <li data-action="rename">📝 Rename Frame</li>
      <li data-action="export">💾 Export Frame Data</li>
      <li data-action="info">ℹ️ Frame Info</li>
      <li data-action="delete">🗑️ Delete Frame</li>
    </ul>`;
  document.body.appendChild(menu);
}

function generateFrameId(type) {
  return `${type}-${Math.random().toString(36).substr(2, 6)}`;
}

function saveFrames(tab) {
  const docRef = doc(db, "tabFrames", tab);
  const dataToSave = { frames: framesData[tab] || [] };
  setDoc(docRef, dataToSave).catch(err => console.error("Error saving frames:", err));
}

document.getElementById("frame-context-menu")?.addEventListener("click", (e) => {
  const action = e.target.dataset.action;
  const menu = e.currentTarget;
  const tab = menu.dataset.tab;
  const id = menu.dataset.id;

  if (!tab || !id || !framesData[tab]) return;
  const frameData = framesData[tab].find(f => f.id === id);
  const frameEl = document.querySelector(`.frame-component[data-id="${id}"]`);
  const header = frameEl?.querySelector(".frame-header");

  if (!frameData) return;

  switch (action) {
    case "rename":
      const newTitle = prompt("Enter new title:", frameData.data.title || "") ?? "";
      frameData.data.title = newTitle.trim();
      if (header) header.childNodes[0].nodeValue = newTitle.trim();
      saveFrames(tab);
      break;
    case "export":
      navigator.clipboard.writeText(JSON.stringify(frameData, null, 2));
      alert("Frame data copied to clipboard.");
      break;
    case "info":
      alert(`Frame Type: ${frameData.type}\nUID: ${id}`);
      break;
    case "delete":
      frameEl?.remove();
      framesData[tab] = framesData[tab].filter(f => f.id !== id);
      saveFrames(tab);
      break;
  }
  menu.style.display = "none";
});

document.addEventListener("click", () => {
  const menu = document.getElementById("frame-context-menu");
  if (menu) menu.style.display = "none";
});

function createFrame(frameObj, tab) {
  const { id, type, x, y, width, height, data = {} } = frameObj;
  const frame = document.createElement("div");
  frame.className = "frame-component";
  frame.dataset.id = id;
  Object.assign(frame.style, {
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`,
    position: "absolute"
  });

  const header = document.createElement("div");
  header.className = "frame-header";
  header.textContent = data.title || type.charAt(0).toUpperCase() + type.slice(1);
  frame.appendChild(header);

  const menuBtn = document.createElement("button");
  menuBtn.className = "frame-menu-button";
  menuBtn.innerText = "⋮";
  header.appendChild(menuBtn);

  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const rect = menuBtn.getBoundingClientRect();
    showFrameContextMenu(rect.left, rect.bottom, tab, id);
  });

  const content = document.createElement("div");
  content.className = "frame-content";
  frame.appendChild(content);

  const container = document.getElementById(tab);
  container?.appendChild(frame);

  if (type === "timer") {
    setupTimerFrame(frame, data, tab, id);
  } else if (type === "bookmark") {
    setupBookmarkFrame(frame, data, tab, id);
  } else if (type === "note") {
    setupNoteFrame(frame, data, tab, id);
  } else if (type === "quick") {
    setupQuickCommentsFrame(frame, data, tab, id);
  }

  makeResizableDraggable(frame, tab);
}

function showFrameContextMenu(x, y, tab, id) {
  const menu = document.getElementById("frame-context-menu");
  if (!menu) return;
  menu.style.top = `${y}px`;
  menu.style.left = `${x}px`;
  menu.style.display = "block";
  menu.dataset.tab = tab;
  menu.dataset.id = id;
}

function makeResizableDraggable(el, tab) {
  el.onmousedown = function (e) {
    if (!e.target.classList.contains("frame-header")) return;
    const offsetX = e.clientX - el.offsetLeft;
    const offsetY = e.clientY - el.offsetTop;

    function moveAt(e) {
      el.style.left = `${e.clientX - offsetX}px`;
      el.style.top = `${e.clientY - offsetY}px`;
    }

    function onMouseUp() {
      updateFrameData(el, tab);
      document.removeEventListener("mousemove", moveAt);
      document.removeEventListener("mouseup", onMouseUp);
    }

    document.addEventListener("mousemove", moveAt);
    document.addEventListener("mouseup", onMouseUp);
  };

  new ResizeObserver(() => updateFrameData(el, tab)).observe(el);
}

function updateFrameData(el, tab) {
  const id = el.dataset.id;
  const frame = framesData[tab]?.find(f => f.id === id);
  if (frame) {
    frame.x = parseInt(el.style.left);
    frame.y = parseInt(el.style.top);
    frame.width = parseInt(el.style.width);
    frame.height = parseInt(el.style.height);
    saveFrames(tab);
  }
}

async function loadFramesForTab(tab, user = null) {
  currentTab = tab;
  const container = document.getElementById(tab);
  if (!container) return;

  if (!user) {
    user = await new Promise(resolve => {
      const unsub = onAuthStateChanged(auth, u => {
        unsub();
        resolve(u);
      });
    });
  }

  const allowedUIDs = ["L9XDBQpraqPwVkZFkqy6Vd5VvWC3"];
  if (!user || !allowedUIDs.includes(user.uid)) {
    console.warn("🚫 Unauthorized user — cannot load frames.");
    container.innerHTML = `<p style="text-align:center;color:gray;">🚫 You are not authorized to view this tab's frames.</p>`;
    framesData[tab] = [];
    return;
  }

  try {
    const snap = await getDoc(doc(db, "tabFrames", tab));
    if (snap.exists()) {
      const frames = snap.data().frames || [];
      console.log("✅ Loaded frames for tab:", tab, frames);
      framesData[tab] = frames;
      container.innerHTML = frames.length === 0
        ? `<p class="empty-tab-message">No frames yet on "${tab}".</p>`
        : "";
      frames.forEach(frame => createFrame(frame, tab));
    } else {
      container.innerHTML = `<p class="empty-tab-message">No frames found for this tab.</p>`;
    }
  } catch (err) {
    console.error("🔥 Error loading frames:", err);
    container.innerHTML = `<p class="empty-tab-message">⚠️ Error loading frames.</p>`;
  }
}

function addNewFrame(type, tab) {
  const id = generateFrameId(type);
  const newFrame = {
    id,
    type,
    x: 100,
    y: 100,
    width: 300,
    height: 200,
    data: {}
  };
  if (!framesData[tab]) framesData[tab] = [];
  framesData[tab].push(newFrame);
  createFrame(newFrame, tab);
  saveFrames(tab);
}

export {
  loadFramesForTab,
  addNewFrame
};

// ✅ NEW: Auto-reload or clear frames on auth change
onAuthStateChanged(auth, (user) => {
  if (currentTab) {
    console.log("🔄 Auth state changed — reloading frames for:", currentTab);
    loadFramesForTab(currentTab, user);
  }
});
