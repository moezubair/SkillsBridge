import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, UserCircle, Star, GraduationCap, Briefcase, ChevronRight, Download } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { EligibleProgramCard, NearMatchProgramCard } from './program-card';
import { cn } from '@/lib/utils';

export function ResultsView() {
  const { analysisResult, reset } = useAppStore();
  const [activeTab, setActiveTab] = useState<'eligible' | 'reach'>('eligible');

  if (!analysisResult) return null;

  const { userProfile, eligiblePrograms, nearMatchPrograms, summary } = analysisResult;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8"
    >
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">Your Path Forward</h2>
          <p className="text-muted-foreground mt-1">Based on our comprehensive analysis of your background.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={reset}
            className="px-4 py-2 bg-secondary text-secondary-foreground font-medium rounded-xl hover:bg-secondary/80 transition-colors flex items-center space-x-2 text-sm"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Analyze New Profile</span>
          </button>
        </div>
      </div>

      {/* Profile Summary Panel */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-primary/5 to-accent/5 border border-border rounded-2xl p-6 mb-10 shadow-sm"
      >
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/3">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <UserCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Profile Recognized</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {summary}
            </p>
          </div>
          
          <div className="lg:w-2/3 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-background rounded-xl p-4 border border-border/50">
              <GraduationCap className="w-5 h-5 text-primary mb-2" />
              <p className="text-xs text-muted-foreground mb-1">Education</p>
              <p className="font-semibold text-sm truncate" title={userProfile.extractedDegree || 'N/A'}>
                {userProfile.extractedDegree || 'N/A'}
              </p>
            </div>
            <div className="bg-background rounded-xl p-4 border border-border/50">
              <Star className="w-5 h-5 text-accent mb-2" />
              <p className="text-xs text-muted-foreground mb-1">GPA/Score</p>
              <p className="font-semibold text-sm">
                {userProfile.extractedGpa || 'Not found'}
              </p>
            </div>
            <div className="bg-background rounded-xl p-4 border border-border/50">
              <Briefcase className="w-5 h-5 text-orange-500 mb-2" />
              <p className="text-xs text-muted-foreground mb-1">Experience</p>
              <p className="font-semibold text-sm">
                {userProfile.extractedExperience || 'Entry Level'}
              </p>
            </div>
            <div className="bg-background rounded-xl p-4 border border-border/50 flex flex-col justify-center">
              <p className="text-2xl font-display font-bold text-primary mb-1">
                {userProfile.extractedSkills.length}
              </p>
              <p className="text-xs text-muted-foreground">Key Skills Identified</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-8">
        <button
          onClick={() => setActiveTab('eligible')}
          className={cn(
            "pb-4 px-6 text-base font-medium transition-colors relative",
            activeTab === 'eligible' ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Programs You Can Apply To
          <span className="ml-2 bg-primary/10 text-primary py-0.5 px-2 rounded-full text-xs">
            {eligiblePrograms?.length || 0}
          </span>
          {activeTab === 'eligible' && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('reach')}
          className={cn(
            "pb-4 px-6 text-base font-medium transition-colors relative",
            activeTab === 'reach' ? "text-accent" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Programs Within Reach
          <span className="ml-2 bg-accent/10 text-accent py-0.5 px-2 rounded-full text-xs">
            {nearMatchPrograms?.length || 0}
          </span>
          {activeTab === 'reach' && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === 'eligible' && (
            <motion.div
              key="eligible"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {eligiblePrograms && eligiblePrograms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {eligiblePrograms.map((prog, idx) => (
                    <EligibleProgramCard key={`el-${idx}`} program={prog} index={idx} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Star className="w-8 h-8 text-muted-foreground opacity-50" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">No perfect matches yet</h3>
                  <p className="text-muted-foreground max-w-md">
                    We couldn't find programs you are immediately eligible for based on the data provided. Check the "Within Reach" tab for programs you are close to qualifying for.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'reach' && (
            <motion.div
              key="reach"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
               {nearMatchPrograms && nearMatchPrograms.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {nearMatchPrograms.map((prog, idx) => (
                    <NearMatchProgramCard key={`nm-${idx}`} program={prog} index={idx} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Target className="w-8 h-8 text-muted-foreground opacity-50" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">No near matches found</h3>
                  <p className="text-muted-foreground max-w-md">
                    Your profile might be too far from the standard requirements for the target profession, or we need more detailed information.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
