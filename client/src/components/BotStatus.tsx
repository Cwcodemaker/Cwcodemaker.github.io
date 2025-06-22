import { Badge } from "@/components/ui/badge";
import { Zap, ZapOff } from "lucide-react";

interface BotStatusProps {
  isOnline: boolean;
  isDeployed: boolean;
  className?: string;
}

export function BotStatus({ isOnline, isDeployed, className = "" }: BotStatusProps) {
  if (!isDeployed) {
    return (
      <Badge variant="secondary" className={`${className} bg-gray-600 text-white`}>
        <ZapOff className="w-3 h-3 mr-1" />
        Not Deployed
      </Badge>
    );
  }

  return (
    <Badge 
      variant={isOnline ? "default" : "destructive"} 
      className={`${className} ${
        isOnline 
          ? "bg-green-600 hover:bg-green-700 text-white" 
          : "bg-red-600 hover:bg-red-700 text-white"
      }`}
    >
      <Zap className="w-3 h-3 mr-1" />
      {isOnline ? "Online 24/7" : "Offline"}
    </Badge>
  );
}