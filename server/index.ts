import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createStorage, setStorage, storage } from "./storage";
import { setupAuth } from "./auth";
import { setupAfkRoutes } from "./afk";
import { setupGameRoutes } from "./games";
import { setupPremiumRoutes } from "./premium";
import { setupSupportRoutes } from "./support";
import rateLimit from "express-rate-limit";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Check for MongoDB URI environment variable
if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI environment variable is not set. Please set it in your environment or .env file.");
  process.exit(1);
}

const app = express();

// Apply security middleware
// Content Security Policy and other security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'] : true,
  credentials: true
}));

// General rate limiter for all API requests
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { message: "Too many requests from this IP, please try again later" }
});

// Apply rate limiting to all API routes
app.use("/api", apiLimiter);

// More strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { message: "Too many authentication attempts, please try again later" }
});

// Apply stricter rate limiting to authentication routes
app.use("/api/login", authLimiter);
app.use("/api/register", authLimiter);

// Increase JSON payload limit to 10MB to handle base64 encoded images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Import and apply sanitization middleware
import { sanitizeRequestBody } from './middleware/sanitize';
app.use(sanitizeRequestBody);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Initialize MongoDB storage
    const mongoStorage = await createStorage();
    setStorage(mongoStorage);
    
    log('MongoDB storage initialized successfully');
    
    // Setup authentication
    setupAuth(app);
    
    // Setup AFK routes
    setupAfkRoutes(app);
    
    // Setup game routes
    setupGameRoutes(app);
    
    // Setup premium subscription routes
    setupPremiumRoutes(app);
    
    // Setup support routes
    setupSupportRoutes(app);
    
    const server = await registerRoutes(app);
    
    // Setup scheduled cleanup for closed support tickets (runs every day)
    const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
    const CLOSED_TICKET_RETENTION_DAYS = 30; // Keep closed tickets for 30 days
    
    setInterval(async () => {
      try {
        const deletedCount = await storage.cleanupOldClosedTickets(CLOSED_TICKET_RETENTION_DAYS);
        if (deletedCount > 0) {
          log(`[CLEANUP] Deleted ${deletedCount} old closed support tickets`);
        }
      } catch (error) {
        log(`[ERROR] Failed to clean up old support tickets: ${error}`);
      }
    }, CLEANUP_INTERVAL_MS);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    log(`Error during server initialization: ${error}`);
    log('Fatal: MongoDB connection failed. Application requires MongoDB.');
    process.exit(1);
  }
})();
