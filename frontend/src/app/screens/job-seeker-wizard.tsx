import { useState } from "react";
import { useNavigate } from "react-router";
import { FileText, Search, ChevronDown, ChevronUp } from "lucide-react";
import { NavBar } from "../components/nav-bar";
import { DocumentUploadCard } from "../components/document-upload-card";

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

  const handleSubmit = () => {
    navigate("/processing", { state: { userType: "job-seeker" } });
  };

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
            onRemove={() => setResumeFile(null)}
          />
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
            className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Find matching positions
          </button>
        </div>
      </div>
    </div>
  );
}
