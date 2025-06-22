import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Square, Save, FileCode, Terminal, Settings, Key, Eye, EyeOff, ExternalLink, Plus, Trash2, MessageCircle, Users, Zap, Database, Settings2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BotCodeEditorProps {
  bot?: any;
  onSave?: (code: string) => void;
}

// Block types for visual coding
interface CodeBlock {
  id: string;
  type: 'event' | 'command' | 'action' | 'condition' | 'variable';
  title: string;
  content: string;
  icon: any;
  color: string;
  inputs?: { name: string; value: string; placeholder: string }[];
  connections?: string[];
}

const defaultBlocks: CodeBlock[] = [
  {
    id: 'ready-event',
    type: 'event',
    title: 'Bot Ready',
    content: 'client.once("ready", () => {\n  console.log(`Bot is online!`);\n});',
    icon: Zap,
    color: 'bg-green-600',
    inputs: []
  },
  {
    id: 'ping-command',
    type: 'command',
    title: 'Ping Command',
    content: 'if (message.content === "!ping") {\n  message.reply("Pong!");\n}',
    icon: MessageCircle,
    color: 'bg-blue-600',
    inputs: [
      { name: 'command', value: '!ping', placeholder: 'Command trigger' },
      { name: 'response', value: 'Pong!', placeholder: 'Bot response' }
    ]
  }
];

