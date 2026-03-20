import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BrainCircuit, Target, CheckCircle2 } from 'lucide-react';

const steps = [
  { icon: FileText, text: "Reading your profile data..." },
  { icon: BrainCircuit, text: "Extracting skills, experience, and academic history..." },
  { icon: Target, text: "Matching against thousands of university programs..." },
  { icon: Sparkles, text: "Identifying eligibility and calculating skill gaps..." },
  { icon: CheckCircle2, text: "Finalizing your personalized roadmap..." },
];

// Helper icon to avoid importing FileText twice if imported from lucide-react above
function FileText(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
}

export function LoadingState() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 4500); // Change step every 4.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto py-16 px-4 flex flex-col items-center justify-center text-center">
      <div className="relative w-32 h-32 mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-4 border-dashed border-primary/30"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 rounded-full border-4 border-dotted border-accent/40"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-background rounded-full shadow-inner">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-primary"
            >
              {React.createElement(steps[currentStep].icon, { className: "w-10 h-10" })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <h3 className="text-2xl font-display font-bold text-foreground mb-4">
        Discovering Your Path
      </h3>
      
      <div className="h-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            className="text-muted-foreground font-medium"
          >
            {steps[currentStep].text}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md mt-10 h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-primary to-accent"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}
