import { Check } from "lucide-react";

interface Step {
  label: string;
  status: "pending" | "active" | "done";
}

interface ProgressStepperProps {
  steps: Step[];
}

export function ProgressStepper({ steps }: ProgressStepperProps) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 py-8">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-2 sm:gap-4">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors ${
                step.status === "done"
                  ? "bg-green-500 text-white"
                  : step.status === "active"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {step.status === "done" ? (
                <Check className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <span className="text-sm sm:text-base">{index + 1}</span>
              )}
            </div>
            <span
              className={`text-xs sm:text-sm font-medium ${
                step.status === "active"
                  ? "text-gray-900"
                  : "text-gray-500"
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-8 sm:w-16 h-0.5 mb-6 ${
                step.status === "done" ? "bg-green-500" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
