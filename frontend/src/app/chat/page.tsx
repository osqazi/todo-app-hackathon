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
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with navigation */}
      <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
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
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Task Assistant
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Powered by OpenAI
          </span>
        </div>
      </header>

      {/* Main chat interface */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-5xl mx-auto">
          <ChatInterface />
        </div>
      </main>

      {/* Footer */}
      <footer className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            This AI assistant can create, update, complete, and delete tasks using natural language.
            All actions are performed securely on your behalf.
          </p>
        </div>
      </footer>
    </div>
  );
}
