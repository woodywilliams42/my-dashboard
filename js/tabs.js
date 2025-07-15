import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { app } from './firebase.js';

import { loadFramesForTab } from './frames.js';
import { setRandomHeroImage, toggleClocks } from './hero.js';

const db = getFirestore(app);
console.log('DB instance:', db);

const navContainer = document.getElementById("tab-nav");
const tabsContainer = document.getElementById("tabs-container");

let currentTabId = null;

async function loadTabs() {
  console.log("Loading tabs from Firestore...");
  console.log('Collection input db:', db);

  try {
    const tabQuery = query(collection(db, "dashboardTabs"), orderBy("order"));
    const snap = await getDocs(tabQuery);
    const tabsArray = [];

    snap.forEach(docSnap => {
      const { id, label } = docSnap.data();
      if (!id || !label) return;
      const cleanId = id.trim();
      tabsArray.push({ id: cleanId, label });

      const btn = document.createElement("button");
      btn.textContent = label;
      btn.dataset.tab = cleanId;
      btn.classList.add("tab-button");
      navContainer?.appendChild(btn);

      const tabDiv = document.createElement("div");
      tabDiv.id = cleanId;
      tabDiv.className = "tab";
      tabDiv.innerHTML = `<p class="empty-tab-message">No frames yet on "${label}".</p>`;
      tabsContainer?.appendChild(tabDiv);
    });

    setupTabSwitching();

    if (tabsArray.length > 0) {
      setTimeout(() => switchToTab(tabsArray[0].id), 0);
    }
  } catch (err) {
    console.error("Failed to load tabs:", err);
  }
}

function setupTabSwitching() {
  navContainer?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-tab]");
    if (btn) {
      switchToTab(btn.dataset.tab);
    }
  });
}

function switchToTab(tabId) {
  if (!tabId) return;

  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));

  document.getElementById(tabId)?.classList.add("active");
  document.querySelector(`button[data-tab="${tabId}"]`)?.classList.add("active");

  currentTabId = tabId;

  setRandomHeroImage?.();
  toggleClocks?.(tabId);
  loadFramesForTab?.(tabId);

  console.log("Switched to tab:", tabId);
}

document.addEventListener("DOMContentLoaded", loadTabs);
