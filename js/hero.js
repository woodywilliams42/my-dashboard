const heroArea = document.querySelector('.hero-background');
const clockWrapper = document.getElementById("world-clocks-wrapper");

async function fetchHeroImages() {
  try {
    const response = await fetch('https://raw.githubusercontent.com/woodywilliams42/my-dashboard/main/images/hero-images.json');
    const imageFilenames = await response.json();

    return imageFilenames.map(name => `https://raw.githubusercontent.com/woodywilliams42/my-dashboard/main/images/${name}`);
  } catch (error) {
    console.error("Failed to fetch hero images:", error);
    return [];
  }
}

function setRandomHeroImage(imageUrls) {
  if (!imageUrls.length) return;
  const randomUrl = imageUrls[Math.floor(Math.random() * imageUrls.length)];
  heroArea.style.backgroundImage = `url('${randomUrl}')`;
}

function setupTabImageRefresh(imageUrls) {
  document.querySelectorAll("nav button").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      setRandomHeroImage(imageUrls);
      clockWrapper.style.display = target === "work" ? "block" : "none";
    });
  });
}

(async function initHero() {
  console.log("Hero.js loaded");
  const heroImages = await fetchHeroImages();
  console.log("Fetched hero images:", heroImages);
  setRandomHeroImage(heroImages);
  setupTabImageRefresh(heroImages);
})();
