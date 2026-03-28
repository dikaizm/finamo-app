/**
 * Chat Service - Multi-turn chat with AI financial assistant (v2 LangGraph)
 *
 * Uses /v2/agent/chat endpoint for session-aware, LangGraph-powered conversations.
 * All requests go through authApiV2 which handles automatic token refresh on 401.
 *
 * Endpoint mapping:
 *   POST   /v2/agent/chat                          → sendMessage
 *   GET    /v2/agent/sessions                      → getSessions
 *   GET    /v2/agent/sessions/{id}/history         → getHistory
 *   DELETE /v2/agent/sessions/{id}                 → deleteSession
 */
import { authApiV2 } from './authService';

// ─── Types matching backend schemas ──────────────────────────────────────────

export interface ChatMessage {
    role: 'user' | 'assistant' | 'card';
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
    intent?: string;
    is_command: boolean;
    requires_confirmation?: boolean;
    entities?: Record<string, unknown>;
}

export interface ChatHistoryResponse {
    session: ChatSession;
    messages: ChatMessage[];
}

// API Response wrapper interface (matches backend ApiResponse[T])
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function unwrapResponse<T>(response: ApiResponse<T>, endpoint: string): T {
    if (response.status === 'error' || !response.data) {
        const errorMessage = response.errors?.[0]?.message || response.message || 'Unknown error';
        console.error(`[ChatService] Error from ${endpoint}:`, errorMessage);
        throw new Error(errorMessage);
    }
    return response.data;
}

// ─── Chat Service ─────────────────────────────────────────────────────────────

export const chatService = {
    /**
     * Send a message to the v2 LangGraph AI assistant.
     *
     * @param message   User message text
     * @param sessionId Optional existing session ID for multi-turn conversations
     * @param month     Optional month context (YYYY-MM)
     * @param mode      'log' | 'analyze' (passed as-is; v2 agent uses it for intent hints)
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

        console.log('[ChatService v2] Sending message:', { mode, hasSession: !!sessionId, month });

        try {
            const response = await authApiV2.post<ApiResponse<ChatResponse>>('/agent/chat', body);
            return unwrapResponse(response.data, '/v2/agent/chat');
        } catch (error: unknown) {
            const err = error as { response?: { status?: number }; message?: string };
            console.error('[ChatService v2] sendMessage failed:', err.response?.status, err.message);
            throw error;
        }
    },

    /**
     * List all chat sessions for the current user.
     */
    async getSessions(): Promise<ChatSession[]> {
        console.log('[ChatService v2] Getting sessions');

        try {
            const response = await authApiV2.get<ApiResponse<ChatSession[]>>('/agent/sessions');
            return unwrapResponse(response.data, '/v2/agent/sessions');
        } catch (error: unknown) {
            const err = error as { response?: { status?: number }; message?: string };
            console.error('[ChatService v2] getSessions failed:', err.response?.status, err.message);
            throw error;
        }
    },

    /**
     * Get full chat history for a session.
     *
     * @param sessionId Session ID to retrieve
     */
    async getHistory(sessionId: string): Promise<ChatHistoryResponse> {
        console.log('[ChatService v2] Getting history for session:', sessionId);

        try {
            const response = await authApiV2.get<ApiResponse<ChatHistoryResponse>>(
                `/agent/sessions/${sessionId}/history`
            );
            return unwrapResponse(response.data, `/v2/agent/sessions/${sessionId}/history`);
        } catch (error: unknown) {
            const err = error as { response?: { status?: number }; message?: string };
            console.error('[ChatService v2] getHistory failed:', err.response?.status, err.message);
            throw error;
        }
    },

    /**
     * Delete a chat session and all its messages.
     *
     * @param sessionId Session ID to delete
     */
    async deleteSession(sessionId: string): Promise<void> {
        console.log('[ChatService v2] Deleting session:', sessionId);

        try {
            await authApiV2.delete(`/agent/sessions/${sessionId}`);
        } catch (error: unknown) {
            const err = error as { response?: { status?: number }; message?: string };
            console.error('[ChatService v2] deleteSession failed:', err.response?.status, err.message);
            throw error;
        }
    },
};

export default chatService;
