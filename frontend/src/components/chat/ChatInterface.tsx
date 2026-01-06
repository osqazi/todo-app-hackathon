/**
 * ChatInterface component for AI-powered task management with vibrant dark theme.
 *
 * This component provides the main chat interface using OpenAI ChatKit
 * for natural language task management.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatMessage, ChatResponse, ChatRequest } from '@/types/chat';
import { getToken } from '@/lib/auth/helpers';
import { VibrantButton } from '@/components/ui/vibrant/VibrantButton';
import { VibrantCard, VibrantCardHeader, VibrantCardTitle, VibrantCardContent } from '@/components/ui/vibrant/VibrantCard';
import { Sparkles, MessageCircle, RotateCcw } from 'lucide-react';

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
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [useStreaming, setUseStreaming] = useState(true); // Phase 7: Streaming toggle

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      if (!token) {
        // Redirect to sign-in if not authenticated
        router.push('/sign-in');
        return;
      }
    };

    checkAuth();
  }, [router]);

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
    <VibrantCard className="chat-container h-full flex flex-col">
      {/* Header */}
      <VibrantCardHeader className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <VibrantCardTitle className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            AI Task Assistant
          </VibrantCardTitle>
        </div>
        <div className="flex items-center gap-3">
          {/* Streaming Toggle */}
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
            <input
              type="checkbox"
              checked={useStreaming}
              onChange={(e) => setUseStreaming(e.target.checked)}
              className="w-4 h-4 text-indigo-500 bg-slate-700 border-slate-600 rounded focus:ring-indigo-500 focus:ring-2"
            />
            <span>Streaming</span>
          </label>
          <VibrantButton
            onClick={startNewConversation}
            variant="outline"
            size="sm"
            className="text-sm"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            New
          </VibrantButton>
        </div>
      </VibrantCardHeader>

      {/* Messages */}
      <VibrantCardContent className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <p className="text-lg font-semibold text-slate-100 mb-2">Welcome to your AI Task Assistant!</p>
            <p className="text-slate-300 mb-6">Ask me to create, update, or manage your tasks using natural language.</p>
            <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700 max-w-md w-full">
              <p className="font-semibold text-slate-200 mb-2">Try commands like:</p>
              <ul className="space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-1">•</span>
                  <span className="text-slate-200">"Add a task to buy groceries"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-1">•</span>
                  <span className="text-slate-200">"Show me all my high-priority tasks"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-1">•</span>
                  <span className="text-slate-200">"Mark task 5 as complete"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-1">•</span>
                  <span className="text-slate-200">"Update task 3 to 'Call client tomorrow at 2 PM'"</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-none shadow-lg'
                      : 'bg-gradient-to-r from-slate-700 to-slate-800 text-slate-100 rounded-bl-none shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.tool_calls && msg.tool_calls.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-600 text-xs opacity-75">
                      <p className="font-medium text-slate-200">Tools used:</p>
                      <ul className="list-disc list-inside">
                        {msg.tool_calls.map((call, i) => (
                          <li key={i} className="text-slate-300">{call.tool_name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl px-5 py-3 rounded-bl-none shadow-md">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/20 rounded-xl p-4 animate-fade-in backdrop-blur-sm">
            <p className="text-red-200">{error}</p>
          </div>
        )}
      </VibrantCardContent>

      {/* Input */}
      <div className="p-4 border-t border-slate-700">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            disabled={isLoading}
            rows={2}
            className="flex-1 resize-none rounded-xl border-2 border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
          />
          <VibrantButton
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 text-base font-semibold"
          >
            Send
          </VibrantButton>
        </form>
        <p className="mt-2 text-xs text-slate-400 text-center">
          Your conversations are saved automatically. Use natural language to manage your tasks.
        </p>
      </div>
    </VibrantCard>
  );
}
