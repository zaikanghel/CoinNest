import { users, activities, withdrawals, gameScores, settings } from "@shared/schema";
import type { User, Activity, Withdrawal, GameScore, Setting, InsertUser } from "@shared/schema";
import { nanoid } from "nanoid";
import session from "express-session";
import createMemoryStore from "memorystore";
import { MongoStorage } from "./mongodb-storage";

const MemoryStore = createMemoryStore(session);

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
  updateWithdrawalStatus(
    id: number,
    status: string,
    processedAt?: Date
  ): Promise<Withdrawal | undefined>;

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

  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private activities: Map<number, Activity>;
  private withdrawals: Map<number, Withdrawal>;
  private gameScores: Map<number, GameScore>;
  private settings: Map<string, Setting>;
  sessionStore: session.SessionStore;
  
  currentUserId: number;
  currentActivityId: number;
  currentWithdrawalId: number;
  currentGameScoreId: number;
  currentSettingId: number;

  constructor() {
    this.users = new Map();
    this.activities = new Map();
    this.withdrawals = new Map();
    this.gameScores = new Map();
    this.settings = new Map();
    
    this.currentUserId = 1;
    this.currentActivityId = 1;
    this.currentWithdrawalId = 1;
    this.currentGameScoreId = 1;
    this.currentSettingId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Default system settings
    this.initDefaultSettings();
  }

  private initDefaultSettings() {
    const defaultSettings = [
      { key: 'afk_rate', value: '2' }, // coins per minute
      { key: 'afk_daily_limit', value: '200' }, // daily coins limit
      { key: 'referral_bonus', value: '75' }, // bonus for referrer
      { key: 'referral_percent', value: '5' }, // percent of referred user earnings
      { key: 'min_withdrawal', value: '1000' }, // minimum coins for withdrawal
      { key: 'conversion_rate', value: '100' }, // coins per $1
      { key: 'captcha_interval', value: '1200' } // seconds between captcha checks
    ];
    
    defaultSettings.forEach((setting, index) => {
      this.settings.set(setting.key, {
        id: index + 1,
        key: setting.key,
        value: setting.value,
        updatedAt: new Date()
      });
      this.currentSettingId = index + 2;
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.referralCode === code
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const referralCode = nanoid(8);
    const now = new Date();
    
    // Initialize with default values
    const user: User = { 
      ...insertUser, 
      id,
      referralCode,
      balance: 0,
      totalEarned: 0,
      afkEarned: 0,
      gamesEarned: 0,
      referralEarned: 0,
      dailyAfkLimit: 200,
      dailyAfkEarned: 0,
      lastAfkReset: now,
      lastActive: now,
      isAdmin: false
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Activity operations
  async createActivity(data: {
    userId: number;
    type: string;
    amount: number;
    description: string;
  }): Promise<Activity> {
    const id = this.currentActivityId++;
    const activity: Activity = {
      id,
      ...data,
      createdAt: new Date()
    };
    
    this.activities.set(id, activity);
    return activity;
  }

  async getActivitiesByUser(userId: number, limit = 10): Promise<Activity[]> {
    const userActivities = Array.from(this.activities.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return limit ? userActivities.slice(0, limit) : userActivities;
  }

  // Withdrawal operations
  async createWithdrawal(data: {
    userId: number;
    amount: number;
    method: string;
    accountDetails: string;
  }): Promise<Withdrawal> {
    const id = this.currentWithdrawalId++;
    const withdrawal: Withdrawal = {
      id,
      ...data,
      status: 'pending',
      createdAt: new Date(),
      processedAt: null
    };
    
    this.withdrawals.set(id, withdrawal);
    return withdrawal;
  }

  async getWithdrawalsByUser(userId: number): Promise<Withdrawal[]> {
    return Array.from(this.withdrawals.values())
      .filter(withdrawal => withdrawal.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPendingWithdrawals(): Promise<Withdrawal[]> {
    return Array.from(this.withdrawals.values())
      .filter(withdrawal => withdrawal.status === 'pending')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async updateWithdrawalStatus(
    id: number,
    status: string,
    processedAt = new Date()
  ): Promise<Withdrawal | undefined> {
    const withdrawal = this.withdrawals.get(id);
    if (!withdrawal) return undefined;
    
    const updatedWithdrawal = { 
      ...withdrawal, 
      status, 
      processedAt
    };
    
    this.withdrawals.set(id, updatedWithdrawal);
    return updatedWithdrawal;
  }

  // Game operations
  async saveGameScore(data: {
    userId: number;
    gameId: string;
    score: number;
    coinsEarned: number;
  }): Promise<GameScore> {
    const id = this.currentGameScoreId++;
    const gameScore: GameScore = {
      id,
      ...data,
      createdAt: new Date()
    };
    
    this.gameScores.set(id, gameScore);
    return gameScore;
  }

  async getTopScoresByGame(gameId: string, limit = 10): Promise<GameScore[]> {
    return Array.from(this.gameScores.values())
      .filter(score => score.gameId === gameId)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async getUserGameScores(userId: number, gameId?: string): Promise<GameScore[]> {
    let scores = Array.from(this.gameScores.values())
      .filter(score => score.userId === userId);
    
    if (gameId) {
      scores = scores.filter(score => score.gameId === gameId);
    }
    
    return scores.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Settings operations
  async getSetting(key: string): Promise<string | undefined> {
    const setting = this.settings.get(key);
    return setting?.value;
  }

  async updateSetting(key: string, value: string): Promise<boolean> {
    const setting = this.settings.get(key);
    if (setting) {
      this.settings.set(key, {
        ...setting,
        value,
        updatedAt: new Date()
      });
      return true;
    } else {
      const id = this.currentSettingId++;
      this.settings.set(key, {
        id,
        key,
        value,
        updatedAt: new Date()
      });
      return true;
    }
  }

  async getSettings(): Promise<Setting[]> {
    return Array.from(this.settings.values());
  }
}

// Factory function to create the appropriate storage implementation
export async function createStorage(): Promise<IStorage> {
  if (process.env.MONGODB_URI) {
    try {
      const mongoStorage = new MongoStorage(process.env.MONGODB_URI);
      await mongoStorage.connect();
      console.log('Using MongoDB for storage');
      return mongoStorage;
    } catch (error) {
      console.error('Failed to connect to MongoDB, falling back to in-memory storage', error);
      return new MemStorage();
    }
  } else {
    console.log('No MongoDB URI provided, using in-memory storage');
    return new MemStorage();
  }
}

// Initialize with in-memory storage by default, will be updated in server/index.ts
export let storage = new MemStorage();
