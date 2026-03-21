import { useState } from "react";
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  AlertCircle,
  Info,
} from "lucide-react";
import { StatusBadge } from "./status-badge";

export interface Gap {
  type: string;
  requirement: string;
  current: string;
  severity: "high" | "medium" | "low";
}

export interface Action {
  action: string;
  why: string;
  priority: number;
  timeline: string;
  estimated_impact: string;
  difficulty: string;
}

export interface ProgramCardProps {
  university: string;
  programName: string;
  overallAssessment: "reachable" | "borderline" | "currently unlikely";
  gaps: Gap[];
  actions: Action[];
  alternatePaths: string[];
  detailUrl?: string | null;
  requiredCourses: string[];
  requiredGpa?: string | null;
  requiredTests: string[];
}

const assessmentConfig = {
  reachable: { label: "Reachable", variant: "eligible" as const, color: "green" },
  borderline: { label: "Borderline", variant: "almost" as const, color: "amber" },
  "currently unlikely": { label: "Unlikely", variant: "unlikely" as const, color: "red" },
};

const severityColors = {
  high: "text-red-600 bg-red-50 border-red-100",
  medium: "text-amber-600 bg-amber-50 border-amber-100",
  low: "text-green-600 bg-green-50 border-green-100",
};

const severityIcons = {
  high: AlertCircle,
  medium: AlertTriangle,
  low: Info,
};

export function ProgramCard({
  university,
  programName,
  overallAssessment,
  gaps,
  actions,
  alternatePaths,
  detailUrl,
  requiredCourses,
  requiredGpa,
  requiredTests,
}: ProgramCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = assessmentConfig[overallAssessment] ?? assessmentConfig["currently unlikely"];
  const highGaps = gaps.filter((g) => g.severity === "high").length;
  const topGap = gaps.length > 0 ? gaps[0] : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 sm:p-5 cursor-pointer"
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{university}</h3>
            <p className="text-sm text-gray-600 truncate">{programName}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge variant={config.variant}>{config.label}</StatusBadge>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>

        {/* Summary row */}
        <div className="flex items-center gap-3 text-sm flex-wrap">
          {gaps.length > 0 && (
            <span className="text-gray-500">
              {gaps.length} gap{gaps.length !== 1 ? "s" : ""}
              {highGaps > 0 && (
                <span className="text-red-500 ml-1">({highGaps} high)</span>
              )}
            </span>
          )}
          {requiredGpa && (
            <span className="text-gray-500">GPA: {requiredGpa}</span>
          )}
          {topGap && !expanded && (
            <span className="text-gray-400 truncate max-w-xs">
              Top gap: {topGap.requirement}
            </span>
          )}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 sm:p-5 space-y-5">
          {/* Gaps */}
          {gaps.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Gaps</h4>
              <div className="space-y-2">
                {gaps.map((gap, i) => {
                  const Icon = severityIcons[gap.severity] ?? Info;
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-2 p-2.5 rounded-lg border text-sm ${severityColors[gap.severity]}`}
                    >
                      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium">{gap.requirement}</p>
                        <p className="opacity-80">Current: {gap.current}</p>
                      </div>
                      <span className="ml-auto text-xs font-medium uppercase flex-shrink-0">
                        {gap.severity}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          {actions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Recommended Actions
              </h4>
              <div className="space-y-2">
                {actions
                  .sort((a, b) => a.priority - b.priority)
                  .map((action, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg text-sm"
                    >
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                        {action.priority}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900">{action.action}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{action.why}</p>
                        <div className="flex gap-2 mt-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-600">
                            {action.timeline}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-600">
                            Impact: {action.estimated_impact}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-600">
                            Difficulty: {action.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Alternate Paths */}
          {alternatePaths.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Alternate Paths
              </h4>
              <ul className="space-y-1">
                {alternatePaths.map((path, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    {path}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements summary + external link */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              {requiredCourses.length > 0 && (
                <span>{requiredCourses.length} required courses</span>
              )}
              {requiredTests.length > 0 && (
                <span className="ml-3">Tests: {requiredTests.join(", ")}</span>
              )}
            </div>
            {detailUrl && (
              <a
                href={detailUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:text-primary/80 border border-primary/20 rounded-md hover:bg-primary/5 transition-colors"
              >
                View program
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
