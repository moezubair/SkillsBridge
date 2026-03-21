import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Upload,
  Search,
  Plus,
  X,
  Languages,
  Globe,
  PenLine,
  BookOpen,
  BarChart3,
  Download,
  Loader2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { NavBar } from "../components/nav-bar";
import { ProgressStepper } from "../components/progress-stepper";
import { DocumentUploadCard } from "../components/document-upload-card";

type Step = 1 | 2 | 3;

type SchoolStoredFileRecord = {
  id: string;
  original_filename: string;
  storage_key: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

type TranscriptExtractionRecord = {
  id: string;
  file_id: string;
  schema_version: string;
  status: string;
  extraction: Record<string, unknown>;
  created_at: string;
};

export function SchoolWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // Step 1: Grades & Documents
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [storedFile, setStoredFile] = useState<SchoolStoredFileRecord | null>(null);
  const [transcript, setTranscript] = useState<TranscriptExtractionRecord | null>(null);
  const [ieltsScores, setIeltsScores] = useState<{
    listening: string; reading: string; writing: string; speaking: string;
  }>({ listening: "", reading: "", writing: "", speaking: "" });

  const ieltsSubScores = [ieltsScores.listening, ieltsScores.reading, ieltsScores.writing, ieltsScores.speaking];
  const filledSubs = ieltsSubScores.filter((v) => v.trim() !== "").map(Number).filter((n) => !isNaN(n));
  const ieltsOverall = filledSubs.length === 4
    ? (Math.round((filledSubs.reduce((a, b) => a + b, 0) / 4) * 2) / 2).toFixed(1)
    : null;
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [savingExtras, setSavingExtras] = useState(false);
  const [toeflFile, setToeflFile] = useState<File | null>(null);
  const [satFile, setSatFile] = useState<File | null>(null);
  const [greFile, setGreFile] = useState<File | null>(null);
  const [gmatFile, setGmatFile] = useState<File | null>(null);
  const [otherTestFile, setOtherTestFile] = useState<File | null>(null);
  const [gradingScale, setGradingScale] = useState("us-4.0");
  const [subjects, setSubjects] = useState([{ subject: "", grade: "" }]);
  const [gpa, setGpa] = useState("");

  // Step 2: Major & Career
  const [majors, setMajors] = useState<string[]>([]);
  const [newMajor, setNewMajor] = useState("");
  const [career, setCareer] = useState("");

  // Step 3: Preferences
  const [regions, setRegions] = useState<string[]>([]);
  const [budget, setBudget] = useState(25000);
  const [degree, setDegree] = useState("master");

  const steps = [
    {
      label: "Documents",
      status:
        currentStep > 1 ? "done" : currentStep === 1 ? "active" : "pending",
    },
    {
      label: "Major",
      status:
        currentStep > 2 ? "done" : currentStep === 2 ? "active" : "pending",
    },
    {
      label: "Preferences",
      status: currentStep === 3 ? "active" : "pending",
    },
  ] as const;

  const addSubject = () => {
    setSubjects([...subjects, { subject: "", grade: "" }]);
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const addMajor = () => {
    if (newMajor.trim() && !majors.includes(newMajor.trim())) {
      setMajors([...majors, newMajor.trim()]);
      setNewMajor("");
    }
  };

  const removeMajor = (major: string) => {
    setMajors(majors.filter((m) => m !== major));
  };

  const toggleRegion = (region: string) => {
    setRegions(
      regions.includes(region)
        ? regions.filter((r) => r !== region)
        : [...regions, region]
    );
  };

  const handleNext = async () => {
    // Save student extras when leaving Step 1
    if (currentStep === 1) {
      if (!storedFile) {
        toast.error("Please upload your transcript first.");
        return;
      }
      setSavingExtras(true);
      try {
        const ieltsBody: Record<string, number | null> = {
          overall: ieltsOverall ? parseFloat(ieltsOverall) : null,
        };
        for (const key of ["listening", "reading", "writing", "speaking"] as const) {
          const val = ieltsScores[key].trim();
          ieltsBody[key] = val ? parseFloat(val) : null;
        }
        const res = await fetch(
          `/api/v1/student-extras?school_file_id=${storedFile.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ielts: ieltsBody, skills }),
          }
        );
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          throw new Error(
            typeof payload?.detail === "string" ? payload.detail : "Failed to save extras"
          );
        }
        toast.success("Profile saved.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save extras");
        setSavingExtras(false);
        return;
      }
      setSavingExtras(false);
    }

    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as Step);
    } else {
      navigate("/processing", { state: { userType: "student", schoolFileId: storedFile?.id } });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  // Upload transcript and auto-extract when file is selected
  useEffect(() => {
    if (!transcriptFile) return;
    let cancelled = false;

    async function uploadAndExtract() {
      setUploading(true);
      setTranscript(null);
      setStoredFile(null);
      try {
        // POST /api/v1/school/files/upload
        const body = new FormData();
        body.append("file", transcriptFile!);
        const uploadRes = await fetch("/api/v1/school/files/upload", {
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
        const stored = uploadPayload as SchoolStoredFileRecord;
        if (cancelled) return;
        setStoredFile(stored);
        setUploading(false);
        toast.success("Transcript uploaded.");

        // POST /api/v1/school/files/{id}/extract-transcript
        setExtracting(true);
        const extractRes = await fetch(
          `/api/v1/school/files/${stored.id}/extract-transcript`,
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
        setTranscript(extractPayload as TranscriptExtractionRecord);
        toast.success("Transcript extracted.");
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
    return () => { cancelled = true; };
  }, [transcriptFile]);

  const majorSuggestions = [
    "Computer Science",
    "Business Administration",
    "Mechanical Engineering",
    "Data Science",
    "Medicine",
    "Law",
    "Economics",
    "Psychology",
  ];

  const careerSuggestions = [
    "AI Engineer",
    "Data Scientist",
    "Software Engineer",
    "Doctor",
    "Researcher",
    "Product Manager",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar showBack title="Profile Setup" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProgressStepper steps={steps} />

        {/* Step 1: Documents & Grades */}
        {currentStep === 1 && (
          <div className="space-y-8">
            {/* Transcript Upload */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Academic Transcript
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Upload your transcript and we'll extract your grades
                automatically
              </p>
              <DocumentUploadCard
                title="Upload Transcript"
                description="Drag and drop your PDF here"
                helperText="We extract grades automatically"
                icon={Upload}
                file={transcriptFile}
                onFileSelect={setTranscriptFile}
                onRemove={() => {
                  setTranscriptFile(null);
                  setStoredFile(null);
                  setTranscript(null);
                }}
              />

              {/* Upload / extraction progress */}
              {(uploading || extracting) && (
                <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {uploading ? "Uploading transcript…" : "Extracting grades…"}
                </div>
              )}

              {/* Extraction results */}
              {transcript && transcript.extraction && (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50/50 p-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-gray-900">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Transcript extracted
                    <span className="ml-auto text-xs font-normal text-gray-500 capitalize">
                      {transcript.status}
                    </span>
                  </div>
                  {typeof transcript.extraction.school_name === "string" && (
                    <p>
                      <span className="text-gray-500">School: </span>
                      {transcript.extraction.school_name}
                    </p>
                  )}
                  {transcript.extraction.gpa != null && (
                    <p>
                      <span className="text-gray-500">GPA: </span>
                      {String(transcript.extraction.gpa)}
                      {typeof transcript.extraction.gpa_scale === "string" &&
                        transcript.extraction.gpa_scale
                        ? ` (${transcript.extraction.gpa_scale})`
                        : ""}
                    </p>
                  )}
                  {Array.isArray(transcript.extraction.courses) && (
                    <p>
                      <span className="text-gray-500">Courses parsed: </span>
                      {transcript.extraction.courses.length}
                    </p>
                  )}

                  {/* Download buttons */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {storedFile && (
                      <a
                        href={`/api/v1/school/files/${storedFile.id}/download`}
                        download={storedFile.original_filename}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download PDF
                      </a>
                    )}
                    <a
                      href={`/api/v1/school/files/${transcript.file_id}/transcript-extraction.json`}
                      download={`${transcript.file_id}-transcript-extraction.json`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download JSON
                    </a>
                  </div>
                </div>
              )}

              {/* File metadata */}
              {storedFile && !uploading && !extracting && !transcript && (
                <p className="mt-2 text-xs text-gray-500">
                  Uploaded: {storedFile.original_filename} ({(storedFile.size_bytes / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* IELTS Scores */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <Languages className="w-5 h-5 text-primary" />
                IELTS Scores
                <span className="text-sm font-normal text-gray-500">Optional</span>
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter your IELTS band scores if you have them
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(["listening", "reading", "writing", "speaking"] as const).map(
                  (field) => (
                    <div key={field}>
                      <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                        {field}
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="9"
                        value={ieltsScores[field]}
                        onChange={(e) =>
                          setIeltsScores({ ...ieltsScores, [field]: e.target.value })
                        }
                        placeholder="0-9"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  )
                )}
              </div>
              {/* Auto-calculated overall */}
              <div className="mt-3 flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600">Overall Band Score:</span>
                {ieltsOverall ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-primary/10 text-primary">
                    {ieltsOverall}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Fill all 4 scores to auto-calculate</span>
                )}
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Skills
                <span className="text-sm font-normal text-gray-500">Optional</span>
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Add relevant skills to improve your program matching
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {skill}
                    <X
                      className="w-3.5 h-3.5 cursor-pointer hover:text-primary/70"
                      onClick={() => removeSkill(skill)}
                    />
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSkill()}
                  placeholder="Type a skill and press Enter"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  onClick={addSkill}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Other Test Scores */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Other Test Scores
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Upload certificates or score reports for any other tests you've taken
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <DocumentUploadCard
                  title="TOEFL"
                  description="Score report or certificate"
                  icon={Globe}
                  file={toeflFile}
                  onFileSelect={setToeflFile}
                  onRemove={() => setToeflFile(null)}
                  compact
                />
                <DocumentUploadCard
                  title="SAT"
                  description="Score report"
                  icon={PenLine}
                  file={satFile}
                  onFileSelect={setSatFile}
                  onRemove={() => setSatFile(null)}
                  compact
                />
                <DocumentUploadCard
                  title="GRE"
                  description="Score report"
                  icon={BookOpen}
                  file={greFile}
                  onFileSelect={setGreFile}
                  onRemove={() => setGreFile(null)}
                  compact
                />
                <DocumentUploadCard
                  title="GMAT"
                  description="Score report"
                  icon={BarChart3}
                  file={gmatFile}
                  onFileSelect={setGmatFile}
                  onRemove={() => setGmatFile(null)}
                  compact
                />
                <DocumentUploadCard
                  title="Other"
                  description="Any other test certificate"
                  icon={Plus}
                  file={otherTestFile}
                  onFileSelect={setOtherTestFile}
                  onRemove={() => setOtherTestFile(null)}
                  compact
                />
              </div>
            </div>

            {/* Manual Entry */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Manual Grade Entry
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grading Scale
                  </label>
                  <select
                    value={gradingScale}
                    onChange={(e) => setGradingScale(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="vn-10">Vietnamese (10-point)</option>
                    <option value="us-4.0">US (4.0 GPA)</option>
                    <option value="uk-alevel">UK A-Level</option>
                    <option value="ib">International Baccalaureate</option>
                  </select>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {subjects.map((subj, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Subject"
                        value={subj.subject}
                        onChange={(e) => {
                          const newSubjects = [...subjects];
                          newSubjects[index].subject = e.target.value;
                          setSubjects(newSubjects);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Grade"
                        value={subj.grade}
                        onChange={(e) => {
                          const newSubjects = [...subjects];
                          newSubjects[index].grade = e.target.value;
                          setSubjects(newSubjects);
                        }}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      {subjects.length > 1 && (
                        <button
                          onClick={() => removeSubject(index)}
                          className="p-2 text-gray-400 hover:text-red-600 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={addSubject}
                  className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add subject
                </button>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall GPA
                  </label>
                  <input
                    type="text"
                    value={gpa}
                    onChange={(e) => setGpa(e.target.value)}
                    placeholder="e.g., 3.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Major & Career */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Desired Major — Primary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                What do you want to study?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Select your desired major to find matching programs
              </p>

              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Popular majors:
                </p>
                <div className="flex flex-wrap gap-2">
                  {majorSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        if (!majors.includes(suggestion)) {
                          setMajors([...majors, suggestion]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors cursor-pointer ${
                        majors.includes(suggestion)
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {majors
                  .filter((m) => !majorSuggestions.includes(m))
                  .map((major) => (
                    <span
                      key={major}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {major}
                      <X
                        className="w-3.5 h-3.5 cursor-pointer hover:text-primary/70"
                        onClick={() => removeMajor(major)}
                      />
                    </span>
                  ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMajor}
                  onChange={(e) => setNewMajor(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addMajor()}
                  placeholder="Type a major and press Enter"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  onClick={addMajor}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Career Goal — Secondary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Career Goal
                <span className="text-sm font-normal text-gray-500 ml-2">
                  Optional
                </span>
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Helps us recommend programs aligned with your career path
              </p>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={career}
                  onChange={(e) => setCareer(e.target.value)}
                  placeholder="Search careers..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {careerSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setCareer(suggestion)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors cursor-pointer ${
                      career === suggestion
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-sm text-gray-600">
              We'll match your selections against 2,400+ programs worldwide.
            </p>
          </div>
        )}

        {/* Step 3: Preferences */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Preferred Regions
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  "Europe",
                  "United States",
                  "Asia",
                  "United Kingdom",
                  "Canada",
                  "Anywhere",
                ].map((region) => (
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Annual Budget: ${budget.toLocaleString()}
              </label>
              <input
                type="range"
                min="0"
                max="50000"
                step="1000"
                value={budget}
                onChange={(e) => setBudget(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>$0</span>
                <span>$50k+</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Degree Level
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDegree("bachelor")}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                    degree === "bachelor"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Bachelor's
                </button>
                <button
                  onClick={() => setDegree("master")}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                    degree === "master"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Master's
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={savingExtras}
            className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            {savingExtras && <Loader2 className="w-4 h-4 animate-spin" />}
            {currentStep === 3 ? "Find my programs" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
