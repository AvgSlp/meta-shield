const toggle = document.getElementById("shield-toggle");
const countDisplay = document.getElementById("block-count");
const mainCard = document.getElementById("main-card");

function updateUI() {
  browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const activeTab = tabs[0];
    if (activeTab) {
      browser.storage.local.get("tab_" + activeTab.id, function(result) {
        countDisplay.textContent = result["tab_" + activeTab.id] || 0;
      });
    }
  });

  browser.storage.local.get("shieldEnabled", function(result) {
    if (result.shieldEnabled === undefined) {
      toggle.checked = true;
      mainCard.classList.remove("disabled");
    } else {
      toggle.checked = result.shieldEnabled;
      if (!result.shieldEnabled) mainCard.classList.add("disabled");
    }
  });
}

toggle.addEventListener("change", function() {
  const isEnabled = toggle.checked;
  browser.storage.local.set({ shieldEnabled: isEnabled });

  if (isEnabled) {
    mainCard.classList.remove("disabled");
    browser.browserAction.setIcon({ path: "icon.png" });
  } else {
    mainCard.classList.add("disabled");
    countDisplay.textContent = "0";
    browser.browserAction.setIcon({ path: "icon_gray.png" });

    browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const activeTab = tabs[0];
      if (activeTab) {
        browser.browserAction.setBadgeText({ tabId: activeTab.id, text: "" });
        browser.storage.local.remove("tab_" + activeTab.id);
      }
    });
  }

  browser.runtime.sendMessage({ action: "updateShield", enabled: isEnabled });
});

updateUI();
