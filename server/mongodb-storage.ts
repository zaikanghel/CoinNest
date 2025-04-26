import { MongoClient, ObjectId, Db, Collection } from "mongodb";
import { users, activities, withdrawals, gameScores, settings } from "@shared/schema";
import type { User, Activity, Withdrawal, GameScore, Setting, InsertUser } from "@shared/schema";
import { IStorage } from "./storage";
import { nanoid } from "nanoid";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class MongoStorage implements IStorage {
  private client: MongoClient;
  private db: Db | null = null;
  private usersCollection: Collection | null = null;
  private activitiesCollection: Collection | null = null;
  private withdrawalsCollection: Collection | null = null;
  private gameScoresCollection: Collection | null = null;
  private settingsCollection: Collection | null = null;
  sessionStore: session.Store;

  constructor(mongoUri: string) {
    this.client = new MongoClient(mongoUri);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      console.log("Connected to MongoDB");
      this.db = this.client.db("smartearn");
      
      // Initialize collections
      this.usersCollection = this.db.collection("users");
      this.activitiesCollection = this.db.collection("activities");
      this.withdrawalsCollection = this.db.collection("withdrawals");
      this.gameScoresCollection = this.db.collection("gameScores");
      this.settingsCollection = this.db.collection("settings");
      
      // Initialize default settings if they don't exist
      await this.initDefaultSettings();
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.client.close();
    console.log("MongoDB connection closed");
  }

  private async initDefaultSettings(): Promise<void> {
    if (!this.settingsCollection) throw new Error("Database not initialized");
    
    console.log("Initializing default settings in MongoDB...");

    const defaultSettings = [
      { key: 'afk_rate', value: '2' }, // coins per minute
      { key: 'afk_daily_limit', value: '200' }, // daily coins limit
      { key: 'referral_bonus', value: '75' }, // bonus for referrer
      { key: 'referral_percent', value: '5' }, // percent of referred user earnings
      { key: 'min_withdrawal', value: '1000' }, // minimum coins for withdrawal
      { key: 'conversion_rate', value: '100' }, // coins per $1
      { key: 'captcha_interval', value: '1200' }, // seconds between captcha checks
      { key: 'game_memory_reward', value: '10' }, // coins per memory match
      { key: 'game_clicker_reward', value: '5' }, // coins per click
      { key: 'game_max_earnings', value: '200' }, // max coins per game session
      { key: 'game_daily_limit', value: '1000' } // max coins from games per day
    ];

    for (const setting of defaultSettings) {
      const exists = await this.settingsCollection.findOne({ key: setting.key });
      if (!exists) {
        console.log(`Creating default setting: ${setting.key} = ${setting.value}`);
        await this.settingsCollection.insertOne({
          ...setting,
          updatedAt: new Date()
        });
      } else {
        console.log(`Setting already exists: ${setting.key} = ${exists.value}`);
      }
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    if (!this.usersCollection) throw new Error("Database not initialized");
    const user = await this.usersCollection.findOne({ id });
    return user ? this.mapToUser(user) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!this.usersCollection) throw new Error("Database not initialized");
    const user = await this.usersCollection.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') } 
    });
    return user ? this.mapToUser(user) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!this.usersCollection) throw new Error("Database not initialized");
    const user = await this.usersCollection.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } 
    });
    return user ? this.mapToUser(user) : undefined;
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    if (!this.usersCollection) throw new Error("Database not initialized");
    const user = await this.usersCollection.findOne({ referralCode: code });
    return user ? this.mapToUser(user) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!this.usersCollection) throw new Error("Database not initialized");
    
    // Get the current max id
    const maxIdUser = await this.usersCollection.find().sort({ id: -1 }).limit(1).toArray();
    const nextId = maxIdUser.length > 0 ? maxIdUser[0].id + 1 : 1;
    
    const referralCode = nanoid(8);
    const now = new Date();
    
    // Ensure referredBy is null if undefined
    const referredBy = insertUser.referredBy ?? null;
    
    const user: User = {
      ...insertUser,
      id: nextId,
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
      isAdmin: false,
      referredBy
    };
    
    await this.usersCollection.insertOne(user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    if (!this.usersCollection) throw new Error("Database not initialized");
    
    const result = await this.usersCollection.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: 'after' }
    );
    
    return result ? this.mapToUser(result) : undefined;
  }

  async listUsers(): Promise<User[]> {
    if (!this.usersCollection) throw new Error("Database not initialized");
    const users = await this.usersCollection.find().toArray();
    return users.map(user => this.mapToUser(user));
  }

  // Activity operations
  async createActivity(data: {
    userId: number;
    type: string;
    amount: number;
    description: string;
  }): Promise<Activity> {
    if (!this.activitiesCollection) throw new Error("Database not initialized");
    
    // Get the current max id
    const maxIdActivity = await this.activitiesCollection.find().sort({ id: -1 }).limit(1).toArray();
    const nextId = maxIdActivity.length > 0 ? maxIdActivity[0].id + 1 : 1;
    
    const activity: Activity = {
      id: nextId,
      ...data,
      createdAt: new Date()
    };
    
    await this.activitiesCollection.insertOne(activity);
    return activity;
  }

  async getActivitiesByUser(userId: number, limit = 10): Promise<Activity[]> {
    if (!this.activitiesCollection) throw new Error("Database not initialized");
    
    const activities = await this.activitiesCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit || 0)
      .toArray();
    
    return activities.map(activity => this.mapToActivity(activity));
  }

  // Withdrawal operations
  async createWithdrawal(data: {
    userId: number;
    amount: number;
    method: string;
    accountDetails: string;
  }): Promise<Withdrawal> {
    if (!this.withdrawalsCollection) throw new Error("Database not initialized");
    
    // Get the current max id
    const maxIdWithdrawal = await this.withdrawalsCollection.find().sort({ id: -1 }).limit(1).toArray();
    const nextId = maxIdWithdrawal.length > 0 ? maxIdWithdrawal[0].id + 1 : 1;
    
    const withdrawal: Withdrawal = {
      id: nextId,
      ...data,
      status: 'pending',
      createdAt: new Date(),
      processedAt: null
    };
    
    await this.withdrawalsCollection.insertOne(withdrawal);
    return withdrawal;
  }

  async getWithdrawalsByUser(userId: number): Promise<Withdrawal[]> {
    if (!this.withdrawalsCollection) throw new Error("Database not initialized");
    
    const withdrawals = await this.withdrawalsCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    
    return withdrawals.map(withdrawal => this.mapToWithdrawal(withdrawal));
  }

  async getPendingWithdrawals(): Promise<Withdrawal[]> {
    if (!this.withdrawalsCollection) throw new Error("Database not initialized");
    
    const withdrawals = await this.withdrawalsCollection
      .find({ status: 'pending' })
      .sort({ createdAt: 1 })
      .toArray();
    
    return withdrawals.map(withdrawal => this.mapToWithdrawal(withdrawal));
  }
  
  async getAllWithdrawals(): Promise<Withdrawal[]> {
    if (!this.withdrawalsCollection) throw new Error("Database not initialized");
    
    const withdrawals = await this.withdrawalsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    return withdrawals.map(withdrawal => this.mapToWithdrawal(withdrawal));
  }

  async updateWithdrawalStatus(
    id: number,
    status: string,
    processedAt = new Date()
  ): Promise<Withdrawal | undefined> {
    if (!this.withdrawalsCollection) throw new Error("Database not initialized");
    
    const result = await this.withdrawalsCollection.findOneAndUpdate(
      { id },
      { $set: { status, processedAt } },
      { returnDocument: 'after' }
    );
    
    return result ? this.mapToWithdrawal(result) : undefined;
  }

  // Game operations
  async saveGameScore(data: {
    userId: number;
    gameId: string;
    score: number;
    coinsEarned: number;
  }): Promise<GameScore> {
    if (!this.gameScoresCollection) throw new Error("Database not initialized");
    
    // Get the current max id
    const maxIdGameScore = await this.gameScoresCollection.find().sort({ id: -1 }).limit(1).toArray();
    const nextId = maxIdGameScore.length > 0 ? maxIdGameScore[0].id + 1 : 1;
    
    const gameScore: GameScore = {
      id: nextId,
      ...data,
      createdAt: new Date()
    };
    
    await this.gameScoresCollection.insertOne(gameScore);
    return gameScore;
  }

  async getTopScoresByGame(gameId: string, limit = 10): Promise<GameScore[]> {
    if (!this.gameScoresCollection) throw new Error("Database not initialized");
    
    const scores = await this.gameScoresCollection
      .find({ gameId })
      .sort({ score: -1 })
      .limit(limit)
      .toArray();
    
    return scores.map(score => this.mapToGameScore(score));
  }

  async getUserGameScores(userId: number, gameId?: string): Promise<GameScore[]> {
    if (!this.gameScoresCollection) throw new Error("Database not initialized");
    
    let query: any = { userId };
    if (gameId) {
      query.gameId = gameId;
    }
    
    const scores = await this.gameScoresCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    return scores.map(score => this.mapToGameScore(score));
  }

  // Settings operations
  async getSetting(key: string): Promise<string | undefined> {
    if (!this.settingsCollection) throw new Error("Database not initialized");
    
    const setting = await this.settingsCollection.findOne({ key });
    return setting?.value;
  }

  async updateSetting(key: string, value: string): Promise<boolean> {
    if (!this.settingsCollection) throw new Error("Database not initialized");
    
    const result = await this.settingsCollection.updateOne(
      { key },
      { 
        $set: { 
          value, 
          updatedAt: new Date() 
        }, 
        $setOnInsert: { key } 
      },
      { upsert: true }
    );
    
    return result.modifiedCount > 0 || result.upsertedCount > 0;
  }

  async getSettings(): Promise<Setting[]> {
    if (!this.settingsCollection) throw new Error("Database not initialized");
    
    const settings = await this.settingsCollection.find().toArray();
    return settings.map(setting => this.mapToSetting(setting));
  }

  // Helper methods to map MongoDB documents to our schema types
  private mapToUser(doc: any): User {
    // Convert MongoDB _id to string if needed
    const { _id, ...userData } = doc;
    return userData as User;
  }

  private mapToActivity(doc: any): Activity {
    const { _id, ...activityData } = doc;
    return activityData as Activity;
  }

  private mapToWithdrawal(doc: any): Withdrawal {
    const { _id, ...withdrawalData } = doc;
    return withdrawalData as Withdrawal;
  }

  private mapToGameScore(doc: any): GameScore {
    const { _id, ...gameScoreData } = doc;
    return gameScoreData as GameScore;
  }

  private mapToSetting(doc: any): Setting {
    const { _id, ...settingData } = doc;
    return settingData as Setting;
  }
}