import { CheckCircle, AlertTriangle, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityWithBot } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface ActivityFeedProps {
  activities: ActivityWithBot[];
  isLoading: boolean;
}

export function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'deployment':
      case 'online':
        return { icon: CheckCircle, bg: "bg-[#57f287]" };
      case 'offline':
        return { icon: AlertTriangle, bg: "bg-[#fee75c]" };
      case 'join_server':
        return { icon: Plus, bg: "bg-[#5865f2]" };
      case 'error':
        return { icon: X, bg: "bg-[#ed4245]" };
      default:
        return { icon: CheckCircle, bg: "bg-[#57f287]" };
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-[#40444b] border-[#40444b]">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#2f3136] rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-[#2f3136] rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-[#2f3136] rounded w-1/4"></div>
                  </div>
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
        <CardTitle className="text-lg font-semibold text-white">Recent Activity</CardTitle>
        <Button variant="link" className="text-[#5865f2] hover:text-[#4f46e5] text-sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#b9bbbe]">No recent activity</p>
            </div>
          ) : (
            activities.map((activity) => {
              const { icon: Icon, bg } = getActivityIcon(activity.type);
              
              return (
                <div key={activity.id} className="flex items-start space-x-4">
                  <div className={`w-8 h-8 ${bg} rounded-full flex items-center justify-center flex-shrink-0 mt-1`}>
                    <Icon className="text-white text-xs h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">
                      <span className="font-medium">{activity.bot.name}</span>
                      <span className="text-[#b9bbbe]"> {activity.message}</span>
                    </p>
                    <p className="text-xs text-[#b9bbbe] mt-1">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
