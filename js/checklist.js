export function renderChecklistFrame(frame, container) {
  container.innerHTML = ''; // Clear previous content

  const ul = document.createElement('ul');
  ul.className = 'checklist-tasks';

  frame.tasks?.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = 'checklist-task';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.addEventListener('change', () => {
      task.done = checkbox.checked;
      // TODO: Save to Firestore
    });

    const label = document.createElement('span');
    label.className = 'checklist-label';
    label.textContent = task.text;

    li.append(checkbox, label);
    ul.appendChild(li);
  });

  container.appendChild(ul);

  // Add task input
  const input = document.createElement('input');
  input.placeholder = 'Add a task...';
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      const newTask = { text: input.value.trim(), done: false };
      frame.tasks.push(newTask);
      input.value = '';
      renderChecklistFrame(frame, container);
      // TODO: Save to Firestore
    }
  });
  container.appendChild(input);
}
