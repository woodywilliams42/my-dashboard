import { db } from './firebase.js';
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

let currentTab = 'work';
let framesData = {}; // { work: [...], personal: [...], etc. }

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

  const frameContainer = document.getElementById(tab);
  if (frameContainer) {
    frameContainer.appendChild(frame);
  }

  if (type === "bookmark") {
    const container = content.querySelector(".bookmark-frame");

    container.querySelector(".add-bookmark").addEventListener("click", () => {
      const input = container.querySelector(".bookmark-input");
      const url = input.value.trim();
      if (!url) return;

      try {
        new URL(url);
      } catch {
        alert("Invalid URL");
        return;
      }

      const list = container.querySelector(".bookmark-list");
      const encoded = encodeURIComponent(url);

      list.insertAdjacentHTML("beforeend", `
        <div class="bookmark-item">
          <a href="${url}" target="_blank" rel="noopener">${url}</a>
          <button data-url="${encoded}" class="remove-bookmark">×</button>
        </div>
      `);

      input.value = "";

      const frameData = framesData[tab].find(f => f.id === id);
      if (!frameData.data.urls) frameData.data.urls = [];
      frameData.data.urls.push(url);
      saveFrames(tab);
    });

    container.querySelector(".bookmark-list").addEventListener("click", (e) => {
      if (e.target.classList.contains("remove-bookmark")) {
        const url = decodeURIComponent(e.target.dataset.url);
        const frameData = framesData[tab].find(f => f.id === id);
        frameData.data.urls = frameData.data.urls.filter(u => u !== url);
        e.target.parentElement.remove();
        saveFrames(tab);
      }
    });
  }
}

function renderContent(type, data, id, tab) {
  if (type === "note") {
    return `<textarea id="note-${id}" class="note-box">${data.content || ""}</textarea>`;
  }
  if (type === "quick") {
    return `<p>Quick Comment block (TBD)</p>`;
  }
  if (type === "bookmark") {
    const links = (data.urls || []).map(url => {
      const safeUrl = encodeURIComponent(url);
      return `
        <div class="bookmark-item">
          <a href="${url}" target="_blank" rel="noopener">${url}</a>
          <button data-url="${safeUrl}" class="remove-bookmark">×</button>
        </div>
      `;
    }).join("");

    return `
      <div class="bookmark-frame" data-frame-id="${id}">
        <input type="url" class="bookmark-input" placeholder="https://example.com" />
        <button class="add-bookmark">Add</button>
        <div class="bookmark-list">${links}</div>
      </div>
    `;
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
  const container = document.getElementById(tab);
  if (!container) return;

  container.innerHTML = ""; // clear content

  const snap = await getDoc(doc(db, "tabFrames", tab));
  const frames = snap.exists() ? snap.data().frames || [] : [];
  framesData[tab] = frames;

  if (frames.length === 0) {
    container.innerHTML = `<p class="empty-tab-message">No frames yet on the "${tab}" tab.</p>`;
  } else {
    frames.forEach(frame => createFrame(frame, tab));
  }
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

// --- Add Frame Button Handler ---
document.getElementById("addFrameBtn").addEventListener("click", () => {
  const type = document.getElementById("frameType").value;
  addNewFrame(type, currentTab);
});
