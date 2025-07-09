import { expect } from 'chai';
import { 
  detectSuspiciousActivity, 
  validateTransaction, 
  trackUserActivity,
  getSecurityStats,
  getUserSecurityInfo 
} from '../../utils/security.js';

describe('Security', () => {
  const mockClient = {
    user: { id: 'test-bot-id' }
  };

  describe('validateTransaction', () => {
    it('should validate normal transactions', () => {
      const mockUserData = { coins: 1000, bank: 5000 };
      const result = validateTransaction('user123', 'work', 100, mockUserData);
      
      expect(result).to.be.an('object');
      expect(result).to.have.property('valid');
      expect(result).to.have.property('reason');
    });

    it('should reject negative amounts', () => {
      const mockUserData = { coins: 1000, bank: 5000 };
      const result = validateTransaction('user123', 'work', -100, mockUserData);
      
      expect(result.valid).to.be.false;
      expect(result.reason).to.include('negative');
    });

    it('should reject excessive amounts', () => {
      const mockUserData = { coins: 1000, bank: 5000 };
      const result = validateTransaction('user123', 'work', 999999999, mockUserData);
      
      expect(result.valid).to.be.false;
    });
  });

  describe('detectSuspiciousActivity', () => {
    it('should detect activity', () => {
      const mockClient = {
        user: { id: 'test-bot-id' }
      };

      const result = detectSuspiciousActivity('test-user', mockClient);
      
      expect(result).to.be.an('object');
      expect(result).to.have.property('suspicious');
      expect(result).to.have.property('reasons');
    });
  });

  describe('getUserSecurityInfo', () => {
    it('should return security info object', () => {
      const info = getUserSecurityInfo('test-user');
      
      expect(info).to.be.an('object');
      expect(info).to.have.property('userId');
      expect(info).to.have.property('riskLevel');
      expect(info).to.have.property('activities');
    });
  });

  describe('getSecurityStats', () => {
    it('should return security statistics', () => {
      const stats = getSecurityStats();
      
      expect(stats).to.be.an('object');
      expect(stats).to.have.property('totalUsers');
      expect(stats).to.have.property('suspiciousUsers');
      expect(stats).to.have.property('blockedTransactions');
    });
  });
});
