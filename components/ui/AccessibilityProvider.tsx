"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AccessibilityContextProps {
  isEasyMode: boolean;
  setIsEasyMode: (val: boolean) => void;
  isHighContrast: boolean;
  setIsHighContrast: (val: boolean) => void;
  fontSizeMultiplier: number; // 1 = 100%, 1.2 = 120%, 1.4 = 140%
  setFontSizeMultiplier: (val: number) => void;
  isReadAloudEnabled: boolean;
  setIsReadAloudEnabled: (val: boolean) => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextProps | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isEasyMode, setIsEasyMode] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1);
  const [isReadAloudEnabled, setIsReadAloudEnabled] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const savedEasyMode = localStorage.getItem('accessibility_easy_mode');
    const savedHighContrast = localStorage.getItem('accessibility_high_contrast');
    const savedFontSize = localStorage.getItem('accessibility_font_size');
    const savedReadAloud = localStorage.getItem('accessibility_read_aloud');

    if (savedEasyMode) setIsEasyMode(savedEasyMode === 'true');
    if (savedHighContrast) setIsHighContrast(savedHighContrast === 'true');
    if (savedFontSize) setFontSizeMultiplier(parseFloat(savedFontSize));
    if (savedReadAloud) setIsReadAloudEnabled(savedReadAloud === 'true');
  }, []);

  const handleSetEasyMode = useCallback((val: boolean) => {
    setIsEasyMode(val);
    localStorage.setItem('accessibility_easy_mode', String(val));
    if (val) {
      speak("Easy mode enabled. Controls are now larger and simplified.");
    } else {
      speak("Standard mode restored.");
    }
  }, []);

  const handleSetHighContrast = useCallback((val: boolean) => {
    setIsHighContrast(val);
    localStorage.setItem('accessibility_high_contrast', String(val));
    if (val) {
      speak("High contrast mode turned on.");
    }
  }, []);

  const handleSetFontSizeMultiplier = useCallback((val: number) => {
    setFontSizeMultiplier(val);
    localStorage.setItem('accessibility_font_size', String(val));
  }, []);

  const handleSetReadAloudEnabled = useCallback((val: boolean) => {
    setIsReadAloudEnabled(val);
    localStorage.setItem('accessibility_read_aloud', String(val));
    if (val) {
      speak("Voice guide enabled. Tap any card or title to read it aloud.");
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    
    // Cancel currently speaking
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for elderly comfort
    synth.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    if (synth) {
      synth.cancel();
    }
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        isEasyMode,
        setIsEasyMode: handleSetEasyMode,
        isHighContrast,
        setIsHighContrast: handleSetHighContrast,
        fontSizeMultiplier,
        setFontSizeMultiplier: handleSetFontSizeMultiplier,
        isReadAloudEnabled,
        setIsReadAloudEnabled: handleSetReadAloudEnabled,
        speak,
        stopSpeaking
      }}
    >
      <div 
        className={`${isHighContrast ? 'contrast-125 saturate-150 font-semibold' : ''}`}
        style={{ fontSize: `${fontSizeMultiplier * 100}%` }}
      >
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
