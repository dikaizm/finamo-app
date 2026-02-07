import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  BackHandler,
  Keyboard,
  Animated,
  Easing,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Markdown from 'react-native-markdown-display';
import { useFinance } from '../context/FinanceContext';
import AIService from '../services/AIService';
import { API, FinanceSummary, SpendingAnalytics, SavingsSummary, AdviceResponse } from '../services/api';
import chatService, { ChatResponse } from '../services/chatService';
import { formatRupiah, formatRupiahWithSymbol } from '../utils/format';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { financialData, addTransaction } = useFinance();
  const [inputText, setInputText] = useState('');
  // Simple lock to avoid duplicate submissions
  const [isSending, setIsSending] = useState(false);
  const [chatMode, setChatMode] = useState(false);
  const [chatIntent, setChatIntent] = useState<'note' | 'analysis'>('note');
  const [chatSessionId, setChatSessionId] = useState<string | null>(null); // Multi-turn session
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'assistant' | 'card'; text: string }[]>([]);
  const [remoteSummary, setRemoteSummary] = useState<FinanceSummary | null>(null);
  const [remoteSpending, setRemoteSpending] = useState<SpendingAnalytics | null>(null);
  const [remoteSavings, setRemoteSavings] = useState<SavingsSummary | null>(null);
  const [remoteAdvice, setRemoteAdvice] = useState<AdviceResponse | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false); // pull-to-refresh state
  const scrollRef = useRef<ScrollView | null>(null);
  const chatInputRef = useRef<TextInput | null>(null);
  const overlayAnim = useRef(new Animated.Value(0)).current; // 0 hidden, 1 shown
  // Removed legacy processingRef & lastCommandRef (simplified with isSending state lock)
  const suppressAutoFocusRef = useRef(false); // prevent auto focus when returning from chat
  const [monthSheetVisible, setMonthSheetVisible] = useState(false);
  const [selectedMonthLabel, setSelectedMonthLabel] = useState<string>('This Month');
  const sheetAnim = useRef(new Animated.Value(0)).current; // 0 hidden, 1 shown for month sheet
  const chevronAnim = useRef(new Animated.Value(0)).current; // 0 down, 1 up
  const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

  const months = React.useMemo(() => {
    const arr: { key: string; label: string; date: Date; isCurrent: boolean }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = i === 0 ? 'This Month' : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      arr.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label,
        date: d,
        isCurrent: i === 0,
      });
    }
    return arr;
  }, []);

  // Active month key (YYYY-MM) derived from selected label
  const activeMonthKey = React.useMemo(() => {
    if (selectedMonthLabel === 'This Month') {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    try {
      const parsed = new Date(selectedMonthLabel);
      if (!isNaN(parsed.getTime())) {
        return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
      }
    } catch { }
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, [selectedMonthLabel]);

  // Fetch remote month data
  const fetchMonthData = React.useCallback(async (monthKey: string) => {
    setApiLoading(true);
    setApiError(null);
    try {
      const [summary, spending, savings, advice] = await Promise.all([
        API.getFinanceSummary(monthKey),
        API.getSpendingAnalytics(monthKey),
        API.getSavingsSummary(monthKey),
        API.getAdvice(monthKey).catch(() => null),
      ]);
      setRemoteSummary(summary);
      setRemoteSpending(spending);
      setRemoteSavings(savings);
      setRemoteAdvice(advice as AdviceResponse | null);
    } catch (e: any) {
      console.warn('Month data fetch failed', e?.message || e);
      setApiError(e?.message || 'Failed to load data');
    } finally {
      setApiLoading(false);
    }
  }, []);

  useEffect(() => { fetchMonthData(activeMonthKey); }, [activeMonthKey, fetchMonthData]);
  const refetchAfterMutation = React.useCallback(() => { fetchMonthData(activeMonthKey); }, [activeMonthKey, fetchMonthData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchMonthData(activeMonthKey);
    } finally {
      // slight delay for smoother UX if fetch is very fast
      setTimeout(() => setRefreshing(false), 300);
    }
  }, [activeMonthKey, fetchMonthData]);

  const closeMonthSheet = () => {
    // Animate out then hide
    Animated.parallel([
      Animated.timing(sheetAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(chevronAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setMonthSheetVisible(false);
    });
  };

  const openMonthSheet = () => {
    setMonthSheetVisible(true);
    sheetAnim.setValue(0);
    chevronAnim.setValue(0);
    // Wait for next frame to ensure the sheet is mounted before animating
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(sheetAnim, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(chevronAnim, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleSelectMonth = (m: { key: string; label: string }) => {
    setSelectedMonthLabel(m.label);
    closeMonthSheet();
    // fetch triggered by effect
  };

  // Auto-scroll chat when new messages arrive
  useEffect(() => {
    if (chatMode && scrollRef.current) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages, chatMode]);

  const handleAIInput = useCallback(async () => {
    if (isSending || !inputText.trim()) return;
    setIsSending(true);
    console.log('[AIInput] invoked with:', inputText);
    try {
      const text = inputText.trim();
      const mode = chatIntent === 'analysis' ? 'analyze' : 'log';
      const prefixed = `${chatIntent === 'analysis' ? 'analysis: ' : 'note: '}${text}`;

      // Render user bubble first when overlay chat is open
      if (chatMode) setMessages(prev => [...prev, { id: Date.now() + '-u', role: 'user', text: prefixed }]);

      const res = await chatService.sendMessage(
        text,
        chatSessionId || undefined,
        activeMonthKey,
        mode
      );
      console.log('Chat response:', res);

      // Store session ID for multi-turn
      if (res.session_id && res.session_id !== chatSessionId) {
        setChatSessionId(res.session_id);
      }

      if (mode === 'analyze') {
        // Analysis Mode: Show response text
        const assistantText = res.message || 'No response available.';
        if (chatMode) {
          setMessages(prev => [...prev, { id: Date.now() + '-a', role: 'assistant', text: assistantText }]);
        } else {
          alert(assistantText);
        }
      } else {
        // Log Mode: Process Action Plan
        const actionPlan = res.action_plan;
        let assistantFeedback = res.message;

        if (actionPlan) {
          const { action, parameters } = actionPlan;
          // Map backend action to frontend logic
          if (action === 'add_expense' && parameters) {
            addTransaction({
              type: 'expense',
              category: parameters.category || 'Others',
              amount: parameters.amount || 0,
              description: parameters.description || text,
              date: new Date(),
            });
          } else if (action === 'add_income' && parameters) {
            addTransaction({
              type: 'income',
              category: 'Income',
              amount: parameters.amount || 0,
              description: parameters.description || text,
              date: new Date(),
            });
          }
          // For reminders/budget/etc., we can add more handlers here or just show the message
        }

        if (chatMode) {
          setMessages(prev => [...prev, { id: Date.now() + '-a', role: 'assistant', text: assistantFeedback }]);
        } else {
          alert(assistantFeedback);
        }
      }

      setInputText('');

    } catch (err: any) {
      console.warn('Chat service failed', err);
      const fallback = 'Sorry, I could not process that right now.';
      if (chatMode) {
        setMessages(prev => [...prev, { id: Date.now() + '-a', role: 'assistant', text: fallback }]);
      } else {
        alert('Failed to process command. Please try again.');
      }
    } finally {
      setIsSending(false);
    }
  }, [isSending, inputText, chatMode, chatIntent, chatSessionId, activeMonthKey, addTransaction]);

  const spendingPercentage = remoteSpending
    ? remoteSpending.expensePctOfIncome
    : (financialData.monthlyExpense / Math.max(financialData.monthlyIncome || 1, 1)) * 100;
  const lastMonthGrowth = 15; // Mock data

  // Handle Android hardware back: exit chat mode instead of leaving the screen / app
  useEffect(() => {
    if (!chatMode) return; // Only attach when chat is open
    const onBackPress = () => {
      if (chatMode) {
        closeChat();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [chatMode]);

  // Open animation & optional autofocus
  useEffect(() => {
    if (chatMode) {
      overlayAnim.setValue(0);
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        if (!suppressAutoFocusRef.current) {
          chatInputRef.current?.focus();
        } else {
          // reset flag after a short delay
          setTimeout(() => { suppressAutoFocusRef.current = false; }, 50);
        }
      });
    }
  }, [chatMode]);

  const closeChat = () => {
    // Prevent auto-focus when we show the small input again
    suppressAutoFocusRef.current = true;
    Keyboard.dismiss();
    Animated.timing(overlayAnim, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setChatMode(false);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#5B5FFF"
            colors={['#5B5FFF']}
            progressBackgroundColor="#FFFFFF"
          />
        }
      >
        {/* {apiLoading && (
          <View style={{ padding: 16 }}>
            <Text style={{ color: '#6B7280' }}>Loading latest data…</Text>
          </View>
        )} */}
        {!!apiError && (
          <View style={{ padding: 16, backgroundColor: '#FEE2E2', marginHorizontal: 16, borderRadius: 12 }}>
            <Text style={{ color: '#B91C1C', fontSize: 13 }}>Failed to update remote data: {apiError}</Text>
          </View>
        )}
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerLeft} onPress={openMonthSheet} activeOpacity={0.7}>
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: chevronAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '180deg'],
                    }),
                  },
                ],
              }}
            >
              <Ionicons name="chevron-down" size={24} color="#1F2937" />
            </Animated.View>
            <Text style={styles.headerTitle}>{selectedMonthLabel}</Text>
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color="#1F2937" />
            </TouchableOpacity>
            <TouchableOpacity>
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color="#5B5FFF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card */}
        <LinearGradient
          colors={['#5B5FFF', '#7C7FFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <TouchableOpacity>
              <Ionicons name="ellipsis-horizontal" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>
            {formatRupiah((remoteSummary?.totalBalance) ?? financialData.totalBalance)}
          </Text>
          <View style={styles.balanceGrowth}>
            <Ionicons name="trending-up" size={16} color="white" />
            <Text style={styles.balanceGrowthText}>
              {lastMonthGrowth}% from last month
            </Text>
          </View>
        </LinearGradient>

        {/* Income/Expense Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
            <View style={styles.statIcon}>
              <Ionicons name="arrow-down" size={24} color="#EF4444" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Expense</Text>
              <Text style={styles.statAmount}>
                {formatRupiah(remoteSummary?.monthlyExpense ?? financialData.monthlyExpense)}
              </Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
            <View style={styles.statIcon}>
              <Ionicons name="arrow-up" size={24} color="#10B981" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Income</Text>
              <Text style={styles.statAmount}>
                {formatRupiah(remoteSummary?.monthlyIncome ?? financialData.monthlyIncome)}
              </Text>
            </View>
          </View>
        </View>

        {/* Saving Card */}
        <TouchableOpacity style={styles.savingCard}>
          <View style={styles.savingIcon}>
            <Ionicons name="wallet" size={24} color="#5B5FFF" />
          </View>
          <View style={styles.savingContent}>
            <Text style={styles.savingLabel}>Saving</Text>
            <Text style={styles.savingAmount}>
              {formatRupiah(remoteSummary?.monthlySaving ?? financialData.monthlySaving)}
            </Text>
          </View>
          <TouchableOpacity style={styles.detailsButton}>
            <Text style={styles.detailsButtonText}>Details</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* AI Advice Card */}
        <TouchableOpacity style={styles.aiCard}>
          <View style={styles.aiIcon}>
            <Ionicons name="sparkles" size={24} color="white" />
          </View>
          <View style={styles.aiContent}>
            <Text style={styles.aiTitle}>Need Advice?</Text>
            <Text style={styles.aiSubtitle}>Let our AI help you manage your finance</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#5B5FFF" />
        </TouchableOpacity>

        {/* Spending Analysis */}
        <View style={styles.analysisSection}>
          <View style={styles.analysisSectionHeader}>
            <Text style={styles.sectionTitle}>Spending Analysis</Text>
            <TouchableOpacity>
              <Ionicons name="ellipsis-horizontal" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          <View style={styles.analysisCard}>
            <View style={styles.chartContainer}>
              <View style={styles.chartCircle}>
                <Text style={styles.chartPercentage}>{Math.round(spendingPercentage)}%</Text>
                <Text style={styles.chartLabel}>of income</Text>
              </View>
            </View>

            <View style={styles.categoryList}>
              <View style={styles.categoryItem}>
                <View style={[styles.categoryDot, { backgroundColor: '#5B5FFF' }]} />
                <Text style={styles.categoryName}>Shopping</Text>
                <Text style={styles.categoryAmount}>
                  {formatRupiah(((remoteSpending?.byCategory.find(c => c.category.toLowerCase() === 'shopping')?.amount) ?? financialData.spendingByCategory.Shopping) || 0)}
                </Text>
              </View>
              <View style={styles.categoryItem}>
                <View style={[styles.categoryDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.categoryName}>Food</Text>
                <Text style={styles.categoryAmount}>
                  {formatRupiah(((remoteSpending?.byCategory.find(c => c.category.toLowerCase() === 'food')?.amount) ?? financialData.spendingByCategory.Food) || 0)}
                </Text>
              </View>
              <View style={styles.categoryItem}>
                <View style={[styles.categoryDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.categoryName}>Transport</Text>
                <Text style={styles.categoryAmount}>
                  {formatRupiah(((remoteSpending?.byCategory.find(c => c.category.toLowerCase() === 'transport')?.amount) ?? financialData.spendingByCategory.Transport) || 0)}
                </Text>
              </View>
              <View style={styles.categoryItem}>
                <View style={[styles.categoryDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.categoryName}>Others</Text>
                <Text style={styles.categoryAmount}>
                  {formatRupiah(((remoteSpending?.byCategory.find(c => c.category.toLowerCase() === 'others')?.amount) ?? financialData.spendingByCategory.Others) || 0)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {!chatMode && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="e.g. coffee 15000"
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            // Removed onSubmitEditing to prevent double submission with send button
            onFocus={() => {
              setChatMode(true); // overlay effect handles focus unless suppressed
            }}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleAIInput}
            disabled={isSending}
          >
            <Ionicons name="send" size={24} color="#5B5FFF" />
          </TouchableOpacity>
        </View>
      )}

      {chatMode && (
        <KeyboardAvoidingView
          style={styles.chatOverlayContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <Animated.View
            style={[
              styles.chatOverlay,
              {
                opacity: overlayAnim,
                transform: [
                  {
                    translateY: overlayAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={[styles.chatHeader, { paddingTop: 14 + insets.top }]}>
              <View style={{ width: 32 }} />
              <Text style={styles.chatTitle}>Assistant</Text>
              <TouchableOpacity
                style={styles.chatBackButton}
                onPress={closeChat}
                disabled={isSending}
              >
                <Ionicons name="close" size={26} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <ScrollView
              ref={scrollRef}
              style={styles.chatMessages}
              contentContainerStyle={styles.chatMessagesContent}
              keyboardShouldPersistTaps="handled"
            >
              {messages.length === 0 && (
                <View style={styles.chatEmptyState}>
                  <Ionicons name="sparkles" size={40} color="#5B5FFF" />
                  <Text style={styles.chatEmptyTitle}>
                    {chatIntent === 'analysis' ? 'Ask for insights' : 'Quick Log'}
                  </Text>
                  <Text style={styles.chatEmptySubtitle}>
                    {chatIntent === 'analysis'
                      ? 'Try: “What did I spend most on this month?” or “Plan my budget next month”'
                      : 'Try: “coffee 15000” or “grab 32000 transport”'}
                  </Text>
                </View>
              )}
              {messages.map(m => (
                <View
                  key={m.id}
                  style={[
                    styles.chatBubble,
                    m.role === 'user' ? styles.chatBubbleUser : (m.role === 'card' ? styles.chatBubbleCard : styles.chatBubbleAssistant),
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
                    <Text style={[styles.chatBubbleText, styles.chatBubbleTextUser]}>{m.text}</Text>
                  )}
                </View>
              ))}
              {isSending && (
                <View style={[styles.chatBubble, styles.chatBubbleAssistant]}>
                  <Text style={[styles.chatBubbleText, styles.chatBubbleTextAssistant]}>Processing…</Text>
                </View>
              )}
              <View style={{ height: 120 }} />
            </ScrollView>
            {/* Intent pills */}
            <View style={[styles.chatPillsBar, { bottom: 60 + (insets.bottom || 0) }]}>
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
            <View style={styles.chatInputBar}>
              <TextInput
                style={styles.chatInput}
                placeholder={chatIntent === 'analysis' ? 'Ask for analysis…' : 'Quick log e.g. coffee 15000'}
                placeholderTextColor="#9CA3AF"
                value={inputText}
                onChangeText={setInputText}
                multiline
                editable={!isSending}
                blurOnSubmit={false}
                ref={chatInputRef}
              />
              <TouchableOpacity
                style={styles.chatSendButton}
                onPress={handleAIInput}
                disabled={isSending}
              >
                <Ionicons name="send" size={22} color={isSending ? '#A5B4FC' : '#ffffff'} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      )}

      {/* Month Selection Bottom Sheet (Animated) */}
      {monthSheetVisible && (
        <View style={styles.sheetOverlay} pointerEvents="box-none">
          <AnimatedTouchableOpacity
            style={[styles.sheetBackdrop, { opacity: sheetAnim }]} // fade backdrop
            activeOpacity={1}
            onPress={closeMonthSheet}
          />
          <Animated.View
            style={[
              styles.sheetContainer,
              {
                opacity: sheetAnim,
                transform: [
                  {
                    translateY: sheetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [60, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.sheetHandleWrapper}>
              <View style={styles.sheetHandle} />
            </View>
            <Text style={styles.sheetTitle}>Select Month</Text>
            <ScrollView style={styles.sheetMonthList} showsVerticalScrollIndicator={false}>
              {months.map(m => (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.monthRow, m.label === selectedMonthLabel && styles.monthRowActive]}
                  onPress={() => handleSelectMonth(m)}
                >
                  <Text style={[styles.monthRowText, m.label === selectedMonthLabel && styles.monthRowTextActive]}>{m.label}</Text>
                  {m.label === selectedMonthLabel && (
                    <Ionicons name="checkmark" size={18} color="#5B5FFF" />
                  )}
                </TouchableOpacity>
              ))}
              <View style={{ height: 12 }} />
            </ScrollView>

          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  chatBubbleCard: {
    backgroundColor: 'transparent',
    alignSelf: 'flex-start',
    width: '100%',
    padding: 0,
    marginTop: 4,
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  transactionCategory: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 24,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#5B5FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  balanceGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  balanceGrowthText: {
    fontSize: 14,
    color: 'white',
    marginLeft: 6,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  statAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  savingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
  },
  savingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  savingContent: {
    flex: 1,
  },
  savingLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  savingAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  detailsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  detailsButtonText: {
    fontSize: 14,
    color: '#5B5FFF',
    fontWeight: '600',
  },
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
  },
  aiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5B5FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiContent: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5B5FFF',
    marginBottom: 2,
  },
  aiSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  analysisSection: {
    marginTop: 24,
    marginBottom: 100,
  },
  analysisSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  analysisCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
  },
  chartContainer: {
    marginRight: 20,
  },
  chartCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: '#5B5FFF',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  chartLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryList: {
    flex: 1,
    justifyContent: 'space-around',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addButton: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#111827',
  },
  micButton: {
    marginLeft: 8,
    padding: 8,
  },
  sendButton: {
    marginLeft: 4,
    padding: 8,
  },
  // Chat mode styles
  chatOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  },
  chatOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  chatBackButton: {
    padding: 4,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  chatMessages: {
    flex: 1,
  },
  chatMessagesContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
  },
  chatEmptyState: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 16,
  },
  chatEmptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  chatEmptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },
  chatBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  chatBubbleUser: {
    backgroundColor: '#5B5FFF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  chatBubbleAssistant: {
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  chatBubbleText: {
    fontSize: 14,
    lineHeight: 19,
  },
  chatBubbleTextUser: {
    color: '#FFFFFF',
  },
  chatBubbleTextAssistant: {
    color: '#1F2937',
  },
  chatInputBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  chatInput: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: '#F3F4F6',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginRight: 8,
    color: '#111827',
  },
  chatSendButton: {
    backgroundColor: '#5B5FFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Chat intent pills
  chatPillsBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pillsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(243,244,246,0.95)',
    borderRadius: 20,
    padding: 4,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  pillActive: {
    backgroundColor: '#5B5FFF',
  },
  pillText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  // Bottom sheet styles
  sheetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
    paddingHorizontal: 20,
    maxHeight: '60%',
  },
  sheetHandleWrapper: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  sheetHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 4,
    marginBottom: 12,
  },
  sheetMonthList: {
    flexGrow: 0,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  monthRowActive: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  monthRowText: {
    fontSize: 16,
    color: '#1F2937',
  },
  monthRowTextActive: {
    fontWeight: '600',
    color: '#5B5FFF',
  },
  sheetCloseButton: {
    marginTop: 8,
    marginBottom: 28,
    backgroundColor: '#5B5FFF',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  sheetCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Markdown styles for assistant bubbles
const markdownStyles: any = {
  body: {
    color: '#1F2937',
    fontSize: 14,
    lineHeight: 19,
  },
  text: {
    color: '#1F2937',
  },
  strong: {
    fontWeight: '700',
    color: '#111827',
  },
  em: {
    fontStyle: 'italic',
  },
  link: {
    color: '#4F46E5',
    textDecorationLine: 'underline',
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  list_item: {
    marginVertical: 2,
  },
  code_inline: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  code_block: {
    backgroundColor: '#111827',
    color: '#F9FAFB',
    borderRadius: 6,
    padding: 10,
    overflow: 'hidden',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  fence: {
    backgroundColor: '#111827',
    color: '#F9FAFB',
    borderRadius: 6,
    padding: 10,
    overflow: 'hidden',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  heading1: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 6 },
  heading2: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  heading3: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
};



