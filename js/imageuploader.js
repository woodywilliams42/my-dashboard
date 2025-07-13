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

// Show context menu on right-click of hero image
function showContextMenu(x, y) {
  contextMenu.style.top = `${y}px`;
  contextMenu.style.left = `${x}px`;
  contextMenu.style.display = "block";
}

document.addEventListener("contextmenu", (e) => {
  const heroEl = document.querySelector(".hero-background");
  if (!heroEl || !heroEl.contains(e.target)) return;

  e.preventDefault();
  showContextMenu(e.clientX, e.clientY);
});

// Hide context menu when clicking elsewhere
document.addEventListener("click", () => {
  contextMenu.style.display = "none";
});

// Handle click on menu options
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
      const filePath = type === "favicon"
        ? `favicons/${file.name}`
        : `herobackgrounds/${file.name}`;

      uploadImageToGitHub(filePath, base64, file.name);
    };
    reader.readAsDataURL(file);
  });

  fileInput.click();
});

// Upload function (calls your Firebase Cloud Function instead of GitHub directly)
async function uploadImageToGitHub(path, base64Content, filename) {
  const functionURL = "https://us-central1-woodydashboard.cloudfunctions.net/uploadToGitHub";

  const payload = {
    path,
    base64: base64Content,
    filename,
  };

  try {
    const res = await fetch(functionURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      alert(`✅ Uploaded ${filename} successfully!`);
      console.log("✅ Firebase Response:", data);
    } else {
      console.error("❌ Upload failed:", data);
      alert(`Upload failed: ${data.message || "Unknown error"}`);
    }
  } catch (err) {
    console.error("❌ Upload error:", err);
    alert("Upload failed: Network or server error.");
  }
}
