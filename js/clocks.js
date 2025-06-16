// === TIMEZONE ABBREVIATION ===
function getTimeZoneAbbr(timeZone) {
  const date = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "short"
  }).formatToParts(date);

  const tzPart = parts.find(p => p.type === "timeZoneName");
  if (tzPart && tzPart.value.includes("GMT")) {
    return timeZone.split('/').pop().slice(0, 3).toUpperCase();
  }
  return tzPart ? tzPart.value.trim() : "";
}

// === UPDATE CLOCKS ===
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
  if (!container) return;

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

// === INITIALIZER ===
export function initClocks() {
  updateClocks();
  setInterval(updateClocks, 1000);
}
