/**
 * Advanced Economy Features
 * Bank interest, investments, achievements, streaks
 */

import { logInfo, logWarn } from '../utils/logger.js';
import { getConfig } from '../utils/config.js';

/**
 * Calculates and applies bank interest
 */
export async function processAllBankInterest(users, client) {
  if (!getConfig('features.enableBankInterest')) return;
  
  const interestRate = getConfig('economy.bankInterestRate') || 0.05;
  const minAmount = 1000; // Minimum bank amount for interest
  const maxInterest = 500; // Maximum interest per day
  
  try {
    const usersWithBank = await users.find({ 
      bank: { $gte: minAmount },
      lastInterest: { $lt: Date.now() - 24 * 60 * 60 * 1000 } // 24 hours
    }).toArray();
    
    let totalInterestPaid = 0;
    let usersProcessed = 0;
    
    for (const user of usersWithBank) {
      const interest = Math.min(Math.floor(user.bank * interestRate), maxInterest);
      
      await users.updateOne(
        { userId: user.userId },
        {
          $inc: { bank: interest, lifetimeEarned: interest },
          $set: { lastInterest: Date.now() }
        }
      );
      
      totalInterestPaid += interest;
      usersProcessed++;
    }
    
    if (usersProcessed > 0) {
      logInfo(client, `Processed bank interest: ${totalInterestPaid} coins paid to ${usersProcessed} users`, {
        totalInterestPaid,
        usersProcessed,
        interestRate,
        action: 'bank_interest_processed'
      });
    }
    
    return { totalInterestPaid, usersProcessed };
  } catch (error) {
    logWarn(client, `Failed to process bank interest: ${error.message}`);
    return { totalInterestPaid: 0, usersProcessed: 0 };
  }
}

/**
 * Achievement system
 */
export const ACHIEVEMENTS = {
  FIRST_COINS: { id: 'first_coins', name: 'First Coins', description: 'Earned your first coins', reward: 50 },
  RICH: { id: 'rich', name: 'Getting Rich', description: 'Have 10,000 coins total', reward: 500 },
  MILLIONAIRE: { id: 'millionaire', name: 'Millionaire', description: 'Have 1,000,000 coins total', reward: 10000 },
  HARD_WORKER: { id: 'hard_worker', name: 'Hard Worker', description: 'Work 100 times', reward: 1000 },
  DAILY_STREAK_7: { id: 'daily_streak_7', name: '7 Day Streak', description: 'Claim daily for 7 days in a row', reward: 700 },
  DAILY_STREAK_30: { id: 'daily_streak_30', name: '30 Day Streak', description: 'Claim daily for 30 days in a row', reward: 3000 },
  ROBBER: { id: 'robber', name: 'Robber', description: 'Successfully rob 10 users', reward: 500 },
  BANKER: { id: 'banker', name: 'Banker', description: 'Have 100,000 coins in bank', reward: 2000 }
};

/**
 * Checks and awards achievements
 */
export async function checkAchievements(users, userId, userData, client) {
  try {
    const achievements = userData.achievements || [];
    const newAchievements = [];
    
    // Check each achievement
    for (const achievement of Object.values(ACHIEVEMENTS)) {
      if (achievements.includes(achievement.id)) continue;
      
      let earned = false;
      
      switch (achievement.id) {
        case 'first_coins':
          earned = (userData.coins + userData.bank) > 0;
          break;
        case 'rich':
          earned = (userData.coins + userData.bank) >= 10000;
          break;
        case 'millionaire':
          earned = (userData.coins + userData.bank) >= 1000000;
          break;
        case 'hard_worker':
          earned = (userData.workCount || 0) >= 100;
          break;
        case 'daily_streak_7':
          earned = (userData.dailyStreak || 0) >= 7;
          break;
        case 'daily_streak_30':
          earned = (userData.dailyStreak || 0) >= 30;
          break;
        case 'robber':
          earned = (userData.successfulRobs || 0) >= 10;
          break;
        case 'banker':
          earned = userData.bank >= 100000;
          break;
      }
      
      if (earned) {
        newAchievements.push(achievement);
        achievements.push(achievement.id);
        
        // Award achievement reward
        await users.updateOne(
          { userId },
          {
            $inc: { coins: achievement.reward },
            $set: { achievements }
          }
        );
        
        logInfo(client, `Achievement earned: ${userData.userId} earned "${achievement.name}"`, {
          userId,
          achievementId: achievement.id,
          achievementName: achievement.name,
          reward: achievement.reward,
          action: 'achievement_earned'
        });
      }
    }
    
    return newAchievements;
  } catch (error) {
    logWarn(client, `Failed to check achievements: ${error.message}`);
    return [];
  }
}

/**
 * Calculates daily streak
 */
export function calculateDailyStreak(userData) {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const lastDaily = userData.lastDaily || 0;
  const timeSinceLastDaily = now - lastDaily;
  
  // If last daily was yesterday, continue streak
  if (timeSinceLastDaily >= oneDayMs && timeSinceLastDaily <= oneDayMs * 2) {
    return (userData.dailyStreak || 0) + 1;
  }
  
  // If last daily was today, maintain streak
  if (timeSinceLastDaily < oneDayMs) {
    return userData.dailyStreak || 0;
  }
  
  // Otherwise, reset streak
  return 1;
}

/**
 * Calculates streak bonus
 */
export function calculateStreakBonus(streak, baseAmount) {
  if (streak <= 1) return 0;
  if (streak <= 7) return Math.floor(baseAmount * 0.1); // 10% bonus
  if (streak <= 30) return Math.floor(baseAmount * 0.2); // 20% bonus
  return Math.floor(baseAmount * 0.3); // 30% bonus for 30+ days
}
