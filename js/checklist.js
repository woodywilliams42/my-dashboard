export function setupChecklistFrame(frame, data, tab, id) {
  const content = frame.querySelector(".frame-content");
  content.innerHTML = "";

  const title = document.createElement("h3");
  title.textContent = data.title || "Checklist";
  // content.appendChild(title);

  const list = document.createElement("ul");
  list.className = "checklist-items";
  content.appendChild(list);

  const addItemInput = document.createElement("input");
  addItemInput.placeholder = "New item...";
  addItemInput.type = "text";

  const addButton = document.createElement("button");
  addButton.textContent = "+ Add";
  addButton.onclick = () => {
    const text = addItemInput.value.trim();
    if (!text) return;
    data.items.push({ text, done: false });
    addItemInput.value = "";
    renderItems();
    saveChecklistData();
  };

  content.appendChild(addItemInput);
  content.appendChild(addButton);

  function renderItems() {
    list.innerHTML = "";
    data.items = data.items || [];

    data.items.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "checklist-task";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = item.done;
      checkbox.onchange = () => {
        data.items[index].done = checkbox.checked;
        saveChecklistData();
        renderItems();
      };

      const span = document.createElement("span");
      span.textContent = item.text;
      if (item.done) span.style.textDecoration = "line-through";

      li.appendChild(checkbox);
      li.appendChild(span);

      // Add right-click context menu
      li.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        showTaskContextMenu(e.clientX, e.clientY, index);
      });

      list.appendChild(li);
    });
  }

  function saveChecklistData() {
    const event = new CustomEvent("checklistDataChanged", { detail: { tab, id, data } });
    document.dispatchEvent(event);
  }

  renderItems();

  // === Context Menu Logic ===
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
