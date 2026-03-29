/**
 * Analysis Section Component - Financial analysis display
 */
import React from 'react';
import { Tag } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../constants/theme';

interface AnalysisSectionProps {
  spendingByCategory: Record<string, number>;
  topCategories: Array<{ category: string; amount: number; percentage: number }>;
}

export default function AnalysisSection({
  spendingByCategory,
  topCategories
}: AnalysisSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Spending Analysis</Text>
      </View>

      {/* Top Categories */}
      <View style={styles.categoriesContainer}>
        <Text style={styles.subtitle}>Top Categories</Text>
        {topCategories.map((item, index) => (
          <View key={index} style={styles.categoryRow}>
            <View style={[styles.categoryBar, { width: `${item.percentage}%` }]} />
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{item.category}</Text>
              <Text style={styles.categoryAmount}>{formatRupiah(item.amount)}</Text>
            </View>
            <Text style={styles.categoryPct}>{Math.round(item.percentage)}%</Text>
          </View>
        ))}
      </View>

      {/* Total Categories */}
      <View style={styles.allCategoriesContainer}>
        <Text style={styles.subtitle}>All Categories</Text>
        {Object.entries(spendingByCategory).map(([category, amount], index) => (
          <View key={index} style={styles.categoryItem}>
            <View style={styles.categoryItemLeft}>
              <Tag size={16} color={COLORS.primary} strokeWidth={2}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.categoryItemName}>{category}</Text>
            </View>
            <Text style={styles.categoryItemAmount}>{formatRupiah(amount)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  categoriesContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  categoryInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  categoryPct: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  allCategoriesContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryItemName: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  categoryItemAmount: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '700',
  },
});
