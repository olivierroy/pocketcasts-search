const fs = require('fs');
const { JSDOM } = require('jsdom');

// Set up DOM environment
const dom = new JSDOM('', {
  url: 'https://example.com',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.console = console;

// Mock Chrome APIs
global.chrome = {
  tabs: {
    create: (options) => {
      console.log(`Mock: Opening ${options.url}`);
    },
    query: async (options) => {
      return [];
    }
  },
  scripting: {
    executeScript: async (options) => {
      return [{ result: { hasPlayer: false } }];
    }
  }
};

// Load the utils.js file
const Utils = require('./utils.js');

// Test framework
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(`Expected "${expected}", got "${actual}". ${message}`);
    }
  }

  assertTrue(condition, message = '') {
    if (!condition) {
      throw new Error(`Expected true, got ${condition}. ${message}`);
    }
  }

  assertFalse(condition, message = '') {
    if (condition) {
      throw new Error(`Expected false, got ${condition}. ${message}`);
    }
  }

  async run() {
    console.log('🧪 Running Pocketcasts Search Extension Test Suite\n');

    for (const { name, fn } of this.tests) {
      try {
        await fn.call(this);
        console.log(`✅ ${name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   ${error.message}\n`);
        this.failed++;
      }
    }

    const total = this.passed + this.failed;
    console.log(`\n📊 Results: ${this.passed}/${total} tests passed`);

    if (this.failed > 0) {
      console.log(`\n💥 ${this.failed} test(s) failed`);
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    }
  }
}

const runner = new TestRunner();

// Title Cleaning Tests
runner.test('cleanTitle removes pipe and channel name', function() {
  const result = Utils.cleanTitle('Episode 123 | Podcast Name');
  this.assertEqual(result, 'Episode 123');
});

runner.test('cleanTitle removes episode numbers', function() {
  const result = Utils.cleanTitle('1. Interview with Guest');
  this.assertEqual(result, 'Interview with Guest');
});

runner.test('cleanTitle removes hash episode format', function() {
  const result = Utils.cleanTitle('#45 - The Big Discussion');
  this.assertEqual(result, 'The Big Discussion');
});

runner.test('cleanTitle removes episode suffix', function() {
  const result = Utils.cleanTitle('Great Discussion - Episode 10');
  this.assertEqual(result, 'Great Discussion');
});

runner.test('cleanTitle removes podcast suffix', function() {
  const result = Utils.cleanTitle('My Show Podcast');
  this.assertEqual(result, 'My Show');
});

runner.test('cleanTitle handles multiple patterns', function() {
  const result = Utils.cleanTitle('2. Deep Dive - Episode 15 | My Podcast Show');
  this.assertEqual(result, 'Deep Dive');
});

// Channel Cleaning Tests
runner.test('cleanChannel removes podcast suffix', function() {
  const result = Utils.cleanChannel('Joe Rogan Podcast');
  this.assertEqual(result, 'Joe Rogan');
});

runner.test('cleanChannel removes show suffix', function() {
  const result = Utils.cleanChannel('The Daily Show');
  this.assertEqual(result, 'The Daily');
});

// Duplicate Detection Tests
runner.test('areTitleAndChannelDuplicates detects exact duplicates', function() {
  const result = Utils.areTitleAndChannelDuplicates('Lex Fridman Podcast', 'Lex Fridman Podcast');
  this.assertTrue(result);
});

runner.test('areTitleAndChannelDuplicates ignores case', function() {
  const result = Utils.areTitleAndChannelDuplicates('LEX FRIDMAN PODCAST', 'lex fridman podcast');
  this.assertTrue(result);
});

runner.test('areTitleAndChannelDuplicates ignores common words', function() {
  const result = Utils.areTitleAndChannelDuplicates('Lex Fridman Podcast', 'The Lex Fridman Show');
  this.assertTrue(result);
});

