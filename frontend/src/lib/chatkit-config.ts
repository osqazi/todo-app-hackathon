/**
 * ChatKit configuration for Todo AI Assistant.
 *
 * This module configures the OpenAI ChatKit React component for use
 * with the Todo chatbot backend.
 */

import { useChatKit } from '@openai/chatkit-react';

/**
 * Custom hook for Todo ChatKit configuration.
 *
 * Initializes ChatKit with the domain key and API endpoint.
 * The backend endpoint handles authentication, agent execution,
 * and conversation persistence.
 *
 * @returns ChatKit hook with configured API settings
 */
export function useTodoChatKit() {
  // Get configuration from environment variables
  const domainKey = process.env.NEXT_PUBLIC_CHATKIT_DOMAIN_KEY;
  const apiUrl = process.env.NEXT_PUBLIC_CHATKIT_API_URL || 'http://localhost:8000/api/chat';

  if (!domainKey) {
    console.error('NEXT_PUBLIC_CHATKIT_DOMAIN_KEY not set in environment variables');
    throw new Error('ChatKit domain key not configured');
  }

  return useChatKit({
    api: {
      url: apiUrl,
      domainKey: domainKey,
    },
    // Optional: Add custom configuration here
    // streaming: true,  // Enable streaming in Phase 7
    // maxTokens: 1000,
    // temperature: 0.7,
  });
}

/**
 * ChatKit domain key for production deployment.
 * This should match the value in .env.local and CDK.txt.
 */
export const CHATKIT_DOMAIN_KEY = process.env.NEXT_PUBLIC_CHATKIT_DOMAIN_KEY;

/**
 * API base URL for chat endpoint.
 */
export const CHAT_API_URL = process.env.NEXT_PUBLIC_CHATKIT_API_URL || 'http://localhost:8000/api/chat';