export function BotCodeEditor({ bot, onSave }: BotCodeEditorProps) {
  const [blocks, setBlocks] = useState<CodeBlock[]>(defaultBlocks);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [botName, setBotName] = useState(bot?.name || "");
  const [botToken, setBotToken] = useState(bot?.token || "");
  const [showToken, setShowToken] = useState(false);
  const [isRunning, setIsRunning] = useState(bot?.isOnline || false);
  const [viewMode, setViewMode] = useState<'blocks' | 'code'>('blocks');
  const [logs, setLogs] = useState<string[]>([
    "Bot editor initialized",
    "Ready to start coding your Discord bot!"
  ]);
  const { toast } = useToast();
  const dragItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);

  const generateCodeFromBlocks = useCallback(() => {
    let generatedCode = `// Generated Discord Bot Code
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

`;

    blocks.forEach(block => {
      if (block.type === 'event') {
        generatedCode += block.content + '\n\n';
      }
    });

    generatedCode += `client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
`;

    blocks.forEach(block => {
      if (block.type === 'command') {
        const command = block.inputs?.find(i => i.name === 'command')?.value || '!ping';
        const response = block.inputs?.find(i => i.name === 'response')?.value || 'Hello!';
        generatedCode += `  if (message.content === '${command}') {
    message.reply('${response}');
  }
  
`;
      }
    });

    generatedCode += `});

client.login(process.env.DISCORD_TOKEN);`;

    return generatedCode;
  }, [blocks]);

  const handleSave = () => {
    const code = generateCodeFromBlocks();
    if (onSave) {
      onSave(code);
    }
    toast({
      title: "Bot saved",
      description: "Your bot blocks have been saved successfully.",
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

  const addNewBlock = (type: CodeBlock['type']) => {
    const newBlock: CodeBlock = {
      id: `block-${Date.now()}`,
      type,
      title: type === 'command' ? 'New Command' : type === 'event' ? 'New Event' : 'New Action',
      content: '',
      icon: type === 'command' ? MessageCircle : type === 'event' ? Zap : Settings2,
      color: type === 'command' ? 'bg-blue-600' : type === 'event' ? 'bg-green-600' : 'bg-purple-600',
      inputs: type === 'command' ? [
        { name: 'command', value: '!newcommand', placeholder: 'Command trigger' },
        { name: 'response', value: 'Hello!', placeholder: 'Bot response' }
      ] : []
    };
    setBlocks(prev => [...prev, newBlock]);
  };

  const deleteBlock = (blockId: string) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
    if (selectedBlock === blockId) {
      setSelectedBlock(null);
    }
  };

  const updateBlockInput = (blockId: string, inputName: string, value: string) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, inputs: block.inputs?.map(input => 
            input.name === inputName ? { ...input, value } : input
          ) }
        : block
    ));
  };

  const handleDragStart = (blockId: string) => {
    dragItem.current = blockId;
  };

  const handleDragOver = (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    dragOverItem.current = blockId;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragItem.current || !dragOverItem.current) return;

    const dragIndex = blocks.findIndex(block => block.id === dragItem.current);
    const dropIndex = blocks.findIndex(block => block.id === dragOverItem.current);

    const newBlocks = [...blocks];
    const draggedBlock = newBlocks[dragIndex];
    newBlocks.splice(dragIndex, 1);
    newBlocks.splice(dropIndex, 0, draggedBlock);

    setBlocks(newBlocks);
    dragItem.current = null;
    dragOverItem.current = null;
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
            Block Editor
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileCode className="w-5 h-5" />
                    Visual Block Editor
                  </CardTitle>
                  <CardDescription className="text-[#b9bbbe]">
                    Drag and drop blocks to build your Discord bot without coding.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setViewMode(viewMode === 'blocks' ? 'code' : 'blocks')}
                    variant="outline"
                    size="sm"
                  >
                    {viewMode === 'blocks' ? 'View Code' : 'View Blocks'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {viewMode === 'blocks' ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[500px]">
                  {/* Block Palette */}
                  <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-white font-medium">Add Blocks</h3>
                    <div className="space-y-2">
                      <Button
                        onClick={() => addNewBlock('event')}
                        className="w-full justify-start bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Event Block
                      </Button>
                      <Button
                        onClick={() => addNewBlock('command')}
                        className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Command Block
                      </Button>
                      <Button
                        onClick={() => addNewBlock('action')}
                        className="w-full justify-start bg-purple-600 hover:bg-purple-700"
                        size="sm"
                      >
                        <Settings2 className="w-4 h-4 mr-2" />
                        Action Block
                      </Button>
                    </div>
                  </div>

                  {/* Block Canvas */}
                  <div className="lg:col-span-3">
                    <ScrollArea className="h-[500px] bg-[#1e1f22] border border-[#40444b] rounded-lg p-4">
                      <div className="space-y-3">
                        {blocks.map((block) => {
                          const IconComponent = block.icon;
                          return (
                            <div
                              key={block.id}
                              draggable
                              onDragStart={() => handleDragStart(block.id)}
                              onDragOver={(e) => handleDragOver(e, block.id)}
                              onDrop={handleDrop}
                              onClick={() => setSelectedBlock(block.id)}
                              className={`relative group cursor-move p-4 rounded-lg border-2 transition-all ${
                                selectedBlock === block.id 
                                  ? 'border-blue-500 bg-[#2f3136]' 
                                  : 'border-[#40444b] bg-[#36393f] hover:border-[#5865f2]'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 ${block.color} rounded-lg flex items-center justify-center`}>
                                  <IconComponent className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-white font-medium">{block.title}</h4>
                                  <p className="text-[#b9bbbe] text-sm">{block.type.charAt(0).toUpperCase() + block.type.slice(1)} Block</p>
                                  
                                  {block.inputs && block.inputs.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                      {block.inputs.map((input) => (
                                        <div key={input.name}>
                                          <Label className="text-xs text-[#b9bbbe] capitalize">{input.name}</Label>
                                          <Input
                                            value={input.value}
                                            onChange={(e) => updateBlockInput(block.id, input.name, e.target.value)}
                                            placeholder={input.placeholder}
                                            className="mt-1 bg-[#40444b] border-[#4f545c] text-white text-sm"
                                            size="sm"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteBlock(block.id);
                                  }}
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                        
                        {blocks.length === 0 && (
                          <div className="text-center py-12">
                            <FileCode className="w-12 h-12 text-[#6d7075] mx-auto mb-4" />
                            <p className="text-[#b9bbbe]">No blocks yet. Add your first block from the palette!</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              ) : (
                <div className="bg-[#1e1f22] border border-[#40444b] rounded-lg overflow-hidden">
                  <div className="bg-[#2f3136] px-4 py-2 border-b border-[#40444b] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-[#b9bbbe] text-sm ml-3">generated-bot.js</span>
                    </div>
                    <div className="text-xs text-[#b9bbbe]">Generated Code</div>
                  </div>
                  <ScrollArea className="h-[500px]">
                    <pre className="p-4 text-[#d4d4d4] font-mono text-sm whitespace-pre-wrap">
                      {generateCodeFromBlocks()}
                    </pre>
                  </ScrollArea>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Bot
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