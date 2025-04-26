import { Express } from "express";
import { storage } from "./storage";

export function setupGameRoutes(app: Express) {
  // Get list of available games
  app.get("/api/games", async (req, res) => {
    // Get game reward settings from the database
    const memoryRewardStr = await storage.getSetting("game_memory_reward");
    const clickerRewardStr = await storage.getSetting("game_clicker_reward");
    const maxEarningsStr = await storage.getSetting("game_max_earnings");
    
    // Default values if settings aren't configured
    const memoryReward = parseInt(memoryRewardStr || "10");
    const clickerReward = parseInt(clickerRewardStr || "5");
    const maxEarnings = parseInt(maxEarningsStr || "200");
    
    // Calculate max hourly earnings for memory game (based on admin settings)
    // Assume average of 3 matches per minute
    const memoryHourlyEarning = 3 * 60 * (memoryReward / 10);
    
    // Calculate max hourly earnings for clicker game (based on admin settings)
    // Assume average of 10 clicks per minute
    const clickerHourlyEarning = 10 * 60 * (clickerReward / 5);
    
    // These would typically be stored in the database,
    // but for MVP we'll use dynamic values based on admin settings
    const games = [
      {
        id: "memory-match",
        name: "Memory Match",
        description: "Test your memory by matching pairs of cards",
        difficulty: "Medium",
        category: "Puzzle",
        maxEarning: Math.min(Math.round(memoryHourlyEarning), maxEarnings), // coins per hour, capped by max earnings
        baseReward: memoryReward,
        isNew: true,
        isPopular: false,
        imageUrl: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300&q=80"
      },
      {
        id: "clicker-quest",
        name: "Clicker Quest",
        description: "Click to earn coins and upgrade your abilities",
        difficulty: "Easy",
        category: "Idle",
        maxEarning: Math.min(Math.round(clickerHourlyEarning), maxEarnings), // coins per hour, capped by max earnings
        baseReward: clickerReward,
        isNew: false,
        isPopular: true,
        imageUrl: "https://images.unsplash.com/photo-1601987177651-8edfe995b286?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300&q=80"
      }
    ];
    
    res.json(games);
  });
  
  // Submit game score and earn rewards
  app.post("/api/games/:gameId/score", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const { gameId } = req.params;
    const { score, timeSpent } = req.body;
    
    if (
      score === undefined || 
      typeof score !== "number" || 
      timeSpent === undefined || 
      typeof timeSpent !== "number"
    ) {
      return res.status(400).json({ message: "Invalid score or timeSpent" });
    }
    
    const user = req.user;
    
    // Calculate coins earned based on game, score and time spent using admin-configurable settings
    let coinsEarned = 0;
    
    // Get reward settings from the database
    const memoryRewardStr = await storage.getSetting("game_memory_reward");
    const clickerRewardStr = await storage.getSetting("game_clicker_reward");
    
    // Default values if settings aren't configured
    const memoryReward = parseInt(memoryRewardStr || "10");
    const clickerReward = parseInt(clickerRewardStr || "5");
    
    if (gameId === "memory-match") {
      // For memory match, earn coins based on score and time
      // Higher score in less time = more coins
      const baseReward = Math.floor(score * (memoryReward / 10));
      const timeMultiplier = Math.max(0.5, 1 - (timeSpent / 180)); // Lower time = higher multiplier
      coinsEarned = Math.round(baseReward * timeMultiplier);
    } else if (gameId === "clicker-quest") {
      // For clicker, earn coins proportional to score using the admin setting
      coinsEarned = Math.floor(score * (clickerReward / 5));
    } else {
      return res.status(404).json({ message: "Game not found" });
    }
    
    // Get max earnings cap from settings
    const maxEarningsStr = await storage.getSetting("game_max_earnings");
    const maxEarnings = parseInt(maxEarningsStr || "200");
    
    // Impose reasonable limits based on admin settings
    coinsEarned = Math.min(coinsEarned, maxEarnings);
    
    // Save the game score
    const gameScore = await storage.saveGameScore({
      userId: user.id,
      gameId,
      score,
      coinsEarned
    });
    
    // Update user balance and stats
    const updatedUser = await storage.updateUser(user.id, {
      balance: user.balance + coinsEarned,
      totalEarned: user.totalEarned + coinsEarned,
      gamesEarned: user.gamesEarned + coinsEarned,
      lastActive: new Date()
    });
    
    // Record activity
    await storage.createActivity({
      userId: user.id,
      type: "game",
      amount: coinsEarned,
      description: `Earned from playing ${gameId}`
    });
    
    // If there's a referrer, add bonus to them
    if (user.referredBy) {
      const referrer = await storage.getUser(user.referredBy);
      if (referrer) {
        // Get referral percent from settings
        const referralPercentStr = await storage.getSetting("referral_percent");
        const referralPercent = parseInt(referralPercentStr || "5");
        
        // Calculate referral bonus
        const referralBonus = Math.floor((coinsEarned * referralPercent) / 100);
        
        if (referralBonus > 0) {
          // Update referrer
          await storage.updateUser(referrer.id, {
            balance: referrer.balance + referralBonus,
            totalEarned: referrer.totalEarned + referralBonus,
            referralEarned: referrer.referralEarned + referralBonus
          });
          
          // Record referral activity
          await storage.createActivity({
            userId: referrer.id,
            type: "referral",
            amount: referralBonus,
            description: `Referral commission from ${user.username}'s game earnings`
          });
        }
      }
    }
    
    res.json({
      gameScore,
      coinsEarned,
      newBalance: updatedUser?.balance || 0
    });
  });
  
  // Get leaderboard for a game
  app.get("/api/games/:gameId/leaderboard", async (req, res) => {
    const { gameId } = req.params;
    
    // Get top scores
    const topScores = await storage.getTopScoresByGame(gameId, 10);
    
    // Get user info for each score
    const leaderboard = await Promise.all(
      topScores.map(async (score) => {
        const user = await storage.getUser(score.userId);
        return {
          score: score.score,
          coinsEarned: score.coinsEarned,
          date: score.createdAt,
          user: user ? {
            id: user.id,
            username: user.username
          } : { id: 0, username: "Unknown" }
        };
      })
    );
    
    res.json(leaderboard);
  });
  
  // Get user's scores for a specific game
  app.get("/api/user/games/:gameId/scores", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const { gameId } = req.params;
    const scores = await storage.getUserGameScores(req.user.id, gameId);
    
    res.json(scores);
  });
}
