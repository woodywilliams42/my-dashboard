import { db } from './firebase.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// === DOM Elements ===
const navContainer = document.querySelector("nav");
const mainContainer = document.body;

// === Load Tabs from Firestore ===
async function loadTabs() {
  const tabQuery = query(collection(db, "dashboardTabs"), orderBy("order"));
  const snap = await getDocs(tabQuery);

  snap.forEach(docSnap => {
    const { id, label } = docSnap.data();

    // === Create Tab Button ===
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.dataset.tab = id;
    btn.classList.addimport { db } from './firebase.js';
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

    // === Create Tab Button ===
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.dataset.tab = id;
    btn.classList.add("tab-button");
    if (id === "work") btn.classList.add("active");
    navContainer.appendChild(btn);

    // === Create Tab Content Panel ===
    const tabDiv = document.createElement("div");
    tabDiv.id = id;
    tabDiv.className = "tab";
    if (id === "work") tabDiv.classList.add("active");

    tabDiv.innerHTML = `
      <div class="frame-component">
        <h3>${label} Tab</h3>
        <p>This is a placeholder for tab "${label}"</p>
      </div>
    `;
    mainContainer.appendChild(tabDiv);
  });

  // Select first tab if available
  if (tabsArray.length > 0) {
    const firstTab = tabsArray[0].id;
    switchToTab(firstTab);
  }

  setupTabSwitching();
}

// === Set up Tab Switching Logic ===
function setupTabSwitching() {
  document.querySelectorAll("nav button").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      switchToTab(target);
    });
  });
}

// === Tab Switching Function ===
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

// === Init Tabs ===
loadTabs();
("tab-button");
    if (id === "work") btn.classList.add("active");
    navContainer.appendChild(btn);

    // === Create Tab Content Panel ===
    const tabDiv = document.createElement("div");
    tabDiv.id = id;
    tabDiv.className = "tab";
    if (id === "work") tabDiv.classList.add("active");

    tabDiv.innerHTML = `
      <div class="frame-component">
        <h3>${label} Tab</h3>
        <p>This is a placeholder for tab "${label}"</p>
      </div>
    `;
    mainContainer.appendChild(tabDiv);
  });
// After creating tab buttons
if (tabsArray.length > 0) {
  const firstTab = tabsArray[0].id;
  document.querySelector(`button[data-tab="${firstTab}"]`)?.click();
}

  setupTabSwitching();
}

// === Set up Tab Switching Logic ===
function setupTabSwitching() {
  document.querySelectorAll("nav button").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;

      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.getElementById(target).classList.add("active");

      document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const clockWrapper = document.getElementById("world-clocks-wrapper");
      if (clockWrapper) {
        clockWrapper.style.display = target === "work" ? "block" : "none";
      }
 loadFramesForTab(tabId);
    });
  });
}

// === Init Tabs ===
loadTabs();
