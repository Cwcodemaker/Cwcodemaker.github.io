import { 
  users, bots, commands, activities,
  type User, type InsertUser,
  type Bot, type InsertBot, type BotWithCommands,
  type Command, type InsertCommand,
  type Activity, type InsertActivity, type ActivityWithBot
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Bot operations
  getBotsByUserId(userId: number): Promise<Bot[]>;
  getBot(id: number): Promise<Bot | undefined>;
  getBotByBotId(botId: string): Promise<Bot | undefined>;
  createBot(bot: InsertBot): Promise<Bot>;
  updateBot(id: number, updates: Partial<Bot>): Promise<Bot | undefined>;
  deleteBot(id: number): Promise<boolean>;

  // Command operations
  getCommandsByBotId(botId: number): Promise<Command[]>;
  getCommand(id: number): Promise<Command | undefined>;
  createCommand(command: InsertCommand): Promise<Command>;
  updateCommand(id: number, updates: Partial<Command>): Promise<Command | undefined>;
  deleteCommand(id: number): Promise<boolean>;

  // Activity operations
  getActivitiesByUserId(userId: number, limit?: number): Promise<ActivityWithBot[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Dashboard stats
  getDashboardStats(userId: number): Promise<{
    totalBots: number;
    onlineBots: number;
    offlineBots: number;
    totalServers: number;
    totalCommands: number;
    uptime: string;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private bots: Map<number, Bot> = new Map();
  private commands: Map<number, Command> = new Map();
  private activities: Map<number, Activity> = new Map();
  private currentUserId: number = 1;
  private currentBotId: number = 1;
  private currentCommandId: number = 1;
  private currentActivityId: number = 1;

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.discordId === discordId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date() 
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

  async getBotsByUserId(userId: number): Promise<Bot[]> {
    return Array.from(this.bots.values()).filter(bot => bot.userId === userId);
  }

  async getBot(id: number): Promise<Bot | undefined> {
    return this.bots.get(id);
  }

  async getBotByBotId(botId: string): Promise<Bot | undefined> {
    return Array.from(this.bots.values()).find(bot => bot.botId === botId);
  }

  async createBot(insertBot: InsertBot): Promise<Bot> {
    const id = this.currentBotId++;
    const bot: Bot = { 
      ...insertBot, 
      id, 
      createdAt: new Date(),
      lastSeen: new Date()
    };
    this.bots.set(id, bot);
    return bot;
  }

  async updateBot(id: number, updates: Partial<Bot>): Promise<Bot | undefined> {
    const bot = this.bots.get(id);
    if (!bot) return undefined;
    
    const updatedBot = { ...bot, ...updates };
    this.bots.set(id, updatedBot);
    return updatedBot;
  }

  async deleteBot(id: number): Promise<boolean> {
    return this.bots.delete(id);
  }

  async getCommandsByBotId(botId: number): Promise<Command[]> {
    return Array.from(this.commands.values()).filter(command => command.botId === botId);
  }

  async getCommand(id: number): Promise<Command | undefined> {
    return this.commands.get(id);
  }

  async createCommand(insertCommand: InsertCommand): Promise<Command> {
    const id = this.currentCommandId++;
    const command: Command = { 
      ...insertCommand, 
      id, 
      createdAt: new Date() 
    };
    this.commands.set(id, command);
    return command;
  }

  async updateCommand(id: number, updates: Partial<Command>): Promise<Command | undefined> {
    const command = this.commands.get(id);
    if (!command) return undefined;
    
    const updatedCommand = { ...command, ...updates };
    this.commands.set(id, updatedCommand);
    return updatedCommand;
  }

  async deleteCommand(id: number): Promise<boolean> {
    return this.commands.delete(id);
  }

  async getActivitiesByUserId(userId: number, limit: number = 10): Promise<ActivityWithBot[]> {
    const userBots = await this.getBotsByUserId(userId);
    const userBotIds = userBots.map(bot => bot.id);
    
    const userActivities = Array.from(this.activities.values())
      .filter(activity => userBotIds.includes(activity.botId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    return userActivities.map(activity => {
      const bot = userBots.find(b => b.id === activity.botId)!;
      return { ...activity, bot };
    });
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const activity: Activity = { 
      ...insertActivity, 
      id, 
      createdAt: new Date() 
    };
    this.activities.set(id, activity);
    return activity;
  }

  async getDashboardStats(userId: number): Promise<{
    totalBots: number;
    onlineBots: number;
    offlineBots: number;
    totalServers: number;
    totalCommands: number;
    uptime: string;
  }> {
    const userBots = await this.getBotsByUserId(userId);
    const onlineBots = userBots.filter(bot => bot.isOnline).length;
    const totalServers = userBots.reduce((sum, bot) => sum + bot.serverCount, 0);
    const totalCommands = userBots.reduce((sum, bot) => sum + bot.commandCount, 0);

    return {
      totalBots: userBots.length,
      onlineBots,
      offlineBots: userBots.length - onlineBots,
      totalServers,
      totalCommands,
      uptime: "99.8%"
    };
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.discordId, discordId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, avatar: insertUser.avatar || null })
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getBotsByUserId(userId: number): Promise<Bot[]> {
    return await db.select().from(bots).where(eq(bots.userId, userId));
  }

  async getBot(id: number): Promise<Bot | undefined> {
    const [bot] = await db.select().from(bots).where(eq(bots.id, id));
    return bot || undefined;
  }

  async getBotByBotId(botId: string): Promise<Bot | undefined> {
    const [bot] = await db.select().from(bots).where(eq(bots.botId, botId));
    return bot || undefined;
  }

  async createBot(insertBot: InsertBot): Promise<Bot> {
    const [bot] = await db
      .insert(bots)
      .values({
        ...insertBot,
        avatar: insertBot.avatar || null,
        isOnline: insertBot.isOnline ?? false,
        serverCount: insertBot.serverCount ?? 0,
        commandCount: insertBot.commandCount ?? 0
      })
      .returning();
    return bot;
  }

  async updateBot(id: number, updates: Partial<Bot>): Promise<Bot | undefined> {
    const [bot] = await db
      .update(bots)
      .set(updates)
      .where(eq(bots.id, id))
      .returning();
    return bot || undefined;
  }

  async deleteBot(id: number): Promise<boolean> {
    const result = await db.delete(bots).where(eq(bots.id, id));
    return result.rowCount > 0;
  }

  async getCommandsByBotId(botId: number): Promise<Command[]> {
    return await db.select().from(commands).where(eq(commands.botId, botId));
  }

  async getCommand(id: number): Promise<Command | undefined> {
    const [command] = await db.select().from(commands).where(eq(commands.id, id));
    return command || undefined;
  }

  async createCommand(insertCommand: InsertCommand): Promise<Command> {
    const [command] = await db
      .insert(commands)
      .values({
        ...insertCommand,
        usage: insertCommand.usage ?? 0,
        isActive: insertCommand.isActive ?? true
      })
      .returning();
    return command;
  }

  async updateCommand(id: number, updates: Partial<Command>): Promise<Command | undefined> {
    const [command] = await db
      .update(commands)
      .set(updates)
      .where(eq(commands.id, id))
      .returning();
    return command || undefined;
  }

  async deleteCommand(id: number): Promise<boolean> {
    const result = await db.delete(commands).where(eq(commands.id, id));
    return result.rowCount > 0;
  }

  async getActivitiesByUserId(userId: number, limit: number = 10): Promise<ActivityWithBot[]> {
    const result = await db
      .select({
        activity: activities,
        bot: bots
      })
      .from(activities)
      .innerJoin(bots, eq(activities.botId, bots.id))
      .where(eq(bots.userId, userId))
      .orderBy(activities.createdAt)
      .limit(limit);

    return result.map(({ activity, bot }) => ({ ...activity, bot }));
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async getDashboardStats(userId: number): Promise<{
    totalBots: number;
    onlineBots: number;
    offlineBots: number;
    totalServers: number;
    totalCommands: number;
    uptime: string;
  }> {
    const userBots = await this.getBotsByUserId(userId);
    const onlineBots = userBots.filter(bot => bot.isOnline).length;
    const totalServers = userBots.reduce((sum, bot) => sum + bot.serverCount, 0);
    const totalCommands = userBots.reduce((sum, bot) => sum + bot.commandCount, 0);

    return {
      totalBots: userBots.length,
      onlineBots,
      offlineBots: userBots.length - onlineBots,
      totalServers,
      totalCommands,
      uptime: "99.8%"
    };
  }
}

export const storage = new DatabaseStorage();
