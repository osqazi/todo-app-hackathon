/**
 * Root layout for Next.js application.
 *
 * Providers: AuthProvider, QueryClientProvider
 */

import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { QueryClientProviderWrapper } from "@/components/providers/QueryClientProvider";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: "Todo Application",
  description: "Full-stack todo application with authentication",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <QueryClientProviderWrapper>{children} <Analytics /></QueryClientProviderWrapper>
        </AuthProvider>
        
      </body>
    </html>
  );
}
