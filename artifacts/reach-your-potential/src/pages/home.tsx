import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileForm } from '@/components/profile-form';
import { LoadingState } from '@/components/loading-state';
import { ResultsView } from '@/components/results-view';
import { useAppStore } from '@/store/use-app-store';

export default function Home() {
  const { analysisResult, isAnalyzing } = useAppStore();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Navigation / Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-background/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-display font-bold text-lg">
              R
            </div>
            <span className="font-display font-bold text-xl tracking-tight">Reach</span>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#" className="hover:text-foreground transition-colors">Universities</a>
            <a href="#" className="hover:text-foreground transition-colors">About</a>
          </nav>
        </div>
      </header>

      <main className="flex-grow flex flex-col relative overflow-hidden">
        
        <AnimatePresence mode="wait">
          {!analysisResult && !isAnalyzing && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex-grow flex flex-col items-center pt-16 pb-24"
            >
              {/* Hero Section */}
              <div className="absolute top-0 left-0 w-full h-[600px] overflow-hidden -z-10">
                <img 
                  src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
                  alt="Abstract background" 
                  className="w-full h-full object-cover opacity-30 mix-blend-multiply dark:mix-blend-screen"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
              </div>

              <div className="max-w-4xl mx-auto px-4 text-center mb-16 relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-bold tracking-wider uppercase mb-6">
                    AI-Powered Admissions Strategy
                  </span>
                  <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-foreground mb-6">
                    Find the programs you <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">actually</span> qualify for.
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                    Upload your resume or connect LinkedIn. We'll instantly match your profile against top university requirements and show you exactly what you need to bridge the gap.
                  </p>
                </motion.div>
              </div>

              {/* Input Form */}
              <div className="w-full px-4 relative z-10">
                <ProfileForm />
              </div>

              {/* Trust markers */}
              <div className="mt-24 text-center opacity-60 relative z-10">
                <p className="text-sm font-medium uppercase tracking-widest mb-6">Analyzing programs from</p>
                <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center grayscale">
                  {/* Decorative placeholders for university logos */}
                  <div className="font-display font-bold text-xl">Stanford</div>
                  <div className="font-display font-bold text-xl">MIT</div>
                  <div className="font-display font-bold text-xl">Oxford</div>
                  <div className="font-display font-bold text-xl">Toronto</div>
                  <div className="font-display font-bold text-xl">Melbourne</div>
                </div>
              </div>
            </motion.div>
          )}

          {isAnalyzing && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-grow flex items-center justify-center bg-background relative z-20"
            >
              <LoadingState />
            </motion.div>
          )}

          {analysisResult && !isAnalyzing && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-grow bg-background relative z-20"
            >
              <ResultsView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/50 py-8 text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} Reach your Potential. Empowering academic journeys.</p>
      </footer>
    </div>
  );
}
