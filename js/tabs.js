// tabs.js — Tab switching and conditional display logic

export function initTabs() {
  const buttons = document.querySelectorAll("nav button");
  const tabs = document.querySelectorAll(".tab");
  const clockWrapper = document.getElementById("world-clocks-wrapper");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;

      buttons.forEach(b => b.classList.remove("active"));
      tabs.forEach(t => t.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(target).classList.add("active");

      clockWrapper.style.display = (target === "work") ? "block" : "none";
    });
  });
}
