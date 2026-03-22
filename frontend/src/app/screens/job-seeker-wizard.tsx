import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  FileText,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  Download,
} from "lucide-react";
import { NavBar } from "../components/nav-bar";
import { DocumentUploadCard } from "../components/document-upload-card";

type StoredFileRecord = {
  id: string;
  original_filename: string;
  storage_key: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

type CvExtractionRecord = {
  id: string;
  file_id: string;
  schema_version: string;
  status: string;
  extraction: Record<string, unknown>;
  created_at: string;
};

const positionSuggestions = [
  "Software Engineer",
  "Data Analyst",
  "Product Manager",
  "Marketing Manager",
  "UX Designer",
  "Financial Analyst",
  "Business Analyst",
  "Project Manager",
];

const regionOptions = [
  "Vietnam",
  "United States",
  "Europe",
  "Asia",
  "United Kingdom",
  "Remote",
];

export function JobSeekerWizard() {
  const navigate = useNavigate();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [storedFile, setStoredFile] = useState<StoredFileRecord | null>(null);
  const [cvExtraction, setCvExtraction] = useState<CvExtractionRecord | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [desiredPosition, setDesiredPosition] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [regions, setRegions] = useState<string[]>([]);
  const [salaryRange, setSalaryRange] = useState(50000);
  const [showOptional, setShowOptional] = useState(false);

  const toggleRegion = (region: string) => {
    setRegions(
      regions.includes(region)
        ? regions.filter((r) => r !== region)
        : [...regions, region]
    );
  };

  // Upload resume and auto-extract when file is selected
  useEffect(() => {
    if (!resumeFile) return;
    let cancelled = false;

    async function uploadAndExtract() {
      setUploading(true);
      setCvExtraction(null);
      setStoredFile(null);
      try {
        const body = new FormData();
        body.append("file", resumeFile!);
        const uploadRes = await fetch("/api/v1/job/files/upload", {
          method: "POST",
          body,
        });
        const uploadPayload = await uploadRes.json().catch(() => null);
        if (!uploadRes.ok) {
          throw new Error(
            typeof uploadPayload?.detail === "string"
              ? uploadPayload.detail
              : "Upload failed"
          );
        }
        const stored = uploadPayload as StoredFileRecord;
        if (cancelled) return;
        setStoredFile(stored);
        setUploading(false);
        toast.success("Resume uploaded.");

        // Extract CV
        setExtracting(true);
        const extractRes = await fetch(
          `/api/v1/job/files/${stored.id}/extract-cv`,
          { method: "POST" }
        );
        const extractPayload = await extractRes.json().catch(() => null);
        if (!extractRes.ok) {
          throw new Error(
            typeof extractPayload?.detail === "string"
              ? extractPayload.detail
              : "Extraction failed"
          );
        }
        if (cancelled) return;
        setCvExtraction(extractPayload as CvExtractionRecord);
        toast.success("CV extracted.");
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Upload failed");
        }
      } finally {
        if (!cancelled) {
          setUploading(false);
          setExtracting(false);
        }
      }
    }

    uploadAndExtract();
    return () => {
      cancelled = true;
    };
  }, [resumeFile]);

  const handleSubmit = async () => {
    if (!storedFile) {
      toast.error("Please upload your resume first.");
      return;
    }

    setSubmitting(true);
    try {
      // Save job preferences
      const prefsBody = {
        desired_titles: desiredPosition.trim() ? [desiredPosition.trim()] : [],
        locations: regions,
        remote_only: regions.includes("Remote"),
        visa_sponsorship: false,
        industries: [],
        seniority: yearsExperience || null,
        keywords_include: [],
        keywords_exclude: [],
      };
      const res = await fetch(
        `/api/v1/job-preferences?job_file_id=${storedFile.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(prefsBody),
        }
      );
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(
          typeof payload?.detail === "string"
            ? payload.detail
            : "Failed to save preferences"
        );
      }
      toast.success("Preferences saved.");
      navigate("/processing", {
        state: { userType: "job-seeker", jobFileId: storedFile.id },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save preferences");
    } finally {
      setSubmitting(false);
    }
  };

  const extraction = cvExtraction?.extraction;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar showBack title="Job Profile" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Resume Upload */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Upload Your Resume
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            We'll extract your skills and experience automatically
          </p>
          <DocumentUploadCard
            title="Resume / CV"
            description="Drag and drop your PDF here"
            helperText="Supports PDF, DOC, DOCX"
            icon={FileText}
            acceptedTypes=".pdf,.doc,.docx"
            file={resumeFile}
            onFileSelect={setResumeFile}
            onRemove={() => {
              setResumeFile(null);
              setStoredFile(null);
              setCvExtraction(null);
            }}
          />

          {/* Upload / extraction progress */}
          {(uploading || extracting) && (
            <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              {uploading ? "Uploading resume…" : "Extracting CV data…"}
            </div>
          )}

          {/* Extraction results */}
          {cvExtraction && extraction && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50/50 p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 font-semibold text-gray-900">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                CV extracted
                <span className="ml-auto text-xs font-normal text-gray-500 capitalize">
                  {cvExtraction.status}
                </span>
              </div>
              {typeof extraction.full_name === "string" && (
                <p>
                  <span className="text-gray-500">Name: </span>
                  {extraction.full_name}
                </p>
              )}
              {typeof extraction.years_of_experience === "number" && (
                <p>
                  <span className="text-gray-500">Experience: </span>
                  {extraction.years_of_experience} years
                </p>
              )}
              {Array.isArray(extraction.technical_skills) && extraction.technical_skills.length > 0 && (
                <div>
                  <span className="text-gray-500">Skills: </span>
                  <span className="text-gray-700">
                    {(extraction.technical_skills as string[]).slice(0, 10).join(", ")}
                    {(extraction.technical_skills as string[]).length > 10 && " …"}
                  </span>
                </div>
              )}

              {/* Download buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                {storedFile && (
                  <a
                    href={`/api/v1/job/files/${storedFile.id}/download`}
                    download={storedFile.original_filename}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download PDF
                  </a>
                )}
                <a
                  href={`/api/v1/job/files/${cvExtraction.file_id}/cv-extraction.json`}
                  download={`${cvExtraction.file_id}-cv-extraction.json`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download JSON
                </a>
              </div>
            </div>
          )}

          {/* File metadata */}
          {storedFile && !uploading && !extracting && !cvExtraction && (
            <p className="mt-2 text-xs text-gray-500">
              Uploaded: {storedFile.original_filename} ({(storedFile.size_bytes / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {/* Desired Position */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            What position are you looking for?
          </h2>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={desiredPosition}
              onChange={(e) => setDesiredPosition(e.target.value)}
              placeholder="Search positions..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Popular positions:</p>
            <div className="flex flex-wrap gap-2">
              {positionSuggestions.map((position) => (
                <button
                  key={position}
                  onClick={() => setDesiredPosition(position)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors cursor-pointer ${
                    desiredPosition === position
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {position}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Optional Details */}
        <div className="bg-white rounded-lg border border-gray-200 mb-8 overflow-hidden">
          <button
            onClick={() => setShowOptional(!showOptional)}
            className="w-full flex items-center justify-between p-6 text-left cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-gray-900">
              Additional Preferences
            </span>
            {showOptional ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showOptional && (
            <div className="px-6 pb-6 space-y-6 border-t border-gray-100 pt-6">
              {/* Years of Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience
                </label>
                <select
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select...</option>
                  <option value="0-1">0 - 1 years</option>
                  <option value="1-3">1 - 3 years</option>
                  <option value="3-5">3 - 5 years</option>
                  <option value="5-10">5 - 10 years</option>
                  <option value="10+">10+ years</option>
                </select>
              </div>

              {/* Preferred Regions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Preferred Locations
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {regionOptions.map((region) => (
                    <label
                      key={region}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={regions.includes(region)}
                        onChange={() => toggleRegion(region)}
                        className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">{region}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Salary Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Expected Salary: ${salaryRange.toLocaleString()}/year
                </label>
                <input
                  type="range"
                  min="0"
                  max="200000"
                  step="5000"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>$0</span>
                  <span>$200k+</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Find matching positions
          </button>
        </div>
      </div>
    </div>
  );
}
