/**
 * Chat page for AI-powered task management.
 *
 * This page provides a full-screen chat interface for managing tasks
 * via natural language using the OpenAI agent.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import ChatInterface from '@/components/chat/ChatInterface';

export const metadata: Metadata = {
  title: 'AI Task Assistant | Todo App',
  description: 'Manage your tasks using natural language with our AI assistant',
};

/**
 * Chat page component.
 *
 * Provides a dedicated page for the AI chatbot interface with:
 * - Full-screen chat layout
 * - Navigation back to dashboard
 * - Responsive design
 */
export default function ChatPage() {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-indigo-900/20 to-slate-900">
      {/* Header with navigation */}
      <header className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-md border-b border-slate-700/50 shadow-2xl">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="flex items-center text-sm text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-indigo-600/20 hover:to-purple-600/20 px-3 py-2 rounded-lg transition-all duration-300 font-semibold relative overflow-hidden"
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </Link>
          <span className="text-slate-500">|</span>
          <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI Task Assistant
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 px-3 py-1.5 rounded-full border border-slate-600/30">
            Powered by OpenAI
          </span>
        </div>
      </header>

      {/* Main chat interface */}
      <main className="flex-1 overflow-hidden p-4">
        <div className="h-full max-w-5xl mx-auto vibrant-card vibrant-fade-in overflow-hidden">
          <ChatInterface />
        </div>
      </main>

      {/* Footer */}
      <footer className="p-3 bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-t border-slate-700/50">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-center text-slate-500">
            This AI assistant can create, update, complete, and delete tasks using natural language.
            All actions are performed securely on your behalf.
          </p>
        </div>
      </footer>
    </div>
  );
}
