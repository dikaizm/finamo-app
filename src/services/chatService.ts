/**
 * Chat Service - Multi-turn chat with AI financial assistant
 * 
 * Uses /agent/chat endpoint for session-aware conversations.
 * All requests go through the authenticated axios instance which handles
 * automatic token refresh on 401 errors.
 */
import authApi from './authService';

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
    parameters: Record<string, unknown>;
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

// API Response wrapper interface (matches backend)
interface ApiResponse<T> {
    status: 'success' | 'error';
    message: string;
    data: T | null;
    errors: Array<{
        code: string;
        message: string;
        details?: unknown;
    }> | null;
}

/**
 * Unwrap API response and extract data, throwing on error
 */
function unwrapResponse<T>(response: ApiResponse<T>, endpoint: string): T {
    if (response.status === 'error' || !response.data) {
        const errorMessage = response.errors?.[0]?.message || response.message || 'Unknown error';
        console.error(`[ChatService] Error from ${endpoint}:`, errorMessage);
        throw new Error(errorMessage);
    }
    return response.data;
}

/**
 * Chat Service API
 */
export const chatService = {
    /**
     * Send a message to the AI assistant
     * 
     * @param message - User message text
     * @param sessionId - Optional session ID for multi-turn conversations
     * @param month - Optional month context (YYYY-MM format)
     * @param mode - 'log' for transaction logging, 'analyze' for analysis
     */
    async sendMessage(
        message: string,
        sessionId?: string,
        month?: string,
        mode: 'log' | 'analyze' = 'analyze'
    ): Promise<ChatResponse> {
        const body: Record<string, unknown> = { message, mode };
        if (sessionId) body.session_id = sessionId;
        if (month) body.month = month;

        console.log('[ChatService] Sending message:', { mode, hasSession: !!sessionId, month });

        try {
            const response = await authApi.post<ApiResponse<ChatResponse>>('/agent/chat', body);
            return unwrapResponse(response.data, '/agent/chat');
        } catch (error: unknown) {
            const err = error as { response?: { status?: number }; message?: string };
            console.error('[ChatService] sendMessage failed:', err.response?.status, err.message);
            throw error;
        }
    },

    /**
     * Get list of chat sessions for the current user
     */
    async getSessions(): Promise<ChatSession[]> {
        console.log('[ChatService] Getting sessions');

        try {
            const response = await authApi.get<ApiResponse<ChatSession[]>>('/agent/chat/sessions');
            return unwrapResponse(response.data, '/agent/chat/sessions');
        } catch (error: unknown) {
            const err = error as { response?: { status?: number }; message?: string };
            console.error('[ChatService] getSessions failed:', err.response?.status, err.message);
            throw error;
        }
    },

    /**
     * Get chat history for a specific session
     * 
     * @param sessionId - The session ID to get history for
     */
    async getHistory(sessionId: string): Promise<ChatHistoryResponse> {
        console.log('[ChatService] Getting history for session:', sessionId);

        try {
            const response = await authApi.get<ApiResponse<ChatHistoryResponse>>(
                `/agent/chat/${sessionId}/history`
            );
            return unwrapResponse(response.data, `/agent/chat/${sessionId}/history`);
        } catch (error: unknown) {
            const err = error as { response?: { status?: number }; message?: string };
            console.error('[ChatService] getHistory failed:', err.response?.status, err.message);
            throw error;
        }
    },

    /**
     * Delete a chat session
     * 
     * @param sessionId - The session ID to delete
     */
    async deleteSession(sessionId: string): Promise<void> {
        console.log('[ChatService] Deleting session:', sessionId);

        try {
            await authApi.delete(`/agent/chat/${sessionId}`);
        } catch (error: unknown) {
            const err = error as { response?: { status?: number }; message?: string };
            console.error('[ChatService] deleteSession failed:', err.response?.status, err.message);
            throw error;
        }
    },
};

export default chatService;
