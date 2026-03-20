import React from 'react';
import { motion } from 'framer-motion';
import { Building2, MapPin, Clock, DollarSign, Award, ArrowRight, AlertCircle, CheckCircle, GraduationCap, FileText, Briefcase, Languages, ChevronRight } from 'lucide-react';
import type { EligibleProgram, NearMatchProgram, Gap } from '@workspace/api-client-react';
import { cn } from '@/lib/utils';

interface EligibleCardProps {
  program: EligibleProgram;
  index: number;
}

export function EligibleProgramCard({ program, index }: EligibleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col h-full group"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
            <Building2 className="w-4 h-4" />
            <span className="font-medium">{program.university}</span>
          </div>
          <h3 className="text-xl font-display font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
            {program.program}
          </h3>
        </div>
        <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap">
          {program.degree}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 opacity-70" />
          <span>{program.country}</span>
        </div>
        {program.duration && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 opacity-70" />
            <span>{program.duration}</span>
          </div>
        )}
        {program.tuitionRange && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <DollarSign className="w-4 h-4 opacity-70" />
            <span>{program.tuitionRange}</span>
          </div>
        )}
        {program.ranking && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Award className="w-4 h-4 opacity-70" />
            <span>Rank: {program.ranking}</span>
          </div>
        )}
      </div>

      <div className="bg-secondary/50 rounded-xl p-4 mb-6 flex-grow">
        <p className="text-sm font-medium text-foreground mb-3 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Why you qualify:</span>
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          {program.whyEligible}
        </p>
        <div className="flex flex-wrap gap-2">
          {program.admissionRequirements.slice(0, 3).map((req, i) => (
            <span key={i} className="text-xs bg-background border border-border px-2 py-1 rounded-md text-muted-foreground">
              {req}
            </span>
          ))}
          {program.admissionRequirements.length > 3 && (
            <span className="text-xs bg-background border border-border px-2 py-1 rounded-md text-muted-foreground">
              +{program.admissionRequirements.length - 3} more
            </span>
          )}
        </div>
      </div>

      <div className="mt-auto pt-4 flex items-center justify-between border-t border-border">
        <div className="text-xs text-muted-foreground">
          {program.applicationDeadline ? `Deadline: ${program.applicationDeadline}` : 'Rolling Admissions'}
        </div>
        <button 
          className="text-primary font-semibold text-sm flex items-center space-x-1 hover:underline"
          onClick={() => window.open(program.programUrl || '#', '_blank')}
        >
          <span>View Details</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

interface NearMatchCardProps {
  program: NearMatchProgram;
  index: number;
}

export function NearMatchProgramCard({ program, index }: NearMatchCardProps) {
  
  const getGapIcon = (type: string) => {
    switch(type) {
      case 'gpa': return <GraduationCap className="w-4 h-4" />;
      case 'test_score': return <FileText className="w-4 h-4" />;
      case 'experience': return <Briefcase className="w-4 h-4" />;
      case 'course': return <Building2 className="w-4 h-4" />;
      case 'language': return <Languages className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800";
    if (score >= 75) return "text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800";
    return "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col h-full group hover:shadow-lg transition-all duration-300"
    >
      <div className="p-6 pb-4 border-b border-border/50">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
            <Building2 className="w-4 h-4" />
            <span className="font-medium">{program.university}</span>
          </div>
          <div className={cn("px-3 py-1 rounded-full text-xs font-bold border flex items-center space-x-1", getScoreColor(program.matchScore))}>
            <span>{program.matchScore}% Match</span>
          </div>
        </div>
        <h3 className="text-xl font-display font-bold text-foreground leading-tight group-hover:text-accent transition-colors">
          {program.program}
        </h3>
        <p className="text-sm text-muted-foreground mt-2">{program.degree} • {program.country}</p>
      </div>

      <div className="p-6 bg-secondary/30 flex-grow">
        <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-orange-500" />
          <span>Gaps to Close</span>
        </h4>
        
        <div className="space-y-4">
          {program.gaps.map((gap, i) => (
            <div key={i} className="bg-background border border-border rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <div className="mt-0.5 p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                  {getGapIcon(gap.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-1">{gap.description}</p>
                  <div className="flex items-start space-x-2 text-xs text-muted-foreground mt-2">
                    <ChevronRight className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                    <span>{gap.howToFix}</span>
                  </div>
                  {gap.timeToFix && (
                    <div className="mt-3 inline-block px-2 py-1 bg-secondary rounded-md text-[11px] font-medium text-muted-foreground">
                      Est. time: {gap.timeToFix}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
