import { GraduationCap, Briefcase, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { NavBar } from "../components/nav-bar";

const userTypes = [
  {
    type: "student",
    title: "Student",
    subtitle: "Find university programs that match your academic profile",
    icon: GraduationCap,
    to: "/school-wizard",
  },
  {
    type: "job-seeker",
    title: "Job Seeker",
    subtitle: "Find positions that match your skills and experience",
    icon: Briefcase,
    to: "/job-seeker",
  },
] as const;

export function UserTypeSelection() {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            I am a...
          </h1>
          <p className="text-lg text-gray-600">
            Choose your path to get personalized recommendations
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          {userTypes.map((item, index) => (
            <motion.div
              key={item.type}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.1 }}
            >
              <Link to={item.to} className="block group">
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 sm:p-10 text-center transition-all duration-200 group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/10 cursor-pointer">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6 transition-colors group-hover:bg-primary/20">
                    <item.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    {item.title}
                  </h2>
                  <p className="text-gray-600 mb-6">{item.subtitle}</p>
                  <span className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
                    Get started
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
