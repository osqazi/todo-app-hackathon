/**
 * TypeScript types for chat functionality.
 *
 * These types define the structure of chat messages, conversations,
 * and API requests/responses for the AI chatbot.
 */

/**
 * Message role in a conversation.
 */
export type MessageRole = 'user' | 'agent' | 'system';

/**
 * A single message in a conversation.
 */
export interface ChatMessage {
  message_id?: number;
  conversation_id: number;
  role: MessageRole;
  content: string;
  tool_calls?: ToolCall[];
  metadata?: MessageMetadata;
  created_at: string;
}

/**
 * Tool call made by the agent during response generation.
 */
export interface ToolCall {
  tool_name: string;
  arguments: Record<string, any>;
  result?: Record<string, any>;
  status?: 'success' | 'error';
  error_message?: string;
}

/**
 * Message metadata for additional information.
 */
export interface MessageMetadata {
  streaming_state?: 'started' | 'streaming' | 'completed';
  reasoning_steps?: string[];
  error_info?: {
    error_type: string;
    error_message: string;
    recovery_action?: string;
  };
  intent_detected?: string;
  confidence_score?: number;
}

/**
 * A conversation session.
 */
export interface Conversation {
  conversation_id: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[];
}

/**
 * Request payload for sending a chat message.
 */
export interface ChatRequest {
  message: string;
  conversation_id?: number;
  stream?: boolean;
}

/**
 * Response from the chat endpoint.
 */
export interface ChatResponse {
  response: string;
  conversation_id: number;
  tool_calls?: ToolCall[];
}

/**
 * List of conversations response.
 */
export interface ConversationsListResponse {
  conversations: {
    conversation_id: number;
    created_at: string;
    updated_at: string;
  }[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Chat UI state.
 */
export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  conversationId: number | null;
}

/**
 * Streaming event types for Server-Sent Events.
 */
export type StreamEventType =
  | 'message_start'
  | 'content_delta'
  | 'tool_call'
  | 'tool_result'
  | 'message_end'
  | 'error';

/**
 * Server-Sent Event data structure.
 */
export interface StreamEvent {
  type: StreamEventType;
  data: any;
}
