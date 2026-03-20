import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Check, Loader2 } from "lucide-react";

interface ProcessingStep {
  label: string;
  status: "pending" | "processing" | "done";
}

export function Processing() {
  const navigate = useNavigate();
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { label: "Extracted 8 subjects", status: "pending" },
    { label: "Matched 4 majors", status: "pending" },
    { label: "Scanning 2,400 programs...", status: "pending" },
    { label: "Comparing criteria", status: "pending" },
    { label: "Calculating gaps", status: "pending" },
  ]);

  useEffect(() => {
    const timings = [500, 1000, 1500, 2500, 3500];

    timings.forEach((timing, index) => {
      setTimeout(() => {
        setSteps((prev) => {
          const newSteps = [...prev];
          if (index > 0) {
            newSteps[index - 1].status = "done";
          }
          newSteps[index].status = "processing";
          return newSteps;
        });
      }, timing);
    });

    setTimeout(() => {
      setSteps((prev) => {
        const newSteps = [...prev];
        newSteps[newSteps.length - 1].status = "done";
        return newSteps;
      });
    }, 4500);

    setTimeout(() => {
      navigate("/results");
    }, 5000);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Finding your matches
          </h2>
        </div>

        <div className="space-y-4 mb-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 transition-opacity duration-300 ${
                step.status === "pending" ? "opacity-40" : "opacity-100"
              }`}
            >
              {step.status === "done" ? (
                <div className="flex-shrink-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              ) : step.status === "processing" ? (
                <div className="flex-shrink-0 w-5 h-5">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                </div>
              ) : (
                <div className="flex-shrink-0 w-5 h-5 bg-gray-300 rounded-full" />
              )}
              <span
                className={`text-left ${
                  step.status === "done"
                    ? "text-gray-900 font-medium"
                    : step.status === "processing"
                    ? "text-blue-600 font-medium"
                    : "text-gray-500"
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-500">Usually takes ~10 seconds.</p>
      </div>
    </div>
  );
}
