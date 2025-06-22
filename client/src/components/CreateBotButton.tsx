import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { BotForm } from "@/components/BotForm";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function CreateBotButton() {
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createBotMutation = useMutation({
    mutationFn: async (botData: any) => {
      return apiRequest("POST", "/api/bots", botData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      setShowForm(false);
      toast({
        title: "Bot created successfully!",
        description: "Your Discord bot has been created and is ready to configure.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create bot",
        description: error.message || "Please check your bot token and try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateBot = (formData: any) => {
    createBotMutation.mutate(formData);
  };

  return (
    <>
      <Button 
        onClick={() => setShowForm(true)}
        className="bg-[#5865f2] hover:bg-[#4f46e5] text-white"
        disabled={createBotMutation.isPending}
      >
        <Plus className="h-4 w-4 mr-2" />
        {createBotMutation.isPending ? "Creating..." : "Create Bot"}
      </Button>
      
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#2f3136] border border-[#40444b] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Create New Discord Bot</h3>
            <BotForm 
              onSubmit={handleCreateBot} 
              onCancel={() => setShowForm(false)} 
            />
          </div>
        </div>
      )}
    </>
  );
}