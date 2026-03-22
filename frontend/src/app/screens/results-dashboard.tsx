import { useMemo, useState } from "react";
import { useLocation, Link } from "react-router";
import { Search, ArrowRight } from "lucide-react";
import { NavBar } from "../components/nav-bar";
import { ProgramCard, type ProgramCardProps } from "../components/program-card";

type AssessmentCategory = "reachable" | "borderline" | "currently unlikely";

interface MatchProgram {
  name: string;
  required_courses: string[];
  required_gpa?: string | null;
  required_tests: string[];
  extracurriculars: string[];
  other_requirements: string[];
  detail_url?: string | null;
}

interface UniversityMatch {
  university: string;
  catalog_source: string;
  programs: MatchProgram[];
}

interface Assessment {
  program_id: string;
  overall_assessment: string;
  gaps: { type: string; requirement: string; current: string; severity: string }[];
  actions: {
    action: string;
    why: string;
    priority: number;
    timeline: string;
    estimated_impact: string;
    difficulty: string;
  }[];
  alternate_paths: string[];
}

interface LocationState {
  userType?: string;
  matches?: { matches: UniversityMatch[] };
  assessments?: { assessments: Assessment[] };
}

const tabs: { key: AssessmentCategory; label: string; activeClass: string }[] = [
  { key: "reachable", label: "Reachable", activeClass: "bg-green-50 text-green-600" },
  { key: "borderline", label: "Borderline", activeClass: "bg-amber-50 text-amber-600" },
  { key: "currently unlikely", label: "Unlikely", activeClass: "bg-red-50 text-red-600" },
];

export function ResultsDashboard() {
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [activeTab, setActiveTab] = useState<AssessmentCategory>("reachable");
  const [searchQuery, setSearchQuery] = useState("");

  // Join matches + assessments into a flat list
  const programs = useMemo(() => {
    const matchList = state?.matches?.matches ?? [];
    const assessmentList = state?.assessments?.assessments ?? [];

    // Index assessments by program_id
    const assessmentMap = new Map<string, Assessment>();
    for (const a of assessmentList) {
      assessmentMap.set(a.program_id, a);
    }

    const result: (ProgramCardProps & { category: AssessmentCategory })[] = [];

    for (const match of matchList) {
      for (const program of match.programs) {
        const programId = `${match.university} ${program.name}`;
        const assessment = assessmentMap.get(programId);

        const overallAssessment = (
          assessment?.overall_assessment === "reachable" ||
          assessment?.overall_assessment === "borderline" ||
          assessment?.overall_assessment === "currently unlikely"
            ? assessment.overall_assessment
            : "currently unlikely"
        ) as AssessmentCategory;

        result.push({
          university: match.university,
          programName: program.name,
          overallAssessment,
          gaps: (assessment?.gaps ?? []).map((g) => ({
            ...g,
            severity: (g.severity === "high" || g.severity === "medium" || g.severity === "low"
              ? g.severity
              : "medium") as "high" | "medium" | "low",
          })),
          actions: assessment?.actions ?? [],
          alternatePaths: assessment?.alternate_paths ?? [],
          detailUrl: program.detail_url,
          requiredCourses: program.required_courses,
          requiredGpa: program.required_gpa,
          requiredTests: program.required_tests,
          category: overallAssessment,
        });
      }
    }

    return result;
  }, [state]);

  const counts = useMemo(() => {
    const c = { reachable: 0, borderline: 0, "currently unlikely": 0 };
    for (const p of programs) c[p.category]++;
    return c;
  }, [programs]);

  const filtered = programs.filter((p) => {
    if (p.category !== activeTab) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.university.toLowerCase().includes(q) ||
      p.programName.toLowerCase().includes(q)
    );
  });

  const hasData = programs.length > 0;

  return (
    <div className="min-h-screen bg-[#F8F7F5]">
      <NavBar />

      {/* Summary Bar */}
      <div className="bg-primary/5 border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {hasData ? (
            <div className="flex flex-wrap items-center gap-4 text-sm sm:text-base">
              <span className="font-semibold text-green-700">
                {counts.reachable} reachable
              </span>
              <span className="text-gray-400">·</span>
              <span className="font-semibold text-amber-600">
                {counts.borderline} borderline
              </span>
              <span className="text-gray-400">·</span>
              <span className="font-semibold text-red-600">
                {counts["currently unlikely"]} unlikely
              </span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-600">
                {programs.length} programs assessed
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              No results yet. Complete the school wizard to see your program matches.
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {hasData && (
          <>
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search programs or universities..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-white p-1 rounded-lg border border-gray-200 w-full sm:w-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 sm:flex-none px-6 py-2.5 rounded-md font-medium transition-colors cursor-pointer ${
                    activeTab === tab.key
                      ? tab.activeClass
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.label} ({counts[tab.key]})
                </button>
              ))}
            </div>

            {/* Program Cards */}
            <div className="grid gap-4 mb-8">
              {filtered.length > 0 ? (
                filtered.map((program, i) => (
                  <ProgramCard key={`${program.university}-${program.programName}-${i}`} {...program} />
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-500">No programs found matching your filters.</p>
                </div>
              )}
            </div>

            {/* Study Plan Link */}
            {state?.assessments && (
              <Link
                to="/study-plan"
                state={{ assessments: state.assessments }}
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
              >
                View my study plan
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
