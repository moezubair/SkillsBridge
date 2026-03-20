import { ArrowLeft, User } from "lucide-react";
import { Link, useNavigate } from "react-router";

interface NavBarProps {
  showBack?: boolean;
  title?: string;
}

export function NavBar({ showBack, title }: NavBarProps) {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            {showBack ? (
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <Link to="/" className="text-xl font-semibold">
                UniPath
              </Link>
            )}
            {title && <h1 className="text-lg font-medium">{title}</h1>}
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/study-plan"
              className="hidden sm:block text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              My Plan
            </Link>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
