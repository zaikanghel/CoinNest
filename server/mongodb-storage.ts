import { MongoClient, ObjectId, Db, Collection } from "mongodb";
import { users, activities, withdrawals, gameScores, settings, supportTickets, dailyRewards, userDailyRewards } from "@shared/schema";
import type { 
  User, Activity, Withdrawal, GameScore, Setting, InsertUser, 
  PremiumPayment, SupportTicket, DailyReward, UserDailyReward,
  InsertDailyReward, InsertUserDailyReward
} from "@shared/schema";
import { IStorage } from "./storage";
import { nanoid } from "nanoid";
import session from "express-session";
import createMemoryStore from "memorystore";
import { implementDailyRewardMethods } from "./mongodb-storage-daily-rewards";

const MemoryStore = createMemoryStore(session);

export class MongoStorage implements IStorage {
  private client: MongoClient;
  private db: Db | null = null;
  private usersCollection: Collection | null = null;
  private activitiesCollection: Collection | null = null;
  private withdrawalsCollection: Collection | null = null;
  private gameScoresCollection: Collection | null = null;
  private settingsCollection: Collection | null = null;
  private premiumPaymentsCollection: Collection | null = null;
  private supportTicketsCollection: Collection | null = null;
  private dailyRewardsCollection: Collection | null = null;
  private userDailyRewardsCollection: Collection | null = null;
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
      this.premiumPaymentsCollection = this.db.collection("premiumPayments");
      this.supportTicketsCollection = this.db.collection("supportTickets");
      this.dailyRewardsCollection = this.db.collection("dailyRewards");
      this.userDailyRewardsCollection = this.db.collection("userDailyRewards");
      
      // Initialize default settings if they don't exist
      await this.initDefaultSettings();
      // Initialize default daily rewards
      await this.initDefaultDailyRewards();
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
      { key: 'captcha_interval', value: '1200' }, // points earned before captcha verification
      { key: 'game_memory_reward', value: '10' }, // coins per memory match
      { key: 'game_clicker_reward', value: '5' }, // coins per click
      { key: 'game_max_earnings', value: '200' }, // max coins per game session
      { key: 'game_daily_limit', value: '1000' }, // max coins from games per day
      
      // Premium settings
      { key: 'premium_price', value: '4.99' }, // monthly price in USD
      { key: 'premium_afk_multiplier', value: '2' }, // multiplier for premium earnings
      { key: 'premium_daily_limit_bonus', value: '200' }, // additional daily limit for premium
      { key: 'captcha_disabled_premium', value: 'true' }, // whether captchas are disabled for premium

      // Daily rewards settings
      { key: 'daily_reward_day1', value: '50' }, // Day 1 reward
      { key: 'daily_reward_day2', value: '75' }, // Day 2 reward
      { key: 'daily_reward_day3', value: '100' }, // Day 3 reward
      { key: 'daily_reward_day4', value: '125' }, // Day 4 reward
      { key: 'daily_reward_day5', value: '150' }, // Day 5 reward
      { key: 'daily_reward_day6', value: '175' }, // Day 6 reward
      { key: 'daily_reward_day7', value: '250' }, // Day 7 reward
      { key: 'daily_reward_cooldown', value: '86400' } // Cooldown in seconds (24 hours)
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
  
