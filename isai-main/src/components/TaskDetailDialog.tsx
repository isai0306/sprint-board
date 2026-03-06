import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateTask } from "@/hooks/useTasks";
import { useComments, useCreateComment } from "@/hooks/useComments";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

interface TaskDetailDialogProps {
  task: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TaskDetailDialog({ task, open, onOpenChange }: TaskDetailDialogProps) {
  const updateTask = useUpdateTask();
  const { data: comments } = useComments(task.id);
  const createComment = useCreateComment();
  const [commentText, setCommentText] = useState("");
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");

  const handleSave = () => {
    updateTask.mutate({
      id: task.id,
      title: title.trim(),
      description: description.trim() || undefined,
    });
    toast.success("Task updated");
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      await createComment.mutateAsync({ task_id: task.id, content: commentText.trim() });
      setCommentText("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Task Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} maxLength={200} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} maxLength={2000} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={task.priority}
                onValueChange={(v) => updateTask.mutate({ id: task.id, priority: v as any })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={task.status}
                onValueChange={(v) => updateTask.mutate({ id: task.id, status: v as any })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input
              type="date"
              value={task.due_date || ""}
              onChange={(e) => updateTask.mutate({ id: task.id, due_date: e.target.value || null })}
            />
          </div>
          <Button onClick={handleSave} disabled={updateTask.isPending}>Save Changes</Button>

          {/* Comments */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4" />
              Comments ({comments?.length ?? 0})
            </h3>
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {comments?.map((c: any) => (
                <div key={c.id} className="bg-secondary rounded-lg p-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span className="font-medium">{c.profiles?.username || "User"}</span>
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm">{c.content}</p>
                </div>
              ))}
              {(!comments || comments.length === 0) && (
                <p className="text-sm text-muted-foreground">No comments yet</p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a comment..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddComment()}
                maxLength={1000}
              />
              <Button size="icon" onClick={handleAddComment} disabled={createComment.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
