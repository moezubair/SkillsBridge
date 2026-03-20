import { Download, Share2 } from "lucide-react";
import { NavBar } from "../components/nav-bar";
import { PriorityActionCard } from "../components/priority-action-card";
import { studyPlanGaps } from "../data/mock-data";

export function StudyPlan() {
  const totalGaps = studyPlanGaps.length;
  const totalMonths = 5;
  const totalPrograms = studyPlanGaps.reduce(
    (sum, gap) => sum + gap.impactCount,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Your Study Plan
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Close these gaps to unlock {totalPrograms} more programs
          </p>

          {/* Summary Stats */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 px-6 py-4">
              <p className="text-sm text-gray-600 mb-1">Total Gaps</p>
              <p className="text-2xl font-bold text-gray-900">{totalGaps}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 px-6 py-4">
              <p className="text-sm text-gray-600 mb-1">Time Needed</p>
              <p className="text-2xl font-bold text-gray-900">~{totalMonths} months</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 px-6 py-4">
              <p className="text-sm text-gray-600 mb-1">Programs to Unlock</p>
              <p className="text-2xl font-bold text-green-600">{totalPrograms}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Share2 className="w-4 h-4" />
              Share with counselor
            </button>
          </div>
        </div>

        {/* Priority Cards */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Priority Actions
          </h2>
          <p className="text-gray-600 mb-6">
            Sorted by impact — start with the highest priority to unlock the most programs.
          </p>
          <div className="space-y-4">
            {studyPlanGaps.map((gap) => (
              <PriorityActionCard key={gap.priority} {...gap} />
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Timeline</h2>

          <div className="space-y-6">
            {/* Month 1-2: IELTS */}
            <div className="relative pl-8 pb-6 border-l-2 border-blue-200">
              <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full" />
              <div className="mb-2">
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium mb-2">
                  Month 1-2
                </span>
                <h3 className="font-semibold text-gray-900">IELTS Preparation</h3>
              </div>
              <p className="text-sm text-gray-600">
                Focus on improving overall band score to 7.5
              </p>
            </div>

            {/* Month 2-4: Statistics */}
            <div className="relative pl-8 pb-6 border-l-2 border-purple-200">
              <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 bg-purple-500 rounded-full" />
              <div className="mb-2">
                <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium mb-2">
                  Month 2-4
                </span>
                <h3 className="font-semibold text-gray-900">Linear Algebra Course</h3>
              </div>
              <p className="text-sm text-gray-600">
                Complete online course and obtain certificate
              </p>
            </div>

            {/* Month 3-4: GRE */}
            <div className="relative pl-8 pb-6 border-l-2 border-green-200">
              <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 bg-green-500 rounded-full" />
              <div className="mb-2">
                <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium mb-2">
                  Month 3-4
                </span>
                <h3 className="font-semibold text-gray-900">GRE Exam</h3>
              </div>
              <p className="text-sm text-gray-600">
                Study for and take the GRE, aiming for 320+
              </p>
            </div>

            {/* Application Season */}
            <div className="relative pl-8">
              <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 bg-amber-500 rounded-full" />
              <div className="mb-2">
                <span className="inline-block px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium mb-2">
                  Month 5+
                </span>
                <h3 className="font-semibold text-gray-900">Application Season</h3>
              </div>
              <p className="text-sm text-gray-600">
                Start applying to your expanded list of programs
              </p>
            </div>
          </div>
        </div>

        {/* Motivational Footer */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 sm:p-8 text-white text-center">
          <h3 className="text-xl font-semibold mb-2">You're on track! 🎯</h3>
          <p className="text-blue-100">
            Complete these steps and you'll have access to {totalPrograms} more world-class programs.
          </p>
        </div>
      </div>
    </div>
  );
}
