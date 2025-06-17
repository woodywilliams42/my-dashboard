// tabs.js

import { db } from './firebase.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { loadFramesForTab } from './frames.js';
import { setRandomHeroImage } from './hero.js'; // ensure this is exported from hero.js

const navContainer = document.getElementById("tab-nav");
const tabsContainer = document.getElementById("tabs-container");
let currentTabId = null;

async function loadTabs() {
  const tabQuery = query(collection(db, "dashboardTabs"), orderBy("order"));
  const snap = await getDocs(tabQuery);
  const tabsArray = [];

  snap.forEach(docSnap => {
    const { id, label } = docSnap.data();
    tabsArray.push({ id, label });

    // Create tab button
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.dataset.tab = id;
    btn.classList.add("tab-button");
    navContainer.appendChild(btn);

    // Create content area
    const tabDiv = document.createElement("div");
    tabDiv.id = id;
    tabDiv.className = "tab";
    tabsContainer.appendChild(tabDiv);
  });

  setupTabSwitching();

  if (tabsArray.length > 0) {
    switchToTab(tabsArray[0].id); // Show first tab on load
  }
}

function setupTabSwitching() {
  navContainer.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-tab]");
    if (btn) {
      const tabId = btn.dataset.tab;
      switchToTab(tabId);
    }
  });
}

function switchToTab(tabId) {
  if (tabId === currentTabId) return;
  currentTabId = tabId;

  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
  document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));

  const newTab = document.getElementById(tabId);
  const newBtn = document.querySelector(`button[data-tab="${tabId}"]`);
  if (newTab) newTab.classList.add("active");
  if (newBtn) newBtn.classList.add("active");

  const clockWrapper = document.getElementById("world-clocks-wrapper");
  if (clockWrapper) {
    clockWrapper.style.display = tabId === "work" ? "block" : "none";
  }

  setRandomHeroImage(); // Update hero image on tab change
  loadFramesForTab(tabId); // Load frames for selected tab
}

document.addEventListener("DOMContentLoaded", loadTabs);
