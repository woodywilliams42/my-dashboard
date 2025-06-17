// hero.js
console.log("Hero.js loaded");

let heroImages = [];

// Load hero image list from JSON
async function fetchHeroImages() {
  try {
    const res = await fetch("hero-images.json");
    if (!res.ok) throw new Error("Failed to fetch hero-images.json");
    heroImages = await res.json();
    console.log("Fetched hero images:", heroImages);
  } catch (err) {
    console.error("Failed to fetch hero images:", err);
    heroImages = [];
  }
}

// Set a random hero background image
function setRandomHeroImage() {
  if (heroImages.length === 0) return;

  const random = heroImages[Math.floor(Math.random() * heroImages.length)];
  const heroArea = document.querySelector(".hero-background");
  heroArea.style.backgroundImage = `url('images/${random}')`;
}

// Update clock visibility for "work" tab
function toggleClocks(tabId) {
  const clockWrapper = document.getElementById("world-clocks-wrapper");
  if (clockWrapper) {
    clockWrapper.style.display = tabId === "work" ? "block" : "none";
  }
}

// Hook into tab switching
function listenForTabChanges() {
  const observer = new MutationObserver(() => {
    const active = document.querySelector(".tab.active");
    if (active) {
      const tabId = active.id;
      setRandomHeroImage();
      toggleClocks(tabId);
    }
  });

  observer.observe(document.getElementById("tabs-container"), {
    subtree: true,
    attributes: true,
    attributeFilter: ["class"]
  });
}

// === Init ===
(async function initHero() {
  await fetchHeroImages();
  setRandomHeroImage();
  listenForTabChanges();
})();
