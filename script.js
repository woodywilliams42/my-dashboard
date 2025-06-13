  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
  import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
  import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

  const firebaseConfig = {
    apiKey: "AIzaSyAFhr8C3o6fEXY1vNkiKq_0tfXp45ekTlU",
    authDomain: "woodydashboard.firebaseapp.com",
    projectId: "woodydashboard",
    storageBucket: "woodydashboard.appspot.com",
    messagingSenderId: "180582118415",
    appId: "1:180582118415:web:447bdf09b42dd16fa15f7a"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const storage = getStorage(app);

  window.db = db;
  window.storage = storage;



async function saveNotes(tab) {
  const content = document.getElementById(`notes-${tab}`).value;
  const statusEl = document.getElementById(`saveStatus-${tab}`);

  statusEl.textContent = "Saving...";
  statusEl.style.opacity = 1;

  try {
    await setDoc(doc(db, "dashboardNotes", tab), { content });
    statusEl.textContent = "✔ Saved!";
  } catch (err) {
    console.error("Error saving notes:", err);
    statusEl.textContent = "❌ Save failed!";
  }

  setTimeout(() => {
    statusEl.style.opacity = 0;
  }, 2000);
}

const lastSavedContent = {};

function setupAutosave(tab) {
  const textarea = document.getElementById(`notes-${tab}`);
  let debounceTimer;

  textarea.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const currentContent = textarea.value;
      if (lastSavedContent[tab] !== currentContent) {
        saveNotes(tab);
        lastSavedContent[tab] = currentContent;
      }
    }, 2000);
  });

  textarea.addEventListener("blur", () => {
    const currentContent = textarea.value;
    if (lastSavedContent[tab] !== currentContent) {
      saveNotes(tab);
      lastSavedContent[tab] = currentContent;
    }
  });
}
function savePanelSize(tab) {
  const panel = document.getElementById(`notes-panel-${tab}`);
  const rect = panel.getBoundingClientRect();
  const size = { width: rect.width, height: rect.height };
  localStorage.setItem(`notesSize-${tab}`, JSON.stringify(size));
}

function applySavedPanelSize(tab) {
  const panel = document.getElementById(`notes-panel-${tab}`);
  const saved = localStorage.getItem(`notesSize-${tab}`);
  if (saved) {
    const { width, height } = JSON.parse(saved);
    panel.style.width = `${width}px`;
    panel.style.height = `${height}px`;
  }
}

