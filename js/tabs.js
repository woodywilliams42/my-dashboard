import { db } from './firebase.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { loadFramesForTab } from './frames.js';

const navContainer = document.querySelector("nav");
const mainContainer = document.getElementById("tabs-container");

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
    btn.addEventListener("click", () => switchToTab(id)); // ✅ attach handler directly
    navContainer.appendChild(btn);

    // Create Tab Content Container
    const tabDiv = document.createElement("div");
    tabDiv.id = id;
    tabDiv.className = "tab";
    mainContainer.appendChild(tabDiv);
  });

  // Auto-select the first tab
  if (tabsArray.length > 0) {
    switchToTab(tabsArray[0].id);
  }
}

function switchToTab(tabId) {
  // Switch visible tab
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  const tabDiv = document.getElementById(tabId);
  if (tabDiv) tabDiv.classList.add("active");

  // Highlight active button
  document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
  const btn = document.querySelector(`button[data-tab="${tabId}"]`);
  if (btn) btn.classList.add("active");

  // Toggle clocks for "work" tab
  const clockWrapper = document.getElementById("world-clocks-wrapper");
  if (clockWrapper) {
    clockWrapper.style.display = tabId === "work" ? "block" : "none";
  }

  // Load frames
  loadFramesForTab(tabId);
}

loadTabs();
