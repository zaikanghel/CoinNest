import { Express } from "express";
import { storage } from "./storage";

export function setupPremiumRoutes(app: Express) {
  // Endpoint to submit premium subscription request
  app.post("/api/premium/subscribe", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const { paymentMethod, receiptId } = req.body;
    
    if (!paymentMethod || !receiptId) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    // Check if user is already premium with an active subscription
    if (req.user.isPremium) {
      const premiumUntil = req.user.premiumUntil ? new Date(req.user.premiumUntil) : null;
      if (premiumUntil && premiumUntil > new Date()) {
        return res.status(400).json({ message: "You already have an active premium subscription" });
      }
    }
    
    // Add the payment request to activities for admin review
    await storage.createActivity({
      userId: req.user.id,
      type: "premium_request",
      amount: 0, // No coins involved directly
      description: `Premium subscription payment (${paymentMethod}) - Reference: ${receiptId}`
    });
    
    // Return success response
    res.json({ success: true, message: "Premium subscription request submitted for review" });
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
}