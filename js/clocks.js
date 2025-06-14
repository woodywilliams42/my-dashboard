// clocks.js — Display world clocks in the header

function getTimeZoneAbbr(timeZone) {
  const date = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "short"
  }).formatToParts(date);

  const part = parts.find(p => p.type === "timeZoneName");
  if (!part) return "";
  return part.value.includes("GMT") ? timeZone.split("/").pop().slice(0, 3).toUpperCase() : part.value.trim();
}

export function updateClocks() {
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

export function initClockUpdater() {
  updateClocks();
  setInterval(updateClocks, 1000);
}
