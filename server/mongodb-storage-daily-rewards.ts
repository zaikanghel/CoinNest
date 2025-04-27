// Implementation of the daily rewards methods for the MongoDB storage class
import { MongoStorage } from "./mongodb-storage";
import { DailyReward, UserDailyReward, InsertDailyReward } from "@shared/schema";

// Add these methods to the MongoStorage class in mongodb-storage.ts
export async function implementDailyRewardMethods(mongoStorage: MongoStorage) {
  // Map to Daily Reward object
  (mongoStorage as any).mapToDailyReward = function(doc: any): DailyReward {
    return {
      id: doc.id,
      day: doc.day,
      reward: doc.reward,
      description: doc.description,
      updatedAt: doc.updatedAt
    };
  };

  // Map to User Daily Reward object
  (mongoStorage as any).mapToUserDailyReward = function(doc: any): UserDailyReward {
    return {
      id: doc.id,
      userId: doc.userId,
      day: doc.day,
      lastClaimedAt: doc.lastClaimedAt,
      streakStartedAt: doc.streakStartedAt,
      completedDays: doc.completedDays,
      hasCompletedWeek: doc.hasCompletedWeek
    };
  };

  // Initialize default daily rewards
  (mongoStorage as any).initDefaultDailyRewards = async function(): Promise<void> {
    if (!(this.dailyRewardsCollection)) throw new Error("Database not initialized");
    
    console.log("Initializing default daily rewards in MongoDB...");

    const defaultRewards = [
      {
        day: 1,
        reward: 50,
        description: "Welcome Bonus"
      },
      {
        day: 2,
        reward: 75,
        description: "Streak Day 2"
      },
      {
        day: 3,
        reward: 100,
        description: "Streak Day 3"
      },
      {
        day: 4,
        reward: 125,
        description: "Halfway Bonus"
      },
      {
        day: 5,
        reward: 150,
        description: "Streak Day 5"
      },
      {
        day: 6,
        reward: 175,
        description: "Almost There!"
      },
      {
        day: 7,
        reward: 250,
        description: "Weekly Completion Bonus"
      }
    ];

    for (const reward of defaultRewards) {
      const exists = await this.dailyRewardsCollection.findOne({ day: reward.day });
      if (!exists) {
        console.log(`Creating default daily reward for day ${reward.day}: ${reward.reward} coins`);
        await this.dailyRewardsCollection.insertOne({
          ...reward,
          id: reward.day, // Use day as ID for simplicity
          updatedAt: new Date()
        });
      } else {
        console.log(`Daily reward for day ${reward.day} already exists: ${exists.reward} coins`);
      }
    }
  };

  // Get all daily rewards
  (mongoStorage as any).getDailyRewards = async function(): Promise<DailyReward[]> {
    if (!this.dailyRewardsCollection) throw new Error("Database not initialized");
    
    const rewards = await this.dailyRewardsCollection
      .find({})
      .sort({ day: 1 })
      .toArray();
    
    return rewards.map((reward: any) => this.mapToDailyReward(reward));
  };

  // Get a specific daily reward by day
  (mongoStorage as any).getDailyReward = async function(day: number): Promise<DailyReward | undefined> {
    if (!this.dailyRewardsCollection) throw new Error("Database not initialized");
    
    const reward = await this.dailyRewardsCollection.findOne({ day });
    return reward ? this.mapToDailyReward(reward) : undefined;
  };

  // Create or update a daily reward
  (mongoStorage as any).createOrUpdateDailyReward = async function(data: InsertDailyReward): Promise<DailyReward> {
    if (!this.dailyRewardsCollection) throw new Error("Database not initialized");
    
    const result = await this.dailyRewardsCollection.findOneAndUpdate(
      { day: data.day },
      { 
        $set: {
          ...data,
          updatedAt: new Date()
        } 
      },
      { 
        upsert: true,
        returnDocument: 'after'
      }
    );
    
    if (!result) {
      // If for some reason, nothing was returned, fetch the reward manually
      const reward = await this.dailyRewardsCollection.findOne({ day: data.day });
      if (!reward) throw new Error(`Failed to create/update daily reward for day ${data.day}`);
      return this.mapToDailyReward(reward);
    }
    
    return this.mapToDailyReward(result);
  };

  // Get a user's daily reward status
  (mongoStorage as any).getUserDailyReward = async function(userId: number): Promise<UserDailyReward | undefined> {
    if (!this.userDailyRewardsCollection) throw new Error("Database not initialized");
    
    const userReward = await this.userDailyRewardsCollection.findOne({ userId });
    return userReward ? this.mapToUserDailyReward(userReward) : undefined;
  };

  // Create a user daily reward record
  (mongoStorage as any).createUserDailyReward = async function(data: {
    userId: number;
    day: number;
  }): Promise<UserDailyReward> {
    if (!this.userDailyRewardsCollection) throw new Error("Database not initialized");
    
    // Get the current max id
    const maxIdUserReward = await this.userDailyRewardsCollection.find().sort({ id: -1 }).limit(1).toArray();
    const nextId = maxIdUserReward.length > 0 ? maxIdUserReward[0].id + 1 : 1;
    
    const now = new Date();
    
    const userDailyReward: UserDailyReward = {
      id: nextId,
      userId: data.userId,
      day: data.day,
      lastClaimedAt: now,
      streakStartedAt: now,
      completedDays: 0,
      hasCompletedWeek: false
    };
    
    await this.userDailyRewardsCollection.insertOne(userDailyReward);
    return userDailyReward;
  };

  // Update a user's daily reward status
  (mongoStorage as any).updateUserDailyReward = async function(
    userId: number,
    updates: Partial<UserDailyReward>
  ): Promise<UserDailyReward | undefined> {
    if (!this.userDailyRewardsCollection) throw new Error("Database not initialized");
    
    const result = await this.userDailyRewardsCollection.findOneAndUpdate(
      { userId },
      { $set: updates },
      { returnDocument: 'after' }
    );
    
    return result ? this.mapToUserDailyReward(result) : undefined;
  };

  // Claim a daily reward
  (mongoStorage as any).claimDailyReward = async function(userId: number): Promise<{
    reward: number;
    day: number;
    hasCompletedWeek: boolean;
    message: string;
  }> {
    if (!this.userDailyRewardsCollection || !this.dailyRewardsCollection || !this.usersCollection) {
      throw new Error("Database not initialized");
    }
    
    // Get user record
    const user = await this.usersCollection.findOne({ id: userId });
    if (!user) throw new Error("User not found");
    
    // Get user daily reward record
    let userReward = await this.userDailyRewardsCollection.findOne({ userId });
    
    const now = new Date();
    let day = 1; // Default to day 1
    let isNewStreak = false;
    let streakBroken = false;
    let completedWeek = false;
    
    if (userReward) {
      // Check if this is a new claim for the day
      const lastClaimDate = new Date(userReward.lastClaimedAt);
      const timeDifference = now.getTime() - lastClaimDate.getTime();
      const hoursSinceLastClaim = timeDifference / (1000 * 60 * 60);
      
      // If last claim was less than 24 hours ago, return error
      if (hoursSinceLastClaim < 20) { // Give a 4-hour buffer
        throw new Error("You've already claimed your daily reward today");
      }
      
      // If last claim was more than 48 hours ago, reset streak
      if (hoursSinceLastClaim > 48) {
        day = 1;
        isNewStreak = true;
        streakBroken = true;
      } else {
        // Continue streak
        day = (userReward.day % 7) + 1; // Cycle from 1-7
        
        // If we're back to day 1, user has completed a week
        if (day === 1) {
          completedWeek = true;
        }
      }
    } else {
      // First time claiming, create a new record
      isNewStreak = true;
    }
    
    // Get the reward amount for this day
    const dailyReward = await this.dailyRewardsCollection.findOne({ day });
    if (!dailyReward) throw new Error(`No reward configured for day ${day}`);
    
    // Update or create the user's daily reward record
    if (userReward) {
      await this.userDailyRewardsCollection.updateOne(
        { userId },
        { 
          $set: {
            day,
            lastClaimedAt: now,
            ...(isNewStreak ? { streakStartedAt: now } : {}),
            completedDays: (userReward.completedDays || 0) + 1,
            hasCompletedWeek: completedWeek || userReward.hasCompletedWeek
          }
        }
      );
    } else {
      await this.userDailyRewardsCollection.insertOne({
        id: await this.userDailyRewardsCollection.countDocuments() + 1,
        userId,
        day,
        lastClaimedAt: now,
        streakStartedAt: now,
        completedDays: 1,
        hasCompletedWeek: false
      });
    }
    
    // Update user balance
    await this.usersCollection.updateOne(
      { id: userId },
      { 
        $inc: { 
          balance: dailyReward.reward,
          totalEarned: dailyReward.reward
        } 
      }
    );
    
    // Create activity record
    await this.createActivity({
      userId,
      type: 'daily_reward',
      amount: dailyReward.reward,
      description: `Day ${day} reward: ${dailyReward.description}`
    });
    
    // Check if user has completed a week and if they were referred
    let message = `You've earned ${dailyReward.reward} coins for your Day ${day} reward!`;
    if (completedWeek) {
      message += " Congratulations on completing a full week!";
      
      // If this user was referred by someone, award the referrer their bonus
      if (user.referredBy) {
        await this.giveReferralBonus(user.referredBy, userId);
      }
    }
    if (streakBroken) {
      message += " Your streak was reset because you missed a day.";
    }
    
    // Get updated user reward to return correct completion status
    const updatedUserReward = await this.userDailyRewardsCollection.findOne({ userId });
    
    return {
      reward: dailyReward.reward,
      day,
      hasCompletedWeek: updatedUserReward ? updatedUserReward.hasCompletedWeek : false,
      message
    };
  };
  
  // Helper method to award referral bonus when a referred user completes 7 days
  (mongoStorage as any).giveReferralBonus = async function(referrerId: number, referredUserId: number): Promise<void> {
    if (!this.usersCollection || !this.settingsCollection) throw new Error("Database not initialized");
    
    // Get the referral bonus amount from settings
    const referralBonusSetting = await this.settingsCollection.findOne({ key: 'referral_bonus' });
    if (!referralBonusSetting) throw new Error("Referral bonus setting not found");
    
    const referralBonus = parseInt(referralBonusSetting.value, 10);
    
    // Check if this referral has already been awarded (avoid duplicate bonuses)
    const existingActivity = await this.activitiesCollection?.findOne({
      userId: referrerId,
      type: 'referral_bonus',
      description: { $regex: new RegExp(`completed 7 days.+${referredUserId}`) }
    });
    
    if (existingActivity) {
      console.log(`Referral bonus for user ${referredUserId} already awarded to ${referrerId}`);
      return;
    }
    
    // Update referrer's balance and stats
    await this.usersCollection.updateOne(
      { id: referrerId },
      { 
        $inc: { 
          balance: referralBonus,
          totalEarned: referralBonus,
          referralEarned: referralBonus
        } 
      }
    );
    
    // Get referred user info for the activity description
    const referredUser = await this.usersCollection.findOne({ id: referredUserId });
    const username = referredUser ? referredUser.username : `User #${referredUserId}`;
    
    // Create activity record for the referrer
    await this.createActivity({
      userId: referrerId,
      type: 'referral_bonus',
      amount: referralBonus,
      description: `Bonus for referral: ${username} completed 7 days of daily rewards`
    });
    
    console.log(`Awarded referral bonus of ${referralBonus} coins to user ${referrerId} for referred user ${referredUserId}`);
  };
  
  return mongoStorage;
}