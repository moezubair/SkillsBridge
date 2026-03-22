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

const jobSeekerStepLabels = [
  "Loading CV profile…",
  "Searching job listings…",
];

export function Processing() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    userType?: string;
    schoolFileId?: string;
    jobFileId?: string;
  } | null;
  const userType = state?.userType;
  const schoolFileId = state?.schoolFileId;
  const jobFileId = state?.jobFileId;

  const isStudent = userType === "student";
  const isJobSeeker = userType === "job-seeker";
  const labels = isStudent ? studentStepLabels : jobSeekerStepLabels;

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

  // Job-seeker flow: real API calls
  useEffect(() => {
    if (!isJobSeeker || ran.current) return;
    ran.current = true;

    if (!jobFileId) {
      setErrorMsg("Missing job file ID. Please go back and upload your resume.");
      return;
    }

    let cancelled = false;

    async function runJobSeekerPipeline() {
      try {
        // Step 0: Loading profile
        setStepStatus(0, "processing");
        await new Promise((r) => setTimeout(r, 600));
        if (cancelled) return;
        setStepStatus(0, "done", "CV profile loaded");

        // Step 1: Search job listings
        setStepStatus(1, "processing");
        const searchRes = await fetch("/api/v1/jobs/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_file_id: jobFileId }),
        });
        const searchData = await searchRes.json().catch(() => null);
        if (!searchRes.ok) {
          throw new Error(
            typeof searchData?.detail === "string"
              ? searchData.detail
              : "Job search failed"
          );
        }
        if (cancelled) return;
        const jobTitle = searchData?.job?.title ?? "a position";
        setStepStatus(1, "done", `Found match: ${jobTitle}`);

        // Navigate to job match page
        setTimeout(() => {
          if (!cancelled) {
            navigate(`/jobs?job_file_id=${jobFileId}`);
          }
        }, 800);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Something went wrong";
          setErrorMsg(msg);
          setSteps((prev) =>
            prev.map((s) => (s.status === "processing" ? { ...s, status: "error" } : s))
          );
        }
      }
    }

    runJobSeekerPipeline();
    return () => {
      cancelled = true;
    };
  }, [isJobSeeker, jobFileId, navigate]);

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
            {isStudent
              ? "Scraping university catalogs — this can take 2–3 minutes…"
              : "Searching job listings — this can take 1–3 minutes…"}
          </p>
        )}
      </div>
    </div>
  );
}
