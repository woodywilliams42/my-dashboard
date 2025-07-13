// alarms.js
import { db } from './firebase.js';
import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// --- Settings and Sounds ---
const alarmSettings = {
  frequency: 120, // seconds
  randomize: false,
  timerId: null
};

const alarmSounds = [
  new Audio("https://raw.githubusercontent.com/woodywilliams42/my-dashboard/main/sounds/Alarm1.mp3"),
  new Audio("https://raw.githubusercontent.com/woodywilliams42/my-dashboard/main/sounds/Alarm2.mp3"),
  new Audio("https://raw.githubusercontent.com/woodywilliams42/my-dashboard/main/sounds/Alarm3.mp3")
];

const dbDoc = doc(db, "alarmSettings", "secondjob");

let countdownInterval = null;

// === Load ===
async function loadAlarmSettings() {
  try {
    const snap = await getDoc(dbDoc);
    if (snap.exists()) {
      Object.assign(alarmSettings, snap.data());
    }
  } catch (err) {
    console.error("Failed to load alarm settings:", err);
  }

  document.getElementById("alarm-frequency").value = alarmSettings.frequency;
  document.getElementById("alarm-random").checked = alarmSettings.randomize;
  updateCountdownDisplay(alarmSettings.frequency);
}

async function saveAlarmSettings() {
  try {
    await setDoc(dbDoc, {
      frequency: alarmSettings.frequency,
      randomize: alarmSettings.randomize
    });
  } catch (err) {
    console.error("Failed to save alarm settings:", err);
  }
}

// === Alarm Logic ===
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
  sound.play().catch(err => console.error("Alarm failed to play:", err));
}

// === Countdown UI ===
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

  if (display) {
    display.innerText = `${minutes}:${secs}`;
    display.className = seconds <= 7 ? "led red" : "led green";
  }
}

// === Hook up UI ===
function setupAlarmUI() {
  const startBtn = document.getElementById("alarm-start");
  const stopBtn = document.getElementById("alarm-stop");
  const freqInput = document.getElementById("alarm-frequency");
  const randomCheckbox = document.getElementById("alarm-random");

  if (startBtn) {
    startBtn.addEventListener("click", startAlarmTimer);
  }

  if (stopBtn) {
    stopBtn.addEventListener("click", () => {
      stopAlarmTimer();
      updateCountdownDisplay(alarmSettings.frequency);
    });
  }

  if (freqInput) {
    freqInput.addEventListener("change", e => {
      const freq = parseInt(e.target.value, 10);
      if (!isNaN(freq)) {
        alarmSettings.frequency = freq;
        saveAlarmSettings();
      }
    });
  }

  if (randomCheckbox) {
    randomCheckbox.addEventListener("change", e => {
      alarmSettings.randomize = e.target.checked;
      saveAlarmSettings();
    });
  }
}
// === Init ===
document.addEventListener("DOMContentLoaded", () => {
  loadAlarmSettings();
  setupAlarmUI();
});

