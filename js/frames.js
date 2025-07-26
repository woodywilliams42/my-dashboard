import { app } from './firebase.js';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  getDoc,
  setDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"; // 🔄 NEW
const auth = getAuth(); // 🔄 NEW

const db = getFirestore(app);

import { setupBookmarkFrame } from './bookmark.js';
import { setupTimerFrame } from './timer.js';
import { setupNoteFrame } from './notes.js';
import { setupQuickCommentsFrame } from './quickcomments.js';

let currentTab = null;
export let framesData = window.framesData = {};

function generateFrameId(type) {
  return `${type}-${Math.random().toString(36).substr(2, 6)}`;
}

function saveFrames(tab) {
  const docRef = doc(db, "tabFrames", tab);
  const dataToSave = { frames: framesData[tab] || [] };
  setDoc(docRef, dataToSave).catch(err => console.error("Error saving frames:", err));
}

function createFrame(frameObj, tab) {
  const { id, type, x, y, width, height, data = {} } = frameObj;
  const frame = document.createElement("div");
  frame.className = "frame-component";
  frame.dataset.id = id;
  Object.assign(frame.style, { left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px`, position: "absolute" });

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

export function addNewFrame(type, tab) {
  const id = generateFrameId(type);
  const newFrame = { id, type, x: 100, y: 100, width: 300, height: 200, data: {} };
  framesData[tab].push(newFrame);
  createFrame(newFrame, tab);
  saveFrames(tab);
}

document.getElementById("addFrameBtn")?.addEventListener("click", () => {
  const type = document.getElementById("frameType")?.value;
  if (type) addNewFrame(type, currentTab);
});

// 🔄 ONLY LOAD FRAMES AFTER AUTH
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    console.warn("🔒 Not logged in – skipping frame load");
    return;
  }

  const tabs = document.querySelectorAll(".tab-content");
  tabs.forEach(tab => loadFramesForTab(tab.id));
});

// 🔄 This function is only called from inside auth listener now
async function loadFramesForTab(tab) {
  currentTab = tab;
  const container = document.getElementById(tab);
  if (!container) return;

  try {
    const snap = await getDoc(doc(db, "tabFrames", tab));
    const frames = snap.exists() ? snap.data().frames || [] : [];
    framesData[tab] = frames;
    container.innerHTML = frames.length === 0
      ? `<p class="empty-tab-message">No frames yet on "${tab}".</p>`
      : "";
    frames.forEach(frame => createFrame(frame, tab));
  } catch (err) {
    console.error("Failed to load frames:", err);
  }
}
