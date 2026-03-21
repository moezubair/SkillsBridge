import { Download, Share2 } from "lucide-react";
import { NavBar } from "../components/nav-bar";
import { PriorityActionCard } from "../components/priority-action-card";
import { studyPlanGaps } from "../data/mock-data";
import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Calendar,
  TrendingUp,
  Target,
  Award,
  BookOpen,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Star,
  Zap,
  BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface Milestone {
  id: string;
  title: string;
  description: string;
  timeframe: string;
  status: "completed" | "in-progress" | "upcoming";
  tasks: { id: string; title: string; completed: boolean }[];
  color: string;
}

const milestones: Milestone[] = [
  {
    id: "1",
    title: "IELTS Preparation",
    description: "Intensive English language preparation to achieve band 7.5",
    timeframe: "Month 1-2",
    status: "in-progress",
    color: "blue",
    tasks: [
      { id: "1-1", title: "Complete diagnostic test", completed: true },
      { id: "1-2", title: "Enroll in prep course", completed: true },
      { id: "1-3", title: "Practice speaking weekly", completed: false },
      { id: "1-4", title: "Take 3 full mock tests", completed: false },
      { id: "1-5", title: "Register for official exam", completed: false },
    ],
  },
  {
    id: "2",
    title: "Linear Algebra Course",
    description: "Complete accredited online course with certificate",
    timeframe: "Month 2-4",
    status: "upcoming",
    color: "purple",
    tasks: [
      { id: "2-1", title: "Choose course platform", completed: false },
      { id: "2-2", title: "Complete modules 1-5", completed: false },
      { id: "2-3", title: "Complete modules 6-10", completed: false },
      { id: "2-4", title: "Pass final exam", completed: false },
      { id: "2-5", title: "Receive certificate", completed: false },
    ],
  },
  {
    id: "3",
    title: "GRE Examination",
    description: "Prepare for and complete GRE with target score 320+",
    timeframe: "Month 3-4",
    status: "upcoming",
    color: "green",
    tasks: [
      { id: "3-1", title: "Take diagnostic test", completed: false },
      { id: "3-2", title: "Study verbal reasoning", completed: false },
      { id: "3-3", title: "Study quantitative reasoning", completed: false },
      { id: "3-4", title: "Practice analytical writing", completed: false },
      { id: "3-5", title: "Schedule and take GRE", completed: false },
    ],
  },
  {
    id: "4",
    title: "Application Season",
    description: "Apply to expanded list of programs worldwide",
    timeframe: "Month 5+",
    status: "upcoming",
    color: "amber",
    tasks: [
      { id: "4-1", title: "Prepare application documents", completed: false },
      { id: "4-2", title: "Request recommendation letters", completed: false },
      { id: "4-3", title: "Write personal statements", completed: false },
      { id: "4-4", title: "Submit applications", completed: false },
      { id: "4-5", title: "Prepare for interviews", completed: false },
    ],
  },
];

const progressData = [
  { month: "Now", completion: 0, id: "progress-0" },
  { month: "Month 1", completion: 15, id: "progress-1" },
  { month: "Month 2", completion: 35, id: "progress-2" },
  { month: "Month 3", completion: 60, id: "progress-3" },
  { month: "Month 4", completion: 85, id: "progress-4" },
  { month: "Month 5", completion: 100, id: "progress-5" },
];

