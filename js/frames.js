import { db } from './firebase.js';
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const frameContainer = document.body; // or a more specific container if needed
let currentTab = 'work';
let framesData = {}; // { work: [...], personal: [...] }

function generateFrameId(type) {
  return `${type}-${Math.random().toString(36).substr(2, 6)}`;
}

function saveFrames(tab) {
  const docRef = doc(db, "tabFrames", tab);
  const dataToSave = { frames: framesData[tab] || [] };
  setDoc(docRef, dataToSave).catch(err => console.error("Error saving frames:", err));
}

function createFrame({ id, type, x, y, width, height, data = {} }, tab) {
  const frame = document.createElement("div");
  frame.className = "frame-component";
  frame.dataset.id = id;
  frame.style.left = `${x}px`;
  frame.style.top = `${y}px`;
  frame.style.width = `${width}px`;
  frame.style.height = `${height}px`;
  frame.style.position = "absolute";

  const header = document.createElement("div");
  header.className = "frame-header";
  header.textContent = `${type.toUpperCase()} (${id})`;
  frame.appendChild(header);

  const content = document.createElement("div");
  content.className = "frame-content";
  content.innerHTML = renderContent(type, data, id, tab);
  frame.appendChild(content);

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-frame";
  deleteBtn.textContent = "×";
  deleteBtn.onclick = () => {
    frame.remove();
    framesData[tab] = framesData[tab].filter(f => f.id !== id);
    saveFrames(tab);
  };
  frame.appendChild(deleteBtn);

  makeResizableDraggable(frame, tab);
  frameContainer.appendChild(frame);
}

// Placeholder render logic
function renderContent(type, data, id, tab) {
  if (type === "note") {
    return `<textarea id="note-${id}" class="note-box">${data.content || ""}</textarea>`;
  }
  if (type === "quick") {
    return `<p>Quick Comment block (TBD)</p>`;
  }
  if (type === "bookmark") {
    return `<p>Bookmark list (TBD)</p>`;
  }
  if (type === "timer") {
    return `<p>Countdown timer (TBD)</p>`;
  }
  return `<p>Unknown frame type</p>`;
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

  const resizeObserver = new ResizeObserver(() => updateFrameData(el, tab));
  resizeObserver.observe(el);
}

function updateFrameData(el, tab) {
  const id = el.dataset.id;
  const frame = framesData[tab].find(f => f.id === id);
  if (frame) {
    frame.x = parseInt(el.style.left);
    frame.y = parseInt(el.style.top);
    frame.width = parseInt(el.style.width);
    frame.height = parseInt(el.style.height);
    // Additional updates for type-specific content can be done here
    const textarea = el.querySelector("textarea");
    if (textarea) {
      frame.data.content = textarea.value;
    }
    saveFrames(tab);
  }
}

// --- Public Functions ---

export async function loadFramesForTab(tab) {
  currentTab = tab;
  const snap = await getDoc(doc(db, "tabFrames", tab));
  framesData[tab] = snap.exists() ? snap.data().frames || [] : [];
  framesData[tab].forEach(frame => createFrame(frame, tab));
}

export function addNewFrame(type, tab) {
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
  framesData[tab].push(newFrame);
  createFrame(newFrame, tab);
  saveFrames(tab);
}

// --- Frame Add UI Controls ---
document.getElementById("addFrameBtn").addEventListener("click", () => {
  const type = document.getElementById("frameType").value;
  addNewFrame(type, currentTab);
});
