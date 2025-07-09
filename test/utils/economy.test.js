import { expect } from 'chai';
import { 
  processAllBankInterest,
  checkAchievements,
  calculateDailyStreak,
  calculateStreakBonus,
  ACHIEVEMENTS 
} from '../../utils/economy.js';

describe('Economy', () => {
  describe('ACHIEVEMENTS', () => {
    it('should have valid achievement definitions', () => {
      expect(ACHIEVEMENTS).to.be.an('object');
      
      Object.values(ACHIEVEMENTS).forEach(achievement => {
        expect(achievement).to.have.property('id');
        expect(achievement).to.have.property('name');
        expect(achievement).to.have.property('description');
        expect(achievement).to.have.property('reward');
        expect(achievement.reward).to.be.a('number').greaterThan(0);
      });
    });

    it('should have unique achievement IDs', () => {
      const ids = Object.values(ACHIEVEMENTS).map(a => a.id);
      const uniqueIds = [...new Set(ids)];
      
      expect(ids.length).to.equal(uniqueIds.length);
    });
  });

  describe('calculateDailyStreak', () => {
    it('should calculate streak for new user', () => {
      const userData = { lastDaily: 0 };
      const streak = calculateDailyStreak(userData);
      
      expect(streak).to.equal(1);
    });

    it('should continue streak for consecutive days', () => {
      const oneDayMs = 24 * 60 * 60 * 1000;
      const userData = { 
        lastDaily: Date.now() - (oneDayMs + 1000), // Just over 1 day ago
        dailyStreak: 5 
      };
      
      const streak = calculateDailyStreak(userData);
      
      expect(streak).to.equal(6);
    });

    it('should reset streak for missed days', () => {
      const oneDayMs = 24 * 60 * 60 * 1000;
      const userData = { 
        lastDaily: Date.now() - (oneDayMs * 3), // 3 days ago
        dailyStreak: 10 
      };
      
      const streak = calculateDailyStreak(userData);
      
      expect(streak).to.equal(1);
    });

    it('should maintain streak for same day', () => {
      const userData = { 
        lastDaily: Date.now() - 1000, // 1 second ago
        dailyStreak: 7 
      };
      
      const streak = calculateDailyStreak(userData);
      
      expect(streak).to.equal(7);
    });
  });

  describe('calculateStreakBonus', () => {
    it('should return 0 for streak of 1', () => {
      const bonus = calculateStreakBonus(1, 1000);
      
      expect(bonus).to.equal(0);
    });

    it('should return 10% bonus for streak 2-7', () => {
      const baseAmount = 1000;
      const bonus = calculateStreakBonus(5, baseAmount);
      
      expect(bonus).to.equal(100); // 10% of 1000
    });

    it('should return 20% bonus for streak 8-30', () => {
      const baseAmount = 1000;
      const bonus = calculateStreakBonus(15, baseAmount);
      
      expect(bonus).to.equal(200); // 20% of 1000
    });

    it('should return 30% bonus for streak 30+', () => {
      const baseAmount = 1000;
      const bonus = calculateStreakBonus(50, baseAmount);
      
      expect(bonus).to.equal(300); // 30% of 1000
    });
  });
});
