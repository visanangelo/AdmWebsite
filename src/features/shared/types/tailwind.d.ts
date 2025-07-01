import type { Config } from 'tailwindcss'

declare module 'tailwindcss' {
  export interface Config {
    darkMode?: string | string[]
    content: string[]
    theme: {
      extend: {
        colors: Record<string, string>
        borderRadius: Record<string, string>
        keyframes: Record<string, Record<string, string>>
        animation: Record<string, string>
      }
    }
    plugins: unknown[]
  }
} 