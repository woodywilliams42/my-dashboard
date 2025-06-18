import { db } from './firebase.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { loadFramesForTab } from './frames.js';
import { setRandomHeroImage, toggleClocks } from './hero.js';

const navContainer = document.getElementById("tab-nav");
const tabsContainer = document.getElementById("tabs-container");
let currentTabId = null;

async function loadTabs() {
  console.log("Loading tabs from Firestore...");
  const tabQuery = query(collection(db, "dashboardTabs"), orderBy("order"));
  const snap = await getDocs(tabQuery);
  const tabsArray = [];

  snap.forEach(docSnap => {
  let { id, label } = docSnap.data();
  id = id.trim(); // Trim whitespace to avoid selector issues
  tabsArray.push({ id, label });


    const btn = document.createElement("button");
    btn.textContent = label;
    btn.dataset.tab = id;
    btn.classList.add("tab-button");
    navContainer.appendChild(btn);

    const tabDiv = document.createElement("div");
    tabDiv.id = id;
    tabDiv.className = "tab";
    tabDiv.innerHTML = `<p class="empty-tab-message">No frames yet on the "${id}" tab.</p>`;
    tabsContainer.appendChild(tabDiv);
  });

  setupTabSwitching();

if (tabsArray.length > 0) {
  // Defer to next tick to allow DOM to fully render
  setTimeout(() => switchToTab(tabsArray[0].id), 0);
}
}

function setupTabSwitching() {
  navContainer.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-tab]");
    if (btn) {
      switchToTab(btn.dataset.tab);
    }
  });
}

function switchToTab(tabId) {
  if (!tabId || typeof tabId !== "string") return;

  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));

  const tabDiv = document.getElementById(tabId.trim());
  const btn = document.querySelector(`button[data-tab="${tabId.trim()}"]`);

  if (tabDiv) tabDiv.classList.add("active");
  if (btn) btn.classList.add("active");

  setRandomHeroImage?.();
  toggleClocks?.(tabId);
  loadFramesForTab?.(tabId);

  console.log("Switched to tab:", tabId);
}



document.addEventListener("DOMContentLoaded", loadTabs);