  private async initDefaultDailyRewards(): Promise<void> {
    if (!this.dailyRewardsCollection) throw new Error("Database not initialized");
    
    console.log("Initializing default daily rewards in MongoDB...");

    const defaultRewards = [
      {
        day: 1,
        reward: 50,
        description: "Welcome Bonus"
      },
      {
        day: 2,
        reward: 75,
        description: "Streak Day 2"
      },
      {
        day: 3,
        reward: 100,
        description: "Streak Day 3"
      },
      {
        day: 4,
        reward: 125,
        description: "Halfway Bonus"
      },
      {
        day: 5,
        reward: 150,
        description: "Streak Day 5"
      },
      {
        day: 6,
        reward: 175,
        description: "Almost There!"
      },
      {
        day: 7,
        reward: 250,
        description: "Weekly Completion Bonus"
      }
    ];

    for (const reward of defaultRewards) {
      const exists = await this.dailyRewardsCollection.findOne({ day: reward.day });
      if (!exists) {
        console.log(`Creating default daily reward for day ${reward.day}: ${reward.reward} coins`);
        await this.dailyRewardsCollection.insertOne({
          ...reward,
          id: reward.day, // Use day as ID for simplicity
          updatedAt: new Date()
        });
      } else {
        console.log(`Daily reward for day ${reward.day} already exists: ${exists.reward} coins`);
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
    
    // Process referredBy field - ensure it's numeric or null
    let referredBy: number | null = null;
    
    if (insertUser.referredBy) {
      console.log(`[STORAGE] Processing referredBy in createUser: ${insertUser.referredBy}, type: ${typeof insertUser.referredBy}`);
      
      if (typeof insertUser.referredBy === 'number') {
        referredBy = insertUser.referredBy;
        console.log(`[STORAGE] Using numeric referredBy: ${referredBy}`);
      } 
      else if (typeof insertUser.referredBy === 'string' && insertUser.referredBy.trim() !== '') {
        // We're being given a referral code, need to look up the user ID
        const refCode = insertUser.referredBy.trim();
        console.log(`[STORAGE] Looking up user ID for referral code: ${refCode}`);
        
        const referrer = await this.getUserByReferralCode(refCode);
        if (referrer) {
          referredBy = referrer.id;
          console.log(`[STORAGE] Found referrer ID: ${referredBy} for code: ${refCode}`);
        } else {
          console.log(`[STORAGE] No user found for referral code: ${refCode}`);
        }
      }
    }
    
    console.log(`[STORAGE] Final referredBy value: ${referredBy}`);
    
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
      referredBy,
      isPremium: false,
      premiumUntil: null,
      premiumStarted: null
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
    if (!this.withdrawalsCollection || !this.usersCollection) throw new Error("Database not initialized");
    
    // Get all pending withdrawals
    const pendingWithdrawals = await this.withdrawalsCollection
      .find({ status: 'pending' })
      .toArray();
    
    // Map each withdrawal to include isPremium status from the user
    const withdrawalsWithUserInfo = await Promise.all(
      pendingWithdrawals.map(async (withdrawal) => {
        const user = await this.usersCollection!.findOne({ id: withdrawal.userId });
        const isPremium = user?.isPremium && 
                         user?.premiumUntil && 
                         new Date(user.premiumUntil) > new Date();
        
        return {
          ...this.mapToWithdrawal(withdrawal),
          isPremiumUser: isPremium
        };
      })
    );
    
    // Sort withdrawals: first by premium status (premium first), then by date
    withdrawalsWithUserInfo.sort((a, b) => {
      // First sort by premium status
      if (a.isPremiumUser && !b.isPremiumUser) return -1;
      if (!a.isPremiumUser && b.isPremiumUser) return 1;
      
      // If premium status is the same, sort by date (oldest first)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    
    return withdrawalsWithUserInfo;
  }
  
  async getAllWithdrawals(): Promise<Withdrawal[]> {
    if (!this.withdrawalsCollection) throw new Error("Database not initialized");
    
    const withdrawals = await this.withdrawalsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    return withdrawals.map(withdrawal => this.mapToWithdrawal(withdrawal));
  }
  
  async getProcessedWithdrawals(): Promise<Withdrawal[]> {
    if (!this.withdrawalsCollection) throw new Error("Database not initialized");
    
    const withdrawals = await this.withdrawalsCollection
      .find({ 
        status: { $in: ['approved', 'rejected'] }
      })
      .sort({ createdAt: -1 })
      .toArray();
    
    return withdrawals.map(withdrawal => this.mapToWithdrawal(withdrawal));
  }
  
  async deleteProcessedWithdrawals(): Promise<number> {
    if (!this.withdrawalsCollection) throw new Error("Database not initialized");
    
    const result = await this.withdrawalsCollection.deleteMany({
      status: { $in: ['approved', 'rejected'] }
    });
    
    return result.deletedCount;
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
    
    // Use MongoDB aggregation to get only the highest score for each user
    const scores = await this.gameScoresCollection.aggregate([
      { $match: { gameId } },
      { $sort: { score: -1, createdAt: -1 } }, // Sort by score descending and date descending
      { $group: { 
          _id: "$userId", 
          score: { $first: "$score" },
          coinsEarned: { $first: "$coinsEarned" },
          gameId: { $first: "$gameId" },
          userId: { $first: "$userId" },
          createdAt: { $first: "$createdAt" },
          id: { $first: "$id" }
        }
      },
      { $sort: { score: -1 } }, // Sort the grouped results by score again
      { $limit: limit }
    ]).toArray();
    
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
  
  async cleanupDuplicateGameScores(): Promise<{ deletedCount: number }> {
    if (!this.gameScoresCollection) throw new Error("Database not initialized");
    
    // Get all unique game IDs
    const games = await this.gameScoresCollection.distinct("gameId");
    let totalDeletedCount = 0;
    
    // Process cleanup for each game
    for (const gameId of games) {
      // Get all unique users who have played this game
      const users = await this.gameScoresCollection.distinct("userId", { gameId });
      
      // For each user, find their best score and delete the rest
      for (const userId of users) {
        // Find best score
        const bestScore = await this.gameScoresCollection
          .find({ gameId, userId })
          .sort({ score: -1 })
          .limit(1)
          .toArray();
          
        if (bestScore.length > 0) {
          // Delete all other scores for this user and game, keeping only the best one
          const result = await this.gameScoresCollection.deleteMany({
            gameId,
            userId,
            _id: { $ne: bestScore[0]._id }
          });
          
          totalDeletedCount += result.deletedCount;
        }
      }
    }
    
    console.log(`Cleaned up ${totalDeletedCount} duplicate game scores from database`);
    return { deletedCount: totalDeletedCount };
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

  private mapToPremiumPayment(doc: any): PremiumPayment {
    const { _id, ...paymentData } = doc;
    return paymentData as PremiumPayment;
  }

  // Premium operations
  async createPremiumPayment(data: {
    userId: number;
    amount: number;
    method: string;
    durationMonths: number;
    proofImage: string;
    notes?: string;
  }): Promise<PremiumPayment> {
    if (!this.premiumPaymentsCollection) throw new Error("Database not initialized");
    
    // Get the current max id
    const maxIdPayment = await this.premiumPaymentsCollection.find().sort({ id: -1 }).limit(1).toArray();
    const nextId = maxIdPayment.length > 0 ? maxIdPayment[0].id + 1 : 1;
    
    const payment: PremiumPayment = {
      id: nextId,
      userId: data.userId,
      amount: data.amount,
      method: data.method,
      durationMonths: data.durationMonths,
      proofImage: data.proofImage,
      notes: data.notes || null,
      status: 'pending',
      createdAt: new Date(),
      processedAt: null
    };
    
    await this.premiumPaymentsCollection.insertOne(payment);
    return payment;
  }

  async getPremiumPaymentsByUser(userId: number): Promise<PremiumPayment[]> {
    if (!this.premiumPaymentsCollection) throw new Error("Database not initialized");
    
    const payments = await this.premiumPaymentsCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    
    return payments.map(payment => this.mapToPremiumPayment(payment));
  }

  async getPendingPremiumPayments(): Promise<PremiumPayment[]> {
    if (!this.premiumPaymentsCollection) throw new Error("Database not initialized");
    
    const payments = await this.premiumPaymentsCollection
      .find({ status: 'pending' })
      .sort({ createdAt: 1 })
      .toArray();
    
    return payments.map(payment => this.mapToPremiumPayment(payment));
  }
  
  async getAllPremiumPayments(): Promise<PremiumPayment[]> {
    if (!this.premiumPaymentsCollection) throw new Error("Database not initialized");
    
    const payments = await this.premiumPaymentsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    return payments.map(payment => this.mapToPremiumPayment(payment));
  }

  async updatePremiumPaymentStatus(
    id: number,
    status: string,
    processedAt = new Date()
  ): Promise<PremiumPayment | undefined> {
    if (!this.premiumPaymentsCollection) throw new Error("Database not initialized");
    
    const result = await this.premiumPaymentsCollection.findOneAndUpdate(
      { id },
      { $set: { status, processedAt } },
      { returnDocument: 'after' }
    );
    
    return result ? this.mapToPremiumPayment(result) : undefined;
  }
  
  async getProcessedPremiumPayments(): Promise<PremiumPayment[]> {
    if (!this.premiumPaymentsCollection) throw new Error("Database not initialized");
    
    const payments = await this.premiumPaymentsCollection
      .find({ 
        status: { $in: ['approved', 'rejected'] }
      })
      .sort({ createdAt: -1 })
      .toArray();
    
    return payments.map(payment => this.mapToPremiumPayment(payment));
  }
  
  async deleteProcessedPremiumPayments(): Promise<number> {
    if (!this.premiumPaymentsCollection) throw new Error("Database not initialized");
    
    const result = await this.premiumPaymentsCollection.deleteMany({
      status: { $in: ['approved', 'rejected'] }
    });
    
    return result.deletedCount;
  }

  async updateUserPremiumStatus(
    userId: number,
    isPremium: boolean,
    premiumUntil?: Date,
    premiumStarted?: Date
  ): Promise<User | undefined> {
    if (!this.usersCollection) throw new Error("Database not initialized");
    
    const updates: any = { isPremium };
    if (premiumUntil) updates.premiumUntil = premiumUntil;
    if (premiumStarted) updates.premiumStarted = premiumStarted;
    
    const result = await this.usersCollection.findOneAndUpdate(
      { id: userId },
      { $set: updates },
      { returnDocument: 'after' }
    );
    
    return result ? this.mapToUser(result) : undefined;
  }

  // Support Ticket operations
  async createSupportTicket(data: {
    userId?: number;
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<SupportTicket> {
    if (!this.supportTicketsCollection) throw new Error("Database not initialized");
    
    // Get the current max id
    const maxIdTicket = await this.supportTicketsCollection.find().sort({ id: -1 }).limit(1).toArray();
    const nextId = maxIdTicket.length > 0 ? maxIdTicket[0].id + 1 : 1;
    
    const now = new Date();
    
    // Check if user is premium to set priority
    let isPremium = false;
    let priority = 0;
    
    if (data.userId) {
      const user = await this.getUser(data.userId);
      if (user && user.isPremium) {
        isPremium = true;
        priority = 10; // Higher priority for premium users
      }
    }
    
    // Create ticket object with MongoDB-specific fields
    const ticket = {
      id: nextId,
      userId: data.userId ?? null,
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      status: 'open',
      adminResponse: null,
      createdAt: now,
      updatedAt: now,
      isPremium, // Add this field for filtering/sorting
      priority   // Add this field for sorting
    };
    
    await this.supportTicketsCollection.insertOne(ticket);
    return ticket;
  }
  
  async getSupportTickets(status?: string): Promise<SupportTicket[]> {
    if (!this.supportTicketsCollection) throw new Error("Database not initialized");
    
    const query = status ? { status } : {};
    
    const tickets = await this.supportTicketsCollection
      .find(query)
      .sort({ priority: -1, createdAt: -1 }) // Sort by priority (premium users) first, then by date
      .toArray();
    
    return tickets.map(ticket => this.mapToSupportTicket(ticket));
  }
  
  async getSupportTicketsByUser(userId: number): Promise<SupportTicket[]> {
    if (!this.supportTicketsCollection) throw new Error("Database not initialized");
    
    const tickets = await this.supportTicketsCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    
    return tickets.map(ticket => this.mapToSupportTicket(ticket));
  }
  
  async getSupportTicket(id: number): Promise<SupportTicket | undefined> {
    if (!this.supportTicketsCollection) throw new Error("Database not initialized");
    
    const ticket = await this.supportTicketsCollection.findOne({ id });
    return ticket ? this.mapToSupportTicket(ticket) : undefined;
  }
  
  async updateSupportTicket(
    id: number,
    updates: { 
      status?: string;
      adminResponse?: string;
    }
  ): Promise<SupportTicket | undefined> {
    if (!this.supportTicketsCollection) throw new Error("Database not initialized");
    
    const now = new Date();
    
    // Always update the updatedAt timestamp
    const updateData: any = {
      ...updates,
      updatedAt: now
    };
    
    // If status is being changed to 'closed', add closedAt timestamp
    if (updates.status === 'closed') {
      updateData.closedAt = now;
    }
    
    const result = await this.supportTicketsCollection.findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    return result ? this.mapToSupportTicket(result) : undefined;
  }

  private mapToSupportTicket(doc: any): SupportTicket {
    return { ...doc, _id: undefined };
  }

  // Delete closed tickets older than specified days
  async cleanupOldClosedTickets(days: number = 30): Promise<number> {
    if (!this.supportTicketsCollection) {
      await this.connect();
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const result = await this.supportTicketsCollection!.deleteMany({
      status: "closed",
      updatedAt: { $lt: cutoffDate }
    });
    
    return result.deletedCount;
  }
}