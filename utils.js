// Shared utilities for YouTube video extraction
window.Utils = {
  cleanTitle(title) {
    return title
      .replace(/\s*\|\s*.*$/, '')
      .replace(/^\d+\.\s*/, '')
      .replace(/^#\d+\s*[-:]\s*/, '')
      .replace(/\s*-\s*Episode.*$/i, '')
      .replace(/\s*\(.*podcast.*\)$/i, '')
      .replace(/\s*podcast\s*$/i, '')
      .trim();
  },

  cleanChannel(channel) {
    return channel
      .replace(/\s*podcast$/i, '')
      .replace(/\s*show$/i, '')
      .trim();
  },

  extractVideoInfo() {
    console.log('YouTube Pocketcasts: Starting video info extraction');

    // Try multiple selectors for the title (YouTube updates these frequently)
    const titleSelectors = [
      'h1.ytd-watch-metadata yt-formatted-string',
      'h1.style-scope.ytd-watch-metadata yt-formatted-string',
      'h1 yt-formatted-string',
      'h1.title.style-scope.ytd-video-primary-info-renderer',
      'h1.title',
      'h1[class*="title"]',
      '#title h1 yt-formatted-string',
      '.ytd-video-primary-info-renderer h1',
      'h1',
      '[class*="title"] h1',
      'ytd-watch-metadata h1'
    ];

    // Try multiple selectors for the channel
    const channelSelectors = [
      '#channel-name a',
      '.ytd-channel-name a',
      '#owner-name a',
      '.ytd-video-owner-renderer a',
      'ytd-channel-name a',
      '#upload-info #channel-name a',
      '.owner-text a',
      '[class*="channel-name"] a',
      'ytd-video-owner-renderer a'
    ];

    let titleElement = null;
    let channelElement = null;
    let workingTitleSelector = null;
    let workingChannelSelector = null;

    // Try each title selector until we find one that works
    for (const selector of titleSelectors) {
      titleElement = document.querySelector(selector);
      console.log(`Trying title selector "${selector}":`, titleElement?.textContent?.trim() || 'not found');
      if (titleElement && titleElement.textContent?.trim()) {
        workingTitleSelector = selector;
        break;
      }
    }

    // Try each channel selector until we find one that works
    for (const selector of channelSelectors) {
      channelElement = document.querySelector(selector);
      console.log(`Trying channel selector "${selector}":`, channelElement?.textContent?.trim() || 'not found');
      if (channelElement && channelElement.textContent?.trim()) {
        workingChannelSelector = selector;
        break;
      }
    }

    console.log(`Working selectors - Title: "${workingTitleSelector}", Channel: "${workingChannelSelector}"`);

    if (!titleElement) {
      console.log('No title element found, returning null');
      return null;
    }

    const title = titleElement.textContent?.trim() || '';
    const channel = channelElement?.textContent?.trim() || '';

    console.log('Extracted info:', { title, channel });

    return {
      title: this.cleanTitle(title),
      channel: this.cleanChannel(channel),
      originalTitle: title,
      originalChannel: channel
    };
  },

  openPocketcasts(query) {
    if (!query.trim()) return;
    const url = `https://pocketcasts.com/search?q=${encodeURIComponent(query.trim())}`;
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank');
    }
  }
};