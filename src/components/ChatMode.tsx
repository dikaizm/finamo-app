/**
 * Chat Mode Component - Chat Assistant UI
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { COLORS } from '../constants/theme';

interface ChatModeProps {
  visible: boolean;
  onClose: () => void;
  chatIntent: 'note' | 'analysis';
  setChatIntent: (intent: 'note' | 'analysis') => void;
  messages: Array<{ id: string; role: 'user' | 'assistant' | 'card'; text: string; intent?: 'note' | 'analysis' }>;
  inputText: string;
  setInputText: (text: string) => void;
  onSend: () => void;
  isSending: boolean;
  scrollRef: React.RefObject<ScrollView>;
}

export default function ChatMode({
  visible,
  onClose,
  chatIntent,
  setChatIntent,
  messages,
  inputText,
  setInputText,
  onSend,
  isSending,
  scrollRef
}: ChatModeProps) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Assistant</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            disabled={isSending}
          >
            <Ionicons name="close" size={26} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="sparkles" size={40} color={COLORS.primary} />
              <Text style={styles.emptyTitle}>
                {chatIntent === 'analysis' ? 'Ask for insights' : 'Quick Log'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {chatIntent === 'analysis'
                  ? 'Try: "What did I spend most on this month?" or "Plan my budget next month"'
                  : 'Try: "coffee 15000" or "grab 32000 transport"'}
              </Text>
            </View>
          )}

          {messages.map(m => (
            <View
              key={m.id}
              style={[
                styles.bubble,
                m.role === 'user' ? styles.bubbleUser : (m.role === 'card' ? styles.bubbleCard : styles.bubbleAssistant),
              ]}
            >
              {m.role === 'assistant' ? (
                <Markdown style={markdownStyles}>
                  {m.text}
                </Markdown>
              ) : m.role === 'card' ? (
                <View>
                  {JSON.parse(m.text).map((item: any, idx: number) => (
                    <View key={idx} style={[styles.transactionCard, idx > 0 && { marginTop: 8 }]}>
                      <View style={[styles.transactionIcon, { backgroundColor: item.type === 'income' ? '#D1FAE5' : '#FEE2E2' }]}>
                        <Ionicons
                          name={item.type === 'income' ? 'arrow-up' : 'pricetag'}
                          size={18}
                          color={item.type === 'income' ? '#10B981' : '#EF4444'}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.transactionTitle}>{item.description}</Text>
                        <Text style={styles.transactionCategory}>{item.category}</Text>
                      </View>
                      <Text style={[styles.transactionAmount, { color: item.type === 'income' ? '#10B981' : '#EF4444' }]}>
                        {item.type === 'income' ? '+' : '-'}{formatRupiah(item.amount)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <Ionicons
                    name={m.intent === 'analysis' ? 'analytics' : 'document-text'}
                    size={16}
                    color="#FFFFFF"
                    style={{ marginRight: 6, marginTop: 2 }}
                  />
                  <Text style={[styles.bubbleText, styles.bubbleTextUser]}>{m.text}</Text>
                </View>
              )}
            </View>
          ))}

          {isSending && (
            <View style={[styles.bubble, styles.bubbleAssistant]}>
              <Text style={[styles.bubbleText, styles.bubbleTextAssistant]}>Processing…</Text>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Intent Pills */}
        <View style={[styles.pillsBar, { bottom: 60 + (insets.bottom || 0) }]}>
          <View style={styles.pillsContainer}>
            <TouchableOpacity
              onPress={() => setChatIntent('note')}
              style={[styles.pill, chatIntent === 'note' && styles.pillActive]}
            >
              <Text style={[styles.pillText, chatIntent === 'note' && styles.pillTextActive]}>Quick Log</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setChatIntent('analysis')}
              style={[styles.pill, chatIntent === 'analysis' && styles.pillActive]}
            >
              <Text style={[styles.pillText, chatIntent === 'analysis' && styles.pillTextActive]}>Thinking</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Input Bar */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom || 0 }]}>
          <TextInput
            style={styles.input}
            placeholder={chatIntent === 'analysis' ? 'Ask for analysis…' : 'Quick log e.g. coffee 15000'}
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            multiline
            editable={!isSending}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={onSend}
            disabled={isSending}
          >
            <Ionicons name="send" size={22} color={isSending ? '#A5B4FC' : '#ffffff'} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// Helper function
function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

const markdownStyles: any = {
  body: {
    color: '#1F2937',
    fontSize: 13,
    lineHeight: 22,
  },
  text: {
    color: '#1F2937',
  },
  strong: {
    fontWeight: '700',
    color: '#111827',
  },
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginVertical: 4,
  },
  bubbleUser: {
    backgroundColor: '#E0E7FF',
  },
  bubbleAssistant: {
    backgroundColor: '#F3F4F6',
  },
  bubbleCard: {
    backgroundColor: '#F3F4F6',
  },
  bubbleText: {
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: '#FFFFFF',
  },
  bubbleTextAssistant: {
    color: '#1F2937',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  pillsBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pillsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    padding: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillActive: {
    backgroundColor: COLORS.primary,
    },
  pillText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.98)',
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#111827',
  },
  sendButton: {
    marginLeft: 8,
    width: 44,
    height: 44,
    backgroundColor: COLORS.primary,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionCard: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    padding: 12,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  transactionCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 12,
    fontWeight: '700',
  },
});
