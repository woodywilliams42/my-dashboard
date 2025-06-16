// === FRAME COMPONENT MANAGER ===
const frameContainer = document.body; // You can change this to a specific tab container if needed
let frameIdCounter = 0;

function createFrame(type = "note", content = "") {
  const frame = document.createElement("div");
  frame.className = "frame-component";
  frame.style.top = `${100 + frameIdCounter * 20}px`;
  frame.style.left = `${100 + frameIdCounter * 20}px`;
  frame.setAttribute("data-frame-id", `frame-${frameIdCounter}`);
  frame.setAttribute("data-type", type);

  // Header and remove button
  const header = document.createElement("div");
  header.className = "frame-header";
  header.innerHTML = `<strong>${type.charAt(0).toUpperCase() + type.slice(1)}</strong>`;
  
  const removeBtn = document.createElement("button");
  removeBtn.textContent = "✖";
  removeBtn.className = "frame-close";
  removeBtn.onclick = () => frame.remove();
  header.appendChild(removeBtn);

  // Content area placeholder
  const body = document.createElement("div");
  body.className = "frame-body";
  body.innerHTML = getInitialContent(type, content);

  frame.appendChild(header);
  frame.appendChild(body);
  frameContainer.appendChild(frame);

  makeFrameDraggable(frame);
  frameIdCounter++;
}

function getInitialContent(type, content = "") {
  switch (type) {
    case "note":
      return `<textarea rows="6" placeholder="Write note...">${content}</textarea>`;
    case "quick":
      return `<div class="quick-comments"><button>Sample Quick Comment</button></div>`;
    case "bookmark":
      return `<div class="bookmark-bar"></div><button>+ Add Bookmark</button>`;
    case "timer":
      return `<div class="led green">00:00</div>`;
    default:
      return `<p>Empty Frame</p>`;
  }
}

function makeFrameDraggable(frame) {
  let isDragging = false;
  let offsetX, offsetY;

  const header = frame.querySelector(".frame-header");
  header.style.cursor = "move";

  header.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - frame.offsetLeft;
    offsetY = e.clientY - frame.offsetTop;
    frame.style.zIndex = 999;
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      frame.style.left = `${e.clientX - offsetX}px`;
      frame.style.top = `${e.clientY - offsetY}px`;
    }
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
    frame.style.zIndex = 5;
  });
}

// Optional: example UI to create one
document.getElementById("addFrameBtn").addEventListener("click", () => {
  const type = document.getElementById("frameType").value;
  createFrame(type);
});
