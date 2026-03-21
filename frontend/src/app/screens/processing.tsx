import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { Check, Loader2, AlertCircle } from "lucide-react";

interface ProcessingStep {
  label: string;
  status: "pending" | "processing" | "done" | "error";
}

const studentStepLabels = [
  "Loading student profile…",
  "Searching university programs…",
  "Assessing program fit…",
];

const jobSeekerSteps = [
  "Parsing resume...",
  "Identifying skills...",
  "Scanning job listings...",
  "Matching positions...",
  "Ranking results...",
];

export function Processing() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    userType?: string;
    schoolFileId?: string;
  } | null;
  const userType = state?.userType;
  const schoolFileId = state?.schoolFileId;

  const isStudent = userType === "student";
  const labels = isStudent ? studentStepLabels : jobSeekerSteps;

  const [steps, setSteps] = useState<ProcessingStep[]>(
    labels.map((label) => ({ label, status: "pending" }))
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const ran = useRef(false);

  // Helper to update a single step's status
  const setStepStatus = (
    index: number,
    status: ProcessingStep["status"],
    label?: string
  ) => {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], status, ...(label ? { label } : {}) };
      return next;
    });
  };

  // Student flow: real API calls
  useEffect(() => {
    if (!isStudent || ran.current) return;
    ran.current = true;

    if (!schoolFileId) {
      setErrorMsg("Missing school file ID. Please go back and upload your transcript.");
      return;
    }

    let cancelled = false;

    async function runStudentPipeline() {
      try {
        // Step 0: Loading profile
        setStepStatus(0, "processing");
        // Small delay so the user sees the step
        await new Promise((r) => setTimeout(r, 600));
        if (cancelled) return;
        setStepStatus(0, "done", "Student profile loaded");

        // Step 1: Search university programs
        setStepStatus(1, "processing");
        const matchRes = await fetch("/api/v1/school-matches/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ school_file_id: schoolFileId }),
        });
        const matchData = await matchRes.json().catch(() => null);
        if (!matchRes.ok) {
          throw new Error(
            typeof matchData?.detail === "string"
              ? matchData.detail
              : "Failed to find university matches"
          );
        }
        if (cancelled) return;
        const matchCount = matchData?.matches?.length ?? 0;
        setStepStatus(1, "done", `Found ${matchCount} university matches`);

        // Step 2: Assess program fit
        setStepStatus(2, "processing");
        const assessRes = await fetch("/api/v1/school-matches/assess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ school_file_id: schoolFileId }),
        });
        const assessData = await assessRes.json().catch(() => null);
        if (!assessRes.ok) {
          throw new Error(
            typeof assessData?.detail === "string"
              ? assessData.detail
              : "Failed to assess programs"
          );
        }
        if (cancelled) return;
        const assessCount = assessData?.assessments?.length ?? 0;
        setStepStatus(2, "done", `Assessed ${assessCount} programs`);

        // Navigate to results with data
        setTimeout(() => {
          if (!cancelled) {
            navigate("/results", {
              state: {
                userType: "student",
                matches: matchData,
                assessments: assessData,
              },
            });
          }
        }, 800);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Something went wrong";
          setErrorMsg(msg);
          // Mark the current processing step as error
          setSteps((prev) =>
            prev.map((s) => (s.status === "processing" ? { ...s, status: "error" } : s))
          );
        }
      }
    }

    runStudentPipeline();
    return () => {
      cancelled = true;
    };
  }, [isStudent, schoolFileId, navigate]);

  // Job-seeker flow: keep fake animation for now
  useEffect(() => {
    if (isStudent) return;

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
  }, [isStudent, navigate]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            {errorMsg ? (
              <AlertCircle className="w-8 h-8 text-red-500" />
            ) : (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            )}
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">
            {errorMsg ? "Something went wrong" : "Finding your matches"}
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
                <div className="flex-shrink-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              ) : step.status === "processing" ? (
                <div className="flex-shrink-0 w-5 h-5">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
              ) : step.status === "error" ? (
                <div className="flex-shrink-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-3 h-3 text-white" />
                </div>
              ) : (
                <div className="flex-shrink-0 w-5 h-5 bg-gray-300 rounded-full" />
              )}
              <span
                className={`text-left ${
                  step.status === "done"
                    ? "text-gray-900 font-medium"
                    : step.status === "processing"
                    ? "text-primary font-medium"
                    : step.status === "error"
                    ? "text-red-600 font-medium"
                    : "text-gray-500"
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {errorMsg ? (
          <div className="space-y-3">
            <p className="text-sm text-red-600">{errorMsg}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Go back
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            {isStudent ? "Scraping university catalogs — this can take 2–3 minutes…" : "Usually takes ~10 seconds."}
          </p>
        )}
      </div>
    </div>
  );
}
