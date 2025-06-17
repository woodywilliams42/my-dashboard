import { db } from './firebase.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { loadFramesForTab } from './frames.js';

// === DOM Elements ===
const navContainer = document.querySelector("nav");
const mainContainer = document.body;

// === Load Tabs from Firestore ===
async function loadTabs() {
  const tabQuery = query(collection(db, "dashboardTabs"), orderBy("order"));
  const snap = await getDocs(tabQuery);

  const tabsArray = [];

  snap.forEach(docSnap => {
    const { id, label } = docSnap.data();
    tabsArray.push({ id, label });

    // Create Tab Button
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.dataset.tab = id;
    btn.classList.add("tab-button");
    navContainer.appendChild(btn);

    // Create Tab Content Container
    const tabDiv = document.createElement("div");
    tabDiv.id = id;
    tabDiv.className = "tab";
    mainContainer.appendChild(tabDiv);
  });

  setupTabSwitching();

  // Auto-select the first tab
  if (tabsArray.length > 0) {
    switchToTab(tabsArray[0].id);
  }
}

// === Tab Switching Logic ===
function setupTabSwitching() {
  document.querySelectorAll("nav button").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault(); // just in case
      const target = btn.dataset.tab;
      switchToTab(target);
    });
  });
}


// === Switch Tabs ===
function switchToTab(tabId) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  const tabDiv = document.getElementById(tabId);
  if (tabDiv) tabDiv.classList.add("active");

  document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
  const btn = document.querySelector(`button[data-tab="${tabId}"]`);
  if (btn) btn.classList.add("active");

  const clockWrapper = document.getElementById("world-clocks-wrapper");
  if (clockWrapper) {
    clockWrapper.style.display = tabId === "work" ? "block" : "none";
  }

  loadFramesForTab(tabId);
}

// === Init ===
document.addEventListener("DOMContentLoaded", loadTabs);
