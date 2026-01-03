/**
 * ChatInterface component for AI-powered task management.
 *
 * This component provides the main chat interface using OpenAI ChatKit
 * for natural language task management.
 */

'use client';

import { useState, useEffect } from 'react';
import { ChatMessage, ChatResponse, ChatRequest } from '@/types/chat';
import { getToken } from '@/lib/auth/helpers';

/**
 * ChatInterface component.
 *
 * Provides a full-featured chat interface for managing tasks via natural language.
 * Uses the backend /api/chat endpoint with JWT authentication.
 *
 * Features:
 * - Send messages to AI assistant
 * - View conversation history
 * - Display agent responses with tool calls
 * - Error handling and loading states
 * - Persistent conversations across sessions
 */
export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [useStreaming, setUseStreaming] = useState(true); // Phase 7: Streaming toggle

  /**
   * Send a message to the chat API (streaming or non-streaming).
   */
  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    setIsLoading(true);
    setError(null);

    // Add user message to UI immediately
    const userMessage: ChatMessage = {
      conversation_id: conversationId || 0,
      role: 'user',
      content: message,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      // Get JWT token from Better Auth
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated. Please sign in.');
      }

      const requestBody: ChatRequest = {
        message,
        conversation_id: conversationId || undefined,
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Phase 7: Use streaming if enabled
      if (useStreaming) {
        await sendMessageStreaming(token, requestBody, apiUrl);
      } else {
        await sendMessageNonStreaming(token, requestBody, apiUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Send message with streaming (Phase 7).
   */
  const sendMessageStreaming = async (token: string, requestBody: ChatRequest, apiUrl: string) => {
    const response = await fetch(`${apiUrl}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Session expired. Please sign in again.');
      }
      throw new Error(`Streaming failed: ${response.status}`);
    }

    // Process SSE stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let streamedContent = '';
    let toolCallsDetected: any[] = [];

    if (!reader) {
      throw new Error('Response body is not readable');
    }

    // Create placeholder message for streaming content
    // Use callback to get CURRENT state, not stale messages.length
    let placeholderId = 0;
    setMessages((prev) => {
      placeholderId = prev.length;  // Get current length
      return [
      ...prev,
      {
        conversation_id: conversationId || 0,
        role: 'agent',
        content: '',
        created_at: new Date().toISOString(),
      },
      ];
    });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        const eventMatch = line.match(/event: (.+)\ndata: (.+)/);
        if (!eventMatch) continue;

        const [, eventType, eventData] = eventMatch;

        try {
          const data = JSON.parse(eventData);

          if (eventType === 'content_delta') {
            streamedContent += data.content || '';
            // Update the placeholder message
            setMessages((prev) => {
              const updated = [...prev];
              updated[placeholderId] = {
                ...updated[placeholderId],
                content: streamedContent,
              };
              return updated;
            });
          } else if (eventType === 'message_end') {
            // Set conversation ID from final message
            if (data.conversation_id && !conversationId) {
              setConversationId(data.conversation_id);
            }
            // Final message update
            setMessages((prev) => {
              const updated = [...prev];
              updated[placeholderId] = {
                ...updated[placeholderId],
                content: data.content || streamedContent,
                tool_calls: data.tool_calls,
              };
              return updated;
            });
          } else if (eventType === 'tool_call_start') {
            toolCallsDetected.push(data);
          } else if (eventType === 'error') {
            throw new Error(data.error || 'Streaming error');
          }
        } catch (parseError) {
          console.warn('Failed to parse SSE event:', line, parseError);
        }
      }
    }
  };

  /**
   * Send message without streaming (original behavior).
   */
  const sendMessageNonStreaming = async (token: string, requestBody: ChatRequest, apiUrl: string) => {
    const response = await fetch(`${apiUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Session expired. Please sign in again.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Request failed: ${response.status}`);
    }

    const data: ChatResponse = await response.json();

    // Add agent response to UI
    const agentMessage: ChatMessage = {
      conversation_id: data.conversation_id,
      role: 'agent',
      content: data.response,
      tool_calls: data.tool_calls,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, agentMessage]);

    // Update conversation ID if this was the first message
    if (!conversationId) {
      setConversationId(data.conversation_id);
    }
  };

  /**
   * Handle form submission.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  /**
   * Handle Enter key to send message (Shift+Enter for new line).
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  /**
   * Start a new conversation.
   */
  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          AI Task Assistant
        </h2>
        <div className="flex items-center gap-3">
          {/* Streaming Toggle */}
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={useStreaming}
              onChange={(e) => setUseStreaming(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span>Streaming</span>
          </label>
          <button
            onClick={startNewConversation}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            New Conversation
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <p className="text-lg font-medium mb-2">Welcome to your AI Task Assistant!</p>
            <p className="text-sm">Ask me to create, update, or manage your tasks using natural language.</p>
            <div className="mt-4 text-xs text-left max-w-md mx-auto space-y-1">
              <p className="font-medium">Try commands like:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                <li>"Add a task to buy groceries"</li>
                <li>"Show me all my high-priority tasks"</li>
                <li>"Mark task 5 as complete"</li>
                <li>"Update task 3 to 'Call client tomorrow at 2 PM'"</li>
              </ul>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.tool_calls && msg.tool_calls.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600 text-xs opacity-75">
                    <p className="font-medium">Tools used:</p>
                    <ul className="list-disc list-inside">
                      {msg.tool_calls.map((call, i) => (
                        <li key={i}>{call.tool_name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            disabled={isLoading}
            rows={2}
            className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Your conversations are saved automatically. Use natural language to manage your tasks.
        </p>
      </form>
    </div>
  );
}
