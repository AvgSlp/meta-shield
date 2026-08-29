const toggle = document.getElementById("shield-toggle");
const countDisplay = document.getElementById("block-count");
const mainCard = document.getElementById("main-card");

// Helper function to format large numbers uniformly across the UI
function formatCount(rawCount) {
  if (rawCount >= 1000) {
    // Converts numbers like 1425 to a localized string like "1,425"
    return rawCount.toLocaleString();
    
    // Alternative: If your popup box is tiny and text wraps, uncomment the line below instead:
    // return (rawCount / 1000).toFixed(1) + "k"; // Displays "1.4k"
  }
  return rawCount.toString();
}

// 1. Unified Initialization using Modern Async/Await Promises
async function initUI() {
  try {
    // Fetch all storage keys at once to prevent multiple read cycles
    const storage = await browser.storage.local.get(["shieldEnabled"]);
    
    // Default to true if the setting has never been saved before
    const isEnabled = storage.shieldEnabled !== false; 
    toggle.checked = isEnabled;
    mainCard.classList.toggle("disabled", !isEnabled);

    // Pull the real-time block metrics for the active view context
    await refreshBlockCount();
  } catch (error) {
    console.error("UI Initialization failed:", error);
  }
}

// 2. Isolated Function to Handle Tab Block Metric Updates Safely
async function refreshBlockCount() {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    
    // Defend against restricted system URLs (e.g., about:addons, chrome://)
    if (!activeTab || !activeTab.id || activeTab.id === browser.tabs.TAB_ID_NONE) {
      countDisplay.textContent = "-";
      return;
    }

    const key = `tab_${activeTab.id}`;
    const result = await browser.storage.local.get(key);
    const rawCount = result[key] || 0;
    
    // Display the beautifully formatted total counter
    countDisplay.textContent = formatCount(rawCount);
  } catch (error) {
    console.error("Failed to fetch block count:", error);
  }
}

// 3. Modernized Toggle Event Listener
toggle.addEventListener("change", async () => {
  const isEnabled = toggle.checked;
  
  try {
    // Atomic state save
    await browser.storage.local.set({ shieldEnabled: isEnabled });
    mainCard.classList.toggle("disabled", !isEnabled);

    // Dynamic asset swap matching current extension states
    const iconPath = isEnabled ? "icon.png" : "icon_gray.png";
    await browser.browserAction.setIcon({ path: iconPath });

    if (!isEnabled) {
      countDisplay.textContent = "0";
      
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];

      if (activeTab && activeTab.id && activeTab.id !== browser.tabs.TAB_ID_NONE) {
        const key = `tab_${activeTab.id}`;
        // Batch clean badge layout counters and clear structural storage
        await Promise.all([
          browser.browserAction.setBadgeText({ tabId: activeTab.id, text: "" }),
          browser.storage.local.remove(key)
        ]);
      }
    }

    // Direct background pipeline ping
    await browser.runtime.sendMessage({ action: "updateShield", enabled: isEnabled });
  } catch (error) {
    console.error("Toggle update pipeline execution failure:", error);
  }
});

// 4. Real-time Extension State Listener
// Ensures if blocks happen while the popup stays open, numbers update instantly!
browser.storage.onChanged.addListener((changes) => {
  browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    const activeTab = tabs[0];
    if (activeTab && changes[`tab_${activeTab.id}`]) {
      const updatedCount = changes[`tab_${activeTab.id}`].newValue || 0;
      countDisplay.textContent = formatCount(updatedCount);
    }
  });
});

// Run execution loop on layout build attach
initUI();
