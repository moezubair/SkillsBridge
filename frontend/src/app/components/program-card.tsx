import { ExternalLink, Bookmark } from "lucide-react";
import { Link } from "react-router";
import { StatusBadge } from "./status-badge";

interface ProgramCardProps {
  id: string;
  universityName: string;
  programName: string;
  country: string;
  countryFlag: string;
  degree: "bachelor" | "master" | "phd";
  qsRank?: number;
  tuition: string;
  matchPercentage: number;
  status: "eligible" | "almost";
  gap?: string;
}

export function ProgramCard({
  id,
  universityName,
  programName,
  country,
  countryFlag,
  degree,
  qsRank,
  tuition,
  matchPercentage,
  status,
  gap,
}: ProgramCardProps) {
  const degreeLabels = {
    bachelor: "BSc",
    master: "MSc",
    phd: "PhD",
  };

  return (
    <Link to={`/program/${id}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{countryFlag}</span>
              <h3 className="font-semibold text-gray-900 truncate">
                {universityName}
              </h3>
            </div>
            <p className="text-sm text-gray-600 truncate">{programName}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusBadge variant={degree}>{degreeLabels[degree]}</StatusBadge>
              <StatusBadge variant={status}>
                {status === "eligible" ? "Eligible" : "Almost There"}
              </StatusBadge>
              {qsRank && (
                <span className="text-xs text-gray-500">QS #{qsRank}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm ${
                status === "eligible"
                  ? "bg-green-50 text-green-600"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              {matchPercentage}%
            </div>
            <button className="p-1 hover:bg-gray-100 rounded transition-colors">
              <Bookmark className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="text-sm">
            <span className="text-gray-500">Tuition:</span>{" "}
            <span className="font-medium text-gray-900">{tuition}</span>
          </div>
          <div className="text-sm text-gray-500">{country}</div>
        </div>

        {gap && status === "almost" && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-amber-500">Gap:</span>
              <span className="text-xs text-gray-600">{gap}</span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
