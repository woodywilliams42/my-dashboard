export function setupDarkModeToggle() {
  const toggle = document.getElementById("darkModeToggle");
  const themeLabel = document.getElementById("theme-label");

  function applyTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);
    themeLabel.textContent = isDark ? "🌙" : "🌞";
    localStorage.setItem("darkMode", isDark);
  }

  toggle.addEventListener("change", () => {
    applyTheme(toggle.checked);
  });

  // Init
  const saved = localStorage.getItem("darkMode") === "true";
  toggle.checked = saved;
  applyTheme(saved);
}

document.addEventListener("DOMContentLoaded", setupDarkModeToggle);
