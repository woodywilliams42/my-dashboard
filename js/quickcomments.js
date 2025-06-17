// quickcomments.js
import { db } from './firebase.js';
import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const quickCommentsData = {}; // { tab: [ { label, text }, ... ] }

// === Load Comments from Firestore ===
export async function loadQuickComments(tab) {
  const docRef = doc(db, "quickComments", tab);
  const snap = await getDoc(docRef);
  quickCommentsData[tab] = snap.exists() ? snap.data().comments || [] : [];
  renderQuickComments(tab);
}

// === Save Comments to Firestore ===
async function saveQuickComments(tab) {
  await setDoc(doc(db, "quickComments", tab), { comments: quickCommentsData[tab] });
}

// === Render Quick Comment Buttons ===
function renderQuickComments(tab) {
  const container = document.getElementById(`quick-comments-${tab}`);
  if (!container) return;

  container.innerHTML = "";
  const comments = quickCommentsData[tab] || [];

  comments.forEach((comment, index) => {
    const button = document.createElement("button");
    button.className = "quick-comment-button";
    button.textContent = comment.label;
    button.title = comment.text.slice(0, 100);
    button.setAttribute("draggable", true);

    button.addEventListener("click", () => {
      navigator.clipboard.writeText(comment.text).then(() => {
        const original = button.textContent;
        button.textContent = "Copied";
        setTimeout(() => {
          button.textContent = original;
        }, 1000);
      });
    });

    button.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showQuickCommentContextMenu(e.pageX, e.pageY, tab, index);
    });

    button.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", index);
      e.dataTransfer.effectAllowed = "move";
    });

    container.appendChild(button);
  });

  container.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  });

  container.addEventListener("drop", (e) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    const toIndex = [...container.children].findIndex(child => child === e.target);
    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      const list = quickCommentsData[tab];
      const moved = list.splice(fromIndex, 1)[0];
      list.splice(toIndex, 0, moved);
      saveQuickComments(tab);
      renderQuickComments(tab);
    }
  });
}

// === Show Context Menu ===
function showQuickCommentContextMenu(x, y, tab, index) {
  const menu = document.getElementById("quickCommentContextMenu");
  menu.style.top = `${y}px`;
  menu.style.left = `${x}px`;
  menu.style.display = "block";
  menu.dataset.tab = tab;
  menu.dataset.index = index;
}

// === Hide Menu on Click Outside ===
document.addEventListener("click", () => {
  const menu = document.getElementById("quickCommentContextMenu");
  if (menu) menu.style.display = "none";
});

// === Handle Menu Actions ===
document.getElementById("quickCommentContextMenu")?.addEventListener("click", async (e) => {
  const action = e.target.dataset.action;
  const menu = e.currentTarget;
  const tab = menu.dataset.tab;
  const index = parseInt(menu.dataset.index, 10);
  const comment = quickCommentsData[tab][index];

  if (action === "edit") {
    const newText = prompt("Edit comment text:", comment.text);
    if (newText !== null) {
      quickCommentsData[tab][index].text = newText;
      await saveQuickComments(tab);
      renderQuickComments(tab);
    }
  } else if (action === "delete") {
    if (confirm(`Delete comment "${comment.label}"?`)) {
      quickCommentsData[tab].splice(index, 1);
      await saveQuickComments(tab);
      renderQuickComments(tab);
    }
  }

  menu.style.display = "none";
});

// === Add New Comment Button ===
document.querySelectorAll(".addCommentBtn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const tab = btn.dataset.tab;
    const label = prompt("Enter a short label:");
    if (!label) return;
    const text = prompt("Enter the comment text:");
    if (!text) return;

    quickCommentsData[tab].push({ label, text });
    await saveQuickComments(tab);
    renderQuickComments(tab);
  });
});

// === Insert Context Menu HTML (if not present) ===
if (!document.getElementById("quickCommentContextMenu")) {
  document.body.insertAdjacentHTML("beforeend", `
    <div id="quickCommentContextMenu" style="position: absolute; display: none; background: white; border: 1px solid #ccc; z-index: 1000;">
      <ul style="list-style: none; margin: 0; padding: 0;">
        <li data-action="edit" style="padding: 4px 8px; cursor: pointer;">✏️ Edit</li>
        <li data-action="delete" style="padding: 4px 8px; cursor: pointer;">🗑️ Delete</li>
      </ul>
    </div>
  `);
}

