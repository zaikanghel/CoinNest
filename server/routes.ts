import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupAfkRoutes } from "./afk";
import { setupGameRoutes } from "./games";
import { z } from "zod";
import { withdrawalSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Setup AFK earning routes
  setupAfkRoutes(app);
  
  // Setup game routes
  setupGameRoutes(app);
  
  // Wallet and withdrawals routes
  app.get("/api/wallet", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const user = req.user;
    const withdrawals = await storage.getWithdrawalsByUser(user.id);
    
    const minWithdrawalStr = await storage.getSetting("min_withdrawal");
    const conversionRateStr = await storage.getSetting("conversion_rate");
    
    const minWithdrawal = parseInt(minWithdrawalStr || "1000");
    const conversionRate = parseInt(conversionRateStr || "100");
    
    res.json({
      balance: user.balance,
      withdrawals,
      minWithdrawal,
      conversionRate
    });
  });
  
  app.post("/api/withdrawals", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const validatedData = withdrawalSchema.parse(req.body);
      const user = req.user;
      
      // Check minimum withdrawal amount
      const minWithdrawalStr = await storage.getSetting("min_withdrawal");
      const minWithdrawal = parseInt(minWithdrawalStr || "1000");
      
      if (validatedData.amount < minWithdrawal) {
        return res.status(400).json({ 
          message: `Minimum withdrawal amount is ${minWithdrawal} coins` 
        });
      }
      
      // Check if user has enough balance
      if (user.balance < validatedData.amount) {
        return res.status(400).json({ 
          message: "Insufficient balance" 
        });
      }
      
      // Create withdrawal request
      const withdrawal = await storage.createWithdrawal({
        userId: user.id,
        amount: validatedData.amount,
        method: validatedData.method,
        accountDetails: validatedData.accountDetails
      });
      
      // Update user balance
      await storage.updateUser(user.id, {
        balance: user.balance - validatedData.amount
      });
      
      // Create activity record
      await storage.createActivity({
        userId: user.id,
        type: "withdrawal",
        amount: -validatedData.amount,
        description: `Withdrawal request (${validatedData.method})`
      });
      
      res.status(201).json(withdrawal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Referral routes
  app.get("/api/referrals", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const user = req.user;
    const referredUsers = await storage.listUsers()
      .then(users => users.filter(u => u.referredBy === user.id));
    
    const referralBonusStr = await storage.getSetting("referral_bonus");
    const referralPercentStr = await storage.getSetting("referral_percent");
    
    const referralBonus = parseInt(referralBonusStr || "75");
    const referralPercent = parseInt(referralPercentStr || "5");
    
    res.json({
      referralCode: user.referralCode,
      referralBonus,
      referralPercent,
      referredUsers: referredUsers.map(u => ({
        id: u.id,
        username: u.username,
        totalEarned: u.totalEarned
      })),
      totalReferrals: referredUsers.length,
      referralEarnings: user.referralEarned
    });
  });
  
  // User activity routes
  app.get("/api/activities", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const activities = await storage.getActivitiesByUser(req.user.id, limit);
    
    res.json(activities);
  });
  
  // Admin routes
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).send("Forbidden");
    }
    
    const users = await storage.listUsers();
    res.json(users);
  });
  
  app.get("/api/admin/withdrawals", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).send("Forbidden");
    }
    
    const showAll = req.query.all === "true";
    
    if (showAll) {
      const allWithdrawals = await storage.getAllWithdrawals();
      res.json(allWithdrawals);
    } else {
      const pendingWithdrawals = await storage.getPendingWithdrawals();
      res.json(pendingWithdrawals);
    }
  });
  
  app.post("/api/admin/withdrawals/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).send("Forbidden");
    }
    
    const { id } = req.params;
    const { status } = req.body;
    
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    const withdrawal = await storage.updateWithdrawalStatus(
      parseInt(id), 
      status,
      new Date()
    );
    
    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }
    
    // If rejected, refund the user
    if (status === "rejected") {
      const user = await storage.getUser(withdrawal.userId);
      if (user) {
        await storage.updateUser(user.id, {
          balance: user.balance + withdrawal.amount
        });
        
        await storage.createActivity({
          userId: user.id,
          type: "refund",
          amount: withdrawal.amount,
          description: "Withdrawal request rejected (refunded)"
        });
      }
    }
    
    res.json(withdrawal);
  });
  
  // Endpoint to get processed withdrawals for download
  app.get("/api/admin/withdrawals/processed", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).send("Forbidden");
    }
    
    const processedWithdrawals = await storage.getProcessedWithdrawals();
    res.json(processedWithdrawals);
  });
  
  // Endpoint to delete processed withdrawals
  app.delete("/api/admin/withdrawals/processed", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).send("Forbidden");
    }
    
    const deletedCount = await storage.deleteProcessedWithdrawals();
    res.json({ 
      success: true, 
      deletedCount,
      message: `Successfully deleted ${deletedCount} processed withdrawal records.`
    });
  });
  
  app.get("/api/admin/settings", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).send("Forbidden");
    }
    
    const settings = await storage.getSettings();
    res.json(settings);
  });
  
  app.post("/api/admin/settings", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).send("Forbidden");
    }
    
    const { key, value } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({ message: "Key and value are required" });
    }
    
    await storage.updateSetting(key, value.toString());
    
    // Update the settings_updated_at timestamp to track changes
    await storage.updateSetting("settings_updated_at", Date.now().toString());
    
    res.json({ success: true });
  });
  
  // Global settings endpoint for all clients (no auth required)
  app.get("/api/settings/global", async (req, res) => {
    const settings = await storage.getSettings();
    res.json(settings);
  });
  
  // Stats route for dashboard
  app.get("/api/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const user = req.user;
    
    // Get base daily limit
    const dailyAfkLimitStr = await storage.getSetting("afk_daily_limit");
    const baseDailyAfkLimit = parseInt(dailyAfkLimitStr || "200");
    
    // Apply premium benefits if user is premium
    let dailyAfkLimit = baseDailyAfkLimit;
    let isPremiumActive = false;
    
    if (user.isPremium && user.premiumUntil && new Date(user.premiumUntil) > new Date()) {
      isPremiumActive = true;
      
      // Get premium daily limit bonus
      const premiumDailyLimitBonusStr = await storage.getSetting("premium_daily_limit_bonus");
      const dailyLimitBonus = parseInt(premiumDailyLimitBonusStr || "200");
      
      // Apply the bonus to the daily limit
      dailyAfkLimit = baseDailyAfkLimit + dailyLimitBonus;
      
      console.log(`[STATS] Premium user ${user.id} gets total daily limit of ${dailyAfkLimit} coins`);
    }
    
    // Convert user balance to monetary value
    const conversionRateStr = await storage.getSetting("conversion_rate");
    const conversionRate = parseInt(conversionRateStr || "100");
    const monetaryValue = (user.totalEarned / conversionRate).toFixed(2);
    
    // Calculate today's game earnings based on activity logs instead of using the cumulative total
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get all of today's game scores for this user
    const todaysGameScores = await storage.getUserGameScores(user.id);
    
    // Filter to just today's scores and sum up the coins earned
    const todaysGameEarnings = todaysGameScores
      .filter(gameScore => {
        // Parse the score date and reset hours to ensure proper date comparison
        const scoreDate = new Date(gameScore.createdAt);
        scoreDate.setHours(0, 0, 0, 0);
        
        // Compare dates to ensure we only count scores from today
        return scoreDate.getTime() === today.getTime();
      })
      .reduce((sum, gameScore) => sum + gameScore.coinsEarned, 0);
    
    console.log(`[STATS] Today's game earnings for user ${user.id}: ${todaysGameEarnings} coins`);
    
    // Get game daily limit from settings
    const dailyGameLimitStr = await storage.getSetting("game_daily_limit");
    const baseDailyGameLimit = parseInt(dailyGameLimitStr || "200");
    
    // Apply premium bonus to game limit if applicable
    let dailyGameLimit = baseDailyGameLimit;
    if (isPremiumActive) {
      const premiumGameLimitBonusStr = await storage.getSetting("premium_daily_limit_bonus");
      const gameBonus = parseInt(premiumGameLimitBonusStr || "200");
      dailyGameLimit = baseDailyGameLimit + gameBonus;
    }
    
    console.log(`[STATS] Daily game earnings for user ${user.id}: ${todaysGameEarnings}/${dailyGameLimit}`);
    
    res.json({
      balance: user.balance,
      totalEarnings: monetaryValue,
      dailyEarnings: user.dailyAfkEarned,
      dailyLimit: dailyAfkLimit,
      baseDailyLimit: baseDailyAfkLimit,
      isPremiumActive,
      dailyProgress: `${user.dailyAfkEarned}/${dailyAfkLimit}`,
      dailyProgressPercent: Math.min(100, Math.round((user.dailyAfkEarned / dailyAfkLimit) * 100)),
      gameEarnings: todaysGameEarnings,
      dailyGameLimit: dailyGameLimit,
      baseDailyGameLimit: baseDailyGameLimit,
      referralEarnings: user.referralEarned,
      totalReferrals: (await storage.listUsers().then(users => users.filter(u => u.referredBy === user.id))).length
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
