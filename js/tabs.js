import { db } from './firebase.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { loadFramesForTab } from './frames.js';

const navContainer = document.getElementById("tab-nav");
const mainContainer = document.getElementById("tabs-container");

let currentTabId = null;

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

  // Automatically select the first tab
  if (tabsArray.length > 0) {
    switchToTab(tabsArray[0].id);
  }
}

function setupTabSwitching() {
  document.querySelectorAll("#tab-nav button").forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.dataset.tab;
      switchToTab(tabId);
    });
  });
}

function switchToTab(tabId) {
  currentTabId = tabId;

  // Hide/show tab content
  document.querySelectorAll(".tab").forEach(t => {
    t.style.display = t.id === tabId ? "block" : "none";
  });

  // Update button active states
  document.querySelectorAll("#tab-nav button").forEach(b => {
    b.classList.toggle("active", b.dataset.tab === tabId);
  });

  // Show/hide clocks
  const clockWrapper = document.getElementById("world-clocks-wrapper");
  if (clockWrapper) {
    clockWrapper.style.display = tabId === "work" ? "block" : "none";
  }

  // Load frames
  loadFramesForTab(tabId);
}

document.addEventListener("DOMContentLoaded", loadTabs);
