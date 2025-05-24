import { BarChart3, Bot, Cog, Plus, Settings, Terminal, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  stats: {
    onlineBots: number;
    offlineBots: number;
    totalServers: number;
  };
}

export function Sidebar({ isOpen, onClose, stats }: SidebarProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: TrendingUp },
    { href: "/bots", label: "My Bots", icon: Bot },
    { href: "/commands", label: "Commands", icon: Terminal },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Cog },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "bg-[#2f3136] w-64 flex-shrink-0 fixed lg:relative z-40 h-full transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 space-y-6">
          {/* Navigation Menu */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.href} href={item.href}>
                  <a
                    className={cn(
                      "flex items-center space-x-3 rounded-lg px-4 py-3 font-medium transition-colors",
                      isActive
                        ? "text-white bg-[#5865f2]"
                        : "text-[#b9bbbe] hover:text-white hover:bg-[#40444b]"
                    )}
                    onClick={onClose}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </a>
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="border-t border-[#40444b] pt-6">
            <h3 className="text-xs font-semibold text-[#b9bbbe] uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <Button className="w-full bg-[#5865f2] hover:bg-[#4f46e5] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add New Bot
            </Button>
          </div>

          {/* Bot Status Overview */}
          <div className="border-t border-[#40444b] pt-6">
            <h3 className="text-xs font-semibold text-[#b9bbbe] uppercase tracking-wider mb-3">
              Bot Status
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#b9bbbe]">Online</span>
                <span className="text-[#57f287] font-medium">{stats.onlineBots}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#b9bbbe]">Offline</span>
                <span className="text-[#ed4245] font-medium">{stats.offlineBots}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#b9bbbe]">Total Servers</span>
                <span className="text-white font-medium">{stats.totalServers}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
