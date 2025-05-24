import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertBotSchema, insertCommandSchema, insertActivitySchema, insertCollaboratorSchema } from "@shared/schema";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "";
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || "http://localhost:5000/api/auth/callback";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time bot communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Map<string, WebSocket>();

  wss.on('connection', (ws, req) => {
    const userId = req.url?.split('userId=')[1];
    if (userId) {
      clients.set(userId, ws);
    }

    ws.on('close', () => {
      if (userId) {
        clients.delete(userId);
      }
    });

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'bot_status_update') {
          const { botId, isOnline, serverCount } = message.data;
          const bot = await storage.getBotByBotId(botId);
          
          if (bot) {
            await storage.updateBot(bot.id, { 
              isOnline, 
              serverCount,
              lastSeen: new Date()
            });

            // Create activity
            await storage.createActivity({
              botId: bot.id,
              type: isOnline ? 'online' : 'offline',
              message: `Bot ${isOnline ? 'came online' : 'went offline'}`
            });

            // Broadcast to user
            const userWs = clients.get(bot.userId.toString());
            if (userWs && userWs.readyState === WebSocket.OPEN) {
              userWs.send(JSON.stringify({
                type: 'bot_status_updated',
                data: { botId, isOnline, serverCount }
              }));
            }
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
  });

  // Discord OAuth routes
  app.get("/api/auth/discord", (req, res) => {
    const state = Math.random().toString(36).substring(7);
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20bot&state=${state}`;
    res.redirect(discordAuthUrl);
  });

  app.get("/api/auth/callback", async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ message: "No authorization code provided" });
    }

    try {
      // Exchange code for access token
      const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: DISCORD_CLIENT_ID,
          client_secret: DISCORD_CLIENT_SECRET,
          grant_type: "authorization_code",
          code: code as string,
          redirect_uri: DISCORD_REDIRECT_URI,
        }),
      });

      const tokenData = await tokenResponse.json();
      
      if (!tokenData.access_token) {
        throw new Error("Failed to get access token");
      }

      // Get user info
      const userResponse = await fetch("https://discord.com/api/users/@me", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      const userData = await userResponse.json();

      // Create or update user
      let user = await storage.getUserByDiscordId(userData.id);
      
      if (!user) {
        user = await storage.createUser({
          discordId: userData.id,
          username: userData.username,
          discriminator: userData.discriminator || "0000",
          avatar: userData.avatar,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
        });
      } else {
        user = await storage.updateUser(user.id, {
          username: userData.username,
          discriminator: userData.discriminator || "0000",
          avatar: userData.avatar,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
        });
      }

      // Set session
      (req as any).session = { userId: user!.id };
      
      res.redirect("/dashboard");
    } catch (error) {
      console.error("Discord OAuth error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = (req as any).session?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({
      id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      avatar: user.avatar,
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    (req as any).session = null;
    res.json({ message: "Logged out successfully" });
  });

  // Bot management routes
  app.get("/api/bots", async (req, res) => {
    const userId = (req as any).session?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const bots = await storage.getBotsByUserId(userId);
    res.json(bots);
  });

  app.post("/api/bots", async (req, res) => {
    const userId = (req as any).session?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const validatedData = insertBotSchema.parse({ ...req.body, userId });
      
      // Verify bot token with Discord API
      const botResponse = await fetch("https://discord.com/api/users/@me", {
        headers: {
          Authorization: `Bot ${validatedData.token}`,
        },
      });

      if (!botResponse.ok) {
        return res.status(400).json({ message: "Invalid bot token" });
      }

      const botData = await botResponse.json();
      
      const bot = await storage.createBot({
        ...validatedData,
        botId: botData.id,
        name: botData.username,
        avatar: botData.avatar,
      });

      // Create activity
      await storage.createActivity({
        botId: bot.id,
        type: 'deployment',
        message: 'Bot was connected successfully'
      });

      res.json(bot);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/bots/:id", async (req, res) => {
    const userId = (req as any).session?.userId;
    const botId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const bot = await storage.getBot(botId);
    
    if (!bot || bot.userId !== userId) {
      return res.status(404).json({ message: "Bot not found" });
    }

    await storage.deleteBot(botId);
    res.json({ message: "Bot deleted successfully" });
  });

  // Command management routes
  app.get("/api/bots/:botId/commands", async (req, res) => {
    const userId = (req as any).session?.userId;
    const botId = parseInt(req.params.botId);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const bot = await storage.getBot(botId);
    
    if (!bot || bot.userId !== userId) {
      return res.status(404).json({ message: "Bot not found" });
    }

    const commands = await storage.getCommandsByBotId(botId);
    res.json(commands);
  });

  app.post("/api/bots/:botId/commands", async (req, res) => {
    const userId = (req as any).session?.userId;
    const botId = parseInt(req.params.botId);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const bot = await storage.getBot(botId);
    
    if (!bot || bot.userId !== userId) {
      return res.status(404).json({ message: "Bot not found" });
    }

    try {
      const validatedData = insertCommandSchema.parse({ ...req.body, botId });
      const command = await storage.createCommand(validatedData);
      res.json(command);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    const userId = (req as any).session?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const stats = await storage.getDashboardStats(userId);
    res.json(stats);
  });

  // Activities
  app.get("/api/activities", async (req, res) => {
    const userId = (req as any).session?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const activities = await storage.getActivitiesByUserId(userId, 10);
    res.json(activities);
  });

  // Collaboration endpoints
  
  // Get bot collaborators
  app.get("/api/bots/:botId/collaborators", async (req, res) => {
    const userId = (req as any).session?.userId;
    const botId = parseInt(req.params.botId);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Check if user can access this bot
    const canAccess = await storage.canUserAccessBot(userId, botId, "viewer");
    if (!canAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const collaborators = await storage.getBotCollaborators(botId);
      res.json(collaborators);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Invite collaborator
  app.post("/api/bots/:botId/collaborators", async (req, res) => {
    const userId = (req as any).session?.userId;
    const botId = parseInt(req.params.botId);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Check if user can manage this bot (admin or owner only)
    const canManage = await storage.canUserAccessBot(userId, botId, "admin");
    if (!canManage) {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      // Find user by Discord username
      const targetUser = await storage.getUserByDiscordId(req.body.discordId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const validatedData = insertCollaboratorSchema.parse({
        botId,
        userId: targetUser.id,
        role: req.body.role,
        invitedBy: userId,
        status: "pending"
      });

      const collaborator = await storage.inviteCollaborator(validatedData);
      res.json(collaborator);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Accept collaboration invite
  app.put("/api/collaborators/:collaboratorId/accept", async (req, res) => {
    const userId = (req as any).session?.userId;
    const collaboratorId = parseInt(req.params.collaboratorId);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const collaborator = await storage.acceptCollaboratorInvite(collaboratorId);
      if (!collaborator) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      res.json(collaborator);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update collaborator role
  app.put("/api/collaborators/:collaboratorId/role", async (req, res) => {
    const userId = (req as any).session?.userId;
    const collaboratorId = parseInt(req.params.collaboratorId);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const collaborator = await storage.updateCollaboratorRole(collaboratorId, req.body.role);
      if (!collaborator) {
        return res.status(404).json({ message: "Collaborator not found" });
      }
      res.json(collaborator);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Remove collaborator
  app.delete("/api/collaborators/:collaboratorId", async (req, res) => {
    const userId = (req as any).session?.userId;
    const collaboratorId = parseInt(req.params.collaboratorId);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const success = await storage.removeCollaborator(collaboratorId);
      if (!success) {
        return res.status(404).json({ message: "Collaborator not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
