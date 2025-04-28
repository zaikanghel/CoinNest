import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { registerSchema, User as SelectUser } from "@shared/schema";
import { nanoid } from "nanoid";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Authentication middleware
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}

// Admin middleware
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  return res.status(403).json({ message: "Forbidden" });
}

export function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    console.error("SESSION_SECRET environment variable is not set. Please set it in your environment or .env file.");
    process.exit(1);
  }

  // Default session settings
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day (default)
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          // Update last active time
          await storage.updateUser(user.id, { lastActive: new Date() });
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      // If user not found in storage
      if (!user) return done(null, false);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate the request body
      const userData = registerSchema.parse(req.body);
      
      // Check if username already exists
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Generate a unique referral code
      const referralCode = nanoid(8);
      
      // Process referrer if provided
      let referredBy: number | null = null;
      const referralValue = userData.referredBy;
      
      console.log(`Processing referral, referredBy value: ${referralValue}, type: ${typeof referralValue}`);
      
      if (referralValue) {
        // Handle referral code (string)
        if (typeof referralValue === 'string' && referralValue.trim() !== '') {
          const refCode = referralValue.trim();
          console.log(`Looking up referrer by code: ${refCode}`);
          
          try {
            const referrer = await storage.getUserByReferralCode(refCode);
            
            if (referrer) {
              console.log(`Found referrer with ID ${referrer.id} for code ${refCode}`);
              referredBy = referrer.id;
              
              // Record the referral activity without a bonus amount
              await storage.createActivity({
                userId: referrer.id,
                type: "referral_signup",
                amount: 0,
                description: `New user signed up through your referral: ${userData.username}. You'll receive a bonus when they complete 7 days of daily rewards.`
              });
            } else {
              console.log(`No referrer found for code: ${refCode}`);
            }
          } catch (error) {
            console.error(`Error looking up referrer by code: ${refCode}`, error);
          }
        } 
        // Handle user ID (number)
        else if (typeof referralValue === 'number' && referralValue > 0) {
          console.log(`Looking up referrer by ID: ${referralValue}`);
          
          try {
            const referrer = await storage.getUser(referralValue);
            
            if (referrer) {
              console.log(`Found referrer with ID ${referrer.id}`);
              referredBy = referrer.id;
              
              // Record the referral activity without a bonus amount
              await storage.createActivity({
                userId: referrer.id,
                type: "referral_signup",
                amount: 0,
                description: `New user signed up through your referral: ${userData.username}. You'll receive a bonus when they complete 7 days of daily rewards.`
              });
            } else {
              console.log(`No referrer found for ID: ${referralValue}`);
            }
          } catch (error) {
            console.error(`Error looking up referrer by ID: ${referralValue}`, error);
          }
        }
      }
      
      // Create the user
      const user = await storage.createUser({
        ...userData,
        password: await hashPassword(userData.password),
        referredBy
      });

      // Log in the newly created user
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Remove sensitive info before sending to client
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error, user: SelectUser) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Check if rememberMe was selected to extend the session
      const rememberMe = req.body.rememberMe === true;
      
      // Set session expiration based on rememberMe preference
      if (rememberMe && req.session.cookie) {
        // Set to 30 days if remember me is selected
        req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30;
        console.log("Extended session to 30 days due to 'Remember Me' option");
      } else if (req.session.cookie) {
        // Use default (1 day) if not remember me
        req.session.cookie.maxAge = 1000 * 60 * 60 * 24;
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        // Remove sensitive info before sending to client
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    // Remove sensitive info before sending to client
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}
