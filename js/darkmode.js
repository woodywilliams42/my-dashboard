// darkmode.js

const darkToggle = document.getElementById("darkModeToggle");
const themeLabel = document.getElementById("theme-label");

function applyDarkMode(isDark) {
  document.body.classList.toggle("dark", isDark);
  if (darkToggle) darkToggle.checked = isDark;
  if (themeLabel) themeLabel.textContent = isDark ? "🌙" : "🌞";
}

function setupDarkMode() {
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDarkMode = savedTheme ? savedTheme === "dark" : systemPrefersDark;
  applyDarkMode(isDarkMode);

  if (darkToggle) {
    darkToggle.addEventListener("change", () => {
      const isDark = darkToggle.checked;
      applyDarkMode(isDark);
      localStorage.setItem("theme", isDark ? "dark" : "light");
    });
  }
}

document.addEventListener("DOMContentLoaded", setupDarkMode);
