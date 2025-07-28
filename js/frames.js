async function loadFramesForTab(tab, user = null) {
  currentTab = tab;
  const container = document.getElementById(tab);
  if (!container) return;

  // ✅ Get current user if not passed
  if (!user) {
    user = await new Promise(resolve => {
      const unsub = onAuthStateChanged(auth, u => {
        unsub();
        resolve(u);
      });
    });
  }

  // ✅ Block unauthorized access
  const allowedUIDs = ["L9XDBQpraqPwVkZFkqy6Vd5VvWC3"];
  if (!user || !allowedUIDs.includes(user.uid)) {
    console.warn("🚫 Unauthorized user — cannot load frames.");
    container.innerHTML = `<p style="text-align:center;color:gray;">🚫 You are not authorized to view this tab's frames.</p>`;
    framesData[tab] = []; // clear data
    return;
  }

  try {
    const snap = await getDoc(doc(db, "tabFrames", tab));
    if (snap.exists()) {
      const frames = snap.data().frames || [];
      console.log("✅ Loaded frames for tab:", tab, frames);
      framesData[tab] = frames;
      container.innerHTML = frames.length === 0
        ? `<p class="empty-tab-message">No frames yet on "${tab}".</p>`
        : "";
      frames.forEach(frame => createFrame(frame, tab));
    } else {
      container.innerHTML = `<p class="empty-tab-message">No frames found for this tab.</p>`;
    }
  } catch (err) {
    console.error("🔥 Error loading frames:", err);
    container.innerHTML = `<p class="empty-tab-message">⚠️ Error loading frames.</p>`;
  }
}
