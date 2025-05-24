import { Bot, Server, Terminal, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsData {
  totalBots: number;
  totalServers: number;
  totalCommands: number;
  uptime: string;
}

interface DashboardStatsProps {
  stats: StatsData;
  isLoading: boolean;
}

export function DashboardStats({ stats, isLoading }: DashboardStatsProps) {
  const statCards = [
    {
      title: "Total Bots",
      value: stats.totalBots,
      icon: Bot,
      iconBg: "bg-[#5865f2]",
      change: "+2",
      changeText: "from last month",
    },
    {
      title: "Active Servers",
      value: stats.totalServers,
      icon: Server,
      iconBg: "bg-[#57f287]",
      change: "+15",
      changeText: "from last week",
    },
    {
      title: "Commands Used",
      value: `${(stats.totalCommands / 1000).toFixed(1)}k`,
      icon: Terminal,
      iconBg: "bg-[#fee75c]",
      change: "+1.2k",
      changeText: "from yesterday",
    },
    {
      title: "Uptime",
      value: stats.uptime,
      icon: Activity,
      iconBg: "bg-[#ed4245]",
      change: "+0.2%",
      changeText: "from last month",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-[#40444b] border-[#40444b]">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 bg-[#2f3136] rounded w-20 mb-2"></div>
                    <div className="h-8 bg-[#2f3136] rounded w-16"></div>
                  </div>
                  <div className="w-12 h-12 bg-[#2f3136] rounded-lg"></div>
                </div>
                <div className="mt-4">
                  <div className="h-3 bg-[#2f3136] rounded w-24"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        
        return (
          <Card 
            key={index} 
            className="bg-[#40444b] border-[#40444b] hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#b9bbbe] text-sm font-medium">{card.title}</p>
                  <p className="text-2xl font-bold mt-1 text-white">{card.value}</p>
                </div>
                <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className="text-white text-xl h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-[#57f287]">{card.change}</span>
                <span className="text-[#b9bbbe] ml-1">{card.changeText}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
