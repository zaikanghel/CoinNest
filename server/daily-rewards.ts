import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { isAuthenticated, isAdmin } from "./auth";

export function setupDailyRewardsRoutes(app: Express) {
  // Get all daily rewards
  app.get("/api/daily-rewards", async (req: Request, res: Response) => {
    try {
      const rewards = await storage.getDailyRewards();
      res.json(rewards);
    } catch (error: any) {
      console.error("Error fetching daily rewards:", error);
      res.status(500).json({ message: error.message || "Failed to fetch daily rewards" });
    }
  });

  // Get user's daily reward status
  app.get("/api/user/daily-reward", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      
      // Get the user's daily reward record
      const userReward = await storage.getUserDailyReward(userId);
      
      // Get next day to claim (1-7)
      const nextDay = userReward ? ((userReward.day % 7) + 1) : 1;
      
      // Calculate if user can claim a reward today
      let canClaim = true;
      let timeToNextClaim = 0;
      
      if (userReward && userReward.lastClaimedAt) {
        const lastClaimedAt = new Date(userReward.lastClaimedAt);
        const now = new Date();
        
        // Get cooldown period from settings (default 24 hours)
        const cooldownStr = await storage.getSetting("daily_reward_cooldown");
        const cooldown = parseInt(cooldownStr || "86400"); // seconds
        
        // Check if cooldown period has passed
        const timeSinceLastClaim = Math.floor((now.getTime() - lastClaimedAt.getTime()) / 1000);
        canClaim = timeSinceLastClaim > cooldown;
        
        if (!canClaim) {
          timeToNextClaim = cooldown - timeSinceLastClaim;
          if (timeToNextClaim < 0) timeToNextClaim = 0;
        }
      }
      
      res.json({
        nextDay,
        completedDays: userReward ? userReward.completedDays : 0,
        hasCompletedWeek: userReward ? userReward.hasCompletedWeek : false,
        lastClaimed: userReward ? userReward.lastClaimedAt : null,
        canClaim,
        timeToNextClaim
      });
    } catch (error: any) {
      console.error("Error fetching user daily reward status:", error);
      res.status(500).json({ message: error.message || "Failed to fetch daily reward status" });
    }
  });

  // Claim daily reward
  app.post("/api/user/daily-reward/claim", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      
      // Check if user is eligible to claim
      const userRewardStatus = await getUserRewardStatus(userId);
      
      if (!userRewardStatus.canClaim) {
        return res.status(400).json({ 
          message: `You've already claimed your daily reward. Try again in ${formatTime(userRewardStatus.timeToNextClaim)}.` 
        });
      }
      
      // Process the claim
      const result = await storage.claimDailyReward(userId);
      
      res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      console.error("Error claiming daily reward:", error);
      res.status(500).json({ message: error.message || "Failed to claim daily reward" });
    }
  });

  // Admin: Update a daily reward
  app.patch("/api/admin/daily-rewards/:day", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const day = parseInt(req.params.day);
      
      if (isNaN(day) || day < 1 || day > 7) {
        return res.status(400).json({ message: "Invalid day. Must be between 1 and 7." });
      }
      
      const { reward, description } = req.body;
      
      if (typeof reward !== 'number' || reward < 1) {
        return res.status(400).json({ message: "Invalid reward amount. Must be a positive number." });
      }
      
      if (!description || typeof description !== 'string') {
        return res.status(400).json({ message: "Description is required." });
      }
      
      // Update the daily reward
      const updatedReward = await storage.createOrUpdateDailyReward({
        day,
        reward,
        description
      });
      
      res.json(updatedReward);
    } catch (error: any) {
      console.error("Error updating daily reward:", error);
      res.status(500).json({ message: error.message || "Failed to update daily reward" });
    }
  });
}

// Helper function to get user's reward status
async function getUserRewardStatus(userId: number) {
  // Get the user's daily reward record
  const userReward = await storage.getUserDailyReward(userId);
  
  // Get next day to claim (1-7)
  const nextDay = userReward ? ((userReward.day % 7) + 1) : 1;
  
  // Calculate if user can claim a reward today
  let canClaim = true;
  let timeToNextClaim = 0;
  
  if (userReward && userReward.lastClaimedAt) {
    const lastClaimedAt = new Date(userReward.lastClaimedAt);
    const now = new Date();
    
    // Get cooldown period from settings (default 24 hours)
    const cooldownStr = await storage.getSetting("daily_reward_cooldown");
    const cooldown = parseInt(cooldownStr || "86400"); // seconds
    
    // Check if cooldown period has passed
    const timeSinceLastClaim = Math.floor((now.getTime() - lastClaimedAt.getTime()) / 1000);
    canClaim = timeSinceLastClaim > cooldown;
    
    if (!canClaim) {
      timeToNextClaim = cooldown - timeSinceLastClaim;
      if (timeToNextClaim < 0) timeToNextClaim = 0;
    }
  }
  
  return {
    nextDay,
    completedDays: userReward ? userReward.completedDays : 0,
    hasCompletedWeek: userReward ? userReward.hasCompletedWeek : false,
    lastClaimed: userReward ? userReward.lastClaimedAt : null,
    canClaim,
    timeToNextClaim
  };
}

// Helper to format time for user-friendly display
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}