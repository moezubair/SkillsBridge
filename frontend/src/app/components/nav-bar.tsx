import { ArrowLeft, User, UserCircle, BookOpen, FolderOpen, Settings, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router";
import logo from "../assets/SkillsBridge_logo-removebg.png";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";

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
              <Link to="/" className="flex items-center gap-2">
                <img src={logo} alt="SkillsBridge logo" className="h-9 w-auto" />
                <span className="text-xl font-bold text-white tracking-tight">
                  SkillsBridge
                </span>
              </Link>
            )}
            {title && <h1 className="text-lg font-semibold text-white">{title}</h1>}
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
                  <User className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <UserCircle className="w-4 h-4" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/study-plan")}>
                  <BookOpen className="w-4 h-4" />
                  My Plan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/portfolio")}>
                  <FolderOpen className="w-4 h-4" />
                  My Portfolio
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="w-4 h-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/")} variant="destructive">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
