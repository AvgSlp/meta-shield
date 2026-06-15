let tabCounts = {};
let isShieldEnabled = true;

// Pre-load the shield state from storage
browser.storage.local.get("shieldEnabled", function(result) {
  if (result.shieldEnabled !== undefined) {
    isShieldEnabled = result.shieldEnabled;
  }
});

// Listen for messages from popup.js to sync state instantly
browser.runtime.onMessage.addListener((message) => {
  if (message.action === "updateShield") {
    isShieldEnabled = message.enabled;
    if (message.enabled) {
      browser.browserAction.setIcon({ path: "icon.png" });
    } else {
      browser.browserAction.setIcon({ path: "icon_gray.png" });
    }
  }
});

// The absolute, un-killable interception engine
browser.webRequest.onBeforeRequest.addListener(
  function(details) {
    // If shield is toggled off, let everything pass
    if (!isShieldEnabled) return { cancel: false };

    // Catch specific tracking files and pixel payloads
    if (details.url.includes("connect.facebook.net") || 
        details.url.includes("tr/") || 
        details.url.includes("impression.php") ||
        (details.type !== "main_frame" && (details.url.includes(".facebook.net") || details.url.includes(".facebook.com")))) {
      
      if (details.tabId && details.tabId >= 0) {
        incrementTabCounter(details.tabId);
      }
      return { cancel: true }; // Vaporizes the tracker script instantly
    }

    return { cancel: false };
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

function incrementTabCounter(tabId) {
  if (!tabCounts[tabId]) tabCounts[tabId] = 0;
  tabCounts[tabId]++;

  browser.storage.local.set({ ["tab_" + tabId]: tabCounts[tabId] });

  browser.browserAction.setBadgeText({ tabId: tabId, text: tabCounts[tabId].toString() });
  browser.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: "#d32f2f" });
}

browser.tabs.onRemoved.addListener((tabId) => {
  delete tabCounts[tabId];
  browser.storage.local.remove("tab_" + tabId);
});
