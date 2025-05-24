import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Trash2, UserPlus, Crown, Shield, Edit, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Bot, CollaboratorWithUser } from "@shared/schema";

interface CollaboratorManagementProps {
  bot: Bot;
  userRole: string;
}

const roleIcons = {
  owner: Crown,
  admin: Shield,
  editor: Edit,
  viewer: Eye,
};

const roleColors = {
  owner: "bg-yellow-500",
  admin: "bg-red-500",
  editor: "bg-blue-500",
  viewer: "bg-gray-500",
};

export function CollaboratorManagement({ bot, userRole }: CollaboratorManagementProps) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    discordId: "",
    role: "viewer"
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch collaborators
  const { data: collaborators = [], isLoading } = useQuery({
    queryKey: ["/api/bots", bot.id, "collaborators"],
    enabled: !!bot.id,
  });

  // Invite collaborator mutation
  const inviteCollaborator = useMutation({
    mutationFn: async (data: { discordId: string; role: string }) => {
      return apiRequest(`/api/bots/${bot.id}/collaborators`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots", bot.id, "collaborators"] });
      setIsInviteOpen(false);
      setInviteForm({ discordId: "", role: "viewer" });
      toast({
        title: "Invitation sent",
        description: "The user has been invited to collaborate on this bot.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send invitation",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Update role mutation
  const updateRole = useMutation({
    mutationFn: async ({ collaboratorId, role }: { collaboratorId: number; role: string }) => {
      return apiRequest(`/api/collaborators/${collaboratorId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots", bot.id, "collaborators"] });
      toast({
        title: "Role updated",
        description: "The collaborator's role has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update role",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Remove collaborator mutation
  const removeCollaborator = useMutation({
    mutationFn: async (collaboratorId: number) => {
      return apiRequest(`/api/collaborators/${collaboratorId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots", bot.id, "collaborators"] });
      toast({
        title: "Collaborator removed",
        description: "The collaborator has been removed from this bot.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove collaborator",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const canManageCollaborators = userRole === "owner" || userRole === "admin";

  const handleInvite = () => {
    if (!inviteForm.discordId.trim()) {
      toast({
        title: "Discord ID required",
        description: "Please enter a Discord user ID",
        variant: "destructive",
      });
      return;
    }
    inviteCollaborator.mutate(inviteForm);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Loading collaborators...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage who can access and edit this bot
          </CardDescription>
        </div>
        {canManageCollaborators && (
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Invite someone to collaborate on {bot.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="discordId">Discord User ID</Label>
                  <Input
                    id="discordId"
                    placeholder="Enter Discord user ID"
                    value={inviteForm.discordId}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, discordId: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={inviteForm.role}
                    onValueChange={(role) => setInviteForm(prev => ({ ...prev, role }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer - View only access</SelectItem>
                      <SelectItem value="editor">Editor - Can edit commands</SelectItem>
                      <SelectItem value="admin">Admin - Full management access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleInvite}
                  disabled={inviteCollaborator.isPending}
                >
                  {inviteCollaborator.isPending ? "Sending..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {collaborators.map((collaborator: CollaboratorWithUser) => {
            const RoleIcon = roleIcons[collaborator.role as keyof typeof roleIcons] || Eye;
            const isOwner = collaborator.role === "owner";
            const canEdit = canManageCollaborators && !isOwner;
            
            return (
              <div
                key={collaborator.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${roleColors[collaborator.role as keyof typeof roleColors]}`} />
                    <RoleIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">{collaborator.user.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {collaborator.user.discriminator}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {collaborator.role}
                  </Badge>
                  
                  {collaborator.status === "pending" && (
                    <Badge variant="outline">Pending</Badge>
                  )}
                  
                  {canEdit && (
                    <div className="flex gap-1">
                      <Select
                        value={collaborator.role}
                        onValueChange={(role) => updateRole.mutate({
                          collaboratorId: collaborator.id,
                          role
                        })}
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCollaborator.mutate(collaborator.id)}
                        disabled={removeCollaborator.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {collaborators.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No team members yet</p>
              <p className="text-sm">Invite collaborators to work on this bot together</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}