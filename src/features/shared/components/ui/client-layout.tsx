'use client';

import React from "react";
import { LanguageProvider } from "@/contexts/language-context";
import { Toaster } from "sonner";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      {children}
      <Toaster 
        position="top-right"
        richColors
        closeButton
        duration={2000}
      />
    </LanguageProvider>
  );
} 