/**
 * Stats Grid Component - Monthly statistics display
 */
import React from 'react';
import { Wallet } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../constants/theme';

interface StatsGridProps {
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySaving: number;
}

export default function StatsGrid({
  monthlyIncome,
  monthlyExpense,
  monthlySaving
}: StatsGridProps) {
  const savingsRate = monthlyIncome > 0 ? (monthlySaving / monthlyIncome * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons name="trending-up" size={28} color="#10B981" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Monthly Income</Text>
          <Text style={styles.amount}>{formatRupiah(monthlyIncome)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons name="trending-down" size={28} color="#EF4444" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Monthly Expense</Text>
          <Text style={styles.amount}>{formatRupiah(monthlyExpense)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Wallet size={28} color={COLORS.primary} strokeWidth={2} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Monthly Savings</Text>
          <Text style={[styles.amount, monthlySaving < 0 && styles.amountNegative]}>
            {formatRupiah(monthlySaving)}
          </Text>
          <Text style={styles.savingsRate}>{savingsRate.toFixed(1)}% saved</Text>
        </View>
      </View>
    </View>
  );
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    flex: 1,
    minWidth: 140,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(91, 91, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  textContainer: {
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  amountNegative: {
    color: '#EF4444',
  },
  savingsRate: {
    fontSize: 11,
    color: '#10B981',
    marginTop: 2,
  },
});
