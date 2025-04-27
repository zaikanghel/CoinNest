import type { User, Activity, Withdrawal, GameScore, Setting, InsertUser, PremiumPayment } from "@shared/schema";
import session from "express-session";
import { MongoStorage } from "./mongodb-storage";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByReferralCode(code: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  listUsers(): Promise<User[]>;

  // Activity operations
  createActivity(data: {
    userId: number;
    type: string;
    amount: number;
    description: string;
  }): Promise<Activity>;
  getActivitiesByUser(userId: number, limit?: number): Promise<Activity[]>;

  // Withdrawal operations
  createWithdrawal(data: {
    userId: number;
    amount: number;
    method: string;
    accountDetails: string;
  }): Promise<Withdrawal>;
  getWithdrawalsByUser(userId: number): Promise<Withdrawal[]>;
  getPendingWithdrawals(): Promise<Withdrawal[]>;
  getAllWithdrawals(): Promise<Withdrawal[]>;
  getProcessedWithdrawals(): Promise<Withdrawal[]>;
  updateWithdrawalStatus(
    id: number,
    status: string,
    processedAt?: Date
  ): Promise<Withdrawal | undefined>;
  deleteProcessedWithdrawals(): Promise<number>;

  // Game operations
  saveGameScore(data: {
    userId: number;
    gameId: string;
    score: number;
    coinsEarned: number;
  }): Promise<GameScore>;
  getTopScoresByGame(gameId: string, limit?: number): Promise<GameScore[]>;
  getUserGameScores(userId: number, gameId?: string): Promise<GameScore[]>;

  // Settings operations
  getSetting(key: string): Promise<string | undefined>;
  updateSetting(key: string, value: string): Promise<boolean>;
  getSettings(): Promise<Setting[]>;
  
  // Premium operations
  createPremiumPayment(data: {
    userId: number;
    amount: number;
    method: string;
    durationMonths: number;
    proofImage: string;
    notes?: string;
  }): Promise<PremiumPayment>;
  getPremiumPaymentsByUser(userId: number): Promise<PremiumPayment[]>;
  getPendingPremiumPayments(): Promise<PremiumPayment[]>;
  getAllPremiumPayments(): Promise<PremiumPayment[]>;
  updatePremiumPaymentStatus(
    id: number,
    status: string,
    processedAt?: Date
  ): Promise<PremiumPayment | undefined>;
  updateUserPremiumStatus(
    userId: number,
    isPremium: boolean,
    premiumUntil?: Date,
    premiumStarted?: Date
  ): Promise<User | undefined>;

  // Session store
  sessionStore: session.Store;
}

// Factory function to create MongoDB storage implementation
export async function createStorage(): Promise<IStorage> {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is required');
  }
  
  const mongoStorage = new MongoStorage(process.env.MONGODB_URI);
  await mongoStorage.connect();
  console.log('Using MongoDB for storage');
  return mongoStorage;
}

// Global storage instance - will be initialized in server/index.ts
let _storage: IStorage | null = null;

// Function to set the storage instance
export function setStorage(instance: IStorage): void {
  _storage = instance;
}

// Proxy to access the storage instance
export const storage = new Proxy({} as IStorage, {
  get(target, prop) {
    if (!_storage) {
      throw new Error('Storage not initialized');
    }
    return Reflect.get(_storage, prop);
  }
});
