import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  balance: integer("balance").notNull().default(0),
  totalEarned: integer("total_earned").notNull().default(0),
  afkEarned: integer("afk_earned").notNull().default(0),
  gamesEarned: integer("games_earned").notNull().default(0),
  referralEarned: integer("referral_earned").notNull().default(0),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: integer("referred_by"),
  lastActive: timestamp("last_active").notNull().defaultNow(),
  isAdmin: boolean("is_admin").notNull().default(false),
  dailyAfkLimit: integer("daily_afk_limit").notNull().default(200),
  dailyAfkEarned: integer("daily_afk_earned").notNull().default(0),
  lastAfkReset: timestamp("last_afk_reset").notNull().defaultNow(),
  isPremium: boolean("is_premium").notNull().default(false),
  premiumUntil: timestamp("premium_until"),
  premiumStarted: timestamp("premium_started")
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'afk', 'game', 'referral', 'withdrawal'
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  method: text("method").notNull(), // 'paypal', 'gcash'
  status: text("status").notNull().default('pending'), // 'pending', 'approved', 'rejected'
  accountDetails: text("account_details").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at")
});

export const gameScores = pgTable("game_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  gameId: text("game_id").notNull(),
  score: integer("score").notNull(),
  coinsEarned: integer("coins_earned").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const premiumPayments = pgTable("premium_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  method: text("method").notNull(), // 'paypal', 'gcash', 'bank_transfer', etc.
  durationMonths: integer("duration_months").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  proofImage: text("proof_image"), // URL or base64 of payment proof
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at")
});

export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // Can be null for non-logged in users
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"), // 'open', 'in_progress', 'closed'
  adminResponse: text("admin_response"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const dailyRewards = pgTable("daily_rewards", {
  id: serial("id").primaryKey(),
  day: integer("day").notNull(), // Day number (1-7)
  reward: integer("reward").notNull(), // Number of coins as reward
  description: text("description").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const userDailyRewards = pgTable("user_daily_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  day: integer("day").notNull(), // Current streak day (1-7)
  lastClaimedAt: timestamp("last_claimed_at").notNull().defaultNow(),
  streakStartedAt: timestamp("streak_started_at").notNull().defaultNow(),
  completedDays: integer("completed_days").notNull().default(0), // Total number of completed days
  hasCompletedWeek: boolean("has_completed_week").notNull().default(false) // Whether user has completed a full week
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isAdmin: true,
  dailyAfkLimit: true,
  dailyAfkEarned: true,
  lastAfkReset: true,
  lastActive: true,
  referralCode: true,
  totalEarned: true,
  afkEarned: true,
  gamesEarned: true,
  referralEarned: true,
  balance: true,
  isPremium: true,
  premiumUntil: true,
  premiumStarted: true
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true
});

export const insertWithdrawalSchema = createInsertSchema(withdrawals).omit({
  id: true,
  status: true,
  createdAt: true,
  processedAt: true
});

export const insertGameScoreSchema = createInsertSchema(gameScores).omit({
  id: true,
  createdAt: true
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true
});

export const insertPremiumPaymentSchema = createInsertSchema(premiumPayments).omit({
  id: true,
  status: true,
  createdAt: true,
  processedAt: true
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  status: true,
  adminResponse: true,
  createdAt: true,
  updatedAt: true
});

export const insertDailyRewardSchema = createInsertSchema(dailyRewards).omit({
  id: true,
  updatedAt: true
});

export const insertUserDailyRewardSchema = createInsertSchema(userDailyRewards).omit({
  id: true,
  lastClaimedAt: true,
  streakStartedAt: true
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type GameScore = typeof gameScores.$inferSelect;
export type Setting = typeof settings.$inferSelect;
export type PremiumPayment = typeof premiumPayments.$inferSelect;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type DailyReward = typeof dailyRewards.$inferSelect;
export type UserDailyReward = typeof userDailyRewards.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type InsertDailyReward = z.infer<typeof insertDailyRewardSchema>;
export type InsertUserDailyReward = z.infer<typeof insertUserDailyRewardSchema>;

// Additional schemas for client validation
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email")
    .transform(val => val.toLowerCase()),
  password: z.string().min(1, "Password is required")
});

export const registerSchema = insertUserSchema.extend({
  username: z.string().min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  email: z.string().email("Please enter a valid email")
    .transform(val => val.toLowerCase()), // Ensure emails are stored in lowercase
  referredBy: z.union([z.number(), z.string(), z.null()]).nullable().optional().transform(val => 
    typeof val === 'string' && val ? parseInt(val, 10) || null : val
  )
});

export const withdrawalSchema = z.object({
  amount: z.number().min(1000, "Minimum withdrawal is 1000 coins"),
  method: z.enum(["paypal", "gcash"], {
    errorMap: () => ({ message: "Please select a valid withdrawal method" })
  }),
  accountDetails: z.string().min(5, "Please enter valid account details")
});

export const premiumPaymentSchema = z.object({
  amount: z.number().min(1, "Please enter a valid amount"),
  method: z.enum(["paypal", "gcash", "bank_transfer", "crypto"], {
    errorMap: () => ({ message: "Please select a valid payment method" })
  }),
  durationMonths: z.number().min(1, "Please select a valid duration"),
  proofImage: z.string().min(5, "Please upload proof of payment"),
  notes: z.string().optional()
});

export const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters" }),
  message: z.string().min(10, { message: "Message must be at least 10 characters" }),
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type WithdrawalData = z.infer<typeof withdrawalSchema>;
export type PremiumPaymentData = z.infer<typeof premiumPaymentSchema>;
export type ContactFormData = z.infer<typeof contactFormSchema>;
