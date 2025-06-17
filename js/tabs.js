// tabs.js
import { db } from './firebase.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { loadFramesForTab } from './frames.js';

const navContainer = document.getElementById("tab-nav");
const tabsContainer = document.getElementById("tabs-container");

let activeTab = null;

async function loadTabs() {
  const tabQuery = query(collection(db, "dashboardTabs"), orderBy("order"));
  const snap = await getDocs(tabQuery);

  snap.forEach(docSnap => {
    const { id, label } = docSnap.data();

    // Create nav button
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.dataset.tab = id;
    btn.classList.add("tab-button");
    btn.addEventListener("click", () => switchToTab(id));
    navContainer.appendChild(btn);

    // Create tab container
    const tabDiv = document.createElement("div");
    tabDiv.id = id;
    tabDiv.className = "tab";
    tabsContainer.appendChild(tabDiv);
  });

  // Auto-select first tab
  const firstTabButton = navContainer.querySelector("button");
  if (firstTabButton) {
    firstTabButton.click();
  }
}

function switchToTab(tabId) {
  // Deactivate all tabs
  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
  document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));

  // Activate current
  const tabDiv = document.getElementById(tabId);
  const btn = document.querySelector(`.tab-button[data-tab="${tabId}"]`);

  if (tabDiv && btn) {
    tabDiv.classList.add("active");
    btn.classList.add("active");
    activeTab = tabId;
    loadFramesForTab(tabId);
  }
}

export { activeTab };

document.addEventListener("DOMContentLoaded", loadTabs);
