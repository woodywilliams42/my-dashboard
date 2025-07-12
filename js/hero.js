console.log("Hero.js loaded");

const GITHUB_API_URL = "https://api.github.com/repos/woodywilliams42/my-dashboard/contents/backgrounds";
const RAW_IMAGE_BASE = "https://raw.githubusercontent.com/woodywilliams42/my-dashboard/main/backgrounds";

let heroImages = [];

export async function fetchHeroImages() {
  try {
    const res = await fetch(GITHUB_API_URL);
    if (!res.ok) throw new Error("Failed to fetch background images from GitHub");

    const files = await res.json();

    heroImages = files
      .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f.name))
      .map(f => `${RAW_IMAGE_BASE}/${f.name}`);

    console.log("Fetched hero images from GitHub:", heroImages);
  } catch (err) {
    console.error("Failed to fetch GitHub hero images:", err);
    heroImages = [];
  }
}

export function setRandomHeroImage() {
  if (heroImages.length === 0) return;

  const random = heroImages[Math.floor(Math.random() * heroImages.length)];
  const heroArea = document.querySelector(".hero-background");
  if (heroArea) {
    heroArea.style.backgroundImage = `url('${random}')`;
  }
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
