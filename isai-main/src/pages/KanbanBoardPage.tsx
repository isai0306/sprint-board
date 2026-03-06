import { useState } from "react";
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
import { toast } from "sonner";
import TaskDetailDialog from "@/components/TaskDetailDialog";

type Status = "todo" | "in_progress" | "review" | "done";

const columns: { id: Status; title: string; color: string }[] = [
  { id: "todo", title: "To Do", color: "bg-warning/10 border-warning/30" },
  { id: "in_progress", title: "In Progress", color: "bg-primary/10 border-primary/30" },
  { id: "review", title: "Review", color: "bg-indigo-500/10 border-indigo-400/30" },
  { id: "done", title: "Done", color: "bg-success/10 border-success/30" },
];

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/20 text-primary",
  high: "bg-warning/20 text-warning",
  urgent: "bg-destructive/20 text-destructive",
};

export default function KanbanBoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { data: tasks } = useTasks(boardId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

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

    updateTask.mutate({ id: taskId, status });
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
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

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {columns.map((col) => {
            const columnTasks = tasks?.filter((t) => t.status === col.id) ?? [];
            return (
              <div key={col.id} className={`min-h-[400px] rounded-lg border p-3 ${col.color}`}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{col.title}</h3>
                  <Badge variant="secondary" className="text-xs">{columnTasks.length}</Badge>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[100px] space-y-2 rounded-md transition-colors ${snapshot.isDraggingOver ? "bg-primary/5" : ""}`}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={snapshot.isDragging ? "rotate-2 shadow-lg" : ""}
                            >
                              <Card
                                className="cursor-pointer bg-card p-3 transition-all hover:border-primary/50"
                                onClick={() => setSelectedTask(task.id)}
                              >
                                <div className="flex items-start gap-2">
                                  <div {...provided.dragHandleProps} className="mt-0.5 text-muted-foreground">
                                    <GripVertical className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">{task.title}</p>
                                    {task.description && (
                                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
                                    )}
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                      <Badge variant="secondary" className={`text-[10px] ${priorityColors[task.priority]}`}>
                                        {task.priority}
                                      </Badge>
                                      {task.work_type && (
                                        <Badge variant="outline" className="text-[10px]">{task.work_type}</Badge>
                                      )}
                                      {task.due_date && (
                                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                          <Calendar className="h-3 w-3" />
                                          {new Date(task.due_date).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
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
