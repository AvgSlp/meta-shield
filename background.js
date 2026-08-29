let tabCounts = {};
let isShieldEnabled = true;

// 1. Pre-load the shield state using modern async Promise handling
browser.storage.local.get("shieldEnabled").then((result) => {
  if (result.shieldEnabled !== undefined) {
    isShieldEnabled = result.shieldEnabled;
  }
}).catch(err => console.error("Storage read failure on init:", err));

// 2. Optimized runtime listener with global badge sync cleanup
browser.runtime.onMessage.addListener((message) => {
  if (message.action === "updateShield") {
    isShieldEnabled = message.enabled;
    const path = message.enabled ? "icon.png" : "icon_gray.png";
    browser.browserAction.setIcon({ path: path });

    // Instantly wipe all active tab counts out of memory if disabled globally
    if (!message.enabled) {
      tabCounts = {};
    }
  }
});

// 3. High-Performance Interception Engine with Robust URL Validation
browser.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (!isShieldEnabled) return { cancel: false };

    // Strict validation check to bypass system internals or invalid tab context environments
    if (!details.tabId || details.tabId < 0) return { cancel: false };

    try {
      const url = details.url;

      // Consolidated evaluation check matching Meta tracker payloads
      if (url.includes("connect.facebook.net") || 
          url.includes("tr/") || 
          url.includes("impression.php") ||
          (details.type !== "main_frame" && (url.includes(".facebook.net") || url.includes(".facebook.com")))) {
        
        incrementTabCounter(details.tabId);
        return { cancel: true }; 
      }
    } catch (e) {
      console.error("Tracker evaluation boundary exception:", e);
    }

    return { cancel: false };
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

// 4. Thread-Safe Performance Counter with Compact Badge Formatting
function incrementTabCounter(tabId) {
  // Safe base initialization mapping
  tabCounts[tabId] = (tabCounts[tabId] || 0) + 1;
  const rawCount = tabCounts[tabId];

  // --- AUTOMATIC BADGE FORMATTER ---
  // Caps text string length at 4 characters so it fits inside the tiny extension badge node safely
  const displayCount = rawCount >= 1000 ? ">1k" : rawCount.toString();

  // Execution: Update rapid memory counters and UI badges synchronously 
  browser.browserAction.setBadgeText({ tabId: tabId, text: displayCount });
  browser.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: "#d32f2f" });

  // Debounced Local Disk Storage Flush:
  // Instead of hitting disk I/O on every block event, use a non-blocking macro task
  setTimeout(() => {
    // We explicitly compare against rawCount to preserve the TRUE numerical value in storage
    if (tabCounts[tabId] === rawCount) {
      browser.storage.local.set({ [`tab_${tabId}`]: rawCount });
    }
  }, 50);
}

// 5. Automatic Dynamic Pipeline Garbage Collector
browser.tabs.onRemoved.addListener((tabId) => {
  if (tabCounts[tabId] !== undefined) {
    delete tabCounts[tabId];
    browser.storage.local.remove(`tab_${tabId}`).catch(() => {});
  }
});

// 6. Reset Counters on Tab Refresh/Navigation
// Prevents block counts from old web pages piling up over your new tab view contents
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading" && tabCounts[tabId]) {
    tabCounts[tabId] = 0;
    browser.storage.local.remove(`tab_${tabId}`).catch(() => {});
    browser.browserAction.setBadgeText({ tabId: tabId, text: "" });
  }
});
