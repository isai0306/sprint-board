import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Plus, GripVertical, Calendar, Trash2, Paperclip } from "lucide-react";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useBoard, useBoardDeveloperActivity, useUpdateBoardGitHub } from "@/hooks/useBoards";
import { toast } from "sonner";
import TaskDetailDialog from "@/components/TaskDetailDialog";
import { Switch } from "@/components/ui/switch";

type Status = "todo" | "in_progress" | "review" | "done";

const columns: { id: Status; title: string; color: string }[] = [
  { id: "todo", title: "To Do", color: "border-amber-300/25 bg-[linear-gradient(180deg,rgba(245,158,11,0.12)_0%,rgba(0,0,0,0.3)_100%)]" },
  { id: "in_progress", title: "In Progress", color: "border-cyan-300/25 bg-[linear-gradient(180deg,rgba(34,211,238,0.12)_0%,rgba(0,0,0,0.3)_100%)]" },
  { id: "review", title: "Review", color: "border-violet-300/25 bg-[linear-gradient(180deg,rgba(139,92,246,0.13)_0%,rgba(0,0,0,0.3)_100%)]" },
  { id: "done", title: "Done", color: "border-emerald-300/25 bg-[linear-gradient(180deg,rgba(16,185,129,0.12)_0%,rgba(0,0,0,0.3)_100%)]" },
];

const priorityColors: Record<string, string> = {
  low: "bg-slate-700/60 text-slate-200",
  medium: "bg-cyan-500/20 text-cyan-300",
  high: "bg-amber-500/20 text-amber-300",
  urgent: "bg-rose-500/25 text-rose-300",
};

