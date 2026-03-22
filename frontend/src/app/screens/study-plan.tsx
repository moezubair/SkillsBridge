import { Download, Share2 } from "lucide-react";
import { NavBar } from "../components/nav-bar";
import { useState, useMemo } from "react";
import { useLocation, Link } from "react-router";
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
  AlertCircle,
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

// Types from the assess API
interface Gap {
  type: string;
  requirement: string;
  current: string;
  severity: string;
}

interface Action {
  action: string;
  why: string;
  priority: number;
  timeline: string;
  estimated_impact: string;
  difficulty: string;
}

interface Assessment {
  program_id: string;
  overall_assessment: string;
  gaps: Gap[];
  actions: Action[];
  alternate_paths: string[];
}

interface LocationState {
  assessments?: { assessments: Assessment[] };
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  timeframe: string;
  status: "completed" | "in-progress" | "upcoming";
  tasks: { id: string; title: string; completed: boolean }[];
  color: string;
}

interface PriorityGap {
  priority: number;
  title: string;
  current: string;
  target: string;
  severity: string;
  impactCount: number;
  programs: string[];
}

const timelineColors: Record<string, string> = {
  immediate: "blue",
  "next term": "purple",
  "next year": "green",
};

function getColor(timeline: string): string {
  const lower = timeline.toLowerCase();
  for (const [key, color] of Object.entries(timelineColors)) {
    if (lower.includes(key)) return color;
  }
  return "amber";
}

function getStatus(timeline: string): "in-progress" | "upcoming" {
  return timeline.toLowerCase().includes("immediate") ? "in-progress" : "upcoming";
}

