// timer.js
import { framesData } from './frames.js';
import { db } from './firebase.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const SOUNDS = [
  'sounds/Alarm1.mp3',
  'sounds/Alarm2.mp3',
  'sounds/Alarm3.mp3'
];

export function setupTimerFrame(frameEl, data, tab, id) {
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

  function playAlarm() {
    const sound = new Audio(SOUNDS[Math.floor(Math.random() * SOUNDS.length)]);
    sound.play();
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
}
