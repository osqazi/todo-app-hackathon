/**
 * Root layout for Next.js application.
 *
 * Providers: ThemeProvider, AuthProvider, QueryClientProvider
 */

import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { QueryClientProviderWrapper } from "@/components/providers/QueryClientProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import PWAProvider from "@/components/providers/PWAProvider";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: "Todo Application",
  description: "Full-stack todo application with authentication",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gradient-to-br from-slate-900 via-indigo-900/20 to-slate-900 text-slate-100">
        <PWAProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <QueryClientProviderWrapper>{children} <Analytics /></QueryClientProviderWrapper>
            </AuthProvider>
          </ThemeProvider>
        </PWAProvider>
      </body>
    </html>
  );
}