// Observe resize
function observeResize(tab) {
  const panel = document.getElementById(`notes-panel-${tab}`);
  const resizeObserver = new ResizeObserver(() => {
    savePanelSize(tab);
  });
  resizeObserver.observe(panel);
}


  async function loadNotes(tab) {
    try {
      const snap = await getDoc(doc(db, "dashboardNotes", tab));
      if (snap.exists()) {
        const data = snap.data();
        document.getElementById(`notes-${tab}`).value = data.content;
      }
    } catch (err) {
      console.error(`Error loading notes for ${tab}:`, err);
    }
  }

  async function loadBookmarks(tab) {
    try {
      const snap = await getDoc(doc(db, "dashboardBookmarks", tab));
      if (snap.exists()) {
        const data = snap.data();
        renderBookmarks(tab, data);
      }
    } catch (err) {
      console.error(`Error loading bookmarks for ${tab}:`, err);
    }
  }

  async function addBookmark(tab) {
    const input = document.getElementById(`newBookmarkUrl-${tab}`);
    const url = input.value.trim();

    try {
      new URL(url);
    } catch {
      alert("Please enter a valid URL (e.g. https://example.com)");
      return;
    }

    let urls = [];
    let favicons = {};
    try {
      const snap = await getDoc(doc(db, "dashboardBookmarks", tab));
      if (snap.exists()) {
        const data = snap.data();
        urls = Array.isArray(data.urls) ? data.urls : [];
        favicons = data.favicons || {};
      }
    } catch (err) {
      console.error("Error fetching bookmarks before add:", err);
    }

    if (!urls.includes(url)) {
      urls.push(url);
      try {
        await setDoc(doc(db, "dashboardBookmarks", tab), { urls, favicons });
        input.value = "";
        renderBookmarks(tab, { urls, favicons });
        closeBookmarkModal(tab);
      } catch (err) {
        console.error("Error saving bookmark:", err);
      }
    } else {
      alert("Bookmark already exists.");
    }
  }

  async function removeBookmark(tab, url) {
    const snap = await getDoc(doc(db, "dashboardBookmarks", tab));
    if (!snap.exists()) return;

    const urls = snap.data().urls || [];
    const updated = urls.filter(u => u !== url);
    await setDoc(doc(db, "dashboardBookmarks", tab), { urls: updated });
    renderBookmarks(tab, { urls: updated, favicons: snap.data().favicons || {} });
  }

  function renderBookmarks(tab, data) {
    const container = document.getElementById(`bookmark-bar-${tab}`);
    container.innerHTML = "";

    const urls = data.urls || [];
    const favicons = data.favicons || {};

    urls.forEach(url => {
      const a = document.createElement("a");
      a.className = "bookmark-button";
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
      a.title = url;
      a.classList.add("bookmark-link");

      const img = document.createElement("img");
      img.alt = "icon";

      if (favicons[url]) {
        img.src = favicons[url];
      } else {
        const fallback = new URL("/favicon.ico", url).href;
        img.src = fallback;
        img.onerror = () => {
          img.src = "https://www.google.com/s2/favicons?domain=" + url;
        };
      }

      const removeBtn = document.createElement("span");
      removeBtn.className = "remove";
      removeBtn.textContent = "×";
      removeBtn.onclick = (e) => {
        e.preventDefault();
        removeBookmark(tab, url);
      };

      a.appendChild(img);
      a.appendChild(removeBtn);
      container.appendChild(a);

      a.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        currentContextUrl = url;
        currentContextTab = tab;
        currentContextImg = img;

        const menu = document.getElementById("bookmark-context-menu");
        menu.style.top = `${e.pageY}px`;
        menu.style.left = `${e.pageX}px`;
        menu.style.display = "block";
      });
    });

    Sortable.create(container, {
      animation: 150,
      onEnd: async function () {
        const newOrder = Array.from(container.querySelectorAll("a")).map(a => a.href);
        try {
          await setDoc(doc(db, "dashboardBookmarks", tab), {
            urls: newOrder,
            favicons
          });
        } catch (err) {
          console.error("Error saving new bookmark order:", err);
        }
      }
    });
  }

  let currentContextUrl = null;
  let currentContextTab = null;
  let currentContextImg = null;

  document.addEventListener("contextmenu", (e) => {
    const link = e.target.closest(".bookmark-button");
    if (link) {
      e.preventDefault();
      currentContextUrl = link.href;
      const bar = link.closest("[id^='bookmark-bar-']");
      if (bar) {
        currentContextTab = bar.id.replace("bookmark-bar-", "");
      }

      const menu = document.getElementById("bookmark-context-menu");
      menu.style.top = `${e.pageY}px`;
      menu.style.left = `${e.pageX}px`;
      menu.style.display = "block";
    } else {
      document.getElementById("bookmark-context-menu").style.display = "none";
    }
  });

  document.addEventListener("click", () => {
    document.getElementById("bookmark-context-menu").style.display = "none";
  });

  document.getElementById("bookmark-context-menu").addEventListener("click", async (e) => {
    const action = e.target.dataset.action;
    if (!action) return;

    if (action === "open") {
      window.open(currentContextUrl, "_blank");

    } else if (action === "copy") {
      await navigator.clipboard.writeText(currentContextUrl);

    } else if (action === "edit") {
      const newUrl = prompt("Edit bookmark URL:", currentContextUrl);
      if (newUrl && newUrl !== currentContextUrl) {
        const snap = await getDoc(doc(db, "dashboardBookmarks", currentContextTab));
        if (snap.exists()) {
          const urls = snap.data().urls || [];
          const index = urls.indexOf(currentContextUrl);
          if (index !== -1) {
            urls[index] = newUrl;
            await setDoc(doc(db, "dashboardBookmarks", currentContextTab), { 
              urls, 
              favicons: snap.data().favicons || {} 
            });
            renderBookmarks(currentContextTab, { urls, favicons: snap.data().favicons || {} });
          }
        }
      }

    } else if (action === "remove") {
      if (currentContextTab && currentContextUrl) {
        await removeBookmark(currentContextTab, currentContextUrl);
      }

    } else if (action === "change-favicon") {
      const newFaviconUrl = prompt("Enter URL of new favicon:", "https://raw.githubusercontent.com/woodywilliams42/my-dashboard/main/favicons/icon1.png");
      if (newFaviconUrl && currentContextImg && currentContextUrl && currentContextTab) {
        currentContextImg.src = newFaviconUrl;

        const snap = await getDoc(doc(db, "dashboardBookmarks", currentContextTab));
        if (snap.exists()) {
          const urls = snap.data().urls || [];
          const favicons = snap.data().favicons || {};
          if (urls.includes(currentContextUrl)) {
            favicons[currentContextUrl] = newFaviconUrl;
            await setDoc(doc(db, "dashboardBookmarks", currentContextTab), { urls, favicons });
          }
        }
      }
    }

    document.getElementById("bookmark-context-menu").style.display = "none";
  });

 loadBookmarks("work");
