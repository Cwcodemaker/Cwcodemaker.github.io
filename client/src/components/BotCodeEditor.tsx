import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Square, Save, FileCode, Terminal, Settings, Key, Eye, EyeOff, ExternalLink, Plus, Trash2, MessageCircle, Users, Zap, Database, Settings2, Shield, UserX, Volume, VolumeX, GitBranch, Filter, Clock, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BotCodeEditorProps {
  bot?: any;
  onSave?: (code: string) => void;
}

// Block types for visual coding
interface CodeBlock {
  id: string;
  type: 'event' | 'command' | 'moderation' | 'condition' | 'logic' | 'variable' | 'action';
  title: string;
  content: string;
  icon: any;
  color: string;
  inputs?: { name: string; value: string; placeholder: string; type?: 'text' | 'number' | 'select' | 'user' }[];
  options?: string[];
  connections?: string[];
  category: string;
}

const blockCategories = {
  events: [
    {
      id: 'ready-event',
      type: 'event' as const,
      title: 'Bot Ready',
      content: 'client.once("ready", () => {\n  console.log(`Bot is online!`);\n});',
      icon: Zap,
      color: 'bg-green-600',
      category: 'Events',
      inputs: []
    },
    {
      id: 'message-event',
      type: 'event' as const,
      title: 'Message Event',
      content: 'client.on("messageCreate", async (message) => {\n  // Handle message\n});',
      icon: MessageCircle,
      color: 'bg-green-600',
      category: 'Events',
      inputs: []
    }
  ],
  commands: [
    {
      id: 'basic-command',
      type: 'command' as const,
      title: 'Basic Command',
      content: '',
      icon: MessageCircle,
      color: 'bg-blue-600',
      category: 'Commands',
      inputs: [
        { name: 'command', value: '!ping', placeholder: 'Command trigger', type: 'text' as const },
        { name: 'response', value: 'Pong!', placeholder: 'Bot response', type: 'text' as const }
      ]
    }
  ],
  moderation: [
    {
      id: 'ban-user',
      type: 'moderation' as const,
      title: 'Ban User',
      content: '',
      icon: Shield,
      color: 'bg-red-600',
      category: 'Moderation',
      inputs: [
        { name: 'command', value: '!ban', placeholder: 'Ban command', type: 'text' as const },
        { name: 'reason', value: 'No reason provided', placeholder: 'Ban reason', type: 'text' as const },
        { name: 'deleteMessages', value: '7', placeholder: 'Days of messages to delete', type: 'number' as const }
      ]
    },
    {
      id: 'unban-user',
      type: 'moderation' as const,
      title: 'Unban User',
      content: '',
      icon: UserX,
      color: 'bg-orange-600',
      category: 'Moderation',
      inputs: [
        { name: 'command', value: '!unban', placeholder: 'Unban command', type: 'text' as const },
        { name: 'reason', value: 'Appeal approved', placeholder: 'Unban reason', type: 'text' as const }
      ]
    },
    {
      id: 'timeout-user',
      type: 'moderation' as const,
      title: 'Timeout/Mute User',
      content: '',
      icon: Volume,
      color: 'bg-yellow-600',
      category: 'Moderation',
      inputs: [
        { name: 'command', value: '!timeout', placeholder: 'Timeout command', type: 'text' as const },
        { name: 'duration', value: '10', placeholder: 'Duration in minutes', type: 'number' as const },
        { name: 'reason', value: 'No reason provided', placeholder: 'Timeout reason', type: 'text' as const }
      ]
    },
    {
      id: 'untimeout-user',
      type: 'moderation' as const,
      title: 'Remove Timeout',
      content: '',
      icon: VolumeX,
      color: 'bg-green-600',
      category: 'Moderation',
      inputs: [
        { name: 'command', value: '!untimeout', placeholder: 'Untimeout command', type: 'text' as const },
        { name: 'reason', value: 'Timeout removed', placeholder: 'Reason', type: 'text' as const }
      ]
    },
    {
      id: 'kick-user',
      type: 'moderation' as const,
      title: 'Kick User',
      content: '',
      icon: UserX,
      color: 'bg-purple-600',
      category: 'Moderation',
      inputs: [
        { name: 'command', value: '!kick', placeholder: 'Kick command', type: 'text' as const },
        { name: 'reason', value: 'No reason provided', placeholder: 'Kick reason', type: 'text' as const }
      ]
    }
  ],
  conditions: [
    {
      id: 'if-condition',
      type: 'condition' as const,
      title: 'If Statement',
      content: '',
      icon: GitBranch,
      color: 'bg-cyan-600',
      category: 'Logic',
      inputs: [
        { name: 'condition', value: 'message.member.permissions.has("ADMINISTRATOR")', placeholder: 'Condition to check', type: 'text' as const },
        { name: 'trueAction', value: 'message.reply("You have admin permissions!")', placeholder: 'Action if true', type: 'text' as const },
        { name: 'falseAction', value: 'message.reply("You need admin permissions!")', placeholder: 'Action if false', type: 'text' as const }
      ]
    },
    {
      id: 'permission-check',
      type: 'condition' as const,
      title: 'Permission Check',
      content: '',
      icon: Shield,
      color: 'bg-indigo-600',
      category: 'Logic',
      inputs: [
        { name: 'permission', value: 'BAN_MEMBERS', placeholder: 'Permission to check', type: 'select' as const },
        { name: 'errorMessage', value: 'You need permission to use this command!', placeholder: 'Error message', type: 'text' as const }
      ],
      options: ['ADMINISTRATOR', 'BAN_MEMBERS', 'KICK_MEMBERS', 'MANAGE_MESSAGES', 'MANAGE_ROLES', 'MANAGE_CHANNELS', 'MODERATE_MEMBERS']
    },
    {
      id: 'role-check',
      type: 'condition' as const,
      title: 'Role Check',
      content: '',
      icon: Star,
      color: 'bg-pink-600',
      category: 'Logic',
      inputs: [
        { name: 'roleName', value: 'Moderator', placeholder: 'Role name to check', type: 'text' as const },
        { name: 'errorMessage', value: 'You need the required role!', placeholder: 'Error message', type: 'text' as const }
      ]
    }
  ],
  logic: [
    {
      id: 'and-gate',
      type: 'logic' as const,
      title: 'AND Gate',
      content: '',
      icon: Filter,
      color: 'bg-teal-600',
      category: 'Logic Gates',
      inputs: [
        { name: 'condition1', value: 'message.member.permissions.has("BAN_MEMBERS")', placeholder: 'First condition', type: 'text' as const },
        { name: 'condition2', value: 'message.member.roles.cache.has("moderatorRoleId")', placeholder: 'Second condition', type: 'text' as const }
      ]
    },
    {
      id: 'or-gate',
      type: 'logic' as const,
      title: 'OR Gate',
      content: '',
      icon: GitBranch,
      color: 'bg-amber-600',
      category: 'Logic Gates',
      inputs: [
        { name: 'condition1', value: 'message.member.permissions.has("ADMINISTRATOR")', placeholder: 'First condition', type: 'text' as const },
        { name: 'condition2', value: 'message.author.id === "YOUR_USER_ID"', placeholder: 'Second condition', type: 'text' as const }
      ]
    }
  ],
  actions: [
    {
      id: 'send-message',
      type: 'action' as const,
      title: 'Send Message',
      content: '',
      icon: MessageCircle,
      color: 'bg-blue-500',
      category: 'Actions',
      inputs: [
        { name: 'channel', value: 'message.channel', placeholder: 'Channel to send to', type: 'text' as const },
        { name: 'content', value: 'Hello World!', placeholder: 'Message content', type: 'text' as const }
      ]
    },
    {
      id: 'add-role',
      type: 'action' as const,
      title: 'Add Role',
      content: '',
      icon: Star,
      color: 'bg-emerald-600',
      category: 'Actions',
      inputs: [
        { name: 'roleName', value: 'Member', placeholder: 'Role name to add', type: 'text' as const },
        { name: 'successMessage', value: 'Role added successfully!', placeholder: 'Success message', type: 'text' as const }
      ]
    },
    {
      id: 'remove-role',
      type: 'action' as const,
      title: 'Remove Role',
      content: '',
      icon: UserX,
      color: 'bg-red-500',
      category: 'Actions',
      inputs: [
        { name: 'roleName', value: 'Member', placeholder: 'Role name to remove', type: 'text' as const },
        { name: 'successMessage', value: 'Role removed successfully!', placeholder: 'Success message', type: 'text' as const }
      ]
    }
  ]
};

