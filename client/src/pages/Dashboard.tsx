import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Plus, Code } from "lucide-react";
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

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  // Fetch bots
  const { data: bots, isLoading: botsLoading } = useQuery({
    queryKey: ["/api/bots"],
  });

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Fetch activities
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/activities"],
  });

  // Mock commands data for now
  const commands = [];

  // WebSocket connection
  useWebSocket(user?.id?.toString() || null);

  // Mutations
  const deleteBotMutation = useMutation({
    mutationFn: async (botId: number) => {
      return apiRequest("DELETE", `/api/bots/${botId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      toast({
        title: "Bot deleted",
        description: "Your bot has been removed successfully.",
      });
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries();
    toast({
      title: "Refreshed",
      description: "Data has been updated.",
    });
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#36393f] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Function to render different page content based on route
  const renderPageContent = () => {
    const currentPath = location;
    
    if (currentPath === "/bots") {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">My Discord Bots</h1>
              <p className="text-[#b9bbbe] mt-2">Create, edit, and host your Discord bots with JavaScript</p>
            </div>
            <Button className="bg-[#5865f2] hover:bg-[#4f46e5] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create New Bot
            </Button>
          </div>
          
          <BotCodeEditor />
          
          {bots && bots.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-white mb-4">Your Bots</h2>
              <BotList 
                bots={bots} 
                isLoading={botsLoading}
                onDeleteBot={(botId) => deleteBotMutation.mutate(botId)}
              />
            </div>
          )}
        </div>
      );
    }
    
    if (currentPath === "/commands") {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Bot Commands</h1>
              <p className="text-[#b9bbbe] mt-2">Manage and configure your bot commands</p>
            </div>
            <Button className="bg-[#5865f2] hover:bg-[#4f46e5] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Command
            </Button>
          </div>
          
          <CommandTable 
            commands={commands} 
            isLoading={botsLoading}
            onEditCommand={(command) => {
              toast({
                title: "Edit command",
                description: `Editing ${command.name}`,
              });
            }}
            onDeleteCommand={(commandId) => {
              toast({
                title: "Command deleted",
                description: "Command removed successfully",
              });
            }}
          />
        </div>
      );
    }
    
    if (currentPath === "/analytics") {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Bot Analytics</h1>
            <p className="text-[#b9bbbe] mt-2">Monitor your bot performance and usage statistics</p>
          </div>
          
          <DashboardStats 
            stats={stats || { totalBots: 0, onlineBots: 0, offlineBots: 0, totalServers: 0, totalCommands: 0, uptime: "99.8%" }} 
            isLoading={statsLoading} 
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActivityFeed 
              activities={activities || []} 
              isLoading={activitiesLoading} 
            />
            
            <div className="bg-[#2f3136] rounded-lg p-6 border border-[#40444b]">
              <h3 className="text-white font-medium mb-4">Performance Metrics</h3>
              <p className="text-[#b9bbbe] text-sm">Detailed analytics coming soon...</p>
            </div>
          </div>
        </div>
      );
    }
    
    if (currentPath === "/settings") {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <p className="text-[#b9bbbe] mt-2">Configure your account and bot hosting preferences</p>
          </div>
          
          <div className="grid gap-6">
            <div className="bg-[#2f3136] rounded-lg p-6 border border-[#40444b]">
              <h3 className="text-white font-medium mb-4">Account Settings</h3>
              <p className="text-[#b9bbbe] mb-4">Manage your DB 14 account and preferences.</p>
              <Button variant="outline">Edit Profile</Button>
            </div>
            
            <div className="bg-[#2f3136] rounded-lg p-6 border border-[#40444b]">
              <h3 className="text-white font-medium mb-4">Bot Hosting Settings</h3>
              <p className="text-[#b9bbbe] mb-4">Configure hosting preferences and resource limits.</p>
              <Button variant="outline">Configure Hosting</Button>
            </div>
            
            <div className="bg-[#2f3136] rounded-lg p-6 border border-[#40444b]">
              <h3 className="text-white font-medium mb-4">API Settings</h3>
              <p className="text-[#b9bbbe] mb-4">Manage your API keys and integrations.</p>
              <Button variant="outline">Manage APIs</Button>
            </div>
          </div>
        </div>
      );
    }
    
    // Default Dashboard
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
            <p className="text-[#b9bbbe] mt-2">Welcome to DB 14 - Your Discord bot hosting platform</p>
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
              Create Bot
            </Button>
          </div>
        </div>

        <DashboardStats 
          stats={stats || { totalBots: 0, onlineBots: 0, offlineBots: 0, totalServers: 0, totalCommands: 0, uptime: "99.8%" }} 
          isLoading={statsLoading} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Your Bots</h2>
              <Button size="sm" variant="outline">
                <Code className="h-4 w-4 mr-2" />
                Code Editor
              </Button>
            </div>
            <BotList 
              bots={bots || []} 
              isLoading={botsLoading}
              onDeleteBot={(botId) => deleteBotMutation.mutate(botId)}
            />
          </div>
          
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
            <ActivityFeed 
              activities={activities || []} 
              isLoading={activitiesLoading} 
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#36393f] flex">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        stats={{
          onlineBots: stats?.onlineBots || 0,
          offlineBots: stats?.offlineBots || 0,
          totalServers: stats?.totalServers || 0,
        }}
      />
      
      <div className="flex-1 flex flex-col">
        <Navigation 
          user={user || { id: 1, username: "Developer", discriminator: "0001", avatar: null }} 
          onMenuClick={() => setSidebarOpen(true)} 
        />
        
        <main className="flex-1 p-6 overflow-auto">
          {renderPageContent()}
        </main>
      </div>
    </div>
  );
}