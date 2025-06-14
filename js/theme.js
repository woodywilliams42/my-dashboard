// theme.js — Dark mode logic

export function initThemeToggle() {
  const toggle = document.getElementById("darkModeToggle");
  const label = document.getElementById("theme-label");

  const applyDark = (on) => {
    document.body.classList.toggle("dark", on);
    toggle.checked = on;
    label.textContent = on ? "🌙" : "🌞";
  };

  const stored = localStorage.getItem("theme");
  const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = stored ? stored === "dark" : prefers;
  applyDark(isDark);

  toggle.addEventListener("change", () => {
    applyDark(toggle.checked);
    localStorage.setItem("theme", toggle.checked ? "dark" : "light");
  });
}
