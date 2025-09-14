# YouTube to Pocketcasts Chrome Extension

A Chrome extension that allows you to search for YouTube videos in Pocketcasts with one click.

## Features

- **One-click search**: Adds a "Search in Pocketcasts" button to YouTube video pages
- **Smart title cleaning**: Automatically removes common YouTube formatting from video titles
- **Popup interface**: Click the extension icon for manual search customization
- **Channel-only search**: Option to search just by podcast channel name

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the extension folder
4. The extension will appear in your Chrome toolbar

## Usage

### Method 1: YouTube Page Button
1. Go to any YouTube video page
2. Look for the red "Search in Pocketcasts" button near the like/share buttons
3. Click it to automatically search for the video in Pocketcasts

### Method 2: Extension Popup
1. While on a YouTube video page, click the extension icon in the toolbar
2. Review and edit the search query if needed
3. Click "Search in Pocketcasts" or "Search Channel Only"

## How It Works

The extension:
1. Extracts video title and channel name from YouTube pages
2. Cleans the title by removing common YouTube formatting (episode numbers, "| Channel Name", etc.)
3. Opens Pocketcasts search with the cleaned query
4. Works with YouTube's single-page navigation

## Files

- `manifest.json` - Extension configuration
- `content.js` - Script that runs on YouTube pages
- `content.css` - Styling for the YouTube button
- `popup.html` - Extension popup interface
- `popup.js` - Popup functionality
- `background.js` - Background service worker
- `icon*.png` - Extension icons

## Development

The extension uses Chrome Extensions Manifest V3 and includes:
- Content scripts for YouTube integration
- Popup interface for manual control
- Background service worker for message handling
- Cross-origin permissions for Pocketcasts integration

## Permissions

- `activeTab` - To read YouTube page content
- `tabs` - To open new Pocketcasts tabs
- Host permissions for YouTube and Pocketcasts domains