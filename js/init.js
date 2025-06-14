// init.js — Load all modules and initialize on page load

import { initThemeToggle } from "./theme.js";
import { initTabs } from "./tabs.js";
import { initClockUpdater } from "./clocks.js";

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initTabs();
  initClockUpdater();
});
