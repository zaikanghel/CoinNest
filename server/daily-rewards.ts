import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { isAuthenticated, isAdmin } from "./auth";

export function setupDailyRewardsRoutes(app: Express) {
  // Get all daily rewards (public)
  app.get("/api/daily-rewards", async (req: Request, res: Response) => {
    try {
      const rewards = await storage.getDailyRewards();
      res.json(rewards);
    } catch (error) {
      console.error("Error getting daily rewards:", error);
      res.status(500).json({ message: "Failed to get daily rewards" });
    }
  });

  // Get user's daily reward status (authenticated)
  app.get("/api/user/daily-reward", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userReward = await storage.getUserDailyReward(req.user.id);
      
      if (!userReward) {
        return res.json({
          canClaim: true,
          nextDay: 1,
          completedDays: 0,
          hasCompletedWeek: false,
          lastClaimed: null,
          timeToNextClaim: 0
        });
      }

      // Calculate time until next claim is available
      const lastClaimed = new Date(userReward.lastClaimedAt);
      const now = new Date();
      const timeDiff = now.getTime() - lastClaimed.getTime();
      const hoursSinceLastClaim = timeDiff / (1000 * 60 * 60);
      
      // Get cooldown setting (in seconds)
      const cooldownSetting = await storage.getSetting("daily_reward_cooldown");
      const cooldownInSeconds = cooldownSetting ? parseInt(cooldownSetting, 10) : 86400; // Default to 24 hours
      const cooldownInHours = cooldownInSeconds / 3600;
      
      // Can claim if it's been more than the cooldown period
      const canClaim = hoursSinceLastClaim >= cooldownInHours;
      
      // Calculate time remaining in seconds
      let timeToNextClaim = 0;
      if (!canClaim) {
        timeToNextClaim = cooldownInSeconds - (timeDiff / 1000);
      }

      res.json({
        canClaim,
        nextDay: userReward.day === 7 ? 1 : userReward.day + 1,
        completedDays: userReward.completedDays,
        hasCompletedWeek: userReward.hasCompletedWeek,
        lastClaimed: userReward.lastClaimedAt,
        timeToNextClaim: Math.max(0, Math.floor(timeToNextClaim))
      });
    } catch (error) {
      console.error("Error getting user daily reward status:", error);
      res.status(500).json({ message: "Failed to get daily reward status" });
    }
  });

  // Claim daily reward (authenticated)
  app.post("/api/user/daily-reward/claim", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const result = await storage.claimDailyReward(req.user.id);
      
      res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      console.error("Error claiming daily reward:", error);
      res.status(400).json({ 
        success: false,
        message: error.message || "Failed to claim daily reward" 
      });
    }
  });

  // Admin: Update a daily reward
  app.patch("/api/admin/daily-rewards/:day", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const day = parseInt(req.params.day, 10);
      
      if (isNaN(day) || day < 1 || day > 7) {
        return res.status(400).json({ message: "Invalid day" });
      }
      
      const { reward, description } = req.body;
      
      if (typeof reward !== 'number' || reward < 1) {
        return res.status(400).json({ message: "Reward must be a positive number" });
      }
      
      if (typeof description !== 'string' || description.trim() === '') {
        return res.status(400).json({ message: "Description is required" });
      }

      const updatedReward = await storage.createOrUpdateDailyReward({
        day,
        reward,
        description: description.trim()
      });

      res.json(updatedReward);
    } catch (error) {
      console.error("Error updating daily reward:", error);
      res.status(500).json({ message: "Failed to update daily reward" });
    }
  });
}