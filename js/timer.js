// timer.js
import { framesData } from './frames.js';
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { app } from './firebase.js';

const db = getFirestore(app);

const GITHUB_API_URL = "https://api.github.com/repos/woodywilliams42/my-dashboard/contents/sounds/alarms";
const RAW_BASE_URL = "https://raw.githubusercontent.com/woodywilliams42/my-dashboard/main/sounds/alarms/";

let soundList = [];

async function fetchAlarmSounds() {
  try {
    const res = await fetch(GITHUB_API_URL);
    if (!res.ok) throw new Error("Failed to fetch alarm sounds");
    const files = await res.json();
    soundList = files
      .filter(f => /\.(mp3|wav|ogg)$/i.test(f.name))
      .map(f => `${RAW_BASE_URL}${f.name}`);
  } catch (err) {
    console.error("Error fetching alarm sounds:", err);
  }
}

function uploadAlarmFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".mp3,.wav,.ogg";
  input.click();

  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;

    const filename = file.name;
    const reader = new FileReader();

    reader.onload = async (e) => {
      const content = e.target.result.split(",")[1]; // Base64
      const res = await fetch(`https://api.github.com/repos/woodywilliams42/my-dashboard/contents/sounds/alarms/${filename}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GITHUB_TOKEN}`, // Replace or reference securely
        },
        body: JSON.stringify({
          message: `Add alarm sound ${filename}`,
          content: content
        })
      });

      if (res.ok) {
        alert("Alarm sound uploaded!");
        fetchAlarmSounds();
      } else {
        const err = await res.json();
        alert("Upload failed: " + (err.message || "Unknown error"));
      }
    };

    reader.readAsDataURL(file);
  });
}

export async function setupTimerFrame(frameEl, data, tab, id) {
  const container = document.createElement("div");
  container.className = "timer-frame-content";
  frameEl.querySelector(".frame-content").appendChild(container);

  container.innerHTML = `
    <div class="timer-display">00:00</div>
    <div class="timer-controls">
      <input type="number" class="timer-length-input" min="1" max="4800" value="${data.baseTime || 10}">
      <select class="timer-unit">
        <option value="seconds" ${data.unit === 'seconds' ? 'selected' : ''}>Seconds</option>
        <option value="minutes" ${data.unit === 'minutes' ? 'selected' : ''}>Minutes</option>
      </select>
      <button class="timer-start-btn start">Start</button>
    </div>
  `;

  const input = container.querySelector(".timer-length-input");
  const unit = container.querySelector(".timer-unit");
  const toggleBtn = container.querySelector(".timer-start-btn");
  const display = container.querySelector(".timer-display");

  let timer = null;
  let remaining = 0;

  // Right-click menu for uploading
  display.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const choice = confirm("Upload a new alarm sound?");
    if (choice) uploadAlarmFile();
  });

  async function playAlarm() {
    if (!soundList.length) await fetchAlarmSounds();
    if (!soundList.length) {
      console.warn("No alarm sounds found");
      return;
    }

    const soundUrl = soundList[Math.floor(Math.random() * soundList.length)];
    const sound = new Audio(soundUrl);
    sound.play().catch(err => console.error("Failed to play alarm sound:", err));
  }

  function randomizeTime(baseMs) {
    const variance = baseMs * 0.2;
    return baseMs + (Math.random() * variance * 2 - variance);
  }

  function updateDisplay(ms) {
    const totalSec = Math.ceil(ms / 1000);
    const min = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const sec = String(totalSec % 60).padStart(2, '0');
    display.textContent = `${min}:${sec}`;
    display.style.color = totalSec <= 7 ? 'red' : 'limegreen';
  }

  function startTimer() {
    const value = parseFloat(input.value);
    if (isNaN(value) || value <= 0) return;

    let baseSec = unit.value === 'minutes' ? value * 60 : value;
    baseSec = Math.min(baseSec, 4800);

    const randomizedMs = randomizeTime(baseSec * 1000);
    remaining = randomizedMs;
    const startTime = Date.now();

    timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const timeLeft = remaining - elapsed;

      updateDisplay(Math.max(0, timeLeft));

      if (timeLeft <= 0) {
        clearInterval(timer);
        playAlarm();
        startTimer();
      }
    }, 100);

    toggleBtn.classList.remove("start");
    toggleBtn.classList.add("stop");
    toggleBtn.textContent = "Stop";
  }

  function stopTimer() {
    clearInterval(timer);
    timer = null;
    toggleBtn.classList.remove("stop");
    toggleBtn.classList.add("start");
    toggleBtn.textContent = "Start";
  }

  toggleBtn.addEventListener("click", () => {
    if (timer) {
      stopTimer();
    } else {
      startTimer();
    }
  });

  unit.addEventListener("change", () => {
    let val = parseFloat(input.value) || 0;
    if (unit.value === "minutes") {
      val = Math.min(val / 60, 80);
    } else {
      val = Math.min(val * 60, 4800);
    }
    input.value = Math.max(1, Math.round(val));
    saveSettings();
  });

  input.addEventListener("input", () => {
    let val = parseFloat(input.value);
    if (unit.value === "minutes" && val > 80) val = 80;
    if (unit.value === "seconds" && val > 4800) val = 4800;
    input.value = val;
    saveSettings();
  });

  function saveSettings() {
    const frame = framesData[tab].find(f => f.id === id);
    if (frame) {
      frame.data.baseTime = parseFloat(input.value);
      frame.data.unit = unit.value;
      const docRef = doc(db, "tabFrames", tab);
      setDoc(docRef, { frames: framesData[tab] });
    }
  }

  updateDisplay(0);
  toggleBtn.classList.add("start");

  // Initial fetch
  await fetchAlarmSounds();
}
