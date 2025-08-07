export function setupChecklistFrame(frame, data, tab, id) {
  const content = frame.querySelector(".frame-content");
  content.innerHTML = "";

  data.items = data.items || [];
  data.repeat = data.repeat || "no repeat";
  data.lastReset = data.lastReset || new Date().toISOString().split("T")[0];

  // === Checklist Reset Logic ===
  function shouldResetChecklist() {
    const today = new Date();
    const lastReset = new Date(data.lastReset);

    if (data.repeat === "no repeat") return false;

    if (data.repeat === "daily") {
      return today.toDateString() !== lastReset.toDateString();
    }

    if (data.repeat === "weekly") {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      return lastReset < startOfWeek;
    }

    if (data.repeat === "monthly") {
      return (
        today.getFullYear() !== lastReset.getFullYear() ||
        today.getMonth() !== lastReset.getMonth()
      );
    }

    return false;
  }

  // Reset tasks if needed
  if (shouldResetChecklist()) {
    data.items.forEach(item => (item.done = false));
    data.lastReset = new Date().toISOString().split("T")[0];
  }

  // === Create List Container ===
  const list = document.createElement("ul");
  list.className = "checklist-items";
  content.appendChild(list);

  // === Add Item Form ===
  const addItemInput = document.createElement("input");
  addItemInput.placeholder = "New item...";
  addItemInput.type = "text";

  const addButton = document.createElement("button");
  addButton.textContent = "+ Add";
  addButton.className = "add-button";
  addButton.onclick = () => {
    const text = addItemInput.value.trim();
    if (!text) return;
    data.items.push({ text, done: false });
    addItemInput.value = "";
    renderItems();
    saveChecklistData();
  };

  const inputGroup = document.createElement("div");
  inputGroup.className = "checklist-input-group";
  inputGroup.appendChild(addItemInput);
  inputGroup.appendChild(addButton);
  content.appendChild(inputGroup);

  // === Repeat Controls (added last) ===
  const repeatWrapper = document.createElement("div");
  repeatWrapper.className = "repeat-controls";

  const repeatBtn = document.createElement("button");
  repeatBtn.textContent = "Repeat";
  repeatBtn.className = "repeat-button";

  const repeatStatus = document.createElement("div");
  repeatStatus.className = "repeat-status";
  repeatStatus.textContent = data.repeat;

  const repeatMenu = document.createElement("div");
  repeatMenu.className = "repeat-menu";
  repeatMenu.style.display = "none";

  ["no repeat", "daily", "weekly", "monthly"].forEach(option => {
    const div = document.createElement("div");
    div.textContent = option;
    div.dataset.value = option;
    div.onclick = () => {
      data.repeat = option;
      repeatStatus.textContent = option;
      repeatMenu.style.display = "none";
      saveChecklistData();
    };
    repeatMenu.appendChild(div);
  });

  repeatBtn.onclick = () => {
    repeatMenu.style.display =
      repeatMenu.style.display === "block" ? "none" : "block";
  };

  repeatWrapper.appendChild(repeatBtn);
  repeatWrapper.appendChild(repeatStatus);
  repeatWrapper.appendChild(repeatMenu);
  content.appendChild(repeatWrapper); // Added at the bottom after everything else

  // === Save Data ===
  function saveChecklistData() {
    const event = new CustomEvent("checklistDataChanged", {
      detail: { tab, id, data },
    });
    document.dispatchEvent(event);
  }

  // === Render Items ===
  function renderItems() {
    list.innerHTML = "";

    const incomplete = data.items.filter(item => !item.done);
    const complete = data.items.filter(item => item.done);
    const sortedItems = [...incomplete, ...complete];

    sortedItems.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "checklist-task";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = item.done;
      checkbox.onchange = () => {
        item.done = checkbox.checked;
        saveChecklistData();
        renderItems();
      };

      const span = document.createElement("span");
      span.textContent = item.text;
      span.style.color = "#000";
      span.style.fontFamily = "inherit";
      if (item.done) span.style.textDecoration = "line-through";

      li.appendChild(checkbox);
      li.appendChild(span);

      // Right-click for context menu
      li.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        showTaskContextMenu(e.clientX, e.clientY, index);
      });

      list.appendChild(li);
    });
  }

  renderItems();

  // === Context Menu ===
  let contextMenu = document.getElementById("task-context-menu");
  if (!contextMenu) {
    contextMenu = document.createElement("div");
    contextMenu.id = "task-context-menu";
    contextMenu.className = "frame-context-menu";
    contextMenu.style.display = "none";
    contextMenu.style.position = "absolute";
    contextMenu.innerHTML = `
      <ul>
        <li data-action="complete">✅ Mark Complete</li>
        <li data-action="incomplete">❎ Mark Incomplete</li>
        <li data-action="edit">✏️ Edit Task</li>
        <li data-action="delete">🗑️ Delete Task</li>
      </ul>
    `;
    document.body.appendChild(contextMenu);
  }

  function showTaskContextMenu(x, y, taskIndex) {
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.style.display = "block";
    contextMenu.dataset.tab = tab;
    contextMenu.dataset.frameId = id;
    contextMenu.dataset.taskIndex = taskIndex;
  }

  contextMenu.addEventListener("click", (e) => {
    const action = e.target.dataset.action;
    const taskIndex = parseInt(contextMenu.dataset.taskIndex);
    if (isNaN(taskIndex)) return;

    const task = data.items?.[taskIndex];
    if (!task) return;

    switch (action) {
      case "complete":
        task.done = true;
        break;
      case "incomplete":
        task.done = false;
        break;
      case "edit":
        const newText = prompt("Edit task:", task.text);
        if (newText !== null) task.text = newText.trim();
        break;
      case "delete":
        data.items.splice(taskIndex, 1);
        break;
    }

    saveChecklistData();
    renderItems();
    contextMenu.style.display = "none";
  });

  // === Global Click: Close Menus ===
  document.addEventListener("click", () => {
    contextMenu.style.display = "none";
    repeatMenu.style.display = "none";
  });
}
