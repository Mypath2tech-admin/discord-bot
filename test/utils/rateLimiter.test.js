import { expect } from 'chai';
import { checkRateLimit, resetUserRateLimit, getRateLimitStats } from '../../utils/rateLimiter.js';

describe('Rate Limiter', () => {
  const mockClient = {
    user: { id: 'test-bot-id' }
  };

  beforeEach(() => {
    // Reset rate limiter state before each test
    // You might need to add a reset function to rateLimiter.js
  });

  describe('checkRateLimit', () => {
    it('should allow first request', () => {
      const result = checkRateLimit('test-user', 'TestUser#1234', 'test-command', mockClient);
      expect(result.allowed).to.be.true;
      expect(result.message).to.be.undefined;
    });

    it('should enforce rate limits', () => {
      const userId = 'rate-limited-user';
      const userTag = 'RateLimitedUser#1234';
      const commandKey = 'daily';

      // Make multiple requests quickly
      for (let i = 0; i < 5; i++) {
        checkRateLimit(userId, userTag, commandKey, mockClient);
      }

      // Next request should be rate limited
      const result = checkRateLimit(userId, userTag, commandKey, mockClient);
      expect(result.allowed).to.be.false;
      expect(result.message).to.include('rate limit');
    });

    it('should handle different command types', () => {
      const userId = 'test-user-2';
      const userTag = 'TestUser2#1234';

      const dailyResult = checkRateLimit(userId, userTag, 'daily', mockClient);
      const workResult = checkRateLimit(userId, userTag, 'work', mockClient);

      expect(dailyResult.allowed).to.be.true;
      expect(workResult.allowed).to.be.true;
    });
  });

  describe('resetUserRateLimit', () => {
    it('should reset user rate limits', () => {
      const userId = 'reset-test-user';
      const userTag = 'ResetTestUser#1234';

      // Hit rate limit
      for (let i = 0; i < 10; i++) {
        checkRateLimit(userId, userTag, 'test-command', mockClient);
      }

      // Should be rate limited
      let result = checkRateLimit(userId, userTag, 'test-command', mockClient);
      expect(result.allowed).to.be.false;

      // Reset and try again
      resetUserRateLimit(userId);
      result = checkRateLimit(userId, userTag, 'test-command', mockClient);
      expect(result.allowed).to.be.true;
    });
  });

  describe('getRateLimitStats', () => {
    it('should return statistics object', () => {
      const stats = getRateLimitStats();
      
      expect(stats).to.be.an('object');
      expect(stats).to.have.property('totalRequests');
      expect(stats).to.have.property('blockedRequests');
      expect(stats).to.have.property('activeUsers');
    });
  });
});
