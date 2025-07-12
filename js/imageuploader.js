// imageUploader.js

// Create context menu
const contextMenu = document.createElement("div");
contextMenu.className = "custom-upload-menu";
contextMenu.style.position = "absolute";
contextMenu.style.display = "none";
contextMenu.style.zIndex = 9999;
contextMenu.innerHTML = `
  <div class="upload-option" data-type="favicon">Upload Favicon</div>
  <div class="upload-option" data-type="hero">Upload Hero Background</div>
`;
document.body.appendChild(contextMenu);

// Listen for right-clicks anywhere on page (can be scoped to frame/header if preferred)
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  contextMenu.style.top = `${e.clientY}px`;
  contextMenu.style.left = `${e.clientX}px`;
  contextMenu.style.display = "block";
});

// Hide on click elsewhere
document.addEventListener("click", () => {
  contextMenu.style.display = "none";
});

// Click handler
contextMenu.addEventListener("click", (e) => {
  const type = e.target.dataset.type;
  if (!type) return;

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function () {
      const base64 = reader.result.split(",")[1];
      console.log(`📦 Ready to upload:\nType: ${type}\nFilename: ${file.name}\nBase64:`, base64.slice(0, 100) + "...");
      // Later: send `file.name`, `base64`, and `type` to backend or upload handler
    };
    reader.readAsDataURL(file);
  });

  fileInput.click();
});

