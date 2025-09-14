// Background script for YouTube to Pocketcasts extension

class BackgroundService {
  constructor() {
    this.videoInfo = null;
    this.init();
  }

  init() {
    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Handle extension icon click
    chrome.action.onClicked.addListener((tab) => {
      this.handleActionClick(tab);
    });
  }

  handleMessage(message, sender, sendResponse) {
    switch (message.action) {
      case 'setVideoInfo':
        this.videoInfo = message.videoInfo;
        sendResponse({ success: true });
        break;

      case 'getVideoInfo':
        sendResponse({ videoInfo: this.videoInfo });
        break;

      case 'searchPocketcasts':
        this.searchInPocketcasts(message.query);
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ error: 'Unknown action' });
    }
  }

  handleActionClick(tab) {
    // This will open the popup, which is handled by popup.html/popup.js
    // No additional action needed here
  }

  searchInPocketcasts(query) {
    if (!query) return;
    const url = `https://pocketcasts.com/search?q=${encodeURIComponent(query)}`;
    chrome.tabs.create({ url });
  }
}

// Initialize background service
new BackgroundService();