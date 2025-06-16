
// frames.js
import { saveNotes, setupAutosave } from './notes.js'; // example: import your feature logic

let frameIdCounter = 0;

// Utility: make a div draggable
function makeDraggable(el) {
  let offsetX, offsetY;
  el.addEventListener("mousedown", (e) => {
    if (!e.target.closest("h3")) return;
    e.preventDefault();
    offsetX = e.clientX - el.offsetLeft;
    offsetY = e.clientY - el.offsetTop;

    function move(e) {
      el.style.left = `${e.clientX - offsetX}px`;
      el.style.top = `${e.clientY - offsetY}px`;
    }

    function stop() {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", stop);
    }

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", stop);
  });
}

export function createFrame(tab, type = "note", initialData = {}) {
  const container = document.getElementById(tab);
  const frame = document.createElement("div");
  frame.className = "frame-component";
  frame.style.top = initialData.top || "100px";
  frame.style.left = initialData.left || "100px";
  frame.style.width = initialData.width || "300px";
  frame.style.height = initialData.height || "200px";
  frame.dataset.tab = tab;
  frame.dataset.type = type;
  frame.dataset.id = frameIdCounter++;

  // === Inner Content Based on Type ===
  switch (type) {
    case "note":
      frame.innerHTML = `
        <h3>Note</h3>
        <textarea class="note-content" rows="6" placeholder="Enter note...">${initialData.content || ""}</textarea>
        <span class="save-status"></span>
      `;
      setupAutosave(frame); // Hook your autosave logic
      break;

    case "bookmark":
      frame.innerHTML = `<h3>Bookmark Panel</h3><p>[Bookmark UI will be inserted here]</p>`;
      break;

    case "quick-comment":
      frame.innerHTML = `<h3>Quick Comments</h3><div class="quick-comments">[buttons go here]</div>`;
      break;

    case "timer":
      frame.innerHTML = `<h3>Countdown</h3><div class="led green">00:00</div>`;
      break;

    default:
      frame.innerHTML = `<h3>Unknown Type</h3>`;
  }

  makeDraggable(frame);
  container.appendChild(frame);
}
