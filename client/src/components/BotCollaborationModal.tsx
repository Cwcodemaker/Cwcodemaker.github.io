import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2, UserPlus, Crown, Shield, Edit, Eye, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getDiscordAvatarUrl } from "@/lib/discord";
import type { BotWithCollaborators, CollaboratorWithUser } from "@shared/schema";

interface BotCollaborationModalProps {
  bot: BotWithCollaborators;
  isOpen: boolean;
  onClose: () => void;
}

const roleIcons = {
  owner: Crown,
  admin: Shield,
  editor: Edit,
  viewer: Eye,
};

const roleColors = {
  owner: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  editor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  viewer: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export function BotCollaborationModal({ bot, isOpen, onClose }: BotCollaborationModalProps) {
  const [inviteForm, setInviteForm] = useState({
    discordId: "",
    role: "viewer"
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch collaborators
  const { data: collaborators = [], isLoading } = useQuery({
    queryKey: ["/api/bots", bot.id, "collaborators"],
    enabled: !!bot.id && isOpen,
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
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
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

  const canManageCollaborators = bot.userRole === "owner" || bot.userRole === "admin";

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage 
                src={bot.avatar ? getDiscordAvatarUrl(bot.botId, bot.avatar, 40) : undefined} 
                alt={bot.name} 
              />
              <AvatarFallback>{bot.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-xl">{bot.name}</DialogTitle>
              <DialogDescription>
                Manage team collaboration and permissions
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team Members
            </TabsTrigger>
            <TabsTrigger value="invite" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Invite Member
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading team members...
                </div>
              ) : collaborators.length > 0 ? (
                collaborators.map((collaborator: CollaboratorWithUser) => {
                  const RoleIcon = roleIcons[collaborator.role as keyof typeof roleIcons] || Eye;
                  const isOwner = collaborator.role === "owner";
                  const canEdit = canManageCollaborators && !isOwner;
                  
                  return (
                    <div
                      key={collaborator.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={collaborator.user.avatar ? getDiscordAvatarUrl(collaborator.user.discordId, collaborator.user.avatar, 40) : undefined} 
                            alt={collaborator.user.username} 
                          />
                          <AvatarFallback>{collaborator.user.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{collaborator.user.username}</p>
                          <p className="text-sm text-muted-foreground">
                            #{collaborator.user.discriminator}
                          </p>
                          {collaborator.status === "pending" && (
                            <Badge variant="outline" className="mt-1">Pending</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="secondary" 
                          className={`capitalize flex items-center gap-1 ${roleColors[collaborator.role as keyof typeof roleColors]}`}
                        >
                          <RoleIcon className="w-3 h-3" />
                          {collaborator.role}
                        </Badge>
                        
                        {canEdit && (
                          <div className="flex gap-2">
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
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No team members yet</p>
                  <p className="text-sm">Invite collaborators to work on this bot together</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="invite" className="space-y-4">
            {canManageCollaborators ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="discordId">Discord User ID</Label>
                  <Input
                    id="discordId"
                    placeholder="Enter Discord user ID (e.g., 123456789012345678)"
                    value={inviteForm.discordId}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, discordId: e.target.value }))}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    You can find this in Discord by right-clicking a user and selecting "Copy User ID"
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="role">Permission Level</Label>
                  <Select
                    value={inviteForm.role}
                    onValueChange={(role) => setInviteForm(prev => ({ ...prev, role }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          <div>
                            <p>Viewer</p>
                            <p className="text-xs text-muted-foreground">View bot stats and activities</p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="editor">
                        <div className="flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          <div>
                            <p>Editor</p>
                            <p className="text-xs text-muted-foreground">Edit commands and bot settings</p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          <div>
                            <p>Admin</p>
                            <p className="text-xs text-muted-foreground">Full management including team members</p>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleInvite}
                  disabled={inviteCollaborator.isPending || !inviteForm.discordId.trim()}
                  className="w-full"
                >
                  {inviteCollaborator.isPending ? "Sending Invitation..." : "Send Invitation"}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Permission Required</p>
                <p className="text-sm">You need admin or owner permissions to invite team members</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}