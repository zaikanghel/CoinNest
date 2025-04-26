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
    
    // Get max earnings cap settings
    const maxEarningsStr = await storage.getSetting("game_max_earnings");
    const dailyGameLimitStr = await storage.getSetting("game_daily_limit");
    
    console.log(`Game Settings - Memory: ${memoryRewardStr}, Clicker: ${clickerRewardStr}, 
                  MaxPerGame: ${maxEarningsStr}, DailyLimit: ${dailyGameLimitStr}`);
    
    // Default values if settings aren't configured
    const memoryReward = parseInt(memoryRewardStr || "10");
    const clickerReward = parseInt(clickerRewardStr || "5");
    const maxEarnings = parseInt(maxEarningsStr || "200");
    const dailyGameLimit = parseInt(dailyGameLimitStr || "1000");
    
    // For memory game, we need to be more accurate with the match count
    // In memory-game.tsx, we have 8 pairs total, and score is calculated as:
    // base 1000 points - 10 points per move - 5 points per second
    if (gameId === "memory-match") {
      // Best possible score would be around 900 (perfect play with minimal time)
      // Worst passable score would be around 200 (many moves, slow time)
      
      // More accurate calculation using score and time:
      // 8 matches maximum possible
      // Score of 700+ is excellent: estimate 7-8 matches
      // Score of 500-700 is good: estimate 5-6 matches
      // Score of 300-500 is average: estimate 3-4 matches
      // Below 300 is poor: estimate 1-2 matches
      
      let estimatedMatches = 0;
      if (score >= 700) {
        estimatedMatches = Math.min(8, Math.floor(score / 100));
      } else if (score >= 500) {
        estimatedMatches = 5 + Math.floor((score - 500) / 100);
      } else if (score >= 300) {
        estimatedMatches = 3 + Math.floor((score - 300) / 100);
      } else {
        estimatedMatches = Math.max(1, Math.floor(score / 150));
      }
      
      // Apply base reward per match
      const baseReward = estimatedMatches * memoryReward;
      
      // Apply time multiplier (capped between 0.5 and 1.5)
      // Better time = better multiplier
      const timeMultiplier = Math.min(1.5, Math.max(0.5, 1 - (timeSpent / 180))); 
      
      // Calculate final reward
      const calculatedReward = Math.round(baseReward * timeMultiplier);
      
      // Apply maximum per game limit
      coinsEarned = Math.min(calculatedReward, maxEarnings);
      
      console.log(`Memory match calculation:
        score=${score}
        estimatedMatches=${estimatedMatches}
        baseReward=${baseReward}
        timeMultiplier=${timeMultiplier}
        calculatedReward=${calculatedReward}
        maxPerGame=${maxEarnings}
        final coinsEarned=${coinsEarned}`);
        
    } else if (gameId === "clicker-quest") {
      // For clicker game, score is raw points accumulated through clicks
      // In clicker-game.tsx, each click gives clickPower points (starts at 1, increases with upgrades)
      // We need to normalize based on average clickPower
      
      // Estimate clicks more precisely based on total score
      // Average clickPower might be around 2-3 after a few upgrades
      const averageClickPower = Math.max(1, Math.min(3, Math.sqrt(score / 50)));
      const estimatedClicks = Math.max(1, Math.round(score / averageClickPower));
      
      // Apply base reward per estimated click (reward is per click)
      const baseReward = estimatedClicks * clickerReward;
      
      // Apply maximum per game limit
      coinsEarned = Math.min(Math.round(baseReward), maxEarnings);
      
      console.log(`Clicker quest calculation:
        score=${score}
        averageClickPower=${averageClickPower}
        estimatedClicks=${estimatedClicks}
        baseReward=${baseReward}
        maxPerGame=${maxEarnings}
        final coinsEarned=${coinsEarned}`);
        
    } else {
      return res.status(404).json({ message: "Game not found" });
    }
    
    // Enforce daily game earnings limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get all of today's game scores for this user
    const todaysGameScores = await storage.getUserGameScores(user.id);
    
    // Filter to just today's scores and sum up the coins earned
    const todaysEarnings = todaysGameScores
      .filter(gameScore => {
        const scoreDate = new Date(gameScore.createdAt);
        return scoreDate >= today;
      })
      .reduce((sum, gameScore) => sum + gameScore.coinsEarned, 0);
    
    console.log(`Daily earnings check:
      todaysEarnings=${todaysEarnings}
      dailyLimit=${dailyGameLimit}
      currentEarning=${coinsEarned}`);
    
    // Calculate remaining daily allowance
    const remainingDaily = Math.max(0, dailyGameLimit - todaysEarnings);
    
    // If already at or over daily limit, return 0 coins
    if (remainingDaily <= 0) {
      console.log("Daily game earnings limit reached - no coins awarded");
      return res.json({
        gameScore: null,
        coinsEarned: 0,
        newBalance: user.balance,
        message: "Daily game earnings limit reached"
      });
    }
    
    // Otherwise cap to remaining daily allowance
    coinsEarned = Math.min(coinsEarned, remainingDaily);
    console.log(`Final coins earned after all limits: ${coinsEarned}`);
    
    
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
