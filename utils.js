// Shared utilities for podcast content extraction
const Utils = {
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

  areTitleAndChannelDuplicates(title, channel) {
    if (!title || !channel) return false;

    // Normalize for comparison (lowercase, remove common words)
    const normalize = (str) => str.toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\b(podcast|show|the)\b/g, '')
      .trim();

    const normalizedTitle = normalize(title);
    const normalizedChannel = normalize(channel);

    return normalizedTitle === normalizedChannel;
  },

  createCleanedResult(title, channel, context = '') {
    console.log(`${context}: Extracted info:`, { title, channel });

    const cleanedTitle = this.cleanTitle(title);
    const cleanedChannel = this.cleanChannel(channel);

    // If title and channel are duplicates, clear the channel
    if (this.areTitleAndChannelDuplicates(cleanedTitle, cleanedChannel)) {
      console.log(`${context}: Title and channel are duplicates, clearing channel`);
      return {
        title: cleanedTitle,
        channel: '',
        originalTitle: title,
        originalChannel: channel
      };
    }

    return {
      title: cleanedTitle,
      channel: cleanedChannel,
      originalTitle: title,
      originalChannel: channel
    };
  },

  extractPodcastInfo() {
    console.log('Pocketcasts Search: Starting content extraction');

    // Check if we're on YouTube and use specific selectors
    if (window.location.hostname.includes('youtube.com')) {
      return this.extractYouTubeInfo();
    }

    // For other sites, try generic podcast content extraction
    return this.extractGenericPodcastInfo();
  },

  extractYouTubeInfo() {
    console.log('Extracting YouTube video info');

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

    return this.trySelectors(titleSelectors, channelSelectors);
  },

  extractGenericPodcastInfo() {
    console.log('Extracting generic podcast info');

    const hostname = window.location.hostname.toLowerCase();

    // Spotify-specific extraction
    if (hostname.includes('spotify.com')) {
      return this.extractSpotifyInfo();
    }

    // Apple Podcasts-specific extraction
    if (hostname.includes('podcasts.apple.com')) {
      return this.extractApplePodcastsInfo();
    }

    // Look for audio elements first to confirm this might be podcast content
    const hasAudio = document.querySelector('audio') ||
                    document.querySelector('[class*="audio"]') ||
                    document.querySelector('[class*="player"]') ||
                    document.querySelector('[id*="player"]') ||
                    document.querySelector('[data-*="audio"]');

    if (!hasAudio) {
      console.log('No audio elements found, trying generic extraction anyway');
    }

    // Generic selectors for podcast titles and show names
    const titleSelectors = [
      // Meta tags (try first as they're most reliable)
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      // Common podcast title patterns
      '[class*="episode"][class*="title"]',
      '[class*="podcast"][class*="title"]',
      '[data-*="episode"]',
      '[data-*="title"]',
      // Common title tags
      'h1',
      'h2',
      '[class*="title"]',
      '[id*="title"]',
      // Apple/other platforms
      '.episode-title',
      '.show-title'
    ];

    const channelSelectors = [
      // Meta tags first
      'meta[property="og:site_name"]',
      'meta[name="author"]',
      // Common podcast show patterns
      '[class*="show"][class*="name"]',
      '[class*="podcast"][class*="name"]',
      '[class*="author"]',
      '[class*="creator"]',
      '[data-*="show"]',
      '[data-*="podcast"]',
      // Generic patterns
      '.show-name',
      '.podcast-name'
    ];

    return this.trySelectors(titleSelectors, channelSelectors);
  },

  extractSpotifyInfo() {
    console.log('Extracting Spotify podcast info');

    // Check if we're on an episode page vs show page
    const isEpisodePage = window.location.href.includes('/episode/');
    const isShowPage = window.location.href.includes('/show/');

    let episodeTitle = '';
    let showName = '';

    // First try meta tags - most reliable
    const metaTitle = document.querySelector('meta[property="og:title"]');
    if (metaTitle && metaTitle.content && !this.isSpotifyNavigationTitle(metaTitle.content)) {
      console.log('Using meta tag title:', metaTitle.content);

      if (isEpisodePage) {
        episodeTitle = metaTitle.content;
        showName = this.extractSpotifyShowName();
      } else {
        // If on show page, the meta title might be the show name
        showName = metaTitle.content;
        episodeTitle = ''; // No specific episode
      }

      // Don't duplicate show name in both fields
      if (episodeTitle === showName) {
        episodeTitle = ''; // Clear duplicate
      }

      return {
        title: this.cleanTitle(episodeTitle || showName),
        channel: this.cleanChannel(episodeTitle ? showName : ''),
        originalTitle: episodeTitle || showName,
        originalChannel: episodeTitle ? showName : ''
      };
    }

    const titleSelectors = [
      // Spotify episode page specific - target main content area
      'main [data-testid="entity-title"]',
      'main h1[data-encore-id="text"]',
      '[role="main"] h1',
      // Content-specific selectors
      '[data-testid="episode-title"]',
      'article h1',
      // Avoid sidebar/nav by targeting main content
      'main h1',
      'main h2'
    ];

    const channelSelectors = [
      // Spotify show name specific
      'main [data-testid="show-title"]',
      'main a[href*="/show/"]',
      '[data-testid="creator-name"]',
      'main [class*="artist"]'
    ];

    return this.trySelectorsWithFilter(titleSelectors, channelSelectors);
  },

  isNavigationTitle(title) {
    const navTitles = [
      'Your Library', 'Home', 'Search', 'Browse', 'Library',
      'Spotify', 'Apple Podcasts', 'Podcasts', 'iTunes',
      'Top Charts', 'Categories', 'New & Noteworthy'
    ];
    return navTitles.some(nav => title.toLowerCase().includes(nav.toLowerCase()));
  },

  isSpotifyNavigationTitle(title) {
    return this.isNavigationTitle(title);
  },

  extractSpotifyShowName() {
    // Try to find show name from various sources
    const selectors = [
      // Show link in breadcrumb or episode info
      'main a[href*="/show/"]:not([data-testid="entity-title"])',
      '[data-testid="show-title"]',
      // Artist/creator info
      'main [class*="artist"]:not(h1)',
      'main [data-testid="creator-name"]',
      // Link elements that point to show
      'a[href*="/show/"] span',
      // Subtitle or byline elements
      'main p a[href*="/show/"]',
      'main div[class*="subtitle"] a'
    ];

    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        const text = element?.textContent?.trim();
        console.log(`Trying show selector "${selector}":`, text || 'not found');

        if (element && text && text !== 'Spotify') {
          return text;
        }
      } catch (e) {
        console.log(`Error with selector "${selector}":`, e);
      }
    }

    // Fallback to extract from URL if we can find a show link
    const showLink = document.querySelector('a[href*="/show/"]');
    if (showLink && showLink.href) {
      const showId = showLink.href.match(/\/show\/([^?]+)/)?.[1];
      if (showId) {
        console.log('Found show ID but no name:', showId);
      }
    }

    return '';
  },

  extractApplePodcastsInfo() {
    console.log('Extracting Apple Podcasts info');

    // First try meta tags - most reliable
    const metaTitle = document.querySelector('meta[property="og:title"]');
    if (metaTitle && metaTitle.content && !this.isNavigationTitle(metaTitle.content)) {
      console.log('Using Apple Podcasts meta tag title:', metaTitle.content);
      const showName = this.extractApplePodcastsShowName();

      // Don't duplicate if title and show name are the same
      const title = metaTitle.content;
      if (title === showName) {
        return {
          title: this.cleanTitle(title),
          channel: '',
          originalTitle: title,
          originalChannel: ''
        };
      }

      return {
        title: this.cleanTitle(title),
        channel: this.cleanChannel(showName || ''),
        originalTitle: title,
        originalChannel: showName || ''
      };
    }

    // Apple Podcasts specific selectors
    const titleSelectors = [
      // Episode or show title
      '[data-testid="non-linkable-headline"]',
      '.product-header__title',
      'h1[class*="headings"]',
      'main h1',
      '.episode-title',
      'h1'
    ];

    const channelSelectors = [
      // Show name
      '.product-header__identity a',
      '[data-testid="click-action"] h2',
      '.podcast-header__identity a',
      'a[href*="/podcast/"]',
      '.show-name'
    ];

    return this.trySelectorsWithAppleFilter(titleSelectors, channelSelectors);
  },

  extractApplePodcastsShowName() {
    const selectors = [
      '.product-header__identity a',
      'a[href*="/podcast/"]:not(h1 a)',
      '[data-testid="click-action"] h2',
      '.podcast-header__identity a'
    ];

    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        const text = element?.textContent?.trim();
        console.log(`Trying Apple show selector "${selector}":`, text || 'not found');

        if (element && text && !this.isNavigationTitle(text)) {
          return text;
        }
      } catch (e) {
        console.log(`Error with selector "${selector}":`, e);
      }
    }
    return '';
  },

  trySelectorsWithAppleFilter(titleSelectors, channelSelectors) {
    let titleElement = null;
    let channelElement = null;
    let workingTitleSelector = null;
    let workingChannelSelector = null;

    // Try each title selector until we find one that works
    for (const selector of titleSelectors) {
      try {
        titleElement = document.querySelector(selector);
        const titleText = titleElement?.textContent?.trim();
        console.log(`Trying Apple title selector "${selector}":`, titleText || 'not found');

        if (titleElement && titleText && !this.isNavigationTitle(titleText)) {
          workingTitleSelector = selector;
          break;
        }
      } catch (e) {
        console.log(`Error with selector "${selector}":`, e);
      }
    }

    // Try each channel selector until we find one that works
    for (const selector of channelSelectors) {
      try {
        channelElement = document.querySelector(selector);
        const channelText = channelElement?.textContent?.trim();
        console.log(`Trying Apple channel selector "${selector}":`, channelText || 'not found');

        if (channelElement && channelText && !this.isNavigationTitle(channelText)) {
          workingChannelSelector = selector;
          break;
        }
      } catch (e) {
        console.log(`Error with selector "${selector}":`, e);
      }
    }

    console.log(`Working Apple selectors - Title: "${workingTitleSelector}", Channel: "${workingChannelSelector}"`);

    if (!titleElement) {
      console.log('No Apple title element found, returning null');
      return null;
    }

    const title = titleElement.textContent?.trim() || '';
    const channel = channelElement?.textContent?.trim() || '';

    return this.createCleanedResult(title, channel, 'Apple Podcasts');
  },

  trySelectorsWithFilter(titleSelectors, channelSelectors) {
    let titleElement = null;
    let channelElement = null;
    let workingTitleSelector = null;
    let workingChannelSelector = null;

    // Try each title selector until we find one that works
    for (const selector of titleSelectors) {
      try {
        titleElement = document.querySelector(selector);
        const titleText = titleElement?.textContent?.trim();
        console.log(`Trying title selector "${selector}":`, titleText || 'not found');

        if (titleElement && titleText && !this.isSpotifyNavigationTitle(titleText)) {
          workingTitleSelector = selector;
          break;
        }
      } catch (e) {
        console.log(`Error with selector "${selector}":`, e);
      }
    }

    // Try each channel selector until we find one that works
    for (const selector of channelSelectors) {
      try {
        channelElement = document.querySelector(selector);
        const channelText = channelElement?.textContent?.trim();
        console.log(`Trying channel selector "${selector}":`, channelText || 'not found');

        if (channelElement && channelText) {
          workingChannelSelector = selector;
          break;
        }
      } catch (e) {
        console.log(`Error with selector "${selector}":`, e);
      }
    }

    console.log(`Working selectors - Title: "${workingTitleSelector}", Channel: "${workingChannelSelector}"`);

    if (!titleElement) {
      console.log('No title element found, returning null');
      return null;
    }

    const title = titleElement.textContent?.trim() || '';
    const channel = channelElement?.textContent?.trim() || '';

    return this.createCleanedResult(title, channel, 'Spotify');
  },

  trySelectors(titleSelectors, channelSelectors) {
    let titleElement = null;
    let channelElement = null;
    let workingTitleSelector = null;
    let workingChannelSelector = null;

    // Try each title selector until we find one that works
    for (const selector of titleSelectors) {
      try {
        if (selector.startsWith('meta[')) {
          // Handle meta tags differently
          const metaTag = document.querySelector(selector);
          if (metaTag && metaTag.content?.trim()) {
            titleElement = { textContent: metaTag.content };
            workingTitleSelector = selector;
            break;
          }
        } else {
          titleElement = document.querySelector(selector);
          console.log(`Trying title selector "${selector}":`, titleElement?.textContent?.trim() || 'not found');
          if (titleElement && titleElement.textContent?.trim()) {
            workingTitleSelector = selector;
            break;
          }
        }
      } catch (e) {
        console.log(`Error with selector "${selector}":`, e);
      }
    }

    // Try each channel selector until we find one that works
    for (const selector of channelSelectors) {
      try {
        if (selector.startsWith('meta[')) {
          // Handle meta tags differently
          const metaTag = document.querySelector(selector);
          if (metaTag && metaTag.content?.trim()) {
            channelElement = { textContent: metaTag.content };
            workingChannelSelector = selector;
            break;
          }
        } else {
          channelElement = document.querySelector(selector);
          console.log(`Trying channel selector "${selector}":`, channelElement?.textContent?.trim() || 'not found');
          if (channelElement && channelElement.textContent?.trim()) {
            workingChannelSelector = selector;
            break;
          }
        }
      } catch (e) {
        console.log(`Error with selector "${selector}":`, e);
      }
    }

    console.log(`Working selectors - Title: "${workingTitleSelector}", Channel: "${workingChannelSelector}"`);

    if (!titleElement) {
      console.log('No title element found, returning null');
      return null;
    }

    const title = titleElement.textContent?.trim() || '';
    const channel = channelElement?.textContent?.trim() || '';

    return this.createCleanedResult(title, channel, 'Generic');
  },

  openPocketcasts(query) {
    if (!query.trim()) return;
    const url = `https://pocketcasts.com/search?q=${encodeURIComponent(query.trim())}`;
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank');
    }
  },

  async findPocketcastsTab() {
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      return null;
    }

    try {
      const tabs = await chrome.tabs.query({
        url: ['*://pocketcasts.com/*', '*://*.pocketcasts.com/*']
      });
      return tabs.find(tab => tab.url && tab.url.includes('pocketcasts.com')) || null;
    } catch (error) {
      console.error('Error finding Pocketcasts tab:', error);
      return null;
    }
  },

  async getPocketcastsPlayerState(tabId) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          // Check if player exists by looking for control buttons or player container
          const pauseButton = document.querySelector('button[aria-label="Pause"]');
          const playButton = document.querySelector('button[aria-label="Play"]');
          const playerContainer = document.querySelector('[class*="player"]');

          if (!pauseButton && !playButton && !playerContainer) {
            return { hasPlayer: false };
          }

          // Get episode and show titles using optimized selectors
          const episodeElement = document.querySelector('.episode-title');
          const showElement = document.querySelector('.podcast-title');

          let episodeTitle = '';
          let showTitle = '';

          if (episodeElement?.textContent?.trim()) {
            const fullText = episodeElement.textContent.trim();

            // Pocketcasts sometimes has format: "Episode Title by Show Name"
            if (fullText.includes(' by ')) {
              const parts = fullText.split(' by ');
              episodeTitle = parts[0].trim();
              showTitle = parts[1].trim();
            } else {
              episodeTitle = fullText;
            }
          }

          // Get show title from dedicated element if not found in episode
          if (!showTitle && showElement?.textContent?.trim()) {
            showTitle = showElement.textContent.trim();
          }

          return {
            hasPlayer: true,
            episodeTitle: episodeTitle || '',
            showTitle: showTitle || ''
          };
        }
      });

      return results[0]?.result || { hasPlayer: false };
    } catch (error) {
      console.error('Error getting Pocketcasts player state:', error);
      return { hasPlayer: false };
    }
  },

  async controlPocketcastsPlayer(tabId) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          // Try the main play/pause button (exact aria-label match)
          const playPauseButton = document.querySelector('button[aria-label="Pause"], button[aria-label="Play"]');

          if (playPauseButton) {
            playPauseButton.click();
            return true;
          }

          // Fallback: try keyboard shortcut
          document.body.focus();
          document.dispatchEvent(new KeyboardEvent('keydown', {
            key: ' ',
            code: 'Space',
            bubbles: true
          }));
          document.dispatchEvent(new KeyboardEvent('keyup', {
            key: ' ',
            code: 'Space',
            bubbles: true
          }));

          return true;
        }
      });

      return results[0]?.result || false;
    } catch (error) {
      console.error('Error controlling Pocketcasts player:', error);
      return false;
    }
  }
};

// Export for both browser and Node.js environments
if (typeof window !== 'undefined') {
  window.Utils = Utils;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}