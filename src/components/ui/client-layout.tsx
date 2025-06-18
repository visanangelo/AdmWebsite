'use client';

import React from "react";
import { LanguageProvider } from "../../contexts/language-context";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  );
} 