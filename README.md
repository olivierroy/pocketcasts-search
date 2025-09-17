# Pocket Casts Search Extension

A Chrome extension that helps you search Pocket Casts for podcasts from webpages with audio players and podcast content. Works on Spotify, Apple Podcasts, SoundCloud, and many other podcast platforms.

## Features

- 🎯 **Automatic Detection**: Detects podcast content on webpages and extracts titles/show names
- 🌐 **Universal**: Works on Spotify, Apple Podcasts, SoundCloud, and many podcast platforms
- 🔍 **Manual Search**: Search for any podcast directly from the extension popup
- ⚡ **Quick Access**: Adds a "Search in Pocket Casts" button on supported pages

## Installation

### From GitHub

1. **Download the extension**:
   - Go to the latest release
   - Download the `.zip` file

2. **Enable Developer Mode in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Toggle "Developer mode" on (top right)

3. **Load the extension**:
   - Click "Load unpacked"
   - Select the folder containing the extension files
   - The extension should now appear in your extensions list

4. **Pin the extension** (optional):
   - Click the puzzle piece icon in the toolbar
   - Pin "Pocket Casts Search" for easy access

### From Chrome Web Store

https://chromewebstore.google.com/detail/pocketcasts-search/hlpijedkipcldggdacalmagojpelmmof

## How to Use

### Automatic Detection
1. Visit any webpage with podcast content (Spotify, Apple Podcasts, etc.)
2. Look for the "Search in Pocket Casts" button on the page
3. Click it to search for the podcast in Pocket Casts

### Extension Popup
1. Click the extension icon in your toolbar
2. On podcast pages: See extracted title/show name, edit if needed
3. On other pages: Use the manual search field
4. Click "Search in Pocket Casts" to open results

### Supported Sites
- Spotify (podcast pages)
- Apple Podcasts
- SoundCloud
- Anchor.fm
- Buzzsprout
- Libsyn
- Video platforms with podcast content
- Any website with `<audio>` elements or podcast players

## Privacy

This extension:
- ✅ Only reads content from webpages you visit
- ✅ Does not collect or store personal data
- ✅ Does not send data to external servers (except opening Pocket Casts search)
- ✅ Works entirely locally in your browser

## License

This project is released into the public domain under The Unlicense. See [UNLICENSE](UNLICENSE) for details.

## Contributing

Contributions welcome! Feel free to:
- Report bugs or request features
- Submit pull requests
- Suggest improvements for podcast detection

## Troubleshooting

**Extension not detecting podcast content?**
- Check browser console for debug logs
- Try refreshing the page
- Use the manual search in the popup as a fallback

**Button not appearing?**
- Make sure you're on a supported site or page with audio elements
- The extension only shows buttons on pages with detectable podcast content

**Search not working?**
- Verify you have an internet connection
- Check if Pocket Casts.com is accessible
