import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useState } from "react";

interface PriorityActionCardProps {
  priority: number;
  title: string;
  current: string;
  target: string;
  impactCount: number;
  timeEstimate: string;
  resources: Array<{ label: string; url: string }>;
  programs: string[];
}

export function PriorityActionCard({
  priority,
  title,
  current,
  target,
  impactCount,
  timeEstimate,
  resources,
  programs,
}: PriorityActionCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-sm">
          {priority}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <span>
              {current} → {target}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              Unlocks {impactCount} programs
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {timeEstimate}
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Resources:</p>
            <div className="flex flex-wrap gap-2">
              {resources.map((resource, index) => (
                <a
                  key={index}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  {resource.label}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-4 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            {expanded ? "Hide" : "View"} {impactCount} programs
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {expanded && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <ul className="space-y-1">
                {programs.map((program, index) => (
                  <li key={index} className="text-sm text-gray-600">
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
}
