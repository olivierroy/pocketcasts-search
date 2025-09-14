# Permission Justifications

This document explains why each permission is required for the Pocketcasts Search extension.

## Required Permissions

### `activeTab`
**Purpose**: Access the content of the currently active tab to extract podcast information.

**Justification**: The extension needs to read the page content (title, metadata, DOM elements) from podcast websites like Spotify, Apple Podcasts, YouTube, and others to automatically detect episode titles and show names. This permission only grants access to the tab the user is currently viewing when they click the extension icon.

**Data Usage**:
- Extracts podcast titles and show names from page elements
- Reads meta tags (og:title, twitter:title) for better content detection
- No data is stored or transmitted to external servers

### `tabs`
**Purpose**: Create new tabs to open Pocketcasts search results.

**Justification**: When users search for a podcast, the extension opens the Pocketcasts search page in a new tab using `chrome.tabs.create()`. This provides a seamless user experience without navigating away from their current page.

**Data Usage**:
- Only creates new tabs with Pocketcasts search URLs
- Does not access content of other tabs
- Does not read tab history or modify existing tabs

### `scripting`
**Purpose**: Inject podcast extraction code into web pages.

**Justification**: The extension uses `chrome.scripting.executeScript()` to run podcast detection logic on the current page. This is necessary because the popup runs in an isolated environment and cannot directly access page content.

**Data Usage**:
- Injects utility functions to extract podcast information
- Runs only when the user opens the extension popup
- Does not persist or store any injected code

## Host Permissions

### `*://*/*`
**Purpose**: Access podcast content on any website with audio players.

**Justification**: Podcasts are hosted on many different platforms (Spotify, Apple Podcasts, SoundCloud, YouTube, podcast hosting sites, etc.). The extension needs broad host access to detect podcast content across the web, as users may encounter podcast episodes on any website.

**Data Usage**:
- Only activates when users manually open the extension popup
- Extracts publicly visible podcast information (titles, show names)
- Does not access sensitive user data or authentication tokens

### `*://pocketcasts.com/*`
**Purpose**: Open Pocketcasts search pages.

**Justification**: The extension's core functionality is to search Pocketcasts. This permission ensures the extension can open Pocketcasts search URLs when users click search buttons.

**Data Usage**:
- Only opens public Pocketcasts search pages
- Does not access user's Pocketcasts account or personal data
- No cookies or authentication data is accessed

## Privacy Commitment

- **No data collection**: The extension does not collect, store, or transmit any personal data
- **No tracking**: No analytics, telemetry, or user behavior tracking
- **Local processing**: All podcast extraction happens locally in the browser
- **No network requests**: Except for opening Pocketcasts search pages, no network requests are made
- **Open source**: All code is publicly available for inspection

## Security Notes

- The extension only runs when explicitly activated by the user
- No background scripts or persistent monitoring
- No content is modified on web pages
- No form data or passwords are accessed
- All operations are read-only except for opening new tabs