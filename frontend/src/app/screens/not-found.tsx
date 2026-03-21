import { Link } from "react-router";
import { Home } from "lucide-react";
import mascot from "../assets/404_SkillsBridge_handraise-removebg.png";

export function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Page not found
        </h2>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to home
        </Link>
      </div>
      <img
        src={mascot}
        alt="SkillsBridge mascot"
        className="w-80 sm:w-96 mt-12"
      />
    </div>
  );
}
