# 🛡️ Meta Shield

**Meta Shield** is a lightweight, high-performance, open-source privacy extension built explicitly for **Mozilla Firefox (Manifest V2)**. It intercepts background network connections and instantly blocks hidden corporate tracking pixels, diagnostic scripts, and analytics hooks before they can transmit your private browsing data back to Meta's servers.

---

## 🚀 Key Features

* **Real-Time Network Interception:** Uses the unthrottled `webRequest` API to trap and destroy tracking scripts instantly.
* **Per-Tab Isolation Analytics:** The toolbar badge counter dynamically tracks and displays blocked elements only for the page you are currently viewing.
* **Granular Active Shield Toggle:** Features a responsive popup dashboard with a master switch to temporarily deactivate or activate your protection.
* **Dynamic Grayscale UI System:** The entire user dashboard and native browser toolbar icon shift to a high-contrast black-and-white state when the shield is deactivated, giving clear visual confirmation.

---

## 🛠️ The Core Architecture

Unlike restrictive Manifest V3 architectures, Meta Shield leverages the full, independent capabilities of Firefox's extension engine to process data streams client-side on your own hardware. 

### Interception Logic (`background.js` snippet)
```javascript
browser.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (!isShieldEnabled) return { cancel: false };
    
    // Intercept specific tracking files and pixel payloads
    if (details.url.includes("connect.facebook.net") || 
        details.url.includes("tr/") || 
        details.url.includes("impression.php")) {
      return { cancel: true }; // Vaporizes the tracker instantly
    }
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);
```

---

## 📦 Local Installation (Developer Mode)

Because this tool is built for independent user sovereignty, you can run the source code directly on your local machine:

1. Clone or download this repository to your computer.
2. Open **Mozilla Firefox** and navigate to `about:debugging`.
3. Click on **This Firefox** in the left-hand sidebar.
4. Click the **Load Temporary Add-on...** button.
5. Select the `manifest.json` file inside your project directory.

---

## ⚖️ Legal Disclaimer

*Meta Shield is an independent open-source software project. It is completely unaffiliated with, authorized by, or endorsed by Meta Platforms, Inc., Facebook, Instagram, or any of its subsidiaries. This tool operates entirely client-side, exercising the user's inherent right to filter network traffic on their own personal hardware and monitor data privacy.*