["personal", "secondjob", "charity"].forEach(loadBookmarks);

["work", "personal", "secondjob", "charity"].forEach(tab => {
  loadNotes(tab);
  setupAutosave(tab); // 👈 This enables autosave for each notes section
});

["work", "personal", "secondjob", "charity"].forEach(loadQuickComments); // ✅ Correct placement

function getTimeZoneAbbr(timeZone) {
  const date = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "short"
  }).formatToParts(date);

  const tzPart = parts.find(p => p.type === "timeZoneName");
  if (tzPart && tzPart.value.includes("GMT")) {
    // Handle fallback abbreviation (e.g. GMT+5:30) — extract offset if needed
    return timeZone.split('/').pop().slice(0, 3).toUpperCase();
  }
  return tzPart ? tzPart.value.trim() : "";
}

function updateClocks() {
  const clocks = [
    { city: "Shanghai", timeZone: "Asia/Shanghai", country: "cn" },
    { city: "Chennai", timeZone: "Asia/Kolkata", country: "in" },
    { city: "London", timeZone: "Europe/London", country: "gb" },
    { city: "New York", timeZone: "America/New_York", country: "us" },
    { city: "Dallas", timeZone: "America/Chicago", country: "us" },
    { city: "Honolulu", timeZone: "Pacific/Honolulu", country: "us" }
  ];

  const container = document.getElementById("world-clocks");
  container.innerHTML = clocks.map(({ city, timeZone, country }) => {
    const now = new Date().toLocaleTimeString("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });

    const abbr = getTimeZoneAbbr(timeZone);

    return `
      <div class="clock-entry">
        <div class="city-info">
          <img class="flag circle-flag" src="https://flagcdn.com/${country}.svg" alt="${country} flag" />
          <span class="city-name">${city}</span>
        </div>
        <div class="time-info">${abbr} ${now}</div>
      </div>
    `;
  }).join("");
}


  setInterval(updateClocks, 1000);
  updateClocks();

  document.querySelectorAll("nav button").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.getElementById(target).classList.add("active");
      document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    // Toggle clock visibility
    const clockWrapper = document.getElementById("world-clocks-wrapper");
    if (target === "work") {
      clockWrapper.style.display = "block";
    } else {
      clockWrapper.style.display = "none";
    }

    });
  });

  const darkToggle = document.getElementById("darkModeToggle");
  const themeLabel = document.getElementById("theme-label");

  function applyDarkMode(isDark) {
    document.body.classList.toggle("dark", isDark);
    darkToggle.checked = isDark;
    themeLabel.textContent = isDark ? "🌙" : "🌞";
  }

  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDarkMode = savedTheme ? savedTheme === "dark" : systemPrefersDark;
  applyDarkMode(isDarkMode);

  darkToggle.addEventListener("change", () => {
    const isDark = darkToggle.checked;
    applyDarkMode(isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
  
const quickCommentsData = {}; // { tab: [ { label, text }, ... ] }

// Load from Firestore
async function loadQuickComments(tab) {
  const docRef = doc(db, "quickComments", tab);
  const snap = await getDoc(docRef);
  quickCommentsData[tab] = snap.exists() ? snap.data().comments || [] : [];
  renderQuickComments(tab);
}

// Save to Firestore
async function saveQuickComments(tab) {
  await setDoc(doc(db, "quickComments", tab), { comments: quickCommentsData[tab] });
}

// Render buttons
function renderQuickComments(tab) {
  const container = document.getElementById(`quick-comments-${tab}`);
  container.innerHTML = ""; // Clear previous
  const comments = quickCommentsData[tab] || [];

  comments.forEach((comment, index) => {
    const button = document.createElement("button");
    button.className = "quick-comment-button";
    button.textContent = comment.label;
    button.title = comment.text.slice(0, 100);
    button.setAttribute("draggable", true);

    // Copy to clipboard
    button.addEventListener("click", () => {
  navigator.clipboard.writeText(comment.text).then(() => {
    const originalText = button.textContent;
    button.textContent = "Copied";
    setTimeout(() => {
      button.textContent = originalText;
    }, 1000);
  });
});

    // Context menu
    button.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showQuickCommentContextMenu(e.pageX, e.pageY, tab, index);
    });

    // Drag-and-drop
    button.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", index);
      e.dataTransfer.effectAllowed = "move";
    });

    container.appendChild(button);
  });

  // Container-level drag handlers
  container.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  });

  container.addEventListener("drop", (e) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    const toIndex = [...container.children].findIndex(child => child === e.target);
    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      const comments = quickCommentsData[tab];
      const moved = comments.splice(fromIndex, 1)[0];
      comments.splice(toIndex, 0, moved);
      saveQuickComments(tab);
      renderQuickComments(tab);
    }
  });
}

