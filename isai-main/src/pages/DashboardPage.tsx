import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { ArrowUpRight, CheckCircle2, Clock3, FolderKanban, Flame, ListTodo } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const chartColors = {
  todo: "#f59e0b",
  progress: "#22d3ee",
  review: "#818cf8",
  done: "#22c55e",
  accent: "#3b82f6",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: workspaces } = useWorkspaces();
  const { data: tasks } = useTasks();

  const todoCount = tasks?.filter((t) => t.status === "todo").length ?? 0;
  const inProgressCount = tasks?.filter((t) => t.status === "in_progress").length ?? 0;
  const reviewCount = tasks?.filter((t) => t.status === "review").length ?? 0;
  const doneCount = tasks?.filter((t) => t.status === "done").length ?? 0;
  const totalTasks = tasks?.length ?? 0;

  const lineData = [
    { month: "Jan", throughput: 8, backlog: 10 },
    { month: "Feb", throughput: 12, backlog: 9 },
    { month: "Mar", throughput: 10, backlog: 8 },
    { month: "Apr", throughput: 14, backlog: 7 },
    { month: "May", throughput: 9, backlog: 10 },
    { month: "Jun", throughput: 16, backlog: 7 },
  ];

  const barData = [
    { name: "Todo", value: todoCount },
    { name: "Progress", value: inProgressCount },
    { name: "Review", value: reviewCount },
    { name: "Done", value: doneCount },
  ];

  const pieData = [
    { name: "To Do", value: todoCount, color: chartColors.todo },
    { name: "In Progress", value: inProgressCount, color: chartColors.progress },
    { name: "Review", value: reviewCount, color: chartColors.review },
    { name: "Done", value: doneCount, color: chartColors.done },
  ];

  const metrics = [
    {
      title: "Projects",
      value: workspaces?.length ?? 0,
      delta: "+12%",
      icon: FolderKanban,
      iconColor: "text-cyan-300",
    },
    {
      title: "Total Tasks",
      value: totalTasks,
      delta: "+8.4%",
      icon: ListTodo,
      iconColor: "text-blue-300",
    },
    {
      title: "In Progress",
      value: inProgressCount,
      delta: "+5.1%",
      icon: Clock3,
      iconColor: "text-amber-300",
    },
    {
      title: "In Review",
      value: reviewCount,
      delta: "+4.2%",
      icon: Clock3,
      iconColor: "text-indigo-300",
    },
    {
      title: "Completed",
      value: doneCount,
      delta: "+18.9%",
      icon: CheckCircle2,
      iconColor: "text-emerald-300",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 rounded-2xl bg-[radial-gradient(circle_at_top_right,#0ea5e922_0%,transparent_35%),linear-gradient(180deg,#0a0f1f_0%,#101827_100%)] p-4 text-slate-100 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Overview, {profile?.username || user?.email?.split("@")[0]}
          </h1>
          <p className="text-sm text-slate-400">Track velocity, backlog, and delivery health.</p>
        </div>
        <Button className="bg-blue-500 text-white hover:bg-blue-400">
          Generate Report
          <ArrowUpRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <Card key={metric.title} className="border-slate-800 bg-slate-900/80 text-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm text-slate-400">
                {metric.title}
                <metric.icon className={`h-4 w-4 ${metric.iconColor}`} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{metric.value}</p>
              <p className="mt-1 text-xs text-emerald-400">{metric.delta} from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900/80 text-slate-100 xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base text-slate-200">Sprint Throughput vs Backlog</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0" }}
                />
                <Line type="monotone" dataKey="throughput" stroke={chartColors.progress} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="backlog" stroke={chartColors.accent} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/80 text-slate-100">
          <CardHeader>
            <CardTitle className="text-base text-slate-200">Task Split</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={65} outerRadius={95} paddingAngle={5}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900/80 text-slate-100 xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base text-slate-200">Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0" }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill={chartColors.accent} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/80 text-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-slate-200">
              <Flame className="h-4 w-4 text-orange-300" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks && tasks.length > 0 ? (
              tasks.slice(0, 6).map((task) => (
                <div key={task.id} className="rounded-md border border-slate-800 bg-slate-950/60 p-2.5">
                  <p className="truncate text-sm text-slate-200">{task.title}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                    <Badge variant="outline" className="border-slate-700 text-slate-300">
                      {task.status.replace("_", " ")}
                    </Badge>
                    <span>{task.priority}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No activity yet. Create a board task to start.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
