import { expect } from 'chai';
import { logInfo, logWarn, logError, getLogStats, queryLogs } from '../../utils/logger.js';

describe('Logger', () => {
  const mockClient = {
    user: { id: 'test-bot-id' },
    channels: {
      cache: {
        get: () => ({
          send: () => Promise.resolve()
        })
      }
    }
  };

  describe('logInfo', () => {
    it('should log info messages without errors', async () => {
      expect(() => {
        logInfo(mockClient, 'Test info message', { testData: 'value' });
      }).to.not.throw();
    });

    it('should handle messages without metadata', async () => {
      expect(() => {
        logInfo(mockClient, 'Test info message without metadata');
      }).to.not.throw();
    });
  });

  describe('logWarn', () => {
    it('should log warning messages without errors', async () => {
      expect(() => {
        logWarn(mockClient, 'Test warning message', { testData: 'value' });
      }).to.not.throw();
    });
  });

  describe('logError', () => {
    it('should log error messages without errors', async () => {
      expect(() => {
        logError(mockClient, 'Test error message', new Error('Test error'));
      }).to.not.throw();
    });

    it('should handle string errors', async () => {
      expect(() => {
        logError(mockClient, 'Test error message', 'String error');
      }).to.not.throw();
    });
  });

  describe('getLogStats', () => {
    it('should return statistics object', () => {
      const stats = getLogStats();
      
      expect(stats).to.be.an('object');
      expect(stats).to.have.property('totalLogs');
      expect(stats).to.have.property('errorLogs');
      expect(stats).to.have.property('warnLogs');
      expect(stats).to.have.property('infoLogs');
    });
  });

  describe('queryLogs', () => {
    it('should return array of logs', async () => {
      const logs = await queryLogs();
      
      expect(logs).to.be.an('array');
    });

    it('should filter by level', async () => {
      const errorLogs = await queryLogs({ level: 'error' });
      
      expect(errorLogs).to.be.an('array');
      errorLogs.forEach(log => {
        expect(log.level).to.equal('error');
      });
    });
  });
});
