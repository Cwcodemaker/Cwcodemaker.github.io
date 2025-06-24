// Bot Runner Service - Manages Discord bot instances
import { spawn, ChildProcess } from 'child_process';
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { storage } from './storage';

interface BotInstance {
  id: number;
  process: ChildProcess;
  startTime: Date;
  restartCount: number;
}

class BotRunner {
  private runningBots: Map<number, BotInstance> = new Map();
  private botDirectory = join(process.cwd(), 'running-bots');

  constructor() {
    // Create bots directory if it doesn't exist
    if (!existsSync(this.botDirectory)) {
      mkdirSync(this.botDirectory, { recursive: true });
    }

    // Start heartbeat checker
    setInterval(() => this.checkHeartbeats(), 30000); // Every 30 seconds
  }

  async startBot(botId: number): Promise<boolean> {
    try {
      const bot = await storage.getBot(botId);
      if (!bot || !bot.token) {
        console.error(`Bot ${botId}: Missing token`);
        return false;
      }

      // Generate default code if none exists
      const defaultCode = bot.code || this.generateDefaultBotCode();
      
      console.log(`Starting bot ${botId}: ${bot.name} with token: ${bot.token.substring(0, 10)}...`);

      // Stop existing instance if running
      if (this.runningBots.has(botId)) {
        await this.stopBot(botId);
      }

      // Create bot directory
      const botDir = join(this.botDirectory, `bot-${botId}`);
      if (!existsSync(botDir)) {
        mkdirSync(botDir, { recursive: true });
      }

      // Write bot code to file
      const botFile = join(botDir, 'index.js');
      const packageFile = join(botDir, 'package.json');
      
      // Create package.json
      const packageJson = {
        name: `discord-bot-${botId}`,
        version: "1.0.0",
        main: "index.js",
        dependencies: {
          "discord.js": "^14.14.1"
        }
      };
      writeFileSync(packageFile, JSON.stringify(packageJson, null, 2));

      // Write bot code with token injection
      const botCode = defaultCode.replace('process.env.DISCORD_TOKEN', `"${bot.token}"`);
      const wrappedCode = `
// Auto-generated Discord bot for ${bot.name}
const { Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');

console.log('Starting Discord bot: ${bot.name}');

// Heartbeat function
setInterval(() => {
  try {
    const http = require('http');
    const postData = JSON.stringify({ botId: ${botId}, status: 'online' });
    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 5000,
      path: '/api/bot-heartbeat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = http.request(options);
    req.write(postData);
    req.end();
  } catch (error) {
    console.error('Heartbeat failed:', error);
  }
}, 25000); // Every 25 seconds

${botCode}
`;
      writeFileSync(botFile, wrappedCode);

      // Install dependencies
      console.log(`Installing dependencies for bot ${botId}...`);
      const npmInstall = spawn('npm', ['install'], { 
        cwd: botDir, 
        stdio: 'pipe'
      });

      await new Promise((resolve, reject) => {
        npmInstall.on('close', (code) => {
          if (code === 0) resolve(code);
          else reject(new Error(`npm install failed with code ${code}`));
        });
      });

      // Start bot process
      console.log(`Starting bot ${botId}: ${bot.name}`);
      const botProcess = spawn('node', ['index.js'], {
        cwd: botDir,
        stdio: 'pipe'
      });

      // Handle bot output
      botProcess.stdout?.on('data', (data) => {
        console.log(`Bot ${botId} stdout: ${data}`);
      });

      botProcess.stderr?.on('data', (data) => {
        console.error(`Bot ${botId} stderr: ${data}`);
      });

      botProcess.on('close', (code) => {
        console.log(`Bot ${botId} process closed with code ${code}`);
        this.runningBots.delete(botId);
        
        // Auto-restart if crash (up to 5 times)
        const instance = this.runningBots.get(botId);
        if (instance && instance.restartCount < 5 && code !== 0) {
          console.log(`Auto-restarting bot ${botId} (attempt ${instance.restartCount + 1})`);
          setTimeout(() => this.startBot(botId), 5000);
        }
      });

      // Store bot instance
      this.runningBots.set(botId, {
        id: botId,
        process: botProcess,
        startTime: new Date(),
        restartCount: 0
      });

      // Update bot status
      await storage.updateBot(botId, { 
        isOnline: true, 
        isDeployed: true,
        lastHeartbeat: new Date()
      });

      return true;
    } catch (error) {
      console.error(`Failed to start bot ${botId}:`, error);
      return false;
    }
  }

