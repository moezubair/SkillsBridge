import { Check, AlertCircle } from "lucide-react";

interface MatchChecklistRowProps {
  label: string;
  required: string;
  yours: string;
  met: boolean;
}

export function MatchChecklistRow({ label, required, yours, met }: MatchChecklistRowProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div
        className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
          met ? "bg-green-100" : "bg-amber-100"
        }`}
      >
        {met ? (
          <Check className="w-3.5 h-3.5 text-green-600" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-medium text-gray-900">{label}</span>
          <span className={`text-sm ${met ? "text-green-600" : "text-amber-600"}`}>
            {met ? "Met" : "Gap"}
          </span>
        </div>
        <div className="mt-1 text-sm text-gray-600">
          <span className="font-medium">Required:</span> {required}
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium">Yours:</span> {yours}
        </div>
      </div>
    </div>
  );
}
