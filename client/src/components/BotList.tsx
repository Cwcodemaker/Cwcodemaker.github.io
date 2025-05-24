import { useState } from "react";
import { MoreVertical, Users, Crown, Shield, Edit, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getDiscordAvatarUrl } from "@/lib/discord";
import { BotCollaborationModal } from "./BotCollaborationModal";
import { BotWithCollaborators } from "@shared/schema";

interface BotListProps {
  bots: BotWithCollaborators[];
  isLoading: boolean;
  onDeleteBot: (botId: number) => void;
}

export function BotList({ bots, isLoading, onDeleteBot }: BotListProps) {
  if (isLoading) {
    return (
      <Card className="bg-[#40444b] border-[#40444b]">
        <CardHeader>
          <CardTitle className="text-white">Active Bots</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between p-4 bg-[#2f3136] rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-[#40444b] rounded-full"></div>
                    <div>
                      <div className="h-4 bg-[#40444b] rounded w-24 mb-2"></div>
                      <div className="h-3 bg-[#40444b] rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-[#40444b] rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#40444b] border-[#40444b]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-white">Active Bots</CardTitle>
        <Button variant="link" className="text-[#5865f2] hover:text-[#4f46e5] text-sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bots.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#b9bbbe]">No bots connected yet</p>
              <Button className="mt-4 bg-[#5865f2] hover:bg-[#4f46e5]">
                Connect Your First Bot
              </Button>
            </div>
          ) : (
            bots.map((bot) => (
              <div 
                key={bot.id} 
                className="flex items-center justify-between p-4 bg-[#2f3136] rounded-lg"
                style={{
                  background: "linear-gradient(135deg, #40444b 0%, #36393f 100%)",
                }}
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={getDiscordAvatarUrl(bot.botId, bot.avatar)} />
                    <AvatarFallback>{bot.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-white">{bot.name}</h3>
                    <p className="text-sm text-[#b9bbbe]">{bot.serverCount} servers</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div 
                      className={`w-3 h-3 rounded-full ${
                        bot.isOnline 
                          ? "bg-[#57f287] shadow-[0_0_10px_rgba(87,242,135,0.3)]" 
                          : "bg-[#ed4245] shadow-[0_0_10px_rgba(237,66,69,0.3)]"
                      }`}
                    />
                    <span className={`text-sm ${bot.isOnline ? "text-[#57f287]" : "text-[#ed4245]"}`}>
                      {bot.isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-[#b9bbbe] hover:text-white">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#2f3136] border-[#40444b]">
                      <DropdownMenuItem 
                        className="text-white hover:bg-[#40444b] focus:bg-[#40444b]"
                      >
                        Configure
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-[#ed4245] hover:bg-[#40444b] focus:bg-[#40444b]"
                        onClick={() => onDeleteBot(bot.id)}
                      >
                        Remove Bot
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