export function StudyPlan() {
  const location = useLocation();
  const state = location.state as LocationState | null;
  const assessments = state?.assessments?.assessments ?? [];

  // Transform assessments into milestones (group actions by timeline)
  const { milestones, priorityGaps } = useMemo(() => {
    // Deduplicate actions by action text, track which programs they appear in
    const actionMap = new Map<
      string,
      { action: Action; programs: Set<string> }
    >();
    const gapMap = new Map<
      string,
      { gap: Gap; programs: Set<string> }
    >();

    for (const assessment of assessments) {
      for (const action of assessment.actions) {
        const key = action.action.toLowerCase().trim();
        if (!actionMap.has(key)) {
          actionMap.set(key, { action, programs: new Set() });
        }
        actionMap.get(key)!.programs.add(assessment.program_id);
      }
      for (const gap of assessment.gaps) {
        const key = `${gap.type}:${gap.requirement.toLowerCase().trim()}`;
        if (!gapMap.has(key)) {
          gapMap.set(key, { gap, programs: new Set() });
        }
        gapMap.get(key)!.programs.add(assessment.program_id);
      }
    }

    // Group actions by timeline into milestones
    const timelineGroups = new Map<string, { action: Action; programs: Set<string> }[]>();
    for (const entry of actionMap.values()) {
      const timeline = entry.action.timeline || "next year";
      if (!timelineGroups.has(timeline)) {
        timelineGroups.set(timeline, []);
      }
      timelineGroups.get(timeline)!.push(entry);
    }

    // Sort timelines: immediate first, then next term, then next year
    const timelineOrder = ["immediate", "next term", "next year"];
    const sortedTimelines = Array.from(timelineGroups.keys()).sort((a, b) => {
      const aIdx = timelineOrder.findIndex((t) => a.toLowerCase().includes(t));
      const bIdx = timelineOrder.findIndex((t) => b.toLowerCase().includes(t));
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
    });

    const milestones: Milestone[] = sortedTimelines.map((timeline, idx) => {
      const entries = timelineGroups.get(timeline)!;
      entries.sort((a, b) => a.action.priority - b.action.priority);
      return {
        id: String(idx + 1),
        title: timeline.charAt(0).toUpperCase() + timeline.slice(1),
        description: `${entries.length} action${entries.length !== 1 ? "s" : ""} across ${new Set(entries.flatMap((e) => [...e.programs])).size} programs`,
        timeframe: timeline,
        status: idx === 0 ? "in-progress" : "upcoming",
        color: getColor(timeline),
        tasks: entries.map((e, i) => ({
          id: `${idx + 1}-${i + 1}`,
          title: e.action.action,
          completed: false,
        })),
      };
    });

    // Build priority gaps sorted by impact (number of programs affected)
    const priorityGaps: PriorityGap[] = Array.from(gapMap.values())
      .sort((a, b) => b.programs.size - a.programs.size)
      .slice(0, 10)
      .map((entry, idx) => ({
        priority: idx + 1,
        title: entry.gap.requirement,
        current: entry.gap.current,
        target: entry.gap.requirement,
        severity: entry.gap.severity,
        impactCount: entry.programs.size,
        programs: Array.from(entry.programs),
      }));

    return { milestones, priorityGaps };
  }, [assessments]);

  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(
    milestones.length > 0 ? milestones[0].id : null
  );
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [expandedGap, setExpandedGap] = useState<string | null>(null);

  const allTasks = milestones.flatMap((m) => m.tasks);
  const completedCount = completedTasks.size;
  const totalTasks = allTasks.length;
  const overallProgress =
    totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const toggleTask = (taskId: string) => {
    const next = new Set(completedTasks);
    if (next.has(taskId)) next.delete(taskId);
    else next.add(taskId);
    setCompletedTasks(next);
  };

  const pieData = [
    { name: "Completed", value: completedCount },
    { name: "Remaining", value: Math.max(totalTasks - completedCount, 0) },
  ];
  const COLORS = ["#D4A84C", "#e5e7eb"];

  const totalPrograms = assessments.length;
  const totalMonths = milestones.length > 0 ? milestones.length * 2 : 0;

  // Generate progress forecast data
  const progressData = milestones.length > 0
    ? [
        { month: "Now", completion: 0 },
        ...milestones.map((m, i) => ({
          month: m.title,
          completion: Math.round(((i + 1) / milestones.length) * 100),
        })),
      ]
    : [];

  if (assessments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            No assessment data
          </h2>
          <p className="text-gray-600 mb-6">
            Complete the school wizard to get your program assessments and generate a study plan.
          </p>
          <Link
            to="/school-wizard"
            className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Go to School Wizard
          </Link>
        </div>
      </div>
    );
  }

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
                Complete these milestones to improve your chances for{" "}
                <span className="font-bold text-[#D4A84C]">
                  {totalPrograms} programs
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
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Overall Progress
                </p>
                <Target className="w-5 h-5 text-[#9B1B30]" />
              </div>
              <p className="text-5xl font-extrabold text-[#9B1B30] mb-2">
                {overallProgress}
                <span className="text-2xl text-[#D4A84C]">%</span>
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
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Milestones
                </p>
                <Clock className="w-5 h-5 text-[#9B1B30]" />
              </div>
              <p className="text-5xl font-extrabold text-[#9B1B30]">
                {milestones.length}
              </p>
              <p className="text-sm text-gray-600 mt-1 font-medium uppercase tracking-wide">
                Phases to complete
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border-2 border-[#D4A84C]/20 p-6 shadow-sm hover:shadow-md transition-shadow hover:border-[#D4A84C]/50"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Programs Assessed
                </p>
                <TrendingUp className="w-5 h-5 text-[#D4A84C]" />
              </div>
              <p className="text-5xl font-extrabold text-[#D4A84C]">
                {totalPrograms}
              </p>
              <p className="text-sm text-gray-600 mt-1 font-medium uppercase tracking-wide">
                Across all universities
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl border-2 border-[#9B1B30]/10 p-6 shadow-sm hover:shadow-md transition-shadow hover:border-[#9B1B30]/30"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Tasks Completed
                </p>
                <Award className="w-5 h-5 text-[#9B1B30]" />
              </div>
              <p className="text-5xl font-extrabold text-[#9B1B30]">
                {completedCount}
                <span className="text-3xl text-gray-400">/{totalTasks}</span>
              </p>
              <p className="text-sm text-gray-600 mt-1 font-medium">
                Keep up the momentum!
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Milestones & Gaps */}
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
                  const milestoneProgress =
                    milestone.tasks.length > 0
                      ? Math.round(
                          (milestoneDone / milestone.tasks.length) * 100
                        )
                      : 0;
                  const isExpanded = expandedMilestone === milestone.id;

                  const colorMap: Record<string, string> = {
                    blue: "#2563eb",
                    purple: "#9333ea",
                    green: "#10b981",
                    amber: "#f59e0b",
                  };

                  return (
                    <motion.div
                      key={milestone.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`border-2 rounded-xl overflow-hidden transition-all ${
                        milestone.status === "in-progress"
                          ? "border-blue-300 bg-blue-50/50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <button
                        onClick={() =>
                          setExpandedMilestone(isExpanded ? null : milestone.id)
                        }
                        className="w-full p-5 text-left hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            {milestoneProgress === 100 ? (
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
                                <span className="inline-block px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
                                  {milestone.tasks.length} tasks
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
                                  animate={{
                                    width: `${milestoneProgress}%`,
                                  }}
                                  className="h-2 rounded-full"
                                  style={{
                                    backgroundColor:
                                      colorMap[milestone.color] ?? "#f59e0b",
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

            {/* Priority Gaps */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Zap className="w-6 h-6 text-amber-500" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Priority Gaps
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                Sorted by impact — addressing the top gaps improves your chances
                for the most programs.
              </p>
              <div className="space-y-4">
                {priorityGaps.map((gap) => {
                  const isExp = expandedGap === String(gap.priority);
                  const severityColors: Record<string, string> = {
                    high: "bg-red-50 text-red-600",
                    medium: "bg-amber-50 text-amber-600",
                    low: "bg-green-50 text-green-600",
                  };
                  return (
                    <div
                      key={gap.priority}
                      className="bg-white rounded-lg border border-gray-200 p-5"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm">
                          {gap.priority}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {gap.title}
                          </h3>
                          <div className="text-sm text-gray-600 mb-3">
                            Current: {gap.current}
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                severityColors[gap.severity] ??
                                severityColors.medium
                              }`}
                            >
                              {gap.severity} severity
                            </span>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
                              Affects {gap.impactCount} program
                              {gap.impactCount !== 1 ? "s" : ""}
                            </span>
                          </div>

                          <button
                            onClick={() =>
                              setExpandedGap(isExp ? null : String(gap.priority))
                            }
                            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
                          >
                            {isExp ? "Hide" : "View"} {gap.impactCount} programs
                            {isExp ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>

                          {isExp && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <ul className="space-y-1">
                                {gap.programs.map((program, i) => (
                                  <li
                                    key={i}
                                    className="text-sm text-gray-600"
                                  >
                                    • {program}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Analytics */}
          <div className="space-y-6">
            {/* Progress Chart */}
            {progressData.length > 0 && (
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
                        <linearGradient
                          id="colorProgress"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#9B1B30"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#9B1B30"
                            stopOpacity={0}
                          />
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
            )}

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

            {/* Motivational Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-[#D4A84C] to-[#C49840] rounded-2xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center gap-3 mb-3">
                <Award className="w-8 h-8" />
                <h3 className="text-xl font-extrabold">You can do this!</h3>
              </div>
              <p className="text-white/90 mb-4 font-medium">
                Address {priorityGaps.length} key gaps to strengthen your
                applications across {totalPrograms} programs.
              </p>
              {milestones.length > 0 && (
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30">
                  <p className="text-sm font-bold mb-1 uppercase tracking-wide">
                    First Milestone
                  </p>
                  <p className="text-sm text-white/90">
                    {milestones[0].title}: {milestones[0].tasks.length} actions
                    to complete
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
