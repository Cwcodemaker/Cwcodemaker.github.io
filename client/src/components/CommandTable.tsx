import { Edit, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Command, Bot } from "@shared/schema";

interface CommandTableProps {
  commands: (Command & { bot: Bot })[];
  isLoading: boolean;
  onEditCommand: (command: Command) => void;
  onDeleteCommand: (commandId: number) => void;
}

export function CommandTable({ commands, isLoading, onEditCommand, onDeleteCommand }: CommandTableProps) {
  if (isLoading) {
    return (
      <Card className="bg-[#40444b] border-[#40444b]">
        <CardHeader>
          <CardTitle className="text-white">Command Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-[#2f3136] rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#40444b] border-[#40444b]">
      <CardHeader className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
        <div>
          <CardTitle className="text-lg font-semibold text-white">Command Management</CardTitle>
          <p className="text-sm text-[#b9bbbe] mt-1">Configure and monitor your bot commands</p>
        </div>
        <Button className="bg-[#5865f2] hover:bg-[#4f46e5] text-white w-fit">
          <Plus className="h-4 w-4 mr-2" />
          Add Command
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#2f3136] hover:bg-transparent">
                <TableHead className="text-[#b9bbbe] font-medium">Command</TableHead>
                <TableHead className="text-[#b9bbbe] font-medium">Bot</TableHead>
                <TableHead className="text-[#b9bbbe] font-medium">Usage</TableHead>
                <TableHead className="text-[#b9bbbe] font-medium">Status</TableHead>
                <TableHead className="text-[#b9bbbe] font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commands.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-[#b9bbbe]">
                    No commands configured yet
                  </TableCell>
                </TableRow>
              ) : (
                commands.slice(0, 10).map((command) => (
                  <TableRow 
                    key={command.id} 
                    className="border-b border-[#2f3136] hover:bg-[#2f3136]"
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center space-x-3">
                        <code className="bg-[#2f3136] px-2 py-1 rounded text-sm text-[#5865f2]">
                          /{command.name}
                        </code>
                        <span className="text-sm text-[#b9bbbe]">{command.description}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-sm text-white">{command.bot.name}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-sm text-white">{command.usage} uses</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge 
                        variant={command.isActive ? "default" : "destructive"}
                        className={
                          command.isActive 
                            ? "bg-[#57f287]/20 text-[#57f287] hover:bg-[#57f287]/30"
                            : "bg-[#ed4245]/20 text-[#ed4245] hover:bg-[#ed4245]/30"
                        }
                      >
                        {command.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-[#b9bbbe] hover:text-white h-8 w-8"
                          onClick={() => onEditCommand(command)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-[#b9bbbe] hover:text-[#ed4245] h-8 w-8"
                          onClick={() => onDeleteCommand(command.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
