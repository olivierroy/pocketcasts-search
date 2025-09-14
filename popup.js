// Popup script for YouTube to Pocketcasts extension

class PopupController {
  constructor() {
    this.init();
  }

  async init() {
    try {
      // Get current tab info
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (this.isYouTubeVideo(tab.url)) {
        await this.loadVideoInfo(tab);
      } else {
        this.showManualSearch();
      }
    } catch (error) {
      console.error('Error initializing popup:', error);
      this.showManualSearch();
    }
  }

  isYouTubeVideo(url) {
    return url && url.includes('youtube.com/watch');
  }

  async loadVideoInfo(tab) {
    try {
      // Execute content script to get video info
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.Utils.extractVideoInfo()
      });

      const videoInfo = results[0]?.result;

      if (videoInfo && videoInfo.title) {
        this.displayVideoInfo(videoInfo);
      } else {
        this.showLoading();
        // Retry after a delay in case page isn't fully loaded
        setTimeout(() => this.retryLoadVideoInfo(tab), 1000);
      }
    } catch (error) {
      console.error('Error loading video info:', error);
      this.showError();
    }
  }

  async retryLoadVideoInfo(tab) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.Utils.extractVideoInfo()
      });

      const videoInfo = results[0]?.result;

      if (videoInfo && videoInfo.title) {
        this.displayVideoInfo(videoInfo);
      } else {
        this.showError('Could not extract video information');
      }
    } catch (error) {
      this.showError('Error loading video information');
    }
  }


  displayVideoInfo(videoInfo) {
    const searchQuery = `${videoInfo.title} ${videoInfo.channel}`.trim();

    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="video-info">
        <div class="video-title">${this.escapeHtml(videoInfo.originalTitle)}</div>
        <div class="video-channel">by ${this.escapeHtml(videoInfo.originalChannel)}</div>
      </div>

      <div class="search-section">
        <input type="text" class="search-query" id="searchQuery"
               value="${this.escapeHtml(searchQuery)}"
               placeholder="Search query for Pocketcasts">
        <button class="button" id="searchBtn">Search in Pocketcasts</button>
        <button class="button secondary-button" id="searchChannelBtn">Search Channel Only</button>
      </div>
    `;

    // Add event listeners
    document.getElementById('searchBtn').addEventListener('click', () => {
      const query = document.getElementById('searchQuery').value;
      this.openPocketcasts(query);
    });

    document.getElementById('searchChannelBtn').addEventListener('click', () => {
      this.openPocketcasts(videoInfo.channel);
    });

    // Allow Enter key to search
    document.getElementById('searchQuery').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = e.target.value;
        this.openPocketcasts(query);
      }
    });
  }

  openPocketcasts(query) {
    Utils.openPocketcasts(query);
    window.close();
  }

  showManualSearch() {
    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="search-section">
        <input type="text" class="search-query" id="manualSearchQuery"
               placeholder="Enter podcast or show name to search">
        <button class="button" id="manualSearchBtn">Search in Pocketcasts</button>
      </div>
      <div class="status">
        Go to a YouTube video for automatic extraction, or use the search above.
      </div>
    `;

    // Add event listeners
    document.getElementById('manualSearchBtn').addEventListener('click', () => {
      const query = document.getElementById('manualSearchQuery').value;
      this.openPocketcasts(query);
    });

    // Allow Enter key to search
    document.getElementById('manualSearchQuery').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = e.target.value;
        this.openPocketcasts(query);
      }
    });

    // Focus the search field
    document.getElementById('manualSearchQuery').focus();
  }

  showLoading() {
    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="status">
        Loading video information...
      </div>
    `;
  }

  showError(message = 'An error occurred') {
    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="status">
        ${this.escapeHtml(message)}
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize popup when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new PopupController());
} else {
  new PopupController();
}