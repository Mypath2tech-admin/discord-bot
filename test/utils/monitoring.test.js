import { expect } from 'chai';
import { 
  getSystemMetrics,
  recordCommandExecution,
  getCommandMetrics,
  recordDatabaseQuery
} from '../../utils/monitoring.js';

describe('Monitoring', () => {
  describe('getSystemMetrics', () => {
    it('should return system metrics object', () => {
      const metrics = getSystemMetrics();
      
      expect(metrics).to.be.an('object');
      expect(metrics).to.have.property('memory');
      expect(metrics).to.have.property('uptime');
      expect(metrics).to.have.property('cpu');
      
      expect(metrics.memory).to.have.property('used');
      expect(metrics.memory).to.have.property('total');
      expect(metrics.memory).to.have.property('percentage');
      
      expect(metrics.uptime).to.be.a('number');
    });

    it('should have valid memory percentages', () => {
      const metrics = getSystemMetrics();
      
      expect(metrics.memory.percentage).to.be.a('number');
      expect(metrics.memory.percentage).to.be.within(0, 100);
    });
  });

  describe('recordCommandExecution', () => {
    it('should track command execution without errors', () => {
      expect(() => {
        recordCommandExecution('test-command', 150, true);
      }).to.not.throw();
    });

    it('should track failed commands', () => {
      expect(() => {
        recordCommandExecution('test-command', 150, false);
      }).to.not.throw();
    });

    it('should handle edge cases', () => {
      expect(() => {
        recordCommandExecution('', 0, true);
        recordCommandExecution('test', -1, false);
      }).to.not.throw();
    });
  });

  describe('getCommandMetrics', () => {
    it('should return metrics object', () => {
      // Track some commands first
      recordCommandExecution('daily', 100, true);
      recordCommandExecution('work', 200, true);
      recordCommandExecution('balance', 50, false);

      const metrics = getCommandMetrics();
      
      expect(metrics).to.be.an('object');
      expect(metrics).to.have.property('totalCommands');
      expect(metrics).to.have.property('successfulCommands');
      expect(metrics).to.have.property('failedCommands');
      expect(metrics).to.have.property('averageExecutionTime');
    });

    it('should calculate success rate correctly', () => {
      const metrics = getCommandMetrics();
      
      if (metrics.totalCommands > 0) {
        const calculatedSuccessRate = 
          (metrics.successfulCommands / metrics.totalCommands) * 100;
        
        expect(metrics.successRate).to.be.approximately(calculatedSuccessRate, 0.01);
      }
    });
  });

  describe('recordDatabaseQuery', () => {
    it('should record database query times', () => {
      expect(() => {
        recordDatabaseQuery(50);
        recordDatabaseQuery(100);
        recordDatabaseQuery(25);
      }).to.not.throw();
    });

    it('should handle zero and negative times', () => {
      expect(() => {
        recordDatabaseQuery(0);
        recordDatabaseQuery(-1);
      }).to.not.throw();
    });
  });
});
