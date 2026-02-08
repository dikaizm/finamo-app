import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { API, SpendingAnalytics, TransactionsList } from '../services/api';
import { formatRupiah } from '../utils/format';
import { COLORS } from '../constants/theme';

export default function SpendingScreen() {
  const { financialData } = useFinance();
  const navigation = useNavigation<any>();

  const activeMonthKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [remoteSpending, setRemoteSpending] = useState<SpendingAnalytics | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<TransactionsList['items']>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [spending, list] = await Promise.all([
        API.getSpendingAnalytics(activeMonthKey),
        API.listTransactions(activeMonthKey),
      ]);
      setRemoteSpending(spending);
      setRecentExpenses((list.items || []).filter(it => it.type === 'expense').slice(0, 5));
    } catch (e: any) {
      setError(e?.message || 'Failed to load spending data');
    } finally {
      setLoading(false);
    }
  }, [activeMonthKey]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await fetchData(); } finally { setTimeout(() => setRefreshing(false), 250); }
  }, [fetchData]);

  const spendingPercentage = remoteSpending
    ? remoteSpending.expensePctOfIncome
    : (financialData.monthlyIncome ? (financialData.monthlyExpense / financialData.monthlyIncome) * 100 : 0);

  const categories = useMemo(() => {
    const byCat = remoteSpending?.byCategory || [];
    const fallback = financialData.spendingByCategory;
    const getAmt = (key: string, fb: number) => byCat.find(c => c.category.toLowerCase() === key)?.amount ?? fb;
    return [
      { name: 'Shopping', amount: getAmt('shopping', fallback.Shopping || 0), color: COLORS.primary, icon: 'cart' },
      { name: 'Food', amount: getAmt('food', fallback.Food || 0), color: '#10B981', icon: 'restaurant' },
      { name: 'Transport', amount: getAmt('transport', fallback.Transport || 0), color: '#F59E0B', icon: 'car' },
      { name: 'Others', amount: getAmt('others', fallback.Others || 0), color: '#EF4444', icon: 'grid' },
    ];
  }, [remoteSpending, financialData.spendingByCategory]);

  const totalExpense = remoteSpending?.expenseTotal ?? financialData.monthlyExpense;

  const getPercentage = (amount: number) => ((amount / (totalExpense || 1)) * 100).toFixed(1);

  const formatTxDate = (value: any) => {
    try {
      const d = value instanceof Date ? value : new Date(value);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    } catch { }
    return '';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
      >
        {loading && (
          <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            <Text style={{ color: '#6B7280' }}>Loading…</Text>
          </View>
        )}
        {!!error && (
          <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            <Text style={{ color: '#B91C1C' }}>Failed to load: {error}</Text>
          </View>
        )}
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Spending Analysis</Text>
          <TouchableOpacity>
            <Ionicons name="calendar-outline" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* Overview Card */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>Total Spending This Month</Text>
          <Text style={styles.overviewAmount}>{formatRupiah(totalExpense)}</Text>
          <View style={styles.overviewBar}>
            <View style={[styles.overviewBarFill, { width: `${spendingPercentage}%` }]} />
          </View>
          <Text style={styles.overviewPercentage}>
            {Math.round(spendingPercentage)}% of income
          </Text>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Category</Text>
          {categories.map((category, index) => (
            <TouchableOpacity key={index} style={styles.categoryCard}>
              <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                <Ionicons name={category.icon as any} size={24} color={category.color} />
              </View>
              <View style={styles.categoryContent}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <View style={styles.categoryBar}>
                  <View
                    style={[
                      styles.categoryBarFill,
                      // React Native types don't like template-literal percentage strings; cast for style
                      { width: `${getPercentage(category.amount)}%`, backgroundColor: category.color } as any,
                    ]}
                  />
                </View>
              </View>
              <View style={styles.categoryAmount}>
                <Text style={styles.categoryAmountText}>{formatRupiah(category.amount)}</Text>
                <Text style={styles.categoryPercentage}>
                  {getPercentage(category.amount)}%
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Expenses')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {(recentExpenses.length ? recentExpenses : financialData.transactions.filter(t => t.type === 'expense').slice(0, 5))
            .map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <View style={[styles.transactionIcon, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="arrow-down" size={20} color="#EF4444" />
                  </View>
                  <View style={styles.transactionTextWrap}>
                    <Text
                      style={styles.transactionDescription}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {(transaction as any).name || (transaction as any).description}
                    </Text>
                    <Text style={styles.transactionDate} numberOfLines={1} ellipsizeMode="tail">
                      {formatTxDate((transaction as any).date)}
                    </Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={styles.transactionAmount}>-{formatRupiah(transaction.amount)}</Text>
                  <Text style={styles.transactionCategory} numberOfLines={1} ellipsizeMode="tail">{transaction.category}</Text>
                </View>
              </View>
            ))}
        </View>
      </ScrollView>
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
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  overviewCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 8,
    padding: 24,
    borderRadius: 16,
  },
  overviewLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  overviewAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  overviewBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  overviewBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  overviewPercentage: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  categoryBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  categoryAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
    minWidth: 90,
  },
  transactionTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionCategory: {
    fontSize: 12,
    color: '#1F2937',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
    marginLeft: 8,
    flexShrink: 0,
    textAlign: 'right',
  },
});
