import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinance } from '../context/FinanceContext';
import AIService from '../services/AIService';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const { financialData, addTransaction } = useFinance();
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatMode, setChatMode] = useState(false);
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'assistant'; text: string }[]>([]);
  const scrollRef = useRef<ScrollView | null>(null);
  const [monthSheetVisible, setMonthSheetVisible] = useState(false);
  const [selectedMonthLabel, setSelectedMonthLabel] = useState<string>('This Month');

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

  const handleSelectMonth = (m: { key: string; label: string }) => {
    setSelectedMonthLabel(m.label);
    setMonthSheetVisible(false);
    // TODO: Implement real filtering logic by month using persisted per-month data.
  };

  // Auto-scroll chat when new messages arrive
  useEffect(() => {
    if (chatMode && scrollRef.current) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages, chatMode]);

  const handleAIInput = async () => {
    if (!inputText.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      // Record user message (chat mode only)
      if (chatMode) {
        setMessages(prev => [...prev, { id: Date.now() + '-u', role: 'user', text: inputText.trim() }]);
      }
      const command = await AIService.parseNaturalLanguage(inputText);

      // Build feedback message for chat assistant summary
      let assistantFeedback = '';
      // Execute command based on type
      switch (command.type) {
        case 'expense':
          addTransaction({
            type: 'expense',
            category: command.data.category,
            amount: command.data.amount,
            description: command.data.description,
            date: new Date(),
          });
          assistantFeedback = `Logged expense $${command.data.amount} (${command.data.category}).`;
          break;
        case 'income':
          addTransaction({
            type: 'income',
            category: 'Income',
            amount: command.data.amount,
            description: command.data.description,
            date: new Date(),
          });
          assistantFeedback = `Recorded income $${command.data.amount}.`;
          break;
        case 'reminder':
          assistantFeedback = `Reminder noted: "${command.data.message}" (mock – persistence not yet implemented).`;
          break;
        case 'budget':
          assistantFeedback = `Prepared a draft budget plan for ${command.data.period}.`;
          break;
        default:
          assistantFeedback = 'Command processed.';
      }
      if (chatMode && assistantFeedback) {
        setMessages(prev => [
          ...prev,
          { id: Date.now() + '-a', role: 'assistant', text: assistantFeedback }
        ]);
      } else if (!chatMode && assistantFeedback) {
        // Preserve existing alert UX outside chat mode
        alert(assistantFeedback);
      }
      setInputText('');
    } catch (error) {
      if (chatMode) {
        setMessages(prev => [
          ...prev,
          { id: Date.now() + '-a', role: 'assistant', text: 'Sorry, I could not process that.' }
        ]);
      } else {
        alert('Failed to process command. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const spendingPercentage = (financialData.monthlyExpense / financialData.monthlyIncome) * 100;
  const lastMonthGrowth = 15; // Mock data

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerLeft} onPress={() => setMonthSheetVisible(true)} activeOpacity={0.7}>
            <Ionicons name="chevron-down" size={24} color="#1F2937" />
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
            ${financialData.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                ${financialData.monthlyExpense.toLocaleString()}
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
                ${financialData.monthlyIncome.toLocaleString()}
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
              ${financialData.monthlySaving.toLocaleString()}
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
                  ${financialData.spendingByCategory.Shopping?.toLocaleString() || 0}
                </Text>
              </View>
              <View style={styles.categoryItem}>
                <View style={[styles.categoryDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.categoryName}>Food</Text>
                <Text style={styles.categoryAmount}>
                  ${financialData.spendingByCategory.Food?.toLocaleString() || 0}
                </Text>
              </View>
              <View style={styles.categoryItem}>
                <View style={[styles.categoryDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.categoryName}>Transport</Text>
                <Text style={styles.categoryAmount}>
                  ${financialData.spendingByCategory.Transport?.toLocaleString() || 0}
                </Text>
              </View>
              <View style={styles.categoryItem}>
                <View style={[styles.categoryDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.categoryName}>Others</Text>
                <Text style={styles.categoryAmount}>
                  ${financialData.spendingByCategory.Others?.toLocaleString() || 0}
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
            placeholder="e.g. coffee $5"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleAIInput}
            onFocus={() => setChatMode(true)}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleAIInput}
            disabled={isProcessing}
          >
            <Ionicons name="send" size={24} color="#5B5FFF" />
          </TouchableOpacity>
        </View>
      )}

      {chatMode && (
        <KeyboardAvoidingView
          style={styles.chatOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <View style={styles.chatHeader}>
            <TouchableOpacity
              style={styles.chatBackButton}
              onPress={() => setChatMode(false)}
              disabled={isProcessing}
            >
              <Ionicons name="chevron-down" size={26} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.chatTitle}>Assistant</Text>
            <View style={{ width: 32 }} />
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
                <Text style={styles.chatEmptyTitle}>Ask or log anything</Text>
                <Text style={styles.chatEmptySubtitle}>Try: “coffee $5” or “plan my budget next month”</Text>
              </View>
            )}
            {messages.map(m => (
              <View
                key={m.id}
                style={[
                  styles.chatBubble,
                  m.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAssistant,
                ]}
              >
                <Text style={[
                  styles.chatBubbleText,
                  m.role === 'user' ? styles.chatBubbleTextUser : styles.chatBubbleTextAssistant,
                ]}>{m.text}</Text>
              </View>
            ))}
            {isProcessing && (
              <View style={[styles.chatBubble, styles.chatBubbleAssistant]}>
                <Text style={[styles.chatBubbleText, styles.chatBubbleTextAssistant]}>Processing…</Text>
              </View>
            )}
            <View style={{ height: 80 }} />
          </ScrollView>
          <View style={styles.chatInputBar}>
            <TextInput
              style={styles.chatInput}
              placeholder="Type a message..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              onSubmitEditing={handleAIInput}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={styles.chatSendButton}
              onPress={handleAIInput}
              disabled={isProcessing}
            >
              <Ionicons name="send" size={22} color={isProcessing ? '#A5B4FC' : '#ffffff'} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Month Selection Bottom Sheet */}
      {monthSheetVisible && (
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setMonthSheetVisible(false)} />
          <View style={styles.sheetContainer}>
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
            <TouchableOpacity style={styles.sheetCloseButton} onPress={() => setMonthSheetVisible(false)}>
              <Text style={styles.sheetCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
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
    fontSize: 20,
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
    flexDirection: 'row',
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
  },
  chatSendButton: {
    backgroundColor: '#5B5FFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
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
