import { useState } from "react";
import { useNavigate } from "react-router";
import { Upload, Search, Plus, X } from "lucide-react";
import { NavBar } from "../components/nav-bar";
import { ProgressStepper } from "../components/progress-stepper";

type Step = 1 | 2 | 3;

export function ProfileWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [gradingScale, setGradingScale] = useState("us-4.0");
  const [subjects, setSubjects] = useState([{ subject: "", grade: "" }]);
  const [gpa, setGpa] = useState("");
  const [career, setCareer] = useState("");
  const [majors, setMajors] = useState<string[]>([]);
  const [newMajor, setNewMajor] = useState("");
  const [regions, setRegions] = useState<string[]>([]);
  const [budget, setBudget] = useState(25000);
  const [degree, setDegree] = useState("master");

  const steps = [
    { label: "Grades", status: currentStep > 1 ? "done" : currentStep === 1 ? "active" : "pending" },
    { label: "Career", status: currentStep > 2 ? "done" : currentStep === 2 ? "active" : "pending" },
    { label: "Preferences", status: currentStep === 3 ? "active" : "pending" },
  ] as const;

  const addSubject = () => {
    setSubjects([...subjects, { subject: "", grade: "" }]);
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
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

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as Step);
    } else {
      // Navigate to processing screen
      navigate("/processing");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

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

        {/* Step 1: Grades */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Upload Card */}
              <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-primary/40 transition-colors cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  Upload Transcript
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Drag and drop your PDF here
                </p>
                <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                  Choose File
                </button>
                <p className="text-xs text-gray-500 mt-4">
                  We extract grades automatically
                </p>
              </div>

              {/* Manual Entry Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Manual Entry
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
                            className="p-2 text-gray-400 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={addSubject}
                    className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
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
          </div>
        )}

        {/* Step 2: Career */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              What do you want to become?
            </h3>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={career}
                onChange={(e) => setCareer(e.target.value)}
                placeholder="Search careers..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Popular careers:</p>
              <div className="flex flex-wrap gap-2">
                {careerSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setCareer(suggestion)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Related majors
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {majors.map((major) => (
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
                  onKeyPress={(e) => e.key === "Enter" && addMajor()}
                  placeholder="Add a major"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={addMajor}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              We'll match these majors against 2,400+ programs.
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
                {["Europe", "United States", "Asia", "United Kingdom", "Canada", "Anywhere"].map(
                  (region) => (
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
                  )
                )}
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
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    degree === "bachelor"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Bachelor's
                </button>
                <button
                  onClick={() => setDegree("master")}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    degree === "master"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Master's
                </button>
              </div>
            </div>

            <details className="border border-gray-200 rounded-lg p-4">
              <summary className="cursor-pointer font-medium text-gray-900">
                Optional: Test Scores
              </summary>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    IELTS Score
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 7.0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    SAT Score
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 1450"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    GRE Score
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 320"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </details>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            {currentStep === 3 ? "Find my programs" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
