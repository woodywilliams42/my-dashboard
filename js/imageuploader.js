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

// 🧠 Context menu display handler
function showContextMenu(x, y) {
  contextMenu.style.top = `${y}px`;
  contextMenu.style.left = `${x}px`;
  contextMenu.style.display = "block";
}

// Only show when right-clicking on hero background
document.addEventListener("contextmenu", (e) => {
  const heroEl = document.querySelector(".hero-background");
  if (!heroEl || !heroEl.contains(e.target)) return;

  e.preventDefault();
  showContextMenu(e.clientX, e.clientY);
});

// Hide menu on click elsewhere
document.addEventListener("click", () => {
  contextMenu.style.display = "none";
});

// Handle menu click
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

// Upload function to GitHub
async function uploadImageToGitHub(path, base64Content, filename) {
  const GITHUB_USERNAME = "woodywilliams42";
  const REPO = "my-dashboard";
  const BRANCH = "main";
  const TOKEN = "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"; // Replace this with your real token

  const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO}/contents/${path}`;

  const payload = {
    message: `Upload ${filename}`,
    content: base64Content,
    branch: BRANCH
  };

  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${TOKEN}`
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      alert(`✅ Uploaded ${filename} successfully!`);
      console.log("GitHub Response:", data);
    } else {
      console.error("❌ GitHub upload failed:", data);
      alert(`Upload failed: ${data.message}`);
    }
  } catch (err) {
    console.error("❌ Upload error:", err);
    alert("Upload failed: Network or permission error.");
  }
}
