console.log("Hero.js loaded");

let heroImages = [];

export async function fetchHeroImages() {
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

export function setRandomHeroImage() {
  if (heroImages.length === 0) return;

  const random = heroImages[Math.floor(Math.random() * heroImages.length)];
  const heroArea = document.querySelector(".hero-background");
  heroArea.style.backgroundImage = `url('images/${random}')`;
}

export function toggleClocks(tabId) {
  const clockWrapper = document.getElementById("world-clocks-wrapper");
  if (clockWrapper) {
    clockWrapper.style.display = tabId === "work" ? "block" : "none";
  }
}

(async function initHero() {
  await fetchHeroImages();
  setRandomHeroImage();
})();