export default function KanbanBoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { data: tasks } = useTasks(boardId);
  const { data: board } = useBoard(boardId);
  const { data: developerActivity } = useBoardDeveloperActivity(boardId);
  const updateBoardGitHub = useUpdateBoardGitHub();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [githubAutoDone, setGithubAutoDone] = useState(false);
  const [githubWebhookSecret, setGithubWebhookSecret] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<string>("medium");
  const [newStatus, setNewStatus] = useState<Status>("todo");
  const [workType, setWorkType] = useState<"task" | "bug" | "story" | "epic">("task");
  const [reporter, setReporter] = useState("Automatic");
  const [parent, setParent] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [sprint, setSprint] = useState("");
  const [linkedType, setLinkedType] = useState("blocks");
  const [linkedUrl, setLinkedUrl] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const status = result.destination.droppableId as Status;
    const taskId = result.draggableId;
    const source = result.source.droppableId as Status;
    const flow: Status[] = ["todo", "in_progress", "review", "done"];
    const sourceIndex = flow.indexOf(source);
    const destIndex = flow.indexOf(status);
    const isAdjacent = Math.abs(destIndex - sourceIndex) <= 1;

    if (!isAdjacent) {
      toast.error("Move task step-by-step: To Do -> In Progress -> Review -> Done");
      return;
    }

    updateTask.mutate({
      id: taskId,
      status,
      position: result.destination.index,
    });
  };

  const resetForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewPriority("medium");
    setNewStatus("todo");
    setWorkType("task");
    setReporter("Automatic");
    setParent("");
    setStartDate("");
    setDueDate("");
    setSprint("");
    setLinkedType("blocks");
    setLinkedUrl("");
    setAttachments([]);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle.trim()) {
      toast.error("Summary is required");
      return;
    }
    if (!boardId) {
      toast.error("Board is missing");
      return;
    }

    try {
      await createTask.mutateAsync({
        board_id: boardId,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        status: newStatus,
        priority: newPriority as any,
        work_type: workType,
        reporter,
        parent: parent.trim() || undefined,
        start_date: startDate || undefined,
        due_date: dueDate || undefined,
        sprint: sprint.trim() || undefined,
        linked_item_type: linkedType,
        linked_item_url: linkedUrl.trim() || undefined,
        attachments,
      });

      toast.success("Task created!");
      resetForm();
      setCreateOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const selectedTaskData = tasks?.find((t) => t.id === selectedTask);

  const connectedRepoUrl = (board as any)?.github?.repository_url || "";
  const webhookUrl = (board as any)?.github?.webhook_url || "";

  useEffect(() => {
    const github = (board as any)?.github;
    if (!github) return;
    setGithubAutoDone(Boolean(github.auto_mark_done));
  }, [board]);

  const handleConnectGitHub = async () => {
    if (!boardId) return;
    if (!githubRepoUrl.trim()) {
      toast.error("Repository URL is required");
      return;
    }
    try {
      const updatedBoard = await updateBoardGitHub.mutateAsync({
        boardId,
        repository_url: githubRepoUrl.trim(),
        auto_mark_done: githubAutoDone,
      });
      setGithubWebhookSecret(updatedBoard?.github?.webhook_secret || "");
      toast.success("GitHub repository connected");
      setGithubRepoUrl("");
    } catch (err: any) {
      toast.error(err.message || "Failed to connect repository");
    }
  };

  const handleDisconnectGitHub = async () => {
    if (!boardId) return;
    try {
      await updateBoardGitHub.mutateAsync({ boardId, disconnect: true });
      toast.success("GitHub repository disconnected");
      setGithubRepoUrl("");
      setGithubWebhookSecret("");
    } catch (err: any) {
      toast.error(err.message || "Failed to disconnect repository");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-slate-100">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sprint Board</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-700 bg-slate-900 text-slate-100 sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Create Task</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateTask} className="space-y-6">
              <p className="text-sm text-slate-400">Required fields are marked with an asterisk *</p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Work type *</Label>
                  <Select value={workType} onValueChange={(v) => setWorkType(v as any)}>
                    <SelectTrigger className="border-slate-700 bg-slate-950/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="bug">Bug</SelectItem>
                      <SelectItem value="story">Story</SelectItem>
                      <SelectItem value="epic">Epic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={newStatus} onValueChange={(v) => setNewStatus(v as Status)}>
                    <SelectTrigger className="border-slate-700 bg-slate-950/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">This is the initial status on creation</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Summary *</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="border-slate-700 bg-slate-950/60"
                  placeholder="Enter summary"
                  maxLength={200}
                  required
                />
                {!newTitle.trim() && <p className="text-sm text-red-400">Summary is required</p>}
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="min-h-32 border-slate-700 bg-slate-950/60"
                  placeholder="Type details, acceptance criteria, or checklist"
                  maxLength={2000}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={newPriority} onValueChange={setNewPriority}>
                    <SelectTrigger className="border-slate-700 bg-slate-950/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Parent</Label>
                  <Input
                    value={parent}
                    onChange={(e) => setParent(e.target.value)}
                    className="border-slate-700 bg-slate-950/60"
                    placeholder="Select parent"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Reporter *</Label>
                  <Input
                    value={reporter}
                    onChange={(e) => setReporter(e.target.value)}
                    className="border-slate-700 bg-slate-950/60"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border-slate-700 bg-slate-950/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due date</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="border-slate-700 bg-slate-950/60"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Sprint</Label>
                  <Input
                    value={sprint}
                    onChange={(e) => setSprint(e.target.value)}
                    className="border-slate-700 bg-slate-950/60"
                    placeholder="Select sprint"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Linked work item</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Select value={linkedType} onValueChange={setLinkedType}>
                      <SelectTrigger className="col-span-1 border-slate-700 bg-slate-950/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blocks">blocks</SelectItem>
                        <SelectItem value="relates_to">relates to</SelectItem>
                        <SelectItem value="duplicates">duplicates</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={linkedUrl}
                      onChange={(e) => setLinkedUrl(e.target.value)}
                      className="col-span-2 border-slate-700 bg-slate-950/60"
                      placeholder="Type or paste URL"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Attachment</Label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-700 p-4 text-slate-400 hover:bg-slate-800/40">
                  <Paperclip className="h-4 w-4" />
                  Drop files to attach or browse
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const names = Array.from(e.target.files || []).map((f) => f.name);
                      setAttachments(names);
                    }}
                  />
                </label>
                {attachments.length > 0 && (
                  <p className="text-xs text-slate-500">Attached: {attachments.join(", ")}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
                <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTask.isPending || !newTitle.trim()}>
                  {createTask.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="space-y-4 border-white/10 bg-black/35 p-4 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">GitHub Integration</h2>
            <p className="text-sm text-muted-foreground">
              {(board as any)?.github?.connected ? "Connected" : "Disconnected"}
              {connectedRepoUrl ? ` to ${connectedRepoUrl}` : ""}
            </p>
          </div>
          {(board as any)?.github?.connected ? (
            <Button variant="destructive" size="sm" onClick={handleDisconnectGitHub} disabled={updateBoardGitHub.isPending}>
              Disconnect
            </Button>
          ) : null}
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Input
            value={githubRepoUrl}
            onChange={(e) => setGithubRepoUrl(e.target.value)}
            placeholder="https://github.com/username/repository"
          />
          <Button onClick={handleConnectGitHub} disabled={updateBoardGitHub.isPending}>
            {(board as any)?.github?.connected ? "Reconnect Repository" : "Connect Repository"}
          </Button>
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">Auto mark task as Done</p>
            <p className="text-xs text-muted-foreground">When enabled, matching commit marks linked task done.</p>
          </div>
          <Switch checked={githubAutoDone} onCheckedChange={setGithubAutoDone} />
        </div>
        {webhookUrl && (
          <div className="rounded-md border bg-muted/30 p-3 text-xs">
            <p className="font-medium">Webhook endpoint</p>
            <p className="mt-1 break-all text-muted-foreground">{webhookUrl}</p>
            {githubWebhookSecret ? (
              <>
                <p className="mt-3 font-medium">Webhook secret (save now)</p>
                <p className="mt-1 break-all text-muted-foreground">{githubWebhookSecret}</p>
              </>
            ) : null}
            <p className="mt-2 text-muted-foreground">
              Set this URL in GitHub repository webhooks and use your board-specific secret.
            </p>
          </div>
        )}
      </Card>

      <Card className="border-white/10 bg-black/35 p-4 backdrop-blur-xl">
        <h2 className="mb-3 text-base font-semibold">Developer Activity</h2>
        {developerActivity && developerActivity.length > 0 ? (
          <div className="space-y-2">
            {developerActivity.map((dev: any) => (
              <div key={dev.id} className="flex items-center justify-between rounded-md border p-2">
                <div>
                  <p className="text-sm font-medium">{dev.author_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Last activity: {dev.last_activity_at ? new Date(dev.last_activity_at).toLocaleString() : "N/A"}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p>{dev.commit_count} commits</p>
                  <p className="text-muted-foreground">{dev.tasks_updated} tasks updated</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No commit activity yet for this board.</p>
        )}
      </Card>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {columns.map((col) => {
            const columnTasks = tasks?.filter((t) => t.status === col.id) ?? [];
            return (
              <div key={col.id} className={`min-h-[420px] rounded-xl border p-3 shadow-[0_0_35px_rgba(8,16,28,0.65)] ${col.color}`}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold tracking-wide text-slate-100">{col.title}</h3>
                  <Badge variant="secondary" className="border border-white/15 bg-black/35 text-xs text-slate-100">{columnTasks.length}</Badge>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[100px] space-y-2 rounded-lg p-1 transition-all ${
                        snapshot.isDraggingOver
                          ? "bg-white/10 shadow-[inset_0_0_0_1px_rgba(45,212,191,0.55),0_0_25px_rgba(45,212,191,0.25)]"
                          : "bg-black/20"
                      }`}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={snapshot.isDragging ? "rotate-2" : ""}
                            >
                              <Card
                                className={`cursor-pointer border border-white/10 bg-[#05080d]/90 p-3 text-slate-100 transition-all ${
                                  snapshot.isDragging
                                    ? "shadow-[0_0_28px_rgba(34,211,238,0.45)] ring-1 ring-cyan-300/40"
                                    : "hover:border-cyan-300/35 hover:shadow-[0_0_20px_rgba(34,211,238,0.18)]"
                                }`}
                                onClick={() => setSelectedTask(task.id)}
                              >
                                <div className="flex items-start gap-2">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="mt-0.5 cursor-grab rounded-md border border-white/10 bg-black/35 p-1 text-slate-400 active:cursor-grabbing"
                                  >
                                    <GripVertical className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-slate-100">{task.title}</p>
                                    {task.description && (
                                      <p className="mt-1 line-clamp-2 text-xs text-slate-400">{task.description}</p>
                                    )}
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                      <Badge variant="secondary" className={`border border-white/10 text-[10px] ${priorityColors[task.priority]}`}>
                                        {task.priority}
                                      </Badge>
                                      {task.work_type && (
                                        <Badge variant="outline" className="border-white/20 bg-black/35 text-[10px] text-slate-200">{task.work_type}</Badge>
                                      )}
                                      {task.due_date && (
                                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                          <Calendar className="h-3 w-3" />
                                          {new Date(task.due_date).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 shrink-0 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteTask.mutate(task.id);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {selectedTaskData && (
        <TaskDetailDialog
          task={selectedTaskData}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
        />
      )}
    </motion.div>
  );
}