// Context menu UI
function showQuickCommentContextMenu(x, y, tab, index) {
  const menu = document.getElementById("quickCommentContextMenu");
  menu.style.top = `${y}px`;
  menu.style.left = `${x}px`;
  menu.style.display = "block";
  menu.dataset.tab = tab;
  menu.dataset.index = index;
}

// Hide menu on click elsewhere
document.addEventListener("click", () => {
  document.getElementById("quickCommentContextMenu").style.display = "none";
});

// Add comment button
document.querySelectorAll(".addCommentBtn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const tab = btn.dataset.tab;
    const label = prompt("Enter a short label:");
    if (!label) return;
    const text = prompt("Enter the comment text:");
    if (!text) return;
    quickCommentsData[tab].push({ label, text });
    await saveQuickComments(tab);
    renderQuickComments(tab);
  });
});

// Context menu HTML (ensure only added once)
if (!document.getElementById("quickCommentContextMenu")) {
  document.body.insertAdjacentHTML("beforeend", `
    <div id="quickCommentContextMenu" style="position: absolute; display: none; background: white; border: 1px solid #ccc; z-index: 1000;">
      <ul style="list-style: none; margin: 0; padding: 0;">
        <li data-action="edit" style="padding: 4px 8px; cursor: pointer;">✏️ Edit</li>
        <li data-action="delete" style="padding: 4px 8px; cursor: pointer;">🗑️ Delete</li>
      </ul>
    </div>
  `);
}

// Context menu actions
document.getElementById("quickCommentContextMenu").addEventListener("click", async (e) => {
  const action = e.target.dataset.action;
  const menu = e.currentTarget;
  const tab = menu.dataset.tab;
  const index = parseInt(menu.dataset.index, 10);
  const comment = quickCommentsData[tab][index];

  if (action === "edit") {
    const newText = prompt("Edit comment text:", comment.text);
    if (newText !== null) {
      quickCommentsData[tab][index].text = newText;
      await saveQuickComments(tab);
      renderQuickComments(tab);
    }
  } else if (action === "delete") {
    if (confirm(`Delete comment "${comment.label}"?`)) {
      quickCommentsData[tab].splice(index, 1);
      await saveQuickComments(tab);
      renderQuickComments(tab);
    }
  }

  menu.style.display = "none";
});

