import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Plus, Code, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Navigation } from "@/components/Navigation";
import { Sidebar } from "@/components/Sidebar";
import { DashboardStats } from "@/components/DashboardStats";
import { BotList } from "@/components/BotList";
import { ActivityFeed } from "@/components/ActivityFeed";
import { CommandTable } from "@/components/CommandTable";
import { BotCodeEditor } from "@/components/BotCodeEditor";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest } from "@/lib/queryClient";
import type { User, Bot, ActivityWithBot, Command } from "@shared/schema";

interface DashboardData {
  user: User;
  bots: Bot[];
  stats: {
    totalBots: number;
    onlineBots: number;
    offlineBots: number;
    totalServers: number;
    totalCommands: number;
    uptime: string;
  };
  activities: ActivityWithBot[];
  commands: (Command & { bot: Bot })[];
}

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: bots = [], isLoading: botsLoading } = useQuery<Bot[]>({
    queryKey: ["/api/bots"],
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery<ActivityWithBot[]>({
    queryKey: ["/api/activities"],
  });

  // Setup WebSocket for real-time updates
  const { on, off } = useWebSocket(user?.id.toString() || null);

  useEffect(() => {
    if (!user) return;

    const handleBotStatusUpdate = (data: any) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      
      toast({
        title: "Bot Status Updated",
        description: `Bot ${data.isOnline ? 'came online' : 'went offline'}`,
      });
    };

    on('bot_status_updated', handleBotStatusUpdate);

    return () => {
      off('bot_status_updated');
    };
  }, [user, on, off, queryClient, toast]);

  // Delete bot mutation
  const deleteBotMutation = useMutation({
    mutationFn: (botId: number) => apiRequest("DELETE", `/api/bots/${botId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Bot removed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove bot",
        variant: "destructive",
      });
    },
  });

  // Refresh data
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
    queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
  };

  // Mock commands data (would be fetched from API)
  const mockCommands = bots.flatMap(bot => [
    {
      id: 1,
      botId: bot.id,
      name: "play",
      description: "Play music from YouTube",
      usage: 2400,
      isActive: true,
      createdAt: new Date(),
      bot,
    },
    {
      id: 2,
      botId: bot.id,
      name: "ban",
      description: "Ban a user from the server",
      usage: 847,
      isActive: true,
      createdAt: new Date(),
      bot,
    },
  ]).slice(0, 3);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#36393f] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#36393f] flex items-center justify-center">
        <div className="text-white">Please log in to continue</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#36393f] text-white">
      <Navigation user={user} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex h-screen">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          stats={{
            onlineBots: stats?.onlineBots || 0,
            offlineBots: stats?.offlineBots || 0,
            totalServers: stats?.totalServers || 0,
          }}
        />

        {/* Main Content */}
        <main className="flex-1 bg-[#36393f] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
              <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-[#b9bbbe] mt-1">Manage your Discord bots and monitor their performance</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  className="bg-[#40444b] border-[#40444b] hover:bg-[#5865f2] text-white"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button className="bg-[#5865f2] hover:bg-[#4f46e5] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Bot
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <DashboardStats 
              stats={stats || { totalBots: 0, totalServers: 0, totalCommands: 0, uptime: "0%" }} 
              isLoading={statsLoading} 
            />

            {/* Bot Management Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BotList 
                bots={bots} 
                isLoading={botsLoading}
                onDeleteBot={(botId) => deleteBotMutation.mutate(botId)}
              />
              <ActivityFeed 
                activities={activities} 
                isLoading={activitiesLoading} 
              />
            </div>

            {/* Command Management Section */}
            <CommandTable
              commands={mockCommands}
              isLoading={false}
              onEditCommand={(command) => {
                toast({
                  title: "Edit Command",
                  description: `Editing command: /${command.name}`,
                });
              }}
              onDeleteCommand={(commandId) => {
                toast({
                  title: "Delete Command",
                  description: "Command deleted successfully",
                });
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