runner.test('areTitleAndChannelDuplicates detects different content', function() {
  const result = Utils.areTitleAndChannelDuplicates('Episode 123', 'Lex Fridman Podcast');
  this.assertFalse(result);
});

runner.test('areTitleAndChannelDuplicates handles empty values', function() {
  const result1 = Utils.areTitleAndChannelDuplicates('', 'Something');
  const result2 = Utils.areTitleAndChannelDuplicates('Something', '');
  const result3 = Utils.areTitleAndChannelDuplicates('', '');
  this.assertFalse(result1);
  this.assertFalse(result2);
  this.assertFalse(result3);
});

// Navigation Title Detection Tests
runner.test('isNavigationTitle detects Spotify navigation', function() {
  const result = Utils.isNavigationTitle('Your Library');
  this.assertTrue(result);
});

runner.test('isNavigationTitle detects Apple Podcasts navigation', function() {
  const result = Utils.isNavigationTitle('Apple Podcasts');
  this.assertTrue(result);
});

runner.test('isNavigationTitle ignores actual content', function() {
  const result = Utils.isNavigationTitle('Episode 123: Deep Learning');
  this.assertFalse(result);
});

// createCleanedResult Tests
runner.test('createCleanedResult handles normal case', function() {
  const result = Utils.createCleanedResult('Episode 123', 'My Podcast Show', 'Test');
  this.assertEqual(result.title, 'Episode 123');
  this.assertEqual(result.channel, 'My Podcast');
  this.assertEqual(result.originalTitle, 'Episode 123');
  this.assertEqual(result.originalChannel, 'My Podcast Show');
});

runner.test('createCleanedResult removes duplicates', function() {
  const result = Utils.createCleanedResult('Lex Fridman Podcast', 'Lex Fridman Podcast', 'Test');
  this.assertEqual(result.title, 'Lex Fridman');
  this.assertEqual(result.channel, '');
  this.assertEqual(result.originalTitle, 'Lex Fridman Podcast');
  this.assertEqual(result.originalChannel, 'Lex Fridman Podcast');
});

// URL Generation Tests
runner.test('openPocketcasts generates correct URL', function() {
  let capturedUrl = null;

  // Override the mock to capture URL
  global.chrome.tabs.create = (options) => {
    capturedUrl = options.url;
  };

  Utils.openPocketcasts('test query');
  this.assertEqual(capturedUrl, 'https://pocketcasts.com/search?q=test%20query');
});

runner.test('openPocketcasts handles special characters', function() {
  let capturedUrl = null;

  global.chrome.tabs.create = (options) => {
    capturedUrl = options.url;
  };

  Utils.openPocketcasts('test & query with spaces');
  this.assertEqual(capturedUrl, 'https://pocketcasts.com/search?q=test%20%26%20query%20with%20spaces');
});

// Player Control Tests
runner.test('findPocketcastsTab returns null without chrome tabs API', async function() {
  // Temporarily remove chrome.tabs
  const originalTabs = global.chrome.tabs;
  delete global.chrome.tabs;

  const result = await Utils.findPocketcastsTab();
  this.assertEqual(result, null);

  // Restore chrome.tabs
  global.chrome.tabs = originalTabs;
});

runner.test('getPocketcastsPlayerState handles missing tab gracefully', async function() {
  // Mock chrome.scripting.executeScript to simulate error
  global.chrome.scripting = {
    executeScript: () => {
      throw new Error('Tab not found');
    }
  };

  const result = await Utils.getPocketcastsPlayerState(999);
  this.assertEqual(result.hasPlayer, false);
});

runner.test('controlPocketcastsPlayer handles missing tab gracefully', async function() {
  // Mock chrome.scripting.executeScript to simulate error
  global.chrome.scripting = {
    executeScript: () => {
      throw new Error('Tab not found');
    }
  };

  const result = await Utils.controlPocketcastsPlayer(999);
  this.assertEqual(result, false);
});

// Run all tests
runner.run();