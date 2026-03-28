/**
 * Chat Session Storage - Persistent storage for chat sessions
 * 
 * Stores active chat session IDs in AsyncStorage so they persist across app restarts.
 * Each user has their own set of session IDs.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAT_SESSION_KEY = '@finamo:activeChatSession';
const CHAT_SESSIONS_KEY = '@finamo:chatSessions';

/**
 * Store the currently active chat session ID
 */
export async function storeActiveSession(sessionId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(CHAT_SESSION_KEY, sessionId);
    console.log('[ChatStorage] Stored active session:', sessionId);
  } catch (error) {
    console.error('[ChatStorage] Failed to store active session:', error);
  }
}

/**
 * Get the currently active chat session ID
 */
export async function getActiveSession(): Promise<string | null> {
  try {
    const sessionId = await AsyncStorage.getItem(CHAT_SESSION_KEY);
    return sessionId;
  } catch (error) {
    console.error('[ChatStorage] Failed to get active session:', error);
    return null;
  }
}

/**
 * Remove the active chat session (on logout)
 */
export async function clearActiveSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CHAT_SESSION_KEY);
    console.log('[ChatStorage] Cleared active session');
  } catch (error) {
    console.error('[ChatStorage] Failed to clear active session:', error);
  }
}

/**
 * Store list of all user's chat session IDs
 */
export async function storeSessionIds(sessionIds: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessionIds));
    console.log('[ChatStorage] Stored session IDs:', sessionIds.length);
  } catch (error) {
    console.error('[ChatStorage] Failed to store session IDs:', error);
  }
}

/**
 * Get list of all user's chat session IDs
 */
export async function getSessionIds(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(CHAT_SESSIONS_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('[ChatStorage] Failed to get session IDs:', error);
    return [];
  }
}

/**
 * Clear all stored session IDs (on logout)
 */
export async function clearAllSessions(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([CHAT_SESSION_KEY, CHAT_SESSIONS_KEY]);
    console.log('[ChatStorage] Cleared all sessions');
  } catch (error) {
    console.error('[ChatStorage] Failed to clear all sessions:', error);
  }
}

/**
 * Add a session to the list of known sessions
 */
export async function addSessionId(sessionId: string): Promise<void> {
  try {
    const existing = await getSessionIds();
    if (!existing.includes(sessionId)) {
      await storeSessionIds([...existing, sessionId]);
      console.log('[ChatStorage] Added session ID:', sessionId);
    }
  } catch (error) {
    console.error('[ChatStorage] Failed to add session ID:', error);
  }
}
