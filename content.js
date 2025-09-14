// Content script for YouTube to Pocketcasts extension

class PocketcatsSearchExtension {
  constructor() {
    this.init();
  }

  init() {
    // Wait for YouTube to load and inject button
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.injectButton());
    } else {
      this.injectButton();
    }

    // Handle YouTube's dynamic navigation
    this.observeNavigation();
  }

  extractVideoInfo() {
    return Utils.extractVideoInfo();
  }


  createPocketcastsButton() {
    const button = document.createElement('button');
    button.id = 'pocketcasts-search-btn';
    button.className = 'pocketcasts-search-button';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
      Search in Pocketcasts
    `;
    
    button.addEventListener('click', () => this.searchInPocketcasts());
    
    return button;
  }

  injectButton() {
    // Remove existing button if present
    const existingButton = document.getElementById('pocketcasts-search-btn');
    if (existingButton) {
      existingButton.remove();
    }

    // Wait a bit for YouTube to fully load
    setTimeout(() => {
      const videoInfo = this.extractVideoInfo();
      if (!videoInfo) return;

      // Find a good place to inject the button
      const actionBar = document.querySelector('#actions') ||
                       document.querySelector('.ytd-menu-renderer') ||
                       document.querySelector('#top-level-buttons-computed');

      if (actionBar) {
        const button = this.createPocketcastsButton();
        actionBar.appendChild(button);
      }
    }, 1000);
  }

  searchInPocketcasts() {
    const videoInfo = this.extractVideoInfo();
    if (!videoInfo) {
      alert('Could not extract video information');
      return;
    }

    // Create search query
    const searchQuery = `${videoInfo.title} ${videoInfo.channel}`.trim();

    // Try to store video info for popup, but don't let it block the search
    try {
      chrome.runtime.sendMessage({
        action: 'setVideoInfo',
        videoInfo: videoInfo,
        searchQuery: searchQuery
      });
    } catch (error) {
      console.log('Could not send message to background script (extension may have been reloaded)');
    }

    Utils.openPocketcasts(searchQuery);
  }

  observeNavigation() {
    // Observe URL changes for YouTube's SPA navigation
    let currentUrl = window.location.href;
    
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        if (currentUrl.includes('/watch')) {
          setTimeout(() => this.injectButton(), 1500);
        }
      }
    });

    observer.observe(document, { subtree: true, childList: true });
  }
}

// Initialize the extension
new PocketcatsSearchExtension();