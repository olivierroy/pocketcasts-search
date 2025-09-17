// Popup script for YouTube to Pocket Casts extension

class PopupController {
  constructor() {
    this.pocketcastsTab = null;
    this.playerState = { hasPlayer: false };
    this.init();
  }

  async init() {
    try {
      // Check for Pocket Casts tab first
      await this.checkPocketcastsPlayer();

      // Get current tab info
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Try to extract content from any page
      await this.loadPodcastInfo(tab);
    } catch (error) {
      console.error('Error initializing popup:', error);
      this.showManualSearch();
    }
  }

  isYouTubeVideo(url) {
    return url && url.includes('youtube.com/watch');
  }

  async loadPodcastInfo(tab) {
    try {
      // Execute content script to get podcast info
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['utils.js']
      });

      const results2 = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.Utils.extractPodcastInfo()
      });

      const podcastInfo = results2[0]?.result;

      if (podcastInfo && podcastInfo.title) {
        this.displayPodcastInfo(podcastInfo);
      } else {
        this.showLoading();
        // Retry after a delay in case page isn't fully loaded
        setTimeout(() => this.retryLoadPodcastInfo(tab), 2000);
      }
    } catch (error) {
      console.error('Error loading podcast info:', error);
      this.showError();
    }
  }

  async retryLoadPodcastInfo(tab) {
    try {
      // Inject utils first, then extract
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['utils.js']
      });

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.Utils.extractPodcastInfo()
      });

      const podcastInfo = results[0]?.result;

      if (podcastInfo && podcastInfo.title) {
        this.displayPodcastInfo(podcastInfo);
      } else {
        this.showManualSearch();
      }
    } catch (error) {
      this.showError('Error loading podcast information');
    }
  }


  displayPodcastInfo(podcastInfo) {
    const searchQuery = `${podcastInfo.title} ${podcastInfo.channel}`.trim();

    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="video-info">
        <div class="video-title">${this.escapeHtml(podcastInfo.originalTitle)}</div>
        <div class="video-channel">by ${this.escapeHtml(podcastInfo.originalChannel)}</div>
      </div>

      <div class="search-section">
        <input type="text" class="search-query" id="searchQuery"
               value="${this.escapeHtml(searchQuery)}"
               placeholder="Search query for Pocket Casts">
        <button class="button" id="searchBtn">Search in Pocket Casts</button>
        <button class="button secondary-button" id="searchChannelBtn">Search Channel Only</button>
      </div>
    `;

    // Add event listeners
    document.getElementById('searchBtn').addEventListener('click', () => {
      const query = document.getElementById('searchQuery').value;
      this.openPocketcasts(query);
    });

    document.getElementById('searchChannelBtn').addEventListener('click', () => {
      this.openPocketcasts(podcastInfo.channel);
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
        <button class="button" id="manualSearchBtn">Search in Pocket Casts</button>
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

  async checkPocketcastsPlayer() {
    try {
      this.pocketcastsTab = await Utils.findPocketcastsTab();

      if (this.pocketcastsTab) {
        this.playerState = await Utils.getPocketcastsPlayerState(this.pocketcastsTab.id);
        this.updatePlayerControls();
      }
    } catch (error) {
      console.error('Error checking Pocket Casts player:', error);
    }
  }

  updatePlayerControls() {
    const playerControls = document.getElementById('playerControls');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const nowPlaying = document.getElementById('nowPlaying');

    if (!this.playerState.hasPlayer) {
      playerControls.classList.remove('visible');
      return;
    }

    playerControls.classList.add('visible');
    playPauseBtn.disabled = false;

    // Update now playing info
    const title = this.playerState.episodeTitle || this.playerState.showTitle || 'Unknown';
    nowPlaying.textContent = title;
    nowPlaying.title = title; // Show full text on hover

    // Add click handler
    playPauseBtn.onclick = () => this.handlePlayPause();
  }

  async handlePlayPause() {
    if (!this.pocketcastsTab) return;

    const playPauseBtn = document.getElementById('playPauseBtn');
    const buttonText = playPauseBtn.querySelector('span');

    playPauseBtn.disabled = true;
    buttonText.textContent = 'Loading...';

    try {
      await Utils.controlPocketcastsPlayer(this.pocketcastsTab.id);
      buttonText.textContent = 'Toggle Play/Pause';
    } catch (error) {
      console.error('Error controlling player:', error);
      buttonText.textContent = 'Error';
      setTimeout(() => {
        buttonText.textContent = 'Toggle Play/Pause';
      }, 1000);
    }

    playPauseBtn.disabled = false;
  }

  async refreshPlayerState() {
    if (!this.pocketcastsTab) return;

    try {
      this.playerState = await Utils.getPocketcastsPlayerState(this.pocketcastsTab.id);
      this.updatePlayerControls();
    } catch (error) {
      console.error('Error refreshing player state:', error);
    }
  }
}

// Initialize popup when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new PopupController());
} else {
  new PopupController();
}