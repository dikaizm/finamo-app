/**
 * Chat Service - Multi-turn chat with AI financial assistant
 * 
 * Uses /agent/chat endpoint for session-aware conversations
 */
import { getAccessToken } from './authService';

const ENV_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8077').replace(/\/$/, '');
const BASE_URL = ENV_BASE.endsWith('/v1') ? ENV_BASE : `${ENV_BASE}/v1`;

// Types matching backend schemas
export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

export interface ChatSession {
    id: string;
    title?: string;
    month_context?: string;
    created_at: string;
    updated_at: string;
}

export interface FinancialActionPlan {
    action: string;
    parameters: Record<string, any>;
    reasoning: string;
}

export interface ChatResponse {
    session_id: string;
    message: string;
    action_plan?: FinancialActionPlan;
    intent?: 'analysis' | 'planning' | 'confirmation' | 'explanation' | 'command';
    is_command: boolean;
}

export interface ChatHistoryResponse {
    session: ChatSession;
    messages: ChatMessage[];
}

/**
 * Get auth token from in-memory storage
 */
function getAuthToken(): string | null {
    return getAccessToken();
}

/**
 * Authenticated fetch wrapper
 */
async function authFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getAuthToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers,
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 200)}`);
        }

        if (response.status === 204) {
            return undefined as unknown as T;
        }

        return await response.json();
    } catch (error: any) {
        clearTimeout(timeout);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out');
        }
        throw error;
    }
}

/**
 * Chat Service API
 */
export const chatService = {
    /**
     * Send a message to the AI assistant
     */
    async sendMessage(
        message: string,
        sessionId?: string,
        month?: string,
        mode: 'log' | 'analyze' = 'analyze'
    ): Promise<ChatResponse> {
        const body: Record<string, any> = { message, mode };
        if (sessionId) body.session_id = sessionId;
        if (month) body.month = month;

        return authFetch<ChatResponse>('/agent/chat', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },

    /**
     * Get list of chat sessions
     */
    async getSessions(): Promise<ChatSession[]> {
        return authFetch<ChatSession[]>('/agent/chat/sessions');
    },

    /**
     * Get chat history for a session
     */
    async getHistory(sessionId: string): Promise<ChatHistoryResponse> {
        return authFetch<ChatHistoryResponse>(`/agent/chat/${sessionId}/history`);
    },

    /**
     * Delete a chat session
     */
    async deleteSession(sessionId: string): Promise<void> {
        return authFetch<void>(`/agent/chat/${sessionId}`, {
            method: 'DELETE',
        });
    },
};

export default chatService;
