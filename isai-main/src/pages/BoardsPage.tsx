import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Columns3 } from "lucide-react";
import { useBoards, useCreateBoard } from "@/hooks/useBoards";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function BoardsPage() {
  const [searchParams] = useSearchParams();
  const workspaceFilter = searchParams.get("workspace");
  const { data: boards, isLoading } = useBoards(workspaceFilter || undefined);
  const { data: workspaces } = useWorkspaces();
  const createBoard = useCreateBoard();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState(workspaceFilter || "");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedWorkspace) return;
    try {
      const board = await createBoard.mutateAsync({
        name: name.trim(),
        workspace_id: selectedWorkspace,
      });
      toast.success("Board created!");
      setName("");
      setOpen(false);
      navigate(`/board/${board.id}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Boards</h1>
          <p className="text-muted-foreground">Kanban boards for your projects</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Board
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Board</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Workspace</Label>
                <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaces?.map((ws) => (
                      <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Board Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sprint 1"
                  required
                  maxLength={100}
                />
              </div>
              <Button type="submit" className="w-full" disabled={createBoard.isPending || !selectedWorkspace}>
                {createBoard.isPending ? "Creating..." : "Create Board"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse"><CardContent className="h-24" /></Card>
          ))}
        </div>
      ) : boards && boards.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <motion.div
              key={board.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/board/${board.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Columns3 className="h-5 w-5 text-primary" />
                    {board.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {(board as any).workspaces?.name}
                  </p>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              {workspaces && workspaces.length === 0
                ? "Create a workspace first to add boards"
                : "No boards yet"}
            </p>
            {workspaces && workspaces.length > 0 && (
              <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create your first board
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
