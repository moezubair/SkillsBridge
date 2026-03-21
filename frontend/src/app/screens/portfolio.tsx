import { useState } from "react";
import {
  FileText,
  Image,
  File,
  Upload,
  Search,
  Grid3X3,
  List,
  Download,
  Trash2,
  Eye,
  MoreVertical,
  FolderOpen,
  Filter,
} from "lucide-react";
import { NavBar } from "../components/nav-bar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../components/ui/dropdown-menu";

type FileType = "pdf" | "image" | "doc" | "other";
type ViewMode = "grid" | "list";

interface PortfolioFile {
  id: string;
  name: string;
  type: FileType;
  size: string;
  date: string;
  category: string;
}

const mockFiles: PortfolioFile[] = [
  { id: "1", name: "Transcript_UofT_2025.pdf", type: "pdf", size: "1.2 MB", date: "Mar 15, 2026", category: "Transcripts" },
  { id: "2", name: "Resume_AlexNguyen.pdf", type: "pdf", size: "340 KB", date: "Mar 10, 2026", category: "Resumes" },
  { id: "3", name: "Cover_Letter_Shopify.pdf", type: "pdf", size: "180 KB", date: "Feb 28, 2026", category: "Cover Letters" },
  { id: "4", name: "Portfolio_Screenshot.png", type: "image", size: "2.4 MB", date: "Feb 20, 2026", category: "Projects" },
  { id: "5", name: "Recommendation_Prof_Lee.pdf", type: "pdf", size: "520 KB", date: "Feb 15, 2026", category: "References" },
  { id: "6", name: "IELTS_Score_Report.pdf", type: "pdf", size: "890 KB", date: "Jan 30, 2026", category: "Test Scores" },
  { id: "7", name: "Capstone_Project_Report.pdf", type: "doc", size: "4.1 MB", date: "Jan 22, 2026", category: "Projects" },
  { id: "8", name: "Passport_Scan.png", type: "image", size: "1.8 MB", date: "Jan 10, 2026", category: "Personal" },
  { id: "9", name: "Cover_Letter_Google.pdf", type: "pdf", size: "175 KB", date: "Dec 18, 2025", category: "Cover Letters" },
  { id: "10", name: "High_School_Diploma.pdf", type: "pdf", size: "650 KB", date: "Dec 5, 2025", category: "Transcripts" },
];

const categories = ["All", "Transcripts", "Resumes", "Cover Letters", "Projects", "References", "Test Scores", "Personal"];

function fileIcon(type: FileType) {
  switch (type) {
    case "pdf": return <FileText className="w-5 h-5 text-red-500" />;
    case "image": return <Image className="w-5 h-5 text-blue-500" />;
    case "doc": return <FileText className="w-5 h-5 text-[#D4A84C]" />;
    default: return <File className="w-5 h-5 text-gray-400" />;
  }
}

function fileIconLarge(type: FileType) {
  switch (type) {
    case "pdf": return <FileText className="w-10 h-10 text-red-500" />;
    case "image": return <Image className="w-10 h-10 text-blue-500" />;
    case "doc": return <FileText className="w-10 h-10 text-[#D4A84C]" />;
    default: return <File className="w-10 h-10 text-gray-400" />;
  }
}

export function Portfolio() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = mockFiles.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || f.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar showBack title="My Portfolio" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Files", value: mockFiles.length },
            { label: "PDFs", value: mockFiles.filter((f) => f.type === "pdf").length },
            { label: "Images", value: mockFiles.filter((f) => f.type === "image").length },
            { label: "Categories", value: categories.length - 1 },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#9B1B30] focus:border-transparent bg-white"
            />
          </div>

          {/* Category Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" />
                {activeCategory}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {categories.map((cat) => (
                <DropdownMenuItem key={cat} onClick={() => setActiveCategory(cat)}>
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Toggle */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white">
            <button
              onClick={() => setView("grid")}
              className={`p-2.5 transition-colors ${view === "grid" ? "bg-[#9B1B30] text-white" : "text-gray-500 hover:bg-gray-50"}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2.5 transition-colors ${view === "list" ? "bg-[#9B1B30] text-white" : "text-gray-500 hover:bg-gray-50"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Upload */}
          <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#9B1B30] text-white rounded-lg text-sm font-medium hover:bg-[#7A1420] transition-colors">
            <Upload className="w-4 h-4" />
            Upload
          </button>
        </div>

        {/* File Area */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No files found</p>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((file) => (
              <div
                key={file.id}
                className="group bg-white rounded-lg border border-gray-200 p-4 hover:border-[#9B1B30]/30 hover:shadow-sm transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center">
                    {fileIconLarge(file.type)}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Eye className="w-4 h-4" /> View</DropdownMenuItem>
                      <DropdownMenuItem><Download className="w-4 h-4" /> Download</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive"><Trash2 className="w-4 h-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                  {file.name}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">{file.size}</span>
                  <span className="text-xs text-gray-400">{file.date}</span>
                </div>
                <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded-full">
                  {file.category}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {/* List Header */}
            <div className="grid grid-cols-[1fr_100px_120px_100px_40px] gap-4 px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">
              <span>Name</span>
              <span>Size</span>
              <span>Date</span>
              <span>Category</span>
              <span />
            </div>
            {filtered.map((file) => (
              <div
                key={file.id}
                className="group grid grid-cols-[1fr_100px_120px_100px_40px] gap-4 px-4 py-3 items-center hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {fileIcon(file.type)}
                  <span className="text-sm text-gray-900 truncate">{file.name}</span>
                </div>
                <span className="text-sm text-gray-500">{file.size}</span>
                <span className="text-sm text-gray-500">{file.date}</span>
                <span className="text-xs text-gray-500">{file.category}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem><Eye className="w-4 h-4" /> View</DropdownMenuItem>
                    <DropdownMenuItem><Download className="w-4 h-4" /> Download</DropdownMenuItem>
                    <DropdownMenuItem variant="destructive"><Trash2 className="w-4 h-4" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
