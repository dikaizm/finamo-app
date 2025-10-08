import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';

export default function SpendingScreen() {
  const { financialData } = useFinance();

  const spendingPercentage = (financialData.monthlyExpense / financialData.monthlyIncome) * 100;

  const categories = [
    { name: 'Shopping', amount: financialData.spendingByCategory.Shopping || 0, color: '#5B5FFF', icon: 'cart' },
    { name: 'Food', amount: financialData.spendingByCategory.Food || 0, color: '#10B981', icon: 'restaurant' },
    { name: 'Transport', amount: financialData.spendingByCategory.Transport || 0, color: '#F59E0B', icon: 'car' },
    { name: 'Others', amount: financialData.spendingByCategory.Others || 0, color: '#EF4444', icon: 'grid' },
  ];

  const getPercentage = (amount: number) => {
    return ((amount / financialData.monthlyExpense) * 100).toFixed(1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
          <Text style={styles.overviewAmount}>
            ${financialData.monthlyExpense.toLocaleString()}
          </Text>
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
                      { width: `${getPercentage(category.amount)}%`, backgroundColor: category.color }
                    ]} 
                  />
                </View>
              </View>
              <View style={styles.categoryAmount}>
                <Text style={styles.categoryAmountText}>
                  ${category.amount.toLocaleString()}
                </Text>
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
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {financialData.transactions
            .filter(t => t.type === 'expense')
            .slice(0, 5)
            .map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <View style={[styles.transactionIcon, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="arrow-down" size={20} color="#EF4444" />
                  </View>
                  <View>
                    <Text style={styles.transactionCategory}>{transaction.category}</Text>
                    <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  </View>
                </View>
                <Text style={styles.transactionAmount}>
                  -${transaction.amount.toLocaleString()}
                </Text>
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
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#5B5FFF',
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#5B5FFF',
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
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  transactionDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});
