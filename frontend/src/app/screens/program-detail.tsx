import { useParams, Link } from "react-router";
import { ExternalLink, Bookmark, Calendar, Clock, Globe, DollarSign, ArrowLeft } from "lucide-react";
import { NavBar } from "../components/nav-bar";
import { StatusBadge } from "../components/status-badge";
import { MatchChecklistRow } from "../components/match-checklist-row";
import { allPrograms } from "../data/mock-data";

export function ProgramDetail() {
  const { id } = useParams();
  const program = allPrograms.find((p) => p.id === id);

  if (!program) {
    return (
      <div className="min-h-screen bg-white">
        <NavBar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Program not found
          </h2>
          <Link to="/results" className="text-blue-600 hover:text-blue-700">
            Back to results
          </Link>
        </div>
      </div>
    );
  }

  const degreeLabels = {
    bachelor: "Bachelor of Science",
    master: "Master of Science",
    phd: "Doctor of Philosophy",
  };

  const daysUntilDeadline = Math.floor(
    (new Date(program.deadline).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/results"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to results
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{program.countryFlag}</span>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {program.universityName}
                </h1>
              </div>
              <h2 className="text-xl text-gray-700 mb-3">
                {program.programName}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <StatusBadge variant={program.degree}>
                  {degreeLabels[program.degree]}
                </StatusBadge>
                <StatusBadge variant={program.status}>
                  {program.status === "eligible" ? "Eligible" : "Almost There"}
                </StatusBadge>
                {program.qsRank && (
                  <span className="text-sm text-gray-600">
                    QS World Ranking #{program.qsRank}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{program.country}</p>
            </div>
            <div className="flex flex-col gap-2">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg ${
                  program.status === "eligible"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {program.matchPercentage}%
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="#"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Visit program
              <ExternalLink className="w-4 h-4" />
            </a>
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Bookmark className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>

        {/* Match Checklist */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Requirements Match
          </h3>
          <div className="space-y-2">
            <MatchChecklistRow
              label="GPA"
              required={program.requirements.gpa.required}
              yours={program.requirements.gpa.yours}
              met={program.requirements.gpa.met}
            />
            <MatchChecklistRow
              label="English Proficiency"
              required={program.requirements.english.required}
              yours={program.requirements.english.yours}
              met={program.requirements.english.met}
            />
            <MatchChecklistRow
              label="Prerequisites"
              required={program.requirements.prerequisites.required}
              yours={program.requirements.prerequisites.yours}
              met={program.requirements.prerequisites.met}
            />
            <MatchChecklistRow
              label="Degree"
              required={program.requirements.degree.required}
              yours={program.requirements.degree.yours}
              met={program.requirements.degree.met}
            />
          </div>

          {program.status === "almost" && program.gap && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="font-medium text-amber-900 mb-2">
                Close this gap to qualify:
              </p>
              <p className="text-amber-800">{program.gap}</p>
              <Link
                to="/study-plan"
                className="inline-block mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
              >
                Add to study plan
              </Link>
            </div>
          )}
        </div>

        {/* Program Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Program Information
          </h3>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Tuition</p>
                <p className="font-medium text-gray-900">{program.tuition}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-medium text-gray-900">{program.duration}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Language</p>
                <p className="font-medium text-gray-900">{program.language}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Application Deadline</p>
                <p className="font-medium text-gray-900">
                  {new Date(program.deadline).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  <span className="ml-2 text-sm text-amber-600">
                    ({daysUntilDeadline} days left)
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Key Courses</h4>
            <ul className="grid sm:grid-cols-2 gap-2">
              {program.courses.map((course, index) => (
                <li key={index} className="text-sm text-gray-600">
                  • {course}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* About University */}
        <details className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
          <summary className="cursor-pointer font-semibold text-gray-900">
            About {program.universityName}
          </summary>
          <p className="mt-4 text-gray-600 leading-relaxed">{program.about}</p>
        </details>
      </div>
    </div>
  );
}
