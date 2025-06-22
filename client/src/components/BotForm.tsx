import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Key, Eye, EyeOff } from "lucide-react";

interface BotFormProps {
  onSubmit: (formData: any) => void;
  onCancel?: () => void;
}

export function BotForm({ onSubmit, onCancel }: BotFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    token: ""
  });
  const [showToken, setShowToken] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.token.trim()) {
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bot-name" className="text-white">Bot Name *</Label>
        <Input
          id="bot-name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="My Awesome Bot"
          className="bg-[#40444b] border-[#4f545c] text-white"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bot-description" className="text-white">Description</Label>
        <Textarea
          id="bot-description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="A helpful Discord bot for my server"
          className="bg-[#40444b] border-[#4f545c] text-white"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bot-token" className="text-white flex items-center gap-2">
          <Key className="w-4 h-4" />
          Discord Bot Token *
        </Label>
        <div className="flex gap-2">
          <Input
            id="bot-token"
            type={showToken ? "text" : "password"}
            value={formData.token}
            onChange={(e) => setFormData(prev => ({ ...prev, token: e.target.value }))}
            placeholder="Enter your Discord bot token"
            className="bg-[#40444b] border-[#4f545c] text-white flex-1"
            required
          />
          <Button
            type="button"
            onClick={() => setShowToken(!showToken)}
            variant="outline"
            size="icon"
            className="bg-[#40444b] border-[#4f545c] text-white hover:bg-[#4f545c]"
          >
            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-[#8a92b2]">
          Get your bot token from the Discord Developer Portal
        </p>
      </div>

      <div className="flex gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="bg-[#40444b] border-[#4f545c] text-white hover:bg-[#4f545c]"
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          className="bg-blue-600 hover:bg-blue-700 flex-1"
        >
          Create Bot
        </Button>
      </div>
    </form>
  );
}