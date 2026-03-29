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
  ActionSheetIOS,
  Alert,
  Image as RNImage,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Plus, ArrowDown, ArrowUp, ArrowRight, Calendar, ChevronRight, X, Eye, Bell, Scale, Send, Sparkles, Wallet, Clock, Camera,
  TrendingUp, TrendingDown, Tag, BarChart3, Receipt, AlertTriangle, Info, HelpCircle, FileText, MessageSquare, BarChart2
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Markdown from 'react-native-markdown-display';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import AIService from '../services/AIService';
import { API, FinanceSummary, SpendingAnalytics, SavingsSummary, AdviceResponse } from '../services/api';
import chatService, { ChatResponse } from '../services/chatService';
import { getAccessToken } from '../services/authService';
import { getActiveBudget, BudgetWithActuals } from '../services/budgetService';
import { getAccountsSummary } from '../services/accountService';
import { formatRupiah, formatRupiahWithSymbol } from '../utils/format';
import { COLORS } from '../constants/theme';
import { pickImage, extractFromImage } from '../services/ocrService';

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
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'assistant' | 'card' | 'image' | 'loading'; text: string; imageUri?: string; intent?: 'note' | 'analysis' }[]>([]);
  const [remoteSummary, setRemoteSummary] = useState<FinanceSummary | null>(null);
  const [remoteSpending, setRemoteSpending] = useState<SpendingAnalytics | null>(null);
  const [remoteSavings, setRemoteSavings] = useState<SavingsSummary | null>(null);
  const [remoteAdvice, setRemoteAdvice] = useState<AdviceResponse | null>(null);
  const [activeBudget, setActiveBudget] = useState<BudgetWithActuals | null>(null);
  const [accountsSummary, setAccountsSummary] = useState<{ total_assets: number; net_worth: number } | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false); // pull-to-refresh state
  const [isOCRLoading, setIsOCRLoading] = useState(false);

  const handleOCR = useCallback(async () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Choose from Gallery'], cancelButtonIndex: 0 },
        (index) => {
          if (index === 1) doOCR('camera');
          if (index === 2) doOCR('gallery');
        }
      );
    } else {
      Alert.alert('Scan Receipt', 'Choose image source', [
        { text: 'Camera', onPress: () => doOCR('camera') },
        { text: 'Gallery', onPress: () => doOCR('gallery') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [chatMode]);

  const doOCR = useCallback(async (source: 'camera' | 'gallery') => {
    setIsOCRLoading(true);
    try {
      // Step 1: Pick image
      const picked = await pickImage(source);
      if (!picked) { setIsOCRLoading(false); return; }

      // Open chat if not already open
      if (!chatMode) setChatMode(true);

      const imageMsgId = Date.now() + '-img';

      // Step 2: Show image bubble immediately
      setMessages(prev => [...prev, {
        id: imageMsgId,
        role: 'image' as const,
        text: '',
        imageUri: picked.uri,
      }]);

      // Step 3: Show loading bubble
      const loadingMsgId = Date.now() + '-loading';
      setMessages(prev => [...prev, {
        id: loadingMsgId,
        role: 'loading' as const,
        text: 'Scanning receipt...',
      }]);

      // Step 4: Call OCR
      const result = await extractFromImage(picked.base64, picked.mimeType);

      // Step 5: Remove loading bubble
      setMessages(prev => prev.filter(m => m.id !== loadingMsgId));

      // Build text from OCR results
      let text = '';
      if (result.amount) text += `${result.amount}`;
      if (result.description) text += (text ? ' ' : '') + result.description;
      if (result.category && result.category !== result.description) text += (text ? ' ' : '') + result.category;
      if (!text && result.raw_text) text = result.raw_text;

      if (text) {
        // Show parsed result as card bubble
        setMessages(prev => [...prev, {
          id: Date.now() + '-ocr',
          role: 'card' as const,
          text: JSON.stringify([{
            type: 'expense',
            amount: result.amount || 0,
            category: result.category || 'Others',
            description: result.description || 'Scanned receipt',
          }]),
        }]);

        // Set as input so user can edit & send
        setInputText(text);
      }
    } catch (err: any) {
      // Remove any loading bubble on error
      setMessages(prev => prev.filter(m => m.role !== 'loading'));
      console.warn('OCR failed:', err);
      alert('OCR failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsOCRLoading(false);
    }
  }, [chatMode]);
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
    const budgetLimit = activeBudget?.total_expense_target || income * 0.8 || 0;
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
      const [summary, spending, savings, advice, budget, accounts] = await Promise.all([
        API.getFinanceSummary(monthKey),
        API.getSpendingAnalytics(monthKey),
        API.getSavingsSummary(monthKey),
        API.getAdvice(monthKey).catch(() => null),
        getActiveBudget().catch(() => null),
        getAccountsSummary().catch(() => null),
      ]);
      setRemoteSummary(summary);
      setRemoteSpending(spending);
      setRemoteSavings(savings);
      setRemoteAdvice(advice as AdviceResponse | null);
      setActiveBudget(budget);
      setAccountsSummary(accounts);
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
  const lastMonthGrowth = remoteSummary?.lastMonthGrowthPct ?? 0;

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
  const monthlyBudget = activeBudget?.total_expense_target || (remoteSummary?.monthlyIncome || financialData.monthlyIncome) * 0.8 || 0;
  const currentExpense = activeBudget?.actuals?.total_expense_actual ?? remoteSummary?.monthlyExpense ?? financialData.monthlyExpense;
  const budgetProgress = monthlyBudget > 0 ? Math.min((currentExpense / monthlyBudget) * 100, 100) : 0;

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
              <Bell size={24} color="#1F2937" strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('ManualTransaction')}>
              <View style={styles.avatar}>
                <Plus size={28} color={COLORS.primary} strokeWidth={2} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Total Balance Card (Main Highlight) */}
        <View
          style={[styles.balanceCard, { backgroundColor: COLORS.primary }]}
        >
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Total Assets</Text>
            <TouchableOpacity>
              <Eye size={20} color="rgba(255,255,255,0.7)" strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>
            {formatRupiah(accountsSummary?.total_assets ?? remoteSummary?.totalBalance ?? financialData.totalBalance)}
          </Text>
          <View style={styles.balanceGrowth}>
            <View style={[styles.growthBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              {lastMonthGrowth >= 0 ? (
                <TrendingUp size={14} color="white" strokeWidth={2} />
              ) : (
                <TrendingDown size={14} color="white" strokeWidth={2} />
              )}
              <Text style={styles.growthText}>
                {lastMonthGrowth >= 0 ? '+' : ''}{lastMonthGrowth}%
              </Text>
            </View>
            <Text style={[styles.growthSubtext, { color: 'rgba(255,255,255,0.6)' }]}>vs last month</Text>
          </View>
        </View>

        {/* Monthly Budget Card */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Monthly Budget</Text>
            <View style={styles.monthBadge}>
              <Calendar size={14} color="#6B7280" strokeWidth={2} style={{ marginRight: 4 }} />
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
              <View style={[styles.progressBarFill, { width: `${budgetProgress}%`, backgroundColor: budgetProgress > 90 ? COLORS.danger : activeBudget?.actuals?.budget_health === 'warning' ? '#F59E0B' : COLORS.primary }]} />
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
              <ArrowRight
                size={14}
                color={assistantMessage.type === 'warning' ? '#DC2626' : (assistantMessage.type === 'success' ? '#059669' : '#0D9488')}
                strokeWidth={2}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Monthly Stats Grid (Income, Expense, Savings, Net) */}
        <View style={styles.statsGrid}>
          {/* Income */}
          <View style={styles.statGridItem}>
            <View style={[styles.statIconContainer, { backgroundColor: '#D1FAE5' }]}>
              <ArrowDown size={20} color="#10B981" strokeWidth={2} />
            </View>
            <Text style={styles.statLabel}>Income</Text>
            <Text style={styles.statValue}>{formatRupiah(remoteSummary?.monthlyIncome ?? financialData.monthlyIncome)}</Text>
          </View>

          {/* Expense */}
          <View style={styles.statGridItem}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FEE2E2' }]}>
              <ArrowUp size={20} color="#EF4444" strokeWidth={2} />
            </View>
            <Text style={styles.statLabel}>Expense</Text>
            <Text style={styles.statValue}>{formatRupiah(remoteSummary?.monthlyExpense ?? financialData.monthlyExpense)}</Text>
          </View>

          {/* Savings */}
          <View style={styles.statGridItem}>
            <View style={[styles.statIconContainer, { backgroundColor: '#E0E7FF' }]}>
              <Wallet size={20} color={COLORS.primary} strokeWidth={2} />
            </View>
            <Text style={styles.statLabel}>Savings</Text>
            <Text style={styles.statValue}>{formatRupiah(remoteSummary?.monthlySaving ?? financialData.monthlySaving)}</Text>
          </View>

          {/* Net (Income - Expense) */}
          <View style={styles.statGridItem}>
            <View style={[styles.statIconContainer, { backgroundColor: '#F3F4F6' }]}>
              <Scale size={20} color="#4B5563" strokeWidth={2} />
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
            <Sparkles size={24} color="white" strokeWidth={2} />
          </View>
          <View style={styles.aiContent}>
            <Text style={styles.aiTitle}>Smart Insights</Text>
            <Text style={styles.aiSubtitle}>Get personalized financial advice</Text>
          </View>
          <ChevronRight size={20} color={COLORS.primary} strokeWidth={2} />
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
              {(remoteSpending?.byCategory ?? []).length > 0
                ? (remoteSpending!.byCategory
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 5)
                    .map((cat, idx) => {
                      const colors = [COLORS.primary, '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
                      return (
                        <View key={cat.category} style={styles.categoryItem}>
                          <View style={[styles.categoryDot, { backgroundColor: colors[idx % colors.length] }]} />
                          <Text style={styles.categoryName}>{cat.category}</Text>
                          <Text style={styles.categoryAmount}>
                            {formatRupiah(cat.amount)}
                          </Text>
                        </View>
                      );
                    }))
                : (['Shopping', 'Food', 'Transport', 'Others'] as const).map((name, idx) => {
                    const colors = [COLORS.primary, '#10B981', '#F59E0B', '#EF4444'];
                    return (
                      <View key={name} style={styles.categoryItem}>
                        <View style={[styles.categoryDot, { backgroundColor: colors[idx] }]} />
                        <Text style={styles.categoryName}>{name}</Text>
                        <Text style={styles.categoryAmount}>{formatRupiah(0)}</Text>
                      </View>
                    );
                  })
              }
            </View>
          </View>
        </View>
      </ScrollView>

      {!chatMode && (
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.inputIconButton}
            onPress={() => handleOCR()}
            disabled={isOCRLoading}
          >
            {isOCRLoading ? (
              <Clock size={22} color={COLORS.primary} strokeWidth={2} />
            ) : (
              <Camera size={22} color={COLORS.primary} strokeWidth={2} />
            )}
          </TouchableOpacity>
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
            <Send size={24} color={COLORS.primary} strokeWidth={2} />
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
                <X size={26} color="#1F2937" strokeWidth={2} />
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
                  <Sparkles size={40} color={COLORS.primary} strokeWidth={2} />
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
                    m.role === 'user' ? styles.chatBubbleUser : (
                      m.role === 'card' ? styles.chatBubbleCard : (
                        m.role === 'image' ? styles.chatBubbleImage : (
                          m.role === 'loading' ? styles.chatBubbleAssistant : styles.chatBubbleAssistant
                        )
                      )
                    ),
                  ]}
                >
                  {m.role === 'image' ? (
                    <RNImage
                      source={{ uri: m.imageUri }}
                      style={styles.chatImage}
                      resizeMode="cover"
                    />
                  ) : m.role === 'loading' ? (
                    <View style={styles.loadingBubble}>
                      <Animated.View style={styles.loadingDotContainer}>
                        <View style={[styles.loadingDot, { backgroundColor: COLORS.primary }]} />
                        <View style={[styles.loadingDot, { backgroundColor: COLORS.primary, opacity: 0.6 }]} />
                        <View style={[styles.loadingDot, { backgroundColor: COLORS.primary, opacity: 0.3 }]} />
                      </Animated.View>
                      <Text style={[styles.chatBubbleText, styles.chatBubbleTextAssistant]}>{m.text}</Text>
                    </View>
                  ) : m.role === 'assistant' ? (
                    <Markdown style={markdownStyles}>
                      {m.text}
                    </Markdown>
                  ) : m.role === 'card' ? (
                    <View>
                      {JSON.parse(m.text).map((item: any, idx: number) => (
                        <View key={idx} style={[styles.transactionCard, idx > 0 && { marginTop: 8 }]}>
                          <View style={[styles.transactionIcon, { backgroundColor: item.type === 'income' ? '#D1FAE5' : '#FEE2E2' }]}>
                            {item.type === 'income' ? (
                              <ArrowUp size={18} color="#10B981" strokeWidth={2} />
                            ) : (
                              <Tag size={18} color="#EF4444" strokeWidth={2} />
                            )}
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
                      {m.intent === 'analysis' ? (
                        <BarChart2 size={16} color="#FFFFFF" strokeWidth={2} style={{ marginRight: 6, marginTop: 2 }} />
                      ) : (
                        <FileText size={16} color="#FFFFFF" strokeWidth={2} style={{ marginRight: 6, marginTop: 2 }} />
                      )}
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
              <TouchableOpacity
                style={styles.chatCameraButton}
                onPress={() => handleOCR()}
                disabled={isOCRLoading || isSending}
              >
                {isOCRLoading ? (
                  <Clock size={22} color="#A5B4FC" strokeWidth={2} />
                ) : (
                  <Camera size={22} color={COLORS.primary} strokeWidth={2} />
                )}
              </TouchableOpacity>
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
                {isSending ? (<Send size={22} color="#A5B4FC" strokeWidth={2} />) : (<Send size={22} color="#ffffff" strokeWidth={2} />)}
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
  growthSubtext: {
    fontSize: 11,
    marginLeft: 8,
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
    bottom: 24,
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
  inputIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
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
    bottom: 24,
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
  chatCameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
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
  // Image bubble styles
  chatBubbleImage: {
    backgroundColor: 'transparent',
    alignSelf: 'flex-end',
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: 'hidden',
  },
  chatImage: {
    width: 200,
    height: 260,
    borderRadius: 16,
  },
  // Loading bubble styles
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingDotContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
