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

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type GameScore = typeof gameScores.$inferSelect;
export type Setting = typeof settings.$inferSelect;
export type PremiumPayment = typeof premiumPayments.$inferSelect;

// Additional schemas for client validation
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export const registerSchema = insertUserSchema.extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Please enter a valid email"),
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

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type WithdrawalData = z.infer<typeof withdrawalSchema>;
export type PremiumPaymentData = z.infer<typeof premiumPaymentSchema>;
