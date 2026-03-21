import { ArrowLeft, User } from "lucide-react";
import { Link, useNavigate } from "react-router";

interface NavBarProps {
  showBack?: boolean;
  title?: string;
}

export function NavBar({ showBack, title }: NavBarProps) {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 bg-[#9B1B30] border-b border-[#8B1528]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            {showBack ? (
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <Link to="/" className="text-xl font-bold text-white tracking-tight">
                SkillsBridge
              </Link>
            )}
            {title && <h1 className="text-lg font-semibold text-white">{title}</h1>}
          </div>

          <div className="flex items-center gap-4">
<Link
              to="/study-plan"
              className="hidden sm:block text-sm font-semibold text-white/90 hover:text-white transition-colors uppercase tracking-wide"
            >
              My Plan
            </Link>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}