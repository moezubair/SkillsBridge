import { useState } from "react";
import { Search, Filter, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { NavBar } from "../components/nav-bar";
import { ProgramCard } from "../components/program-card";
import { FilterPill } from "../components/filter-pill";
import { eligiblePrograms, almostTherePrograms } from "../data/mock-data";

export function ResultsDashboard() {
  const [activeTab, setActiveTab] = useState<"eligible" | "almost">("eligible");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  const displayPrograms =
    activeTab === "eligible" ? eligiblePrograms : almostTherePrograms;

  const filteredPrograms = displayPrograms.filter((program) => {
    const matchesSearch =
      program.universityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.programName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry =
      selectedCountries.length === 0 ||
      selectedCountries.includes(program.country);
    return matchesSearch && matchesCountry;
  });

  return (
    <div className="min-h-screen bg-[#F8F7F5]">
      <NavBar />

      {/* Summary Bar */}
      <div className="bg-blue-50 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-4 text-sm sm:text-base">
            <span className="font-semibold text-gray-900">
              {eligiblePrograms.length} programs you qualify for
            </span>
            <span className="text-gray-400">·</span>
            <span className="font-semibold text-gray-900">
              {almostTherePrograms.length} within reach
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-600">4 majors searched</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search programs or universities..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterPill
              label="All Countries"
              active={selectedCountries.length === 0}
              onClick={() => setSelectedCountries([])}
            />
            {["Germany", "Netherlands", "Sweden", "Switzerland", "United Kingdom"].map(
              (country) => (
                <FilterPill
                  key={country}
                  label={country}
                  active={selectedCountries.includes(country)}
                  onClick={() =>
                    setSelectedCountries(
                      selectedCountries.includes(country)
                        ? selectedCountries.filter((c) => c !== country)
                        : [...selectedCountries, country]
                    )
                  }
                  onRemove={
                    selectedCountries.includes(country)
                      ? () =>
                          setSelectedCountries(
                            selectedCountries.filter((c) => c !== country)
                          )
                      : undefined
                  }
                />
              )
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white p-1 rounded-lg border border-gray-200 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("eligible")}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-md font-medium transition-colors ${
              activeTab === "eligible"
                ? "bg-green-100 text-green-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            You qualify ({eligiblePrograms.length})
          </button>
          <button
            onClick={() => setActiveTab("almost")}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-md font-medium transition-colors ${
              activeTab === "almost"
                ? "bg-amber-100 text-amber-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Almost there ({almostTherePrograms.length})
          </button>
        </div>

        {/* Program Cards */}
        <div className="grid gap-4 mb-8">
          {filteredPrograms.length > 0 ? (
            filteredPrograms.map((program) => (
              <ProgramCard key={program.id} {...program} />
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500">No programs found matching your filters.</p>
            </div>
          )}
        </div>

        {/* Study Plan Link */}
        {activeTab === "almost" && almostTherePrograms.length > 0 && (
          <Link
            to="/study-plan"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            View my study plan
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
