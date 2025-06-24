import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, UserPlus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Bot } from "@shared/schema";

interface CollaboratorInviteProps {
  bot: Bot;
}

export function CollaboratorInvite({ bot }: CollaboratorInviteProps) {
  const [serverId, setServerId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [role, setRole] = useState("viewer");
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const inviteCollaboratorMutation = useMutation({
    mutationFn: async (data: { serverId: string; targetUserId: string; role: string }) => {
      return apiRequest("POST", `/api/bots/${bot.id}/collaborators/invite`, data);
    },
    onSuccess: (data: any) => {
      setGeneratedId(data.collaboratorId);
      queryClient.invalidateQueries({ queryKey: [`/api/bots/${bot.id}/collaborators`] });
      toast({
        title: "Collaborator invite created!",
        description: `Share this ID: ${data.collaboratorId}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create invite",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleInvite = () => {
    if (!serverId || !targetUserId) {
      toast({
        title: "Missing information",
        description: "Please provide both server ID and user ID",
        variant: "destructive",
      });
      return;
    }

    inviteCollaboratorMutation.mutate({
      serverId,
      targetUserId,
      role,
    });
  };

  const copyToClipboard = async () => {
    if (generatedId) {
      await navigator.clipboard.writeText(generatedId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Collaborator ID copied to clipboard",
      });
    }
  };

  return (
    <Card className="bg-[#2f3136] border-[#40444b]">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Invite Collaborator
        </CardTitle>
        <CardDescription className="text-[#b9bbbe]">
          Generate a unique collaborator ID to share bot access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="serverId" className="text-white">Server ID</Label>
            <Input
              id="serverId"
              placeholder="123456789012345678"
              value={serverId}
              onChange={(e) => setServerId(e.target.value)}
              className="bg-[#40444b] border-[#4f545c] text-white"
            />
            <p className="text-xs text-[#8a92b2]">
              Discord server where the invite is created
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="targetUserId" className="text-white">Target User ID</Label>
            <Input
              id="targetUserId"
              placeholder="987654321098765432"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="bg-[#40444b] border-[#4f545c] text-white"
            />
            <p className="text-xs text-[#8a92b2]">
              Discord user ID to invite
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role" className="text-white">Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="bg-[#40444b] border-[#4f545c] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2f3136] border-[#40444b]">
              <SelectItem value="viewer" className="text-white">Viewer - View only access</SelectItem>
              <SelectItem value="editor" className="text-white">Editor - Can edit code</SelectItem>
              <SelectItem value="admin" className="text-white">Admin - Full access</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleInvite}
          disabled={inviteCollaboratorMutation.isPending || !serverId || !targetUserId}
          className="w-full bg-[#5865f2] hover:bg-[#4f46e5] text-white"
        >
          {inviteCollaboratorMutation.isPending ? "Creating Invite..." : "Generate Collaborator ID"}
        </Button>

        {generatedId && (
          <div className="space-y-3 p-4 bg-[#36393f] rounded-lg">
            <h4 className="text-white font-medium">Collaborator ID Generated</h4>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-[#5865f2] text-white font-mono text-sm px-3 py-1">
                {generatedId}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={copyToClipboard}
                className="bg-[#40444b] border-[#4f545c] text-white hover:bg-[#4f545c]"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-[#b9bbbe]">
              Share this ID with the user. Format: <code className="bg-[#2f3136] px-1 rounded">serverid-userid-8randomchars</code>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}