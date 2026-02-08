import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
import { useAuth } from '../context/AuthContext';
import AIService from '../services/AIService';
import { API, FinanceSummary, SpendingAnalytics, SavingsSummary, AdviceResponse } from '../services/api';
import chatService, { ChatResponse } from '../services/chatService';
import { getAccessToken } from '../services/authService';
import { formatRupiah, formatRupiahWithSymbol } from '../utils/format';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { financialData, addTransaction } = useFinance();
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  // Simple lock to avoid duplicate submissions
  const [isSending, setIsSending] = useState(false);
  const [chatMode, setChatMode] = useState(false);
  const [chatIntent, setChatIntent] = useState<'note' | 'analysis'>('note');
  const [chatSessionId, setChatSessionId] = useState<string | null>(null); // Multi-turn session
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'assistant' | 'card'; text: string; intent?: 'note' | 'analysis' }[]>([]);
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

  // Active month key (YYYY-MM) is always current month now
  const activeMonthKey = React.useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Determine Assistant Hint State
  const assistantMessage = React.useMemo(() => {
    // Default safe values
    const income = remoteSummary?.monthlyIncome ?? financialData.monthlyIncome ?? 1;
    const expense = remoteSummary?.monthlyExpense ?? financialData.monthlyExpense ?? 0;
    const saving = remoteSummary?.monthlySaving ?? financialData.monthlySaving ?? 0;

    // Budget progress (expense / income * 0.8)
    // Re-calculating budget here locally to ensure consistency with card above
    const budgetLimit = income * 0.8 || 5000000;
    const progress = Math.min((expense / budgetLimit) * 100, 100);
    const savingsRate = (saving / income) * 100;

    if (progress > 90) {
      return {
        type: 'warning',
        text: `⚠️ You’ve spent ${Math.round(progress)}% of your monthly budget`,
        action: 'Ask Finamo for adjustments',
        prompt: `I've spent ${Math.round(progress)}% of my projected budget. Can you help me adjust my spending for the rest of the month?`
      };
    } else if (savingsRate > 20) {
      return {
        type: 'success',
        text: `🎉 Great job! You saved ${Math.round(savingsRate)}% of income`,
        action: 'See investment options',
        prompt: 'I have good savings this month. What are some safe investment options for me?'
      };
    } else {
      return {
        type: 'info',
        text: '💡 Keep your expenses under control this week',
        action: 'Ask for a weekly plan',
        prompt: 'Can you create a weekly spending plan for me based on my current habits?'
      };
    }
  }, [remoteSummary, financialData, remoteSpending, remoteSavings]);

  const currentMonthName = React.useMemo(() => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[new Date().getMonth()];
  }, []);

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

  // Auto-scroll chat when new messages arrive
  useEffect(() => {
    if (chatMode && scrollRef.current) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages, chatMode]);

  // Load chat history when opening chat with existing session
  useEffect(() => {
    // Only load history when chat opens with a session and messages are empty
    if (chatMode && chatSessionId && messages.length === 0) {
      loadChatHistory(chatSessionId);
    }
  }, [chatMode, chatSessionId]);

  const loadChatHistory = async (sessionId: string) => {
    try {
      const history = await chatService.getHistory(sessionId);
      const formattedMessages = history.messages.map(msg => ({
        id: `${msg.created_at}-${msg.role}`,
        role: msg.role,
        text: msg.content
      }));
      setMessages(formattedMessages);
      console.log(`Loaded ${formattedMessages.length} messages from chat history`);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      // Don't show error to user, just start with empty messages
    }
  };

  const handleAIInput = useCallback(async () => {
    if (isSending || !inputText.trim()) return;
    setIsSending(true);
    console.log('[AIInput] invoked with:', inputText);

    // Check authentication before making request
    const token = getAccessToken();
    if (!token) {
      console.error('[AIInput] No auth token available');
      alert('Please login first');
      setIsSending(false);
      return;
    }
    try {
      const text = inputText.trim();
      const mode = chatIntent === 'analysis' ? 'analyze' : 'log';

      // Clear input immediately after capturing the text
      setInputText('');

      // Render user bubble first when overlay chat is open
      if (chatMode) setMessages(prev => [...prev, { id: Date.now() + '-u', role: 'user', text, intent: chatIntent }]);

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

          // If there are transactions, add card message for visual display
          const items = actionPlan?.parameters?.items;
          if (items && Array.isArray(items) && items.length > 0) {
            setMessages(prev => [...prev, {
              id: Date.now() + '-c',
              role: 'card',
              text: JSON.stringify(items)
            }]);
          }
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

  // Direct message sender for auto-send scenarios (e.g., assistant hint click)
  const sendDirectMessage = useCallback(async (messageText: string, intent: 'note' | 'analysis' = 'analysis') => {
    if (isSending || !messageText.trim()) return;
    setIsSending(true);
    console.log('[DirectMessage] sending:', messageText);

    const token = getAccessToken();
    if (!token) {
      console.error('[DirectMessage] No auth token available');
      alert('Please login first');
      setIsSending(false);
      return;
    }

    try {
      const text = messageText.trim();
      const mode = intent === 'analysis' ? 'analyze' : 'log';

      // Render user bubble
      setMessages(prev => [...prev, { id: Date.now() + '-u', role: 'user', text, intent }]);

      const res = await chatService.sendMessage(
        text,
        chatSessionId || undefined,
        activeMonthKey,
        mode
      );
      console.log('Chat response:', res);

      if (res.session_id && res.session_id !== chatSessionId) {
        setChatSessionId(res.session_id);
      }

      if (mode === 'analyze') {
        const assistantText = res.message || 'No response available.';
        setMessages(prev => [...prev, { id: Date.now() + '-a', role: 'assistant', text: assistantText }]);
      } else {
        const actionPlan = res.action_plan;
        let assistantFeedback = res.message;

        if (actionPlan) {
          const { action, parameters } = actionPlan;
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
        }

        setMessages(prev => [...prev, { id: Date.now() + '-a', role: 'assistant', text: assistantFeedback }]);

        const items = actionPlan?.parameters?.items;
        if (items && Array.isArray(items) && items.length > 0) {
          setMessages(prev => [...prev, {
            id: Date.now() + '-c',
            role: 'card',
            text: JSON.stringify(items)
          }]);
        }
      }
    } catch (err: any) {
      console.warn('Direct message failed', err);
      const fallback = 'Sorry, I could not process that right now.';
      setMessages(prev => [...prev, { id: Date.now() + '-a', role: 'assistant', text: fallback }]);
    } finally {
      setIsSending(false);
    }
  }, [isSending, chatSessionId, activeMonthKey, addTransaction]);

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

  // Mock monthly budget for now (e.g., 80% of income or a fixed amount if no income)
  // In a real app, this would come from an endpoint.
  const monthlyBudget = (remoteSummary?.monthlyIncome || financialData.monthlyIncome) ? (remoteSummary?.monthlyIncome || financialData.monthlyIncome) * 0.8 : 5000000;
  const currentExpense = remoteSummary?.monthlyExpense ?? financialData.monthlyExpense;
  const budgetProgress = Math.min((currentExpense / monthlyBudget) * 100, 100);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
            progressBackgroundColor="#FFFFFF"
          />
        }
      >
        {!!apiError && (
          <View style={{ padding: 16, backgroundColor: '#FEE2E2', marginHorizontal: 16, borderRadius: 12 }}>
            <Text style={{ color: '#B91C1C', fontSize: 13 }}>Failed to update remote data: {apiError}</Text>
          </View>
        )}

        {/* Header - Greeting */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View>
              <Text style={styles.greetingText}>Hello, {user?.name?.split(' ')[0] || 'Friend'}! 👋</Text>
              <Text style={styles.subGreetingText}>Let's manage your wealth.</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color="#1F2937" />
            </TouchableOpacity>
            <TouchableOpacity>
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Total Balance Card (Main Highlight) */}
        <View
          style={[styles.balanceCard, { backgroundColor: COLORS.primary }]}
        >
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Total Liquidity</Text>
            <TouchableOpacity>
              <Ionicons name="eye-outline" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>
            {formatRupiah((remoteSummary?.totalBalance) ?? financialData.totalBalance)}
          </Text>
          <View style={styles.balanceGrowth}>
            <View style={[styles.growthBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="trending-up" size={14} color="white" />
              <Text style={styles.growthText}>
                +{lastMonthGrowth}%
              </Text>
            </View>
          </View>
        </View>

        {/* Monthly Budget Card */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Monthly Budget</Text>
            <View style={styles.monthBadge}>
              <Ionicons name="calendar-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
              <Text style={styles.monthText}>{currentMonthName}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.budgetCard}
            onPress={() => navigation.navigate('BudgetDetail')}
          >
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetLabel}>Remaining</Text>
              <Text style={styles.budgetAmount}>
                {formatRupiah(Math.max(monthlyBudget - currentExpense, 0))}
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${budgetProgress}%`, backgroundColor: budgetProgress > 90 ? COLORS.danger : COLORS.primary }]} />
            </View>
            <View style={styles.budgetFooter}>
              <Text style={styles.budgetFooterText}>Spent: {formatRupiah(currentExpense)}</Text>
              <Text style={styles.budgetFooterText}>Limit: {formatRupiah(monthlyBudget)}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.assistantHint, {
              backgroundColor: assistantMessage.type === 'warning' ? '#FEF2F2' : (assistantMessage.type === 'success' ? '#ECFDF5' : '#F0FDFA'),
              borderColor: assistantMessage.type === 'warning' ? '#FEE2E2' : (assistantMessage.type === 'success' ? '#D1FAE5' : '#CCFBF1')
            }]}
            onPress={async () => {
              setChatIntent('analysis');
              setChatMode(true);
              // Use setTimeout to ensure chat UI is ready before sending
              setTimeout(() => {
                sendDirectMessage(assistantMessage.prompt, 'analysis');
              }, 150);
            }}
          >
            <Text style={[styles.assistantHintText, { color: assistantMessage.type === 'warning' ? '#991B1B' : (assistantMessage.type === 'success' ? '#065F46' : '#115E59') }]}>
              {assistantMessage.text}
            </Text>
            <View style={styles.assistantAction}>
              <Text style={[styles.assistantActionText, { color: assistantMessage.type === 'warning' ? '#DC2626' : (assistantMessage.type === 'success' ? '#059669' : '#0D9488') }]}>
                {assistantMessage.action}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={14}
                color={assistantMessage.type === 'warning' ? '#DC2626' : (assistantMessage.type === 'success' ? '#059669' : '#0D9488')}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Monthly Stats Grid (Income, Expense, Savings, Net) */}
        <View style={styles.statsGrid}>
          {/* Income */}
          <View style={styles.statGridItem}>
            <View style={[styles.statIconContainer, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="arrow-down-outline" size={20} color="#10B981" />
            </View>
            <Text style={styles.statLabel}>Income</Text>
            <Text style={styles.statValue}>{formatRupiah(remoteSummary?.monthlyIncome ?? financialData.monthlyIncome)}</Text>
          </View>

          {/* Expense */}
          <View style={styles.statGridItem}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="arrow-up-outline" size={20} color="#EF4444" />
            </View>
            <Text style={styles.statLabel}>Expense</Text>
            <Text style={styles.statValue}>{formatRupiah(remoteSummary?.monthlyExpense ?? financialData.monthlyExpense)}</Text>
          </View>

          {/* Savings */}
          <View style={styles.statGridItem}>
            <View style={[styles.statIconContainer, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.statLabel}>Savings</Text>
            <Text style={styles.statValue}>{formatRupiah(remoteSummary?.monthlySaving ?? financialData.monthlySaving)}</Text>
          </View>

          {/* Net (Income - Expense) */}
          <View style={styles.statGridItem}>
            <View style={[styles.statIconContainer, { backgroundColor: '#F3F4F6' }]}>
              <Ionicons name="scale-outline" size={20} color="#4B5563" />
            </View>
            <Text style={styles.statLabel}>Net</Text>
            <Text style={[styles.statValue, { color: ((remoteSummary?.monthlyIncome ?? financialData.monthlyIncome) - (remoteSummary?.monthlyExpense ?? financialData.monthlyExpense)) >= 0 ? '#10B981' : '#EF4444' }]}>
              {formatRupiah((remoteSummary?.monthlyIncome ?? financialData.monthlyIncome) - (remoteSummary?.monthlyExpense ?? financialData.monthlyExpense))}
            </Text>
          </View>
        </View>


        {/* AI Advice Card */}
        <TouchableOpacity style={styles.aiCard}>
          <View style={styles.aiIcon}>
            <Ionicons name="sparkles" size={24} color="white" />
          </View>
          <View style={styles.aiContent}>
            <Text style={styles.aiTitle}>Smart Insights</Text>
            <Text style={styles.aiSubtitle}>Get personalized financial advice</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Spending Analysis */}
        <View style={styles.analysisSection}>
          <View style={styles.analysisSectionHeader}>
            <Text style={styles.sectionTitle}>Spending Breakdown</Text>
            <TouchableOpacity>
              <Text style={{ color: COLORS.primary, fontWeight: '600', fontSize: 13 }}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.analysisCard}>
            <View style={styles.chartContainer}>
              <View style={styles.chartCircle}>
                <Text style={styles.chartPercentage}>{Math.round(spendingPercentage)}%</Text>
                <Text style={styles.chartLabel}>used</Text>
              </View>
            </View>

            <View style={styles.categoryList}>
              <View style={styles.categoryItem}>
                <View style={[styles.categoryDot, { backgroundColor: COLORS.primary }]} />
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
            onFocus={() => {
              setChatMode(true);
            }}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleAIInput}
            disabled={isSending}
          >
            <Ionicons name="send" size={24} color={COLORS.primary} />
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
                  <Ionicons name="sparkles" size={40} color={COLORS.primary} />
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
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <Ionicons
                        name={m.intent === 'analysis' ? 'analytics' : 'document-text'}
                        size={16}
                        color="#FFFFFF"
                        style={{ marginRight: 6, marginTop: 2 }}
                      />
                      <Text style={[styles.chatBubbleText, styles.chatBubbleTextUser]}>{m.text}</Text>
                    </View>
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

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  headerLeft: {
    flex: 1,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  subGreetingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
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
    marginTop: 16,
    padding: 24,
    borderRadius: 24,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: 'white',
    marginTop: 8,
    marginBottom: 8,
  },
  balanceGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  monthText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  budgetCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // Elevation for Android
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  budgetLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  budgetAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  assistantHint: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    // Colors are now handled dynamically in styles
  },
  assistantHintText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  assistantAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assistantActionText: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  budgetFooterText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  statGridItem: {
    width: (width - 40 - 12) / 2, // (Screen width - horizontal padding - gap) / 2
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 20,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
    marginHorizontal: 20,
    marginTop: 24,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(91, 95, 255, 0.1)',
  },
  aiIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  aiContent: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  aiSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  analysisSection: {
    marginTop: 28,
    marginBottom: 100,
  },
  analysisSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  analysisCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 24,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  chartContainer: {
    marginRight: 20,
    justifyContent: 'center',
  },
  chartCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 10,
    borderColor: '#E0E7FF', // S lighter bg for chart base
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    // We could layer another view for actual progress if needed, 
    // but for now this is just the circle container from original code.
    // The original code had borderColor: '#5B5FFF'. 
    // If we want it to look like a chart, we might need an overlay. 
    // Keeping it simple as per original for now, just updated styling.
  },
  chartPercentage: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
  },
  chartLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryList: {
    flex: 1,
    justifyContent: 'space-around',
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  categoryName: {
    flex: 1,
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  categoryAmount: {
    fontSize: 13,
    fontWeight: '700',
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
    borderTopColor: '#F3F4F6',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111827',
  },
  sendButton: {
    marginLeft: 8,
    width: 44,
    height: 44,
    backgroundColor: '#E0E7FF',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Chat mode styles (mostly unchanged, just consistent with new theme)
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
    borderBottomColor: '#F3F4F6',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  chatEmptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  chatBubble: {
    maxWidth: '85%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  chatBubbleCard: {
    backgroundColor: 'transparent',
    alignSelf: 'flex-start',
    width: '100%',
    paddingHorizontal: 0,
    paddingVertical: 0
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontWeight: '700',
  },
  chatBubbleUser: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  chatBubbleAssistant: {
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  chatBubbleText: {
    fontSize: 15,
    lineHeight: 22,
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
    borderTopColor: '#F3F4F6',
  },
  chatInput: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    marginRight: 8,
    color: '#111827',
  },
  chatSendButton: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatPillsBar: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
});

// Markdown styles for assistant bubbles
const markdownStyles: any = {
  body: {
    color: '#1F2937',
    fontSize: 15,
    lineHeight: 22,
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
    color: COLORS.primary,
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
    fontSize: 13,
  },
  code_block: {
    backgroundColor: '#111827',
    color: COLORS.gray50,
    borderRadius: 8,
    padding: 12,
    overflow: 'hidden',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: 13,
  },
  fence: {
    backgroundColor: '#111827',
    color: COLORS.gray50,
    borderRadius: 8,
    padding: 12,
    overflow: 'hidden',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: 13,
  },
  heading1: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  heading2: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  heading3: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 },
};
