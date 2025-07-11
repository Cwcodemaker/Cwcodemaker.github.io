import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bot, Shield, Zap, Users, Code } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getDiscordAuthUrl } from "@/lib/discord";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function Login() {
  const [, setLocation] = useLocation();
  const [devPassword, setDevPassword] = useState("");
  const { toast } = useToast();

  // Check if user is already authenticated
  const { data: user, error } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !error) {
      setLocation("/dashboard");
    }
  }, [user, error, setLocation]);

  const devLogin = useMutation({
    mutationFn: async (password: string) => {
      const response = await apiRequest("POST", "/api/auth/dev-login", { password });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Developer login successful",
        description: "Welcome to DB 14!",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Invalid password",
        description: "Please check your developer password and try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const handleDiscordLogin = () => {
    window.location.href = getDiscordAuthUrl();
  };

  const handleDevLogin = () => {
    if (devPassword.trim()) {
      devLogin.mutate(devPassword);
    }
  };

  const features = [
    {
      icon: Bot,
      title: "Easy Bot Management",
      description: "Connect and manage multiple Discord bots from one centralized dashboard"
    },
    {
      icon: Shield,
      title: "Secure OAuth",
      description: "Login securely using Discord OAuth with proper permissions management"
    },
    {
      icon: Zap,
      title: "Real-time Updates",
      description: "Monitor your bots' status and activity in real-time with live updates"
    },
    {
      icon: Users,
      title: "Server Analytics",
      description: "Track your bots' performance across all servers they're deployed to"
    }
  ];

  return (
    <div className="min-h-screen bg-[#36393f] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#5865f2] rounded-2xl flex items-center justify-center">
              <Bot className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">DB 14</h1>
          <p className="text-[#b9bbbe] text-lg">Discord Bot Management Platform</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Login Card */}
          <Card className="bg-[#2f3136] border-[#40444b] order-2 lg:order-1">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">Get Started</CardTitle>
              <CardDescription className="text-[#b9bbbe]">
                Connect your Discord account to start managing your bots
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-sm text-[#b9bbbe]">
                  <div className="w-2 h-2 bg-[#57f287] rounded-full"></div>
                  <span>Secure Discord OAuth integration</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-[#b9bbbe]">
                  <div className="w-2 h-2 bg-[#57f287] rounded-full"></div>
                  <span>Real-time bot monitoring</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-[#b9bbbe]">
                  <div className="w-2 h-2 bg-[#57f287] rounded-full"></div>
                  <span>Command management system</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-[#b9bbbe]">
                  <div className="w-2 h-2 bg-[#57f287] rounded-full"></div>
                  <span>Analytics and insights</span>
                </div>
              </div>

              <Button 
                onClick={handleDiscordLogin}
                className="w-full bg-[#5865f2] hover:bg-[#4f46e5] text-white py-3 text-lg font-medium"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.211.375-.446.865-.608 1.25a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.25.077.077 0 0 0-.079-.036A19.896 19.896 0 0 0 3.677 4.492a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 2.03.078.078 0 0 0 .084-.026 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-2.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.278c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Login with Discord
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full bg-[#4f545c]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#2f3136] px-3 text-[#b9bbbe]">Or</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs text-orange-400 border-orange-400">
                    <Code className="w-3 h-3 mr-1" />
                    DEV
                  </Badge>
                  <span className="text-sm text-[#b9bbbe]">Developer Bypass</span>
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Enter developer password (1234)..."
                    value={devPassword}
                    onChange={(e) => setDevPassword(e.target.value)}
                    className="bg-[#40444b] border-[#4f545c] text-white placeholder-[#72767d]"
                    onKeyDown={(e) => e.key === "Enter" && handleDevLogin()}
                  />
                  <Button 
                    onClick={handleDevLogin}
                    disabled={!devPassword.trim() || devLogin.isPending}
                    variant="outline"
                    className="w-full border-[#4f545c] text-[#b9bbbe] hover:bg-[#40444b]"
                    size="sm"
                  >
                    {devLogin.isPending ? "Logging in..." : "Developer Login"}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-[#b9bbbe] text-center">
                Discord login allows secure access to your servers and bot management.
              </p>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="space-y-4 order-1 lg:order-2">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="flex items-start space-x-4 p-4 bg-[#40444b] rounded-lg border border-[#40444b]"
                >
                  <div className="w-10 h-10 bg-[#5865f2] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-[#b9bbbe]">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
