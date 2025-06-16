export function setupDarkModeToggle() {
  const darkToggle = document.getElementById("darkModeToggle");
  const themeLabel = document.getElementById("theme-label");

  function applyDarkMode(isDark) {
    document.body.classList.toggle("dark", isDark);
    darkToggle.checked = isDark;
    themeLabel.textContent = isDark ? "🌙" : "🌞";
  }

  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDarkMode = savedTheme ? savedTheme === "dark" : systemPrefersDark;
  applyDarkMode(isDarkMode);

  darkToggle.addEventListener("change", () => {
    const isDark = darkToggle.checked;
    applyDarkMode(isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
}