const alarmSettings = {
  frequency: 120, // default in seconds (2 minutes)
  randomize: false,
  timerId: null,
};

const alarmSounds = [
  new Audio("https://raw.githubusercontent.com/woodywilliams42/my-dashboard/main/sounds/Alarm1.mp3"),
  new Audio("https://raw.githubusercontent.com/woodywilliams42/my-dashboard/main/sounds/Alarm2.mp3"),
  new Audio("https://raw.githubusercontent.com/woodywilliams42/my-dashboard/main/sounds/Alarm3.mp3"),
];

const dbDoc = doc(db, "alarmSettings", "secondjob");

// --- Load Settings ---
async function loadAlarmSettings() {
  const snap = await getDoc(dbDoc);
  if (snap.exists()) {
    Object.assign(alarmSettings, snap.data());
  }
  document.getElementById("alarm-frequency").value = alarmSettings.frequency;
  document.getElementById("alarm-random").checked = alarmSettings.randomize;
  updateCountdownDisplay(alarmSettings.frequency);
}

async function saveAlarmSettings() {
  await setDoc(dbDoc, {
    frequency: alarmSettings.frequency,
    randomize: alarmSettings.randomize,
  });
}

// --- Timer Logic ---
function startAlarmTimer() {
  stopAlarmTimer();
  scheduleNextAlarm();
}

function stopAlarmTimer() {
  if (alarmSettings.timerId) clearTimeout(alarmSettings.timerId);
  alarmSettings.timerId = null;
}

function scheduleNextAlarm() {
  let interval = alarmSettings.frequency;
  if (alarmSettings.randomize) {
    const delta = interval * 0.1;
    interval = interval + (Math.random() * delta * 2 - delta);
  }
  const ms = Math.round(interval * 1000);

  countdownStart(Date.now(), ms);

  alarmSettings.timerId = setTimeout(() => {
    playRandomAlarm();
    scheduleNextAlarm();
  }, ms);
}

function playRandomAlarm() {
  const sound = alarmSounds[Math.floor(Math.random() * alarmSounds.length)];
  sound.play();
}

// --- Countdown Display ---
let countdownInterval;
function countdownStart(startTime, duration) {
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, duration - elapsed);
    updateCountdownDisplay(Math.floor(remaining / 1000));
    if (remaining <= 0) clearInterval(countdownInterval);
  }, 1000);
}

function updateCountdownDisplay(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  const display = document.getElementById("alarm-countdown");
  display.innerText = `${minutes}:${secs}`;
  display.className = seconds <= 7 ? "led red" : "led green";
}

// --- Event Handlers ---
document.getElementById("alarm-start").addEventListener("click", startAlarmTimer);
document.getElementById("alarm-stop").addEventListener("click", () => {
  stopAlarmTimer();
  updateCountdownDisplay(alarmSettings.frequency);
});

document.getElementById("alarm-frequency").addEventListener("change", e => {
  alarmSettings.frequency = parseInt(e.target.value);
  saveAlarmSettings();
});

document.getElementById("alarm-random").addEventListener("change", e => {
  alarmSettings.randomize = e.target.checked;
  saveAlarmSettings();
});

// --- Initial Load ---
loadAlarmSettings();

  window.saveNotes = saveNotes;
  window.addBookmark = addBookmark;
  window.removeBookmark = removeBookmark;
  window.showBookmarkModal = function(tab) {
    document.getElementById(`bookmarkModal-${tab}`).style.display = 'flex';
  };
  window.closeBookmarkModal = function(tab) {
    document.getElementById(`bookmarkModal-${tab}`).style.display = 'none';
  };

  ["personal", "secondjob", "charity"].forEach(tab => {
    document.getElementById(`showBookmarkModal-${tab}`).addEventListener("click", () => window.showBookmarkModal(tab));
  });

  document.getElementById("showBookmarkModal-work").addEventListener("click", () => window.showBookmarkModal("work"));
