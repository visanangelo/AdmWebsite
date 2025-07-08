import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../../styles/globals.css";
import { ThemeProvider, ClientLayout } from "@/features/shared"

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
