import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Play, Square, Save, FileCode, Terminal, Settings, Key, Eye, EyeOff, ExternalLink } from "lucide-react";
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
  const [showToken, setShowToken] = useState(false);
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
              {/* Block-style Code Editor */}
              <div className="bg-[#1e1f22] border border-[#40444b] rounded-lg overflow-hidden">
                <div className="bg-[#2f3136] px-4 py-2 border-b border-[#40444b] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-[#b9bbbe] text-sm ml-3">index.js</span>
                  </div>
                  <div className="text-xs text-[#b9bbbe]">JavaScript</div>
                </div>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#282a2e] border-r border-[#40444b] flex flex-col text-[#6d7075] text-xs font-mono">
                    {code.split('\n').map((_, index) => (
                      <div key={index} className="px-2 py-0.5 text-right leading-6">
                        {index + 1}
                      </div>
                    ))}
                  </div>
                  <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter your Discord bot code here..."
                    className="min-h-[500px] pl-16 pr-4 py-3 bg-transparent border-none text-[#d4d4d4] font-mono text-sm leading-6 resize-none focus:ring-0 focus:outline-none"
                    style={{ 
                      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, "Courier New", monospace',
                      fontSize: '14px',
                      lineHeight: '24px'
                    }}
                  />
                </div>
              </div>
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
          {/* Bot Setup Guide */}
          {!botToken && (
            <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Key className="w-6 h-6 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Setup Your Discord Bot</h3>
                </div>
                <p className="text-[#b9bbbe] mb-4">
                  Follow these simple steps to get your bot token and start hosting your Discord bot:
                </p>
                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <p className="text-white font-medium">Visit Discord Developer Portal</p>
                      <p className="text-sm text-[#b9bbbe]">Go to discord.com/developers/applications</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <p className="text-white font-medium">Create New Application</p>
                      <p className="text-sm text-[#b9bbbe]">Click "New Application" and give it a name</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <p className="text-white font-medium">Get Your Bot Token</p>
                      <p className="text-sm text-[#b9bbbe]">Go to "Bot" section and copy the token</p>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => window.open('https://discord.com/developers/applications', '_blank')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Discord Developer Portal
                </Button>
              </CardContent>
            </Card>
          )}

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
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="botName" className="text-white">Bot Name</Label>
                <Input
                  id="botName"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="My Awesome Bot"
                  className="bg-[#40444b] border-[#4f545c] text-white"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="botToken" className="text-white flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Discord Bot Token
                </Label>
                <div className="relative">
                  <Input
                    id="botToken"
                    type={showToken ? "text" : "password"}
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="Paste your bot token here..."
                    className="bg-[#40444b] border-[#4f545c] text-white pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-[#4f545c]"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? (
                      <EyeOff className="w-4 h-4 text-[#b9bbbe]" />
                    ) : (
                      <Eye className="w-4 h-4 text-[#b9bbbe]" />
                    )}
                  </Button>
                </div>
                {botToken && (
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    Token configured successfully
                  </div>
                )}
                <div className="bg-[#40444b] p-3 rounded-lg">
                  <p className="text-xs text-[#b9bbbe] mb-2">
                    <strong>Keep your token secure:</strong>
                  </p>
                  <ul className="text-xs text-[#b9bbbe] space-y-1">
                    <li>• Never share your bot token publicly</li>
                    <li>• Regenerate if compromised</li>
                    <li>• Only paste from Discord Developer Portal</li>
                  </ul>
                </div>
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
              </CardHeader>
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