export function StudyPlan() {
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>("1");
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(
    new Set(["1-1", "1-2"])
  );

  const totalGaps = studyPlanGaps.length;
  const totalMonths = 5;
  const totalPrograms = studyPlanGaps.reduce(
    (sum, gap) => sum + gap.impactCount,
    0
  );

  const allTasks = milestones.flatMap((m) => m.tasks);
  const completedCount = Array.from(completedTasks).length;
  const totalTasks = allTasks.length;
  const overallProgress = Math.round((completedCount / totalTasks) * 100);

  const toggleTask = (taskId: string) => {
    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(taskId)) {
      newCompleted.delete(taskId);
    } else {
      newCompleted.add(taskId);
    }
    setCompletedTasks(newCompleted);
  };

  const pieData = [
    { name: "Completed", value: completedCount },
    { name: "Remaining", value: totalTasks - completedCount },
  ];

  const COLORS = ["#D4A84C", "#e5e7eb"];

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-[#9B1B30] mb-3 tracking-tight">
                Your Study Plan
              </h1>
              <p className="text-xl text-gray-700">
                Complete these milestones to unlock{" "}
                <span className="font-bold text-[#D4A84C]">
                  {totalPrograms} more programs
                </span>
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#9B1B30] text-white rounded-lg hover:bg-[#8B1528] transition-all shadow-lg shadow-[#9B1B30]/30 font-semibold uppercase tracking-wide text-sm"
              >
                <Download className="w-5 h-5" />
                Export Plan
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#9B1B30] text-[#9B1B30] rounded-lg hover:bg-[#9B1B30] hover:text-white transition-all font-semibold uppercase tracking-wide text-sm"
              >
                <Share2 className="w-5 h-5" />
                Share
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#D4A84C] text-[#D4A84C] rounded-lg hover:bg-[#D4A84C] hover:text-white transition-all font-semibold uppercase tracking-wide text-sm"
              >
                <Calendar className="w-5 h-5" />
                Add to Calendar
              </motion.button>
            </div>
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border-2 border-[#9B1B30]/10 p-6 shadow-sm hover:shadow-md transition-shadow hover:border-[#9B1B30]/30"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Overall Progress</p>
                <Target className="w-5 h-5 text-[#9B1B30]" />
              </div>
              <p className="text-5xl font-extrabold text-[#9B1B30] mb-2">
                {overallProgress}<span className="text-2xl text-[#D4A84C]">%</span>
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="bg-gradient-to-r from-[#9B1B30] to-[#D4A84C] h-2.5 rounded-full"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border-2 border-[#9B1B30]/10 p-6 shadow-sm hover:shadow-md transition-shadow hover:border-[#9B1B30]/30"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Time Investment</p>
                <Clock className="w-5 h-5 text-[#9B1B30]" />
              </div>
              <p className="text-5xl font-extrabold text-[#9B1B30]">
                {totalMonths}
              </p>
              <p className="text-sm text-gray-600 mt-1 font-medium uppercase tracking-wide">Months • ~15-20 hrs/week</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border-2 border-[#D4A84C]/20 p-6 shadow-sm hover:shadow-md transition-shadow hover:border-[#D4A84C]/50"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Programs Unlocked</p>
                <TrendingUp className="w-5 h-5 text-[#D4A84C]" />
              </div>
              <p className="text-5xl font-extrabold text-[#D4A84C]">{totalPrograms}</p>
              <p className="text-sm text-gray-600 mt-1 font-medium uppercase tracking-wide">Including 3 top-10 ranked</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl border-2 border-[#9B1B30]/10 p-6 shadow-sm hover:shadow-md transition-shadow hover:border-[#9B1B30]/30"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tasks Completed</p>
                <Award className="w-5 h-5 text-[#9B1B30]" />
              </div>
              <p className="text-5xl font-extrabold text-[#9B1B30]">
                {completedCount}<span className="text-3xl text-gray-400">/{totalTasks}</span>
              </p>
              <p className="text-sm text-gray-600 mt-1 font-medium">Keep up the momentum!</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Milestones & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Milestones */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Milestones</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {completedCount} of {totalTasks} tasks
                </div>
              </div>

              <div className="space-y-3">
                {milestones.map((milestone, index) => {
                  const milestoneTaskIds = milestone.tasks.map((t) => t.id);
                  const milestoneDone = milestoneTaskIds.filter((id) =>
                    completedTasks.has(id)
                  ).length;
                  const milestoneProgress = Math.round(
                    (milestoneDone / milestone.tasks.length) * 100
                  );
                  const isExpanded = expandedMilestone === milestone.id;

                  return (
                    <motion.div
                      key={milestone.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`border-2 rounded-xl overflow-hidden transition-all ${
                        milestone.status === "in-progress"
                          ? `border-${milestone.color}-300 bg-${milestone.color}-50/50`
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <button
                        onClick={() =>
                          setExpandedMilestone(
                            isExpanded ? null : milestone.id
                          )
                        }
                        className="w-full p-5 text-left hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            {milestone.status === "completed" ? (
                              <CheckCircle2 className="w-6 h-6 text-green-500" />
                            ) : milestone.status === "in-progress" ? (
                              <div className="w-6 h-6 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                            ) : (
                              <Circle className="w-6 h-6 text-gray-400" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">
                                  {milestone.title}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {milestone.description}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span
                                  className={`inline-block px-3 py-1 rounded-lg text-xs font-medium bg-${milestone.color}-100 text-${milestone.color}-700`}
                                >
                                  {milestone.timeframe}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${milestoneProgress}%` }}
                                  className={`bg-${milestone.color}-600 h-2 rounded-full`}
                                  style={{
                                    backgroundColor:
                                      milestone.color === "blue"
                                        ? "#2563eb"
                                        : milestone.color === "purple"
                                        ? "#9333ea"
                                        : milestone.color === "green"
                                        ? "#10b981"
                                        : "#f59e0b",
                                  }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-600">
                                {milestoneProgress}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-gray-200"
                          >
                            <div className="p-5 space-y-2">
                              {milestone.tasks.map((task) => {
                                const isCompleted = completedTasks.has(task.id);
                                return (
                                  <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => toggleTask(task.id)}
                                  >
                                    <div className="flex-shrink-0">
                                      {isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                      ) : (
                                        <Circle className="w-5 h-5 text-gray-400" />
                                      )}
                                    </div>
                                    <span
                                      className={`flex-1 text-sm ${
                                        isCompleted
                                          ? "line-through text-gray-500"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      {task.title}
                                    </span>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Priority Actions */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Zap className="w-6 h-6 text-amber-500" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Priority Actions
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                Sorted by impact — start with the highest priority to unlock the
                most programs.
              </p>
              <div className="space-y-4">
                {studyPlanGaps.map((gap) => (
                  <PriorityActionCard key={gap.priority} {...gap} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Analytics & Resources */}
          <div className="space-y-6">
            {/* Progress Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-[#9B1B30]" />
                <h3 className="font-semibold text-gray-900 uppercase tracking-wide text-sm">
                  Progress Forecast
                </h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={progressData}>
                    <defs>
                      <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9B1B30" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#9B1B30" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                    />
                    <YAxis
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="completion"
                      stroke="#9B1B30"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorProgress)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Task Distribution */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 uppercase tracking-wide text-sm">
                Task Distribution
              </h3>
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`pie-cell-${entry.name}-${index}`}
                            fill={COLORS[index]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <p className="text-4xl font-extrabold text-[#9B1B30]">
                      {overallProgress}
                      <span className="text-2xl text-[#D4A84C]">%</span>
                    </p>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                      Complete
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#D4A84C]" />
                    <span className="text-gray-600 font-medium">Completed</span>
                  </div>
                  <span className="font-bold text-[#9B1B30]">
                    {completedCount} tasks
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-300" />
                    <span className="text-gray-600 font-medium">Remaining</span>
                  </div>
                  <span className="font-bold text-gray-700">
                    {totalTasks - completedCount} tasks
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Resources */}
            <div className="bg-gradient-to-br from-[#9B1B30] to-[#7A1420] rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5" />
                <h3 className="font-bold uppercase tracking-wide text-sm">Recommended Resources</h3>
              </div>
              <div className="space-y-3">
                {[
                  {
                    name: "IELTS Prep Course",
                    provider: "British Council",
                    rating: 4.8,
                  },
                  {
                    name: "Linear Algebra",
                    provider: "MIT OpenCourseWare",
                    rating: 4.9,
                  },
                  {
                    name: "GRE Official Guide",
                    provider: "ETS",
                    rating: 4.7,
                  },
                ].map((resource, index) => (
                  <motion.a
                    key={index}
                    href="#"
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors border border-white/10"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-sm">{resource.name}</p>
                      <p className="text-xs text-white/80">
                        {resource.provider}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-[#D4A84C] px-2 py-1 rounded">
                        <Star className="w-3 h-3 fill-current text-white" />
                        <span className="text-xs font-bold">{resource.rating}</span>
                      </div>
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Motivational Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-[#D4A84C] to-[#C49840] rounded-2xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center gap-3 mb-3">
                <Award className="w-8 h-8" />
                <h3 className="text-xl font-extrabold">You're on track! 🎯</h3>
              </div>
              <p className="text-white/90 mb-4 font-medium">
                Complete these steps and you'll have access to {totalPrograms} more
                world-class programs, including ETH Zurich, Imperial College, and
                EPFL.
              </p>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30">
                <p className="text-sm font-bold mb-1 uppercase tracking-wide">Next Milestone</p>
                <p className="text-sm text-white/90">
                  Complete IELTS practice test by next week
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}