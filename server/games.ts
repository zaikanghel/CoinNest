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
      // For memory match, the score represents matched pairs
      // Calculate based on number of matches (score is actually much higher)
      // For memory match, score is calculated as: base 1000 points - (10 * moves) - (5 * time)
      // We need to normalize this to get a reasonable coin reward
      // Let's estimate that an average score of 500 represents about 8 matches successfully completed
      const estimatedMatches = Math.max(1, Math.round(score / 100)); // Roughly estimate matches from score
      const baseReward = estimatedMatches * memoryReward; // Each match gives memoryReward coins
      
      // Apply time multiplier - faster completion gives better rewards
      // Cap this to avoid extreme rewards for very fast times
      const timeMultiplier = Math.min(1.5, Math.max(0.5, 1 - (timeSpent / 180))); 
      
      coinsEarned = Math.round(baseReward * timeMultiplier);
      console.log(`Memory match: score=${score}, estimatedMatches=${estimatedMatches}, baseReward=${baseReward}, timeMultiplier=${timeMultiplier}, coinsEarned=${coinsEarned}`);
    } else if (gameId === "clicker-quest") {
      // For clicker, we need to normalize the score to clicks
      // The score increases based on upgrades and time played, not just raw clicks
      // Let's estimate that an average score of 100 represents about 20 effective clicks
      const estimatedClicks = Math.max(1, Math.round(score / 5)); // Estimate clicks from score
      coinsEarned = Math.round(estimatedClicks * (clickerReward / 5));
      console.log(`Clicker quest: score=${score}, estimatedClicks=${estimatedClicks}, coinsEarned=${coinsEarned}`);
    } else {
      return res.status(404).json({ message: "Game not found" });
    }
    
    // Get max earnings cap from settings
    const maxEarningsStr = await storage.getSetting("game_max_earnings");
    const maxEarnings = parseInt(maxEarningsStr || "200");
    
    // Impose reasonable limits based on admin settings
    coinsEarned = Math.min(coinsEarned, maxEarnings);
    
    // Check for daily game earnings limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's game earnings
    const todaysGameScores = await storage.getUserGameScores(user.id);
    const todaysEarnings = todaysGameScores
      .filter(score => new Date(score.createdAt) >= today)
      .reduce((sum, score) => sum + score.coinsEarned, 0);
      
    // Get daily game limit from settings
    const dailyGameLimitStr = await storage.getSetting("game_daily_limit");
    const dailyGameLimit = parseInt(dailyGameLimitStr || "1000");
    
    // Check if adding these earnings would exceed the daily limit
    const remainingDaily = Math.max(0, dailyGameLimit - todaysEarnings);
    
    // If no more earnings allowed today
    if (remainingDaily <= 0) {
      return res.json({
        gameScore: null,
        coinsEarned: 0,
        newBalance: user.balance,
        message: "Daily game earnings limit reached"
      });
    }
    
    // Cap earnings to remaining daily limit
    coinsEarned = Math.min(coinsEarned, remainingDaily);
    
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
