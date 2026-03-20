import { create } from 'zustand';
import type { AnalyzeProfileResponse } from '@workspace/api-client-react';

interface AppState {
  analysisResult: AnalyzeProfileResponse | null;
  setAnalysisResult: (result: AnalyzeProfileResponse | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (status: boolean) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  analysisResult: null,
  setAnalysisResult: (result) => set({ analysisResult: result }),
  isAnalyzing: false,
  setIsAnalyzing: (status) => set({ isAnalyzing: status }),
  reset: () => set({ analysisResult: null, isAnalyzing: false }),
}));
