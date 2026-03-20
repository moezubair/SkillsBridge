import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Linkedin, Briefcase, MapPin, ChevronRight, X } from "lucide-react";
import { useAnalyzeProfile } from "@workspace/api-client-react";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const PROFESSIONS = [
  "Computer Science", "Software Engineering", "Data Science", "Artificial Intelligence",
  "Business Administration", "Finance", "Marketing", "Economics",
  "Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Biomedical Engineering",
  "Medicine", "Public Health", "Nursing", "Psychology",
  "Law", "Architecture", "Education", "Environmental Science",
  "Physics", "Mathematics", "Chemistry", "Biology",
  "Graphic Design", "UX Design", "Film & Media", "Political Science",
  "International Relations", "Social Work"
];

export function ProfileForm() {
  const [activeTab, setActiveTab] = useState<"resume" | "linkedin">("resume");
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [profession, setProfession] = useState("");
  const [country, setCountry] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { setIsAnalyzing, setAnalysisResult } = useAppStore();
  
  const analyzeMutation = useAnalyzeProfile({
    mutation: {
      onSuccess: (data) => {
        setAnalysisResult(data);
        setIsAnalyzing(false);
      },
      onError: (error) => {
        setIsAnalyzing(false);
        toast({
          title: "Analysis Failed",
          description: error.message || "We couldn't analyze your profile right now. Please try again.",
          variant: "destructive"
        });
      }
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    
    // Simple fallback text reader. Real app might send file to backend or use pdfjs
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setResumeText(event.target.result as string);
        toast({
          title: "File attached",
          description: `Successfully loaded ${file.name}`
        });
      }
    };
    reader.onerror = () => {
      toast({
        title: "Error reading file",
        description: "Please try pasting your resume text instead.",
        variant: "destructive"
      });
      setFileName(null);
    };
    reader.readAsText(file); // Reads txt/csv/md perfectly, extracts raw strings from some PDFs
  };

  const clearFile = () => {
    setFileName(null);
    setResumeText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profession) {
      toast({ title: "Profession required", description: "Please select your target field of study.", variant: "destructive" });
      return;
    }

    if (activeTab === "resume" && !resumeText.trim()) {
      toast({ title: "Resume required", description: "Please upload or paste your resume.", variant: "destructive" });
      return;
    }

    if (activeTab === "linkedin" && !linkedinUrl.trim()) {
      toast({ title: "LinkedIn URL required", description: "Please provide your LinkedIn profile URL.", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    
    analyzeMutation.mutate({
      data: {
        profession,
        country: country || undefined,
        resumeText: activeTab === "resume" ? resumeText : undefined,
        linkedinData: activeTab === "linkedin" ? linkedinUrl : undefined,
      }
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-2xl mx-auto bg-card rounded-2xl shadow-xl shadow-primary/5 border border-border overflow-hidden"
    >
      <div className="p-6 md:p-8">
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => setActiveTab("resume")}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2",
              activeTab === "resume" 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <FileText className="w-4 h-4" />
            <span>Use Resume</span>
          </button>
          <button
            onClick={() => setActiveTab("linkedin")}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2",
              activeTab === "linkedin" 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <Linkedin className="w-4 h-4" />
            <span>Use LinkedIn</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SOURCE INPUT */}
          <div className="space-y-4 min-h-[160px]">
            {activeTab === "resume" ? (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {!fileName ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">Click to upload resume</p>
                    <p className="text-xs text-muted-foreground mb-4">TXT, PDF, DOCX (Max 5MB)</p>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
                      <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or paste text</span></div>
                    </div>
                    
                    <textarea 
                      onClick={(e) => e.stopPropagation()}
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Paste your resume content here..."
                      className="mt-4 w-full h-32 p-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                  </div>
                ) : (
                  <div className="border border-border rounded-xl p-6 flex items-center justify-between bg-primary/5">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{fileName}</p>
                        <p className="text-xs text-muted-foreground">Ready for analysis</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={clearFile}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".txt,.pdf,.doc,.docx" 
                  onChange={handleFileUpload}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">LinkedIn Profile URL</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                      <Linkedin className="w-5 h-5" />
                    </div>
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Ensure your profile is set to public, or paste your "About" and "Experience" sections below.</p>
                </div>
                <textarea 
                  value={resumeText} // Reusing this state for pasted text
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Or paste profile text here..."
                  className="w-full h-24 p-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
            {/* TARGET PROFESSION */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Target Profession/Field</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Briefcase className="w-4 h-4" />
                </div>
                <select
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                  required
                >
                  <option value="" disabled>Select a field...</option>
                  {PROFESSIONS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted-foreground">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>

            {/* PREFERRED COUNTRY */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Preferred Country (Optional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. USA, UK, Canada"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={analyzeMutation.isPending}
              className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>Unlock Your Potential</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
