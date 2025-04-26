import { Express } from "express";
import { storage } from "./storage";

export function setupAfkRoutes(app: Express) {
  // Start AFK earning session
  app.post("/api/afk/start", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = req.user;
    
    // Check if daily limit has been reset
    const now = new Date();
    const lastReset = new Date(user.lastAfkReset);
    
    // If it's a new day, reset the daily earned amount
    if (
      now.getDate() !== lastReset.getDate() ||
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear()
    ) {
      await storage.updateUser(user.id, {
        dailyAfkEarned: 0,
        lastAfkReset: now
      });
    }
    
    // Update last active time
    await storage.updateUser(user.id, { lastActive: now });
    
    // Get earning rate from settings
    const afkRateStr = await storage.getSetting("afk_rate");
    const afkRate = parseInt(afkRateStr || "2");
    
    // Get daily limit from settings
    const dailyLimitStr = await storage.getSetting("afk_daily_limit");
    const dailyLimit = parseInt(dailyLimitStr || "200");
    
    // Get captcha interval from settings
    const captchaIntervalStr = await storage.getSetting("captcha_interval");
    const captchaInterval = parseInt(captchaIntervalStr || "1200");
    
    res.json({
      afkRate,
      dailyLimit,
      dailyEarned: user.dailyAfkEarned,
      captchaInterval,
      lastActive: user.lastActive
    });
  });
  
  // Record AFK earnings
  app.post("/api/afk/earn", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const { minutes, isTabActive, isPaused } = req.body;
    
    // Enhanced validation on minutes value
    if (!minutes || typeof minutes !== "number" || minutes <= 0) {
      return res.json({
        earned: 0,
        dailyEarned: req.user.dailyAfkEarned || 0,
        dailyLimit: 200,
        remainingDaily: 200 - (req.user.dailyAfkEarned || 0),
        message: "Invalid minutes value"
      });
    }
    
    // Block earnings if tab is inactive or paused (server-side verification)
    if (isPaused === true || isTabActive === false) {
      console.log("Server prevented earnings - tab inactive or paused");
      return res.json({
        earned: 0,
        dailyEarned: req.user.dailyAfkEarned || 0,
        dailyLimit: 200,
        remainingDaily: 200 - (req.user.dailyAfkEarned || 0),
        message: "Tab inactive or paused"
      });
    }

    // Anti-cheat: Cap the maximum minutes that can be earned in one request
    // This prevents attempting to submit large time periods at once
    const cappedMinutes = Math.min(minutes, 1.2); // Maximum slightly more than 1 minute
    
    const user = req.user;
    
    // Check for inactivity - don't award if user has been inactive for too long
    const now = new Date();
    const lastActive = new Date(user.lastActive || 0);
    const inactiveTimeSeconds = (now.getTime() - lastActive.getTime()) / 1000;
    
    // If user has been inactive for more than 3 minutes, return no earnings
    // This is a server-side safety net for the client-side anti-cheat
    if (inactiveTimeSeconds > 180) {
      return res.json({
        earned: 0,
        dailyEarned: user.dailyAfkEarned || 0,
        dailyLimit: 200,
        remainingDaily: 200 - (user.dailyAfkEarned || 0),
        captchaRequired: true,
        message: "Inactive for too long"
      });
    }
    
    // Get earning rate from settings
    const afkRateStr = await storage.getSetting("afk_rate");
    const afkRate = parseInt(afkRateStr || "2");
    
    // Calculate earned coins (using capped minutes)
    const earnedCoins = Math.floor(cappedMinutes * afkRate);
    
    // Get daily limit from settings
    const dailyLimitStr = await storage.getSetting("afk_daily_limit");
    const dailyLimit = parseInt(dailyLimitStr || "200");
    
    // Check if user has reached daily limit
    const remainingDaily = Math.max(0, dailyLimit - user.dailyAfkEarned);
    
    // Apply earnings up to the daily limit
    const actualEarnings = Math.min(earnedCoins, remainingDaily);
    
    // If no earnings possible, return early
    if (actualEarnings === 0) {
      return res.json({
        earned: 0,
        dailyEarned: user.dailyAfkEarned || 0,
        dailyLimit,
        remainingDaily: 0,
        message: "Daily limit reached"
      });
    }
    
    // Update user balance and stats
    const updatedUser = await storage.updateUser(user.id, {
      balance: user.balance + actualEarnings,
      totalEarned: user.totalEarned + actualEarnings,
      afkEarned: user.afkEarned + actualEarnings,
      dailyAfkEarned: user.dailyAfkEarned + actualEarnings,
      lastActive: new Date()
    });
    
    // Record activity
    await storage.createActivity({
      userId: user.id,
      type: "afk",
      amount: actualEarnings,
      description: `AFK earnings for ${minutes} minutes`
    });
    
    // If there's a referrer, add bonus to them
    if (user.referredBy) {
      const referrer = await storage.getUser(user.referredBy);
      if (referrer) {
        // Get referral percent from settings
        const referralPercentStr = await storage.getSetting("referral_percent");
        const referralPercent = parseInt(referralPercentStr || "5");
        
        // Calculate referral bonus
        const referralBonus = Math.floor((actualEarnings * referralPercent) / 100);
        
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
            description: `Referral commission from ${user.username}'s AFK earnings`
          });
        }
      }
    }
    
    // Calculate new remaining daily limit
    const newRemainingDaily = Math.max(0, dailyLimit - (updatedUser?.dailyAfkEarned || 0));
    
    res.json({
      earned: actualEarnings,
      dailyEarned: updatedUser?.dailyAfkEarned || 0,
      dailyLimit,
      remainingDaily: newRemainingDaily,
      balance: updatedUser?.balance || 0
    });
  });
  
  // Verify captcha for AFK
  app.post("/api/afk/verify", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const { answer, expected } = req.body;
    
    if (answer === undefined || expected === undefined) {
      return res.status(400).json({ message: "Missing answer or expected value" });
    }
    
    try {
      // Convert both values to numbers and compare
      const answerNum = parseInt(String(answer).trim());
      const expectedNum = parseInt(String(expected).trim());
      
      // Validation for non-numeric values
      if (isNaN(answerNum) || isNaN(expectedNum)) {
        return res.status(400).json({
          success: false,
          message: "Invalid numeric values"
        });
      }
      
      // Simple verification, check if the answer matches expected
      const isCorrect = answerNum === expectedNum;
      
      if (isCorrect) {
        // Update last active time and reset pause/inactivity status
        await storage.updateUser(req.user.id, { 
          lastActive: new Date(),
          // Could add additional fields if needed for tracking verification history
        });
        
        // Return success with the AFK rate and daily info to resume correctly
        const afkRateStr = await storage.getSetting("afk_rate");
        const afkRate = parseInt(afkRateStr || "2");
        
        const dailyLimitStr = await storage.getSetting("afk_daily_limit");
        const dailyLimit = parseInt(dailyLimitStr || "200");
        
        res.json({ 
          success: true,
          afkRate,
          dailyLimit,
          dailyEarned: req.user.dailyAfkEarned || 0,
          message: "Verification successful"
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Incorrect answer"
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error verifying captcha"
      });
    }
  });
}
