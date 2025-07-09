// Test setup file
import dotenv from 'dotenv';

// Load environment variables for testing
dotenv.config();

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Mock Discord client if needed
global.mockDiscordClient = {
  user: { id: 'test-bot-id' },
  channels: {
    cache: {
      get: () => ({
        send: () => Promise.resolve()
      })
    }
  },
  ws: { ping: 50 }
};

// Suppress console output during tests (optional)
if (process.env.SUPPRESS_TEST_LOGS === 'true') {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}

console.log('🧪 Test environment initialized');
