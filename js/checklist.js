
export function setupChecklistFrame(frame, data, tab, id) {
  const content = frame.querySelector(".frame-content");
  content.innerHTML = "";

  const title = document.createElement("h3");
  title.textContent = data.title || "Checklist";
  content.appendChild(title);

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
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = item.done;
      checkbox.onchange = () => {
        data.items[index].done = checkbox.checked;
        saveChecklistData();
      };

      const span = document.createElement("span");
      span.textContent = item.text;
      if (item.done) span.style.textDecoration = "line-through";

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "❌";
      deleteBtn.onclick = () => {
        data.items.splice(index, 1);
        renderItems();
        saveChecklistData();
      };

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(deleteBtn);
      list.appendChild(li);
    });
  }

  function saveChecklistData() {
    const event = new CustomEvent("checklistDataChanged", { detail: { tab, id, data } });
    document.dispatchEvent(event);
  }

  renderItems();
}
