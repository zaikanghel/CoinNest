import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./auth";

export function setupOnboardingRoutes(app: Express) {
  // Get the user's onboarding status
  app.get("/api/user/onboarding-status", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        completedOnboarding: user.onboardingCompleted || false
      });
    } catch (error) {
      console.error("Error fetching onboarding status:", error);
      res.status(500).json({ message: "Failed to fetch onboarding status" });
    }
  });

  // Mark onboarding as complete
  app.post("/api/user/onboarding-complete", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user's onboarding status
      const updatedUser = await storage.updateUser(req.user.id, { 
        onboardingCompleted: true 
      });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update onboarding status" });
      }
      
      // Create activity record for completing onboarding
      await storage.createActivity({
        userId: user.id,
        type: "onboarding_completed",
        amount: 0,
        description: "Completed the onboarding tour"
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking onboarding as complete:", error);
      res.status(500).json({ message: "Failed to mark onboarding as complete" });
    }
  });
}
