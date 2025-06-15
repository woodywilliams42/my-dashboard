import { storage } from './firebase.js';
import { listAll, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// DOM references
const heroArea = document.querySelector('.hero-background');
const clockWrapper = document.getElementById("world-clocks-wrapper");

// Folder in Firebase Storage
const HERO_FOLDER = 'hero-images/'; // <- Your folder inside Firebase Storage

let heroImages = [];

// Fetch all hero image URLs (jpg/png)
async function fetchHeroImages() {
  try {
    const folderRef = ref(storage, HERO_FOLDER);
    const listResult = await listAll(folderRef);
    
    const imageFiles = listResult.items.filter(item =>
      item.name.toLowerCase().endsWith('.jpg') || item.name.toLowerCase().endsWith('.png')
    );

    heroImages = await Promise.all(imageFiles.map(file => getDownloadURL(file)));
  } catch (err) {
    console.error("Failed to load hero images:", err);
  }
}

// Set background image randomly
function setRandomHeroImage() {
  if (heroImages.length === 0) return;

  const randomUrl = heroImages[Math.floor(Math.random() * heroImages.length)];
  heroArea.style.backgroundImage = `url('${randomUrl}')`;
}

// Hook into tab switches
function setupTabImageRefresh() {
  document.querySelectorAll("nav button").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      setRandomHeroImage();
      clockWrapper.style.display = target === "work" ? "block" : "none";
    });
  });
}

// Init on load
(async function initHeroArea() {
  await fetchHeroImages();
  setRandomHeroImage();
  setupTabImageRefresh();
})();

