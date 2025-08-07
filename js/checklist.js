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
      startOfWeek.setDate(today.getDate() - today.getDay());
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

  if (shouldResetChecklist()) {
    data.items.forEach(item => (item.done = false));
    data.lastReset = new Date().toISOString().split("T")[0];
  }

  // === Add Header + Button (same pattern as bookmarks) ===
  const header = frame.querySelector(".frame-header");
  if (header && !header.querySelector(".add-checklist-btn")) {
    const addBtn = document.createElement("button");
    addBtn.textContent = "➕";
    addBtn.className = "add-checklist-btn";
    addBtn.title = "Add task";

    const menuBtn = header.querySelector(".frame-menu-button");
    if (menuBtn) header.insertBefore(addBtn, menuBtn);
    else header.appendChild(addBtn);

    // Will attach click listener after addItemInput exists
    addBtn.addEventListener("click", () => {
      addItemInput.focus();
    });
  }

  const list = document.createElement("ul");
  list.className = "checklist-items";
  content.appendChild(list);

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

  // === Repeat Dropdown Control ===
  const repeatWrapper = document.createElement("div");
  repeatWrapper.className = "repeat-controls";

  const repeatSelect = document.createElement("select");
  repeatSelect.className = "repeat-select";

  ["no repeat", "daily", "weekly", "monthly"].forEach(option => {
    const opt = document.createElement("option");
    opt.value = option;
    opt.textContent = option;
    if (data.repeat === option) opt.selected = true;
    repeatSelect.appendChild(opt);
  });

  repeatSelect.onchange = () => {
    data.repeat = repeatSelect.value;
    saveChecklistData();
  };

  repeatWrapper.appendChild(repeatSelect);
  content.appendChild(repeatWrapper);

  function saveChecklistData() {
    const event = new CustomEvent("checklistDataChanged", {
      detail: { tab, id, data },
    });
    document.dispatchEvent(event);
  }

  function renderItems() {
    list.innerHTML = "";

    const incomplete = data.items.filter(item => !item.done);
    const complete = data.items.filter(item => item.done);
    const sortedItems = [...incomplete, ...complete];

    sortedItems.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "checklist-task";
      li.draggable = true;
      li.dataset.index = index;

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
      if (item.done) span.style.textDecoration = "line-through";

      li.appendChild(checkbox);
      li.appendChild(span);

      li.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        showTaskContextMenu(e.clientX, e.clientY, index);
      });

      // Drag & Drop
      li.addEventListener("dragstart", (e) => {
        li.classList.add("dragging");
        e.dataTransfer.setData("text/plain", index);
      });

      li.addEventListener("dragover", (e) => {
        e.preventDefault();
        li.classList.add("drag-over");
      });

      li.addEventListener("dragleave", () => {
        li.classList.remove("drag-over");
      });

      li.addEventListener("drop", (e) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
        const toIndex = parseInt(li.dataset.index);

        if (fromIndex !== toIndex) {
          const movedItem = data.items.splice(fromIndex, 1)[0];
          data.items.splice(toIndex, 0, movedItem);
          saveChecklistData();
          renderItems();
        }
      });

      li.addEventListener("dragend", () => {
        li.classList.remove("dragging");
        list.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over"));
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

  document.addEventListener("click", () => {
    contextMenu.style.display = "none";
  });
}
