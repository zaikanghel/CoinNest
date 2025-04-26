import { Express } from "express";
import { storage } from "./storage";
import { premiumPaymentSchema } from "@shared/schema";

export function setupPremiumRoutes(app: Express) {
  // Helper function to check if premium is expired
  const checkPremiumExpiration = async (userId: number) => {
    try {
      const user = await storage.getUser(userId);
      if (!user) return false;
      
      console.log(`[PREMIUM CHECK] Checking premium status for user ${userId}`);
      console.log(`[PREMIUM CHECK] isPremium: ${user.isPremium}, premiumUntil: ${user.premiumUntil}`);
      
      if (user.premiumUntil) {
        const expiryDate = new Date(user.premiumUntil);
        const now = new Date();
        console.log(`[PREMIUM CHECK] Expiry date: ${expiryDate.toISOString()}, Current date: ${now.toISOString()}`);
        console.log(`[PREMIUM CHECK] Is expired: ${expiryDate <= now}`);
      }
      
      // If user has premium but it's expired, automatically deactivate it
      if (user.isPremium && user.premiumUntil && new Date(user.premiumUntil) <= new Date()) {
        console.log(`[PREMIUM CHECK] Premium expired for user ${userId}, deactivating...`);
        
        await storage.updateUserPremiumStatus(
          user.id,
          false,
          user.premiumUntil
        );
        
        // Add activity record for automatic expiration
        await storage.createActivity({
          userId: user.id,
          type: "premium_expired",
          amount: 0,
          description: "Premium subscription expired automatically"
        });
        
        console.log(`[PREMIUM CHECK] Successfully deactivated premium for user ${userId}`);
        return true; // Premium was expired
      }
      
      return false; // No expiration needed
    } catch (error) {
      console.error("Error checking premium expiration:", error);
      return false;
    }
  };
  
  // Get premium status for current user
  app.get("/api/premium/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = req.user;
    
    // Check if premium subscription has expired
    await checkPremiumExpiration(user.id);
    
    // Get fresh user data after potential expiration check
    const updatedUser = await storage.getUser(user.id);
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Calculate if premium is active with fresh data
    const isPremiumActive = updatedUser.isPremium && updatedUser.premiumUntil && new Date(updatedUser.premiumUntil) > new Date();

    res.json({
      isPremium: isPremiumActive,
      premiumUntil: updatedUser.premiumUntil,
      premiumStarted: updatedUser.premiumStarted
    });
  });

  // Get premium payments for current user
  app.get("/api/premium/payments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payments = await storage.getPremiumPaymentsByUser(req.user.id);
    res.json(payments);
  });
  
  // Admin endpoint to get all premium payments
  app.get("/api/admin/premium/payments", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const showAll = req.query.all === "true";
    
    if (showAll) {
      const allPayments = await storage.getAllPremiumPayments();
      res.json(allPayments);
    } else {
      const pendingPayments = await storage.getPendingPremiumPayments();
      res.json(pendingPayments);
    }
  });
  
  // Admin endpoint to process premium payment
  app.post("/api/admin/premium/payments/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const { id } = req.params;
    const { status } = req.body;
    
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    const payment = await storage.updatePremiumPaymentStatus(
      parseInt(id), 
      status,
      new Date()
    );
    
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    
    // If approved, activate premium for the user
    if (status === "approved") {
      const user = await storage.getUser(payment.userId);
      if (user) {
        // Calculate new premium expiry date
        const now = new Date();
        let premiumUntil = user.premiumUntil ? new Date(user.premiumUntil) : now;
        
        // If premium has expired, start from now
        if (premiumUntil < now) {
          premiumUntil = now;
        }
        
        // Add months to the premium expiry date
        premiumUntil.setMonth(premiumUntil.getMonth() + payment.durationMonths);
        
        // Update user's premium status
        await storage.updateUserPremiumStatus(
          user.id, 
          true, 
          premiumUntil,
          user.premiumStarted || now
        );
        
        // Add activity record
        await storage.createActivity({
          userId: user.id,
          type: "premium_activated",
          amount: payment.amount,
          description: `Premium subscription activated for ${payment.durationMonths} month(s)`
        });
      }
    }
    
    res.json(payment);
  });

  // Endpoint to submit premium subscription request
  app.post("/api/premium/subscribe", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Check if user is already premium with an active subscription
    if (req.user.isPremium) {
      const premiumUntil = req.user.premiumUntil ? new Date(req.user.premiumUntil) : null;
      if (premiumUntil && premiumUntil > new Date()) {
        return res.status(400).json({ message: "You already have an active premium subscription" });
      }
    }
    
    try {
      const validatedData = premiumPaymentSchema.parse(req.body);
      
      const payment = await storage.createPremiumPayment({
        userId: req.user.id,
        ...validatedData
      });
      
      // Add the payment request to activities for admin review
      await storage.createActivity({
        userId: req.user.id,
        type: "premium_request",
        amount: payment.amount,
        description: `Premium subscription payment (${payment.method}) - ${payment.durationMonths} month(s)`
      });

      res.json({ success: true, payment, message: "Premium subscription request submitted for review" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Admin endpoint to approve premium subscription
  app.post("/api/admin/premium/:userId", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const { userId } = req.params;
    const { months = 1 } = req.body; // Default to 1 month if not specified
    
    const user = await storage.getUser(parseInt(userId));
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Calculate new premium expiry date
    const now = new Date();
    let premiumUntil = user.premiumUntil ? new Date(user.premiumUntil) : now;
    
    // If premium has expired, start from now
    if (premiumUntil < now) {
      premiumUntil = now;
    }
    
    // Add months to the premium expiry date
    premiumUntil.setMonth(premiumUntil.getMonth() + months);
    
    // Update user's premium status
    const updatedUser = await storage.updateUser(user.id, {
      isPremium: true,
      premiumStarted: user.premiumStarted || now,
      premiumUntil
    });
    
    // Add activity record
    await storage.createActivity({
      userId: user.id,
      type: "premium_activated",
      amount: 0,
      description: `Premium subscription activated for ${months} month(s)`
    });
    
    res.json({
      success: true,
      user: updatedUser,
      message: `Premium subscription activated for ${months} month(s)`
    });
  });
  
  // Admin endpoint to revoke premium
  app.delete("/api/admin/premium/:userId", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const { userId } = req.params;
    
    const user = await storage.getUser(parseInt(userId));
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Remove premium status
    const updatedUser = await storage.updateUser(user.id, {
      isPremium: false,
      premiumUntil: new Date() // Set expiry to now (expired)
    });
    
    // Add activity record
    await storage.createActivity({
      userId: user.id,
      type: "premium_revoked",
      amount: 0,
      description: "Premium subscription revoked by admin"
    });
    
    res.json({
      success: true,
      user: updatedUser,
      message: "Premium subscription revoked"
    });
  });
  
  // Test endpoint for premium expiration (for development purposes only)
  app.get("/api/admin/test-premium-expiration/:userId", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const { userId } = req.params;
    const user = await storage.getUser(parseInt(userId));
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Set premium to expire in the past (5 seconds ago)
    const pastExpiryDate = new Date(Date.now() - 5000); // 5 seconds ago
    
    // Set user as premium but with expired date
    await storage.updateUser(user.id, {
      isPremium: true,
      premiumUntil: pastExpiryDate,
      premiumStarted: new Date(Date.now() - 3600000) // 1 hour ago
    });
    
    console.log(`[TEST] Set user ${userId} as premium with expiry date: ${pastExpiryDate.toISOString()}`);
    
    // Check for expiration
    const wasExpired = await checkPremiumExpiration(parseInt(userId));
    
    // Get updated user
    const updatedUser = await storage.getUser(parseInt(userId));
    
    res.json({
      success: true,
      wasExpired,
      user: updatedUser,
      message: wasExpired ? "Premium was successfully expired and deactivated" : "Premium expiration check did not deactivate premium"
    });
  });
}