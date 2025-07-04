import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/features/shared/components/ui/theme-provider";
import { ClientLayout } from "@/features/shared/components/ui/client-layout"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ADM Instal - Equipment Rental Management",
  description: "Professional equipment rental management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