const defaultBlocks: CodeBlock[] = [
  blockCategories.events[0], // Bot Ready
  blockCategories.commands[0] // Basic Command
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

`;

    // Add event blocks
    blocks.forEach(block => {
      if (block.type === 'event') {
        if (block.id === 'ready-event') {
          generatedCode += `client.once('ready', () => {
  console.log(\`✅ \${client.user.tag} is now online!\`);
  client.user.setActivity('Powered by DB 14', { type: 'WATCHING' });
});

`;
        }
      }
    });

    // Helper functions for moderation
    generatedCode += `// Helper function to get mentioned user or user by ID
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

`;

    generatedCode += `client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  
  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  
`;

    // Process each block type
    blocks.forEach(block => {
      if (block.type === 'command') {
        const command = block.inputs?.find(i => i.name === 'command')?.value || '!ping';
        const response = block.inputs?.find(i => i.name === 'response')?.value || 'Hello!';
        const commandName = command.startsWith('!') ? command.slice(1) : command;
        generatedCode += `  if (command === '${commandName}') {
    message.reply('${response}');
  }
  
`;
      }

      if (block.type === 'moderation') {
        const commandInput = block.inputs?.find(i => i.name === 'command')?.value || '!ban';
        const commandName = commandInput.startsWith('!') ? commandInput.slice(1) : commandInput;
        
        if (block.id === 'ban-user') {
          const reason = block.inputs?.find(i => i.name === 'reason')?.value || 'No reason provided';
          const deleteMessages = block.inputs?.find(i => i.name === 'deleteMessages')?.value || '7';
          generatedCode += `  if (command === '${commandName}') {
    if (!hasPermission(message.member, 'BAN_MEMBERS')) {
      return message.reply('❌ You need the Ban Members permission to use this command!');
    }
    
    const target = await getTargetUser(message, args);
    if (!target) {
      return message.reply('❌ Please mention a user or provide a valid user ID.');
    }
    
    if (target.id === message.author.id) {
      return message.reply('❌ You cannot ban yourself!');
    }
    
    try {
      await message.guild.members.ban(target.id, {
        reason: '${reason}',
        deleteMessageDays: ${deleteMessages}
      });
      message.reply(\`✅ Successfully banned \${target.tag} for: ${reason}\`);
    } catch (error) {
      message.reply('❌ Failed to ban user. Check my permissions and role hierarchy.');
    }
  }
  
`;
        }

        if (block.id === 'unban-user') {
          const reason = block.inputs?.find(i => i.name === 'reason')?.value || 'Appeal approved';
          generatedCode += `  if (command === '${commandName}') {
    if (!hasPermission(message.member, 'BAN_MEMBERS')) {
      return message.reply('❌ You need the Ban Members permission to use this command!');
    }
    
    const userId = args[0];
    if (!userId) {
      return message.reply('❌ Please provide a user ID to unban.');
    }
    
    try {
      await message.guild.members.unban(userId, '${reason}');
      message.reply(\`✅ Successfully unbanned user ID: \${userId}\`);
    } catch (error) {
      message.reply('❌ Failed to unban user. They may not be banned or I lack permissions.');
    }
  }
  
`;
        }

        if (block.id === 'timeout-user') {
          const duration = block.inputs?.find(i => i.name === 'duration')?.value || '10';
          const reason = block.inputs?.find(i => i.name === 'reason')?.value || 'No reason provided';
          generatedCode += `  if (command === '${commandName}') {
    if (!hasPermission(message.member, 'MODERATE_MEMBERS')) {
      return message.reply('❌ You need the Moderate Members permission to use this command!');
    }
    
    const target = await getTargetUser(message, args);
    if (!target) {
      return message.reply('❌ Please mention a user or provide a valid user ID.');
    }
    
    const member = message.guild.members.cache.get(target.id);
    if (!member) {
      return message.reply('❌ User not found in this server.');
    }
    
    try {
      await member.timeout(${duration} * 60 * 1000, '${reason}');
      message.reply(\`✅ Successfully timed out \${target.tag} for ${duration} minutes. Reason: ${reason}\`);
    } catch (error) {
      message.reply('❌ Failed to timeout user. Check my permissions and role hierarchy.');
    }
  }
  
`;
        }

        if (block.id === 'untimeout-user') {
          const reason = block.inputs?.find(i => i.name === 'reason')?.value || 'Timeout removed';
          generatedCode += `  if (command === '${commandName}') {
    if (!hasPermission(message.member, 'MODERATE_MEMBERS')) {
      return message.reply('❌ You need the Moderate Members permission to use this command!');
    }
    
    const target = await getTargetUser(message, args);
    if (!target) {
      return message.reply('❌ Please mention a user or provide a valid user ID.');
    }
    
    const member = message.guild.members.cache.get(target.id);
    if (!member) {
      return message.reply('❌ User not found in this server.');
    }
    
    try {
      await member.timeout(null, '${reason}');
      message.reply(\`✅ Successfully removed timeout from \${target.tag}\`);
    } catch (error) {
      message.reply('❌ Failed to remove timeout. Check my permissions.');
    }
  }
  
`;
        }

        if (block.id === 'kick-user') {
          const reason = block.inputs?.find(i => i.name === 'reason')?.value || 'No reason provided';
          generatedCode += `  if (command === '${commandName}') {
    if (!hasPermission(message.member, 'KICK_MEMBERS')) {
      return message.reply('❌ You need the Kick Members permission to use this command!');
    }
    
    const target = await getTargetUser(message, args);
    if (!target) {
      return message.reply('❌ Please mention a user or provide a valid user ID.');
    }
    
    const member = message.guild.members.cache.get(target.id);
    if (!member) {
      return message.reply('❌ User not found in this server.');
    }
    
    try {
      await member.kick('${reason}');
      message.reply(\`✅ Successfully kicked \${target.tag} for: ${reason}\`);
    } catch (error) {
      message.reply('❌ Failed to kick user. Check my permissions and role hierarchy.');
    }
  }
  
`;
        }
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

  const addNewBlock = (blockTemplate: CodeBlock) => {
    const newBlock: CodeBlock = {
      ...blockTemplate,
      id: `block-${Date.now()}`
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
                  <div className="lg:col-span-1">
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="space-y-4">
                        <h3 className="text-white font-medium">Block Palette</h3>
                        
                        {Object.entries(blockCategories).map(([categoryKey, categoryBlocks]) => (
                          <div key={categoryKey} className="space-y-2">
                            <h4 className="text-sm font-medium text-[#b9bbbe] uppercase tracking-wide">
                              {categoryBlocks[0]?.category}
                            </h4>
                            <div className="space-y-1">
                              {categoryBlocks.map((blockTemplate) => {
                                const IconComponent = blockTemplate.icon;
                                return (
                                  <Button
                                    key={blockTemplate.id}
                                    onClick={() => addNewBlock(blockTemplate)}
                                    className={`w-full justify-start text-xs ${blockTemplate.color} hover:opacity-80`}
                                    size="sm"
                                  >
                                    <IconComponent className="w-3 h-3 mr-2" />
                                    {blockTemplate.title}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
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
                                          <Label className="text-xs text-[#b9bbbe] capitalize">
                                            {input.name.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                          </Label>
                                          {input.type === 'select' && block.options ? (
                                            <select
                                              value={input.value}
                                              onChange={(e) => updateBlockInput(block.id, input.name, e.target.value)}
                                              className="mt-1 w-full bg-[#40444b] border border-[#4f545c] text-white text-sm rounded px-2 py-1"
                                            >
                                              {block.options.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                              ))}
                                            </select>
                                          ) : (
                                            <Input
                                              value={input.value}
                                              onChange={(e) => updateBlockInput(block.id, input.name, e.target.value)}
                                              placeholder={input.placeholder}
                                              type={input.type === 'number' ? 'number' : 'text'}
                                              className="mt-1 bg-[#40444b] border-[#4f545c] text-white text-sm"
                                              size="sm"
                                            />
                                          )}
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