  private generateDefaultBotCode(): string {
    return `// Generated Discord Bot Code
const { Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
  ],
});

client.once('ready', () => {
  console.log(\`✅ \${client.user.tag} is now online!\`);
  client.user.setActivity('Powered by DB 14', { type: 'WATCHING' });
});

// Helper function to get mentioned user or user by ID
async function getTargetUser(message, args) {
  let target = message.mentions.users.first();
  if (!target && args[0]) {
    try {
      target = await client.users.fetch(args[0]);
    } catch (error) {
      return null;
    }
  }
  return target;
}

// Helper function to check permissions
function hasPermission(member, permission) {
  return member.permissions.has(PermissionFlagsBits[permission]);
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  
  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  
  if (command === 'ping') {
    message.reply('Pong! Bot is online and running 24/7 on DB 14!');
  }
  
  if (command === 'help') {
    message.reply('🤖 **Available Commands:**\\n\`!ping\` - Check if bot is online\\n\`!help\` - Show this help message\\n\\nThis bot is hosted 24/7 on DB 14!');
  }
  
});

client.login(process.env.DISCORD_TOKEN).catch(console.error);`;
  }

  async stopBot(botId: number): Promise<boolean> {
    try {
      const instance = this.runningBots.get(botId);
      if (instance) {
        instance.process.kill('SIGTERM');
        this.runningBots.delete(botId);
      }

      // Clean up bot directory
      const botDir = join(this.botDirectory, `bot-${botId}`);
      if (existsSync(botDir)) {
        rmSync(botDir, { recursive: true, force: true });
      }

      // Update bot status
      await storage.updateBot(botId, { 
        isOnline: false, 
        isDeployed: false,
        lastHeartbeat: null
      });

      console.log(`Stopped bot ${botId}`);
      return true;
    } catch (error) {
      console.error(`Failed to stop bot ${botId}:`, error);
      return false;
    }
  }

  async restartBot(botId: number): Promise<boolean> {
    await this.stopBot(botId);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    return await this.startBot(botId);
  }

  async updateBotHeartbeat(botId: number): Promise<void> {
    try {
      await storage.updateBot(botId, { 
        lastHeartbeat: new Date(),
        isOnline: true
      });
    } catch (error) {
      console.error(`Failed to update heartbeat for bot ${botId}:`, error);
    }
  }

  private async checkHeartbeats(): Promise<void> {
    const cutoffTime = new Date(Date.now() - 60000); // 1 minute ago
    
    for (const [botId, instance] of this.runningBots) {
      try {
        const bot = await storage.getBot(botId);
        if (bot?.lastHeartbeat && bot.lastHeartbeat < cutoffTime) {
          console.log(`Bot ${botId} missed heartbeat, marking as offline`);
          await storage.updateBot(botId, { isOnline: false });
        }
      } catch (error) {
        console.error(`Error checking heartbeat for bot ${botId}:`, error);
      }
    }
  }

  getBotStatus(botId: number): { isRunning: boolean; uptime?: number } {
    const instance = this.runningBots.get(botId);
    if (instance) {
      return {
        isRunning: true,
        uptime: Date.now() - instance.startTime.getTime()
      };
    }
    return { isRunning: false };
  }

  getRunningBots(): number[] {
    return Array.from(this.runningBots.keys());
  }
}

export const botRunner = new BotRunner();