import { 
  users, bots, commands, activities, collaborators,
  type User, type InsertUser,
  type Bot, type InsertBot, type BotWithCommands, type BotWithCollaborators,
  type Command, type InsertCommand,
  type Activity, type InsertActivity, type ActivityWithBot,
  type Collaborator, type InsertCollaborator, type CollaboratorWithUser
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or } from "drizzle-orm";

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

  // Collaboration operations
  getBotCollaborators(botId: number): Promise<CollaboratorWithUser[]>;
  getBotsUserCanAccess(userId: number): Promise<BotWithCollaborators[]>;
  inviteCollaborator(collaboration: InsertCollaborator): Promise<Collaborator>;
  acceptCollaboratorInvite(collaboratorId: number): Promise<Collaborator | undefined>;
  removeCollaborator(collaboratorId: number): Promise<boolean>;
  updateCollaboratorRole(collaboratorId: number, role: string): Promise<Collaborator | undefined>;
  getUserRole(userId: number, botId: number): Promise<string | null>;
  canUserAccessBot(userId: number, botId: number, requiredRole?: string): Promise<boolean>;
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
    for (const user of this.users.values()) {
      if (user.discordId === discordId) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = { 
      id: this.currentUserId++,
      ...insertUser,
      avatar: insertUser.avatar ?? null,
      email: insertUser.email ?? null,
      guilds: insertUser.guilds ?? null,
      createdAt: new Date()
    };
    this.users.set(user.id, user);
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
    for (const bot of this.bots.values()) {
      if (bot.botId === botId) {
        return bot;
      }
    }
    return undefined;
  }

  async createBot(insertBot: InsertBot): Promise<Bot> {
    const bot: Bot = { 
      id: this.currentBotId++,
      ...insertBot,
      avatar: insertBot.avatar ?? null,
      isOnline: insertBot.isOnline ?? false,
      isDeployed: false,
      serverCount: insertBot.serverCount ?? 0,
      commandCount: insertBot.commandCount ?? 0,
      lastHeartbeat: null,
      deploymentUrl: null,
      lastSeen: null,
      updatedAt: new Date(),
      createdAt: new Date()
    };
    this.bots.set(bot.id, bot);
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
    const command: Command = { 
      id: this.currentCommandId++,
      ...insertCommand,
      usage: insertCommand.usage ?? 0,
      isActive: insertCommand.isActive ?? true,
      createdAt: new Date()
    };
    this.commands.set(command.id, command);
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
    const userBotIds = new Set(userBots.map(bot => bot.id));
    
    const activities = Array.from(this.activities.values())
      .filter(activity => userBotIds.has(activity.botId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    return activities.map(activity => ({
      ...activity,
      bot: this.bots.get(activity.botId)!
    }));
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const activity: Activity = { 
      id: this.currentActivityId++,
      ...insertActivity,
      createdAt: new Date()
    };
    this.activities.set(activity.id, activity);
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

  // Stub methods for collaboration (MemStorage doesn't support collaboration)
  async getBotCollaborators(botId: number): Promise<CollaboratorWithUser[]> {
    return [];
  }

  async getBotsUserCanAccess(userId: number): Promise<BotWithCollaborators[]> {
    const userBots = await this.getBotsByUserId(userId);
    return userBots.map(bot => ({
      ...bot,
      collaborators: [],
      userRole: "owner"
    }));
  }

  async inviteCollaborator(insertCollaborator: InsertCollaborator): Promise<Collaborator> {
    throw new Error("Collaboration not supported in MemStorage");
  }

  async acceptCollaboratorInvite(collaboratorId: number): Promise<Collaborator | undefined> {
    throw new Error("Collaboration not supported in MemStorage");
  }

  async removeCollaborator(collaboratorId: number): Promise<boolean> {
    throw new Error("Collaboration not supported in MemStorage");
  }

  async updateCollaboratorRole(collaboratorId: number, role: string): Promise<Collaborator | undefined> {
    throw new Error("Collaboration not supported in MemStorage");
  }

  async getUserRole(userId: number, botId: number): Promise<string | null> {
    const bot = await this.getBot(botId);
    return bot?.userId === userId ? "owner" : null;
  }

  async canUserAccessBot(userId: number, botId: number, requiredRole?: string): Promise<boolean> {
    const bot = await this.getBot(botId);
    return bot?.userId === userId;
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
      .values(insertUser)
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
      .values(insertBot)
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
    return (result.rowCount || 0) > 0;
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
      .values(insertCommand)
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
    return (result.rowCount || 0) > 0;
  }

  async getActivitiesByUserId(userId: number, limit: number = 10): Promise<ActivityWithBot[]> {
    const userBots = await this.getBotsUserCanAccess(userId);
    const userBotIds = userBots.map(bot => bot.id);
    
    if (userBotIds.length === 0) return [];

    const result = await db
      .select({
        activity: activities,
        bot: bots
      })
      .from(activities)
      .innerJoin(bots, eq(activities.botId, bots.id))
      .where(or(...userBotIds.map(id => eq(activities.botId, id))))
      .orderBy(activities.createdAt)
      .limit(limit);

    return result.map(({ activity, bot }) => ({
      ...activity,
      bot
    }));
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
    const userBots = await this.getBotsUserCanAccess(userId);
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

  async getBotCollaborators(botId: number): Promise<CollaboratorWithUser[]> {
    const result = await db
      .select({
        collaborator: collaborators,
        user: users,
        invitedByUser: {
          id: users.id,
          username: users.username,
          avatar: users.avatar,
          discriminator: users.discriminator,
        }
      })
      .from(collaborators)
      .innerJoin(users, eq(collaborators.userId, users.id))
      .innerJoin(
        { invitedBy: users }, 
        eq(collaborators.invitedBy, users.id)
      )
      .where(eq(collaborators.botId, botId));

    return result.map(({ collaborator, user, invitedByUser }) => ({
      ...collaborator,
      user,
      invitedByUser: invitedByUser as User
    }));
  }

  async getBotsUserCanAccess(userId: number): Promise<BotWithCollaborators[]> {
    // Get bots owned by user
    const ownedBots = await db.select().from(bots).where(eq(bots.userId, userId));
    
    // Get bots user collaborates on
    const collaboratedBots = await db
      .select({ bot: bots })
      .from(collaborators)
      .innerJoin(bots, eq(collaborators.botId, bots.id))
      .where(and(
        eq(collaborators.userId, userId),
        eq(collaborators.status, "accepted")
      ));

    const allBots = [
      ...ownedBots.map(bot => ({ ...bot, userRole: "owner" })),
      ...collaboratedBots.map(({ bot }) => ({ ...bot, userRole: undefined }))
    ];

    // Get collaborators for each bot
    const botsWithCollaborators = await Promise.all(
      allBots.map(async (bot) => {
        const collaboratorsList = await this.getBotCollaborators(bot.id);
        const userCollaboration = collaboratorsList.find(c => c.userId === userId);
        
        return {
          ...bot,
          collaborators: collaboratorsList,
          userRole: bot.userRole || userCollaboration?.role || "owner"
        };
      })
    );

    return botsWithCollaborators;
  }

  async inviteCollaborator(insertCollaborator: InsertCollaborator): Promise<Collaborator> {
    const [collaborator] = await db
      .insert(collaborators)
      .values(insertCollaborator)
      .returning();
    return collaborator;
  }

  async acceptCollaboratorInvite(collaboratorId: number): Promise<Collaborator | undefined> {
    const [collaborator] = await db
      .update(collaborators)
      .set({ 
        status: "accepted",
        acceptedAt: new Date()
      })
      .where(eq(collaborators.id, collaboratorId))
      .returning();
    return collaborator || undefined;
  }

  async removeCollaborator(collaboratorId: number): Promise<boolean> {
    const result = await db.delete(collaborators).where(eq(collaborators.id, collaboratorId));
    return (result.rowCount || 0) > 0;
  }

  async updateCollaboratorRole(collaboratorId: number, role: string): Promise<Collaborator | undefined> {
    const [collaborator] = await db
      .update(collaborators)
      .set({ role })
      .where(eq(collaborators.id, collaboratorId))
      .returning();
    return collaborator || undefined;
  }

  async getUserRole(userId: number, botId: number): Promise<string | null> {
    // Check if user is the owner
    const [bot] = await db.select().from(bots).where(and(
      eq(bots.id, botId),
      eq(bots.userId, userId)
    ));
    
    if (bot) return "owner";

    // Check if user is a collaborator
    const [collaborator] = await db
      .select()
      .from(collaborators)
      .where(and(
        eq(collaborators.botId, botId),
        eq(collaborators.userId, userId),
        eq(collaborators.status, "accepted")
      ));

    return collaborator?.role || null;
  }

  async canUserAccessBot(userId: number, botId: number, requiredRole?: string): Promise<boolean> {
    const userRole = await this.getUserRole(userId, botId);
    if (!userRole) return false;

    if (!requiredRole) return true;

    const roleHierarchy = ["viewer", "editor", "admin", "owner"];
    const userRoleIndex = roleHierarchy.indexOf(userRole);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

    return userRoleIndex >= requiredRoleIndex;
  }
}

export const storage = new MemStorage();