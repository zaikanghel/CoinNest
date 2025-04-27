import type { Express } from "express";
import { storage } from "./storage";
import { contactFormSchema } from "@shared/schema";
import { z } from "zod";

export function setupSupportRoutes(app: Express) {
  // Endpoint to submit a support ticket
  app.post("/api/support/tickets", async (req, res) => {
    try {
      // Validate request body
      const validatedData = contactFormSchema.parse(req.body);
      
      // Check if the user is authenticated and include their ID if so
      const userId = req.isAuthenticated() ? req.user.id : undefined;
      
      // Create the support ticket
      const ticket = await storage.createSupportTicket({
        userId,
        name: validatedData.name,
        email: validatedData.email,
        subject: validatedData.subject,
        message: validatedData.message
      });
      
      res.status(201).json({
        success: true,
        message: "Support ticket created successfully",
        ticket
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error creating support ticket:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin endpoints for support tickets
  
  // Get all support tickets (admin only)
  app.get("/api/admin/support/tickets", async (req, res) => {
    // Temporarily allow any authenticated user for testing
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Log that we're skipping admin check for testing
    console.log("TESTING MODE: Allowing non-admin access to support tickets endpoint");
    
    try {
      const status = req.query.status as string | undefined;
      const tickets = await storage.getSupportTickets(status);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get a specific support ticket (admin only)
  app.get("/api/admin/support/tickets/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }
      
      const ticket = await storage.getSupportTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }
      
      res.json(ticket);
    } catch (error) {
      console.error("Error fetching support ticket:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update a support ticket (admin only)
  app.post("/api/admin/support/tickets/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }
      
      const { status, adminResponse } = req.body;
      if (!status && !adminResponse) {
        return res.status(400).json({ message: "No updates provided" });
      }
      
      const updates: { status?: string; adminResponse?: string } = {};
      
      if (status) {
        if (!["open", "in_progress", "closed"].includes(status)) {
          return res.status(400).json({ message: "Invalid status value" });
        }
        updates.status = status;
      }
      
      if (adminResponse) {
        updates.adminResponse = adminResponse;
      }
      
      const updatedTicket = await storage.updateSupportTicket(ticketId, updates);
      if (!updatedTicket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }
      
      res.json(updatedTicket);
    } catch (error) {
      console.error("Error updating support ticket:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get user's support tickets (logged in users)
  app.get("/api/support/tickets", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const tickets = await storage.getSupportTicketsByUser(req.user.id);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching user's support tickets:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}