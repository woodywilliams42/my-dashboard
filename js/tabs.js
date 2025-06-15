// tabs.js

export function setupTabSwitching() {
  const tabs = document.querySelectorAll("nav button");
  const allTabs = document.querySelectorAll(".tab");
  const clockWrapper = document.getElementById("world-clocks-wrapper");

  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;

      // Switch active tab content
      allTabs.forEach(t => t.classList.remove("active"));
      document.getElementById(target).classList.add("active");

      // Update button highlighting
      tabs.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // Show/hide world clocks for "work" tab
      clockWrapper.style.display = target === "work" ? "block" : "none";
    });
  });
}
