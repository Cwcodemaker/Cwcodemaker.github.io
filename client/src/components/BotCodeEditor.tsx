import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Save, FileCode, Terminal, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BotCodeEditorProps {
  bot?: any;
  onSave?: (code: string) => void;
}

const defaultBotCode = `// Discord.js Bot Template
const { Client, GatewayIntentBits, Collection } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Bot ready event
client.once('ready', () => {
  console.log(\`✅ \${client.user.tag} is now online!\`);
  client.user.setActivity('DB 14 Hosting', { type: 'PLAYING' });
});

// Message handling
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  // Ping command
  if (message.content === '!ping') {
    const latency = Date.now() - message.createdTimestamp;
    message.reply(\`🏓 Pong! Latency: \${latency}ms\`);
  }
  
  // Hello command
  if (message.content === '!hello') {
    message.reply(\`👋 Hello \${message.author.username}! I'm hosted on DB 14!\`);
  }
  
  // Server info command
  if (message.content === '!serverinfo') {
    const embed = {
      title: '📊 Server Information',
      fields: [
        { name: 'Server Name', value: message.guild.name, inline: true },
        { name: 'Member Count', value: message.guild.memberCount.toString(), inline: true },
        { name: 'Created', value: message.guild.createdAt.toDateString(), inline: true },
      ],
      color: 0x5865f2,
    };
    message.reply({ embeds: [embed] });
  }
});

// Error handling
client.on('error', console.error);

// Login with bot token
client.login(process.env.DISCORD_TOKEN);`;

export function BotCodeEditor({ bot, onSave }: BotCodeEditorProps) {
  const [code, setCode] = useState(bot?.code || defaultBotCode);
  const [botName, setBotName] = useState(bot?.name || "");
  const [botToken, setBotToken] = useState(bot?.token || "");
  const [isRunning, setIsRunning] = useState(bot?.isOnline || false);
  const [logs, setLogs] = useState<string[]>([
    "Bot editor initialized",
    "Ready to start coding your Discord bot!"
  ]);
  const { toast } = useToast();

  const handleSave = () => {
    if (onSave) {
      onSave(code);
    }
    toast({
      title: "Code saved",
      description: "Your bot code has been saved successfully.",
    });
  };

  const handleStart = () => {
    if (!botToken.trim()) {
      toast({
        title: "Bot token required",
        description: "Please enter your Discord bot token to start the bot.",
        variant: "destructive",
      });
      return;
    }
    
    setIsRunning(true);
    setLogs(prev => [...prev, `Starting bot: ${botName}...`, "Bot is now online!"]);
    toast({
      title: "Bot started",
      description: `${botName} is now running on DB 14!`,
    });
  };

  const handleStop = () => {
    setIsRunning(false);
    setLogs(prev => [...prev, "Stopping bot...", "Bot has been stopped."]);
    toast({
      title: "Bot stopped",
      description: `${botName} has been stopped.`,
    });
  };

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-49), `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Bot Code Editor</h2>
          <p className="text-[#b9bbbe]">Write and host your Discord bot with JavaScript</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isRunning ? "default" : "secondary"} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500' : 'bg-gray-500'}`} />
            {isRunning ? "Online" : "Offline"}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="editor" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <FileCode className="w-4 h-4" />
            Code Editor
          </TabsTrigger>
          <TabsTrigger value="console" className="flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            Console
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Bot Settings
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileCode className="w-4 h-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          <Card className="bg-[#2f3136] border-[#40444b]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileCode className="w-5 h-5" />
                JavaScript Code Editor
              </CardTitle>
              <CardDescription className="text-[#b9bbbe]">
                Write your Discord bot code here. Use Discord.js library for bot functionality.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter your Discord bot code here..."
                className="min-h-[400px] bg-[#40444b] border-[#4f545c] text-white font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Code
                </Button>
                {!isRunning ? (
                  <Button onClick={handleStart} className="bg-green-600 hover:bg-green-700">
                    <Play className="w-4 h-4 mr-2" />
                    Start Bot
                  </Button>
                ) : (
                  <Button onClick={handleStop} variant="destructive">
                    <Square className="w-4 h-4 mr-2" />
                    Stop Bot
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="console" className="space-y-4">
          <Card className="bg-[#2f3136] border-[#40444b]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                Bot Console
              </CardTitle>
              <CardDescription className="text-[#b9bbbe]">
                Real-time logs and output from your Discord bot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-[#1e1e1e] p-4 rounded-lg min-h-[300px] max-h-[400px] overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="text-green-400 font-mono text-sm mb-1">
                    {log}
                  </div>
                ))}
              </div>
              <Button 
                onClick={() => setLogs([])} 
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                Clear Console
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="bg-[#2f3136] border-[#40444b]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Bot Configuration
              </CardTitle>
              <CardDescription className="text-[#b9bbbe]">
                Configure your Discord bot settings and token
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="botName" className="text-white">Bot Name</Label>
                <Input
                  id="botName"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="Enter your bot name"
                  className="bg-[#40444b] border-[#4f545c] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="botToken" className="text-white">Discord Bot Token</Label>
                <Input
                  id="botToken"
                  type="password"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="Enter your Discord bot token"
                  className="bg-[#40444b] border-[#4f545c] text-white"
                />
                <p className="text-xs text-[#b9bbbe]">
                  Get your bot token from the Discord Developer Portal
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4">
            <Card className="bg-[#2f3136] border-[#40444b]">
              <CardHeader>
                <CardTitle className="text-white">Basic Bot Template</CardTitle>
                <CardDescription className="text-[#b9bbbe]">
                  Simple Discord bot with basic commands
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setCode(defaultBotCode)}
                  variant="outline"
                >
                  Load Template
                </Button>
              </CardContent>
            </Card>
            
            <Card className="bg-[#2f3136] border-[#40444b]">
              <CardHeader>
                <CardTitle className="text-white">Advanced Bot Template</CardTitle>
                <CardDescription className="text-[#b9bbbe]">
                  Bot with slash commands, embeds, and moderation features
                </CardDescription>
              </CardContent>
              <CardContent>
                <Button 
                  onClick={() => {
                    const advancedCode = `// Advanced Discord Bot Template
// Includes slash commands, embeds, and moderation
const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once('ready', () => {
  console.log(\`🚀 Advanced bot \${client.user.tag} is ready!\`);
});

// Add your advanced bot logic here...`;
                    setCode(advancedCode);
                  }}
                  variant="outline"
                >
                  Load Advanced Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}