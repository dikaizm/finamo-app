/**
 * Budget Card Component - Monthly budget display widget
 */
import React from 'react';
import { ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../constants/theme';

interface BudgetCardProps {
  currentMonth: string;
  totalLimit: number;
  totalSpend: number;
  budgetPct: number;
}

export default function BudgetCard({
  currentMonth,
  totalLimit,
  totalSpend,
  budgetPct
}: BudgetCardProps) {
  const remaining = totalLimit - totalSpend;
  const isOverBudget = totalSpend > totalLimit;

  return (
    <View style={styles.card}>
      {/* Header with Month */}
      <View style={styles.header}>
        <Text style={styles.monthLabel}>Budget</Text>
        <View style={styles.monthBadge}>
          <Text style={styles.monthText}>{currentMonth}</Text>
        </View>
      </View>

      {/* Amounts */}
      <View style={styles.amountsContainer}>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Budget</Text>
          <Text style={styles.amountValue}>{formatRupiah(totalLimit)}</Text>
        </View>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Spent</Text>
          <Text style={[styles.amountValue, isOverBudget && styles.amountValueOver]}>
            {formatRupiah(totalSpend)}
          </Text>
        </View>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Remaining</Text>
          <Text style={[styles.amountValue, remaining < 0 && styles.amountValueNegative]}>
            {formatRupiah(remaining)}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(budgetPct, 100)}%`,
                backgroundColor: isOverBudget ? '#FF5252' : COLORS.primary
              }
            ]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(budgetPct)}%</Text>
      </View>

      {/* Icon */}
      {isOverBudget ? (
        <View style={styles.warningIcon}>
          <AlertTriangle size={20} color="#FF5252" strokeWidth={2} />
        </View>
      ) : budgetPct < 50 ? (
        <View style={styles.successIcon}>
          <CheckCircle size={20} color="#10B981" strokeWidth={2} />
        </View>
      ) : null}
    </View>
  );
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  monthText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  amountsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  amountItem: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  amountValueOver: {
    color: '#FF5252',
  },
  amountValueNegative: {
    color: '#FF5252',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
  },
  warningIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  successIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
});
