import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { formatRupiahWithSymbol } from '../utils/format';
import { COLORS } from '../constants/theme';
import {
  getActiveBudget,
  createBudgetFromAIPlan,
  archiveBudget,
  BudgetWithActuals,
} from '../services/budgetService';

const CATEGORY_ICONS: Record<string, string> = {
  Food: 'restaurant',
  Shopping: 'cart',
  Transport: 'car',
  Bills: 'document-text',
  Entertainment: 'film',
  Health: 'medical',
  Education: 'school',
  Travel: 'airplane',
  Others: 'ellipsis-horizontal',
};

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const [budget, setBudget] = useState<BudgetWithActuals | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const loadBudget = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true); else setIsLoading(true);
    try {
      setBudget(await getActiveBudget());
    } catch (e) {
      console.error('[BudgetScreen] load error:', e);
      setBudget(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadBudget(); }, [loadBudget]);

  const handleCreateBudget = useCallback(async () => {
    setIsCreating(true);
    try {
      await createBudgetFromAIPlan();
      await loadBudget();
    } catch (e: any) {
      const msg = e?.response?.data?.detail;
      Alert.alert('Error', typeof msg === 'string' ? msg : 'Failed to create budget. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }, [loadBudget]);

  const handleFAB = useCallback(() => {
    if (!budget) return;
    Alert.alert('Budget Options', undefined, [
      {
        text: 'Create New Budget',
        onPress: () =>
          Alert.alert('Create New Budget', 'AI will generate a new budget from your spending history.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Create', onPress: handleCreateBudget },
          ]),
      },
      {
        text: 'Archive Budget',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Archive Budget', 'Archive the current active budget?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Archive',
              style: 'destructive',
              onPress: async () => {
                try {
                  await archiveBudget(budget.id);
                  await loadBudget();
                } catch (e: any) {
                  Alert.alert('Error', e?.response?.data?.detail || 'Failed to archive budget');
                }
              },
            },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [budget, handleCreateBudget, loadBudget]);

  const stats = useMemo(() => {
    if (!budget) return null;
    const actuals = budget.actuals || {};
    const totalLimit = budget.total_expense_target || 0;
    const spent = actuals.total_expense_actual || 0;
    const remaining = totalLimit - spent;
    const pct = totalLimit > 0 ? (spent / totalLimit) * 100 : 0;
    const [year, month] = budget.month.split('-');
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysRemaining = Math.max(0, daysInMonth - dayOfMonth);
    const daysPassed = Math.max(1, dayOfMonth);
    const dailyAvg = spent / daysPassed;
    const safeDailySpend = daysRemaining > 0 ? remaining / daysRemaining : 0;
    return {
      totalLimit, spent, remaining, pct,
      daysRemaining, dailyAvg, safeDailySpend,
      monthDisplay: `${monthNames[parseInt(month) - 1]} ${year}`,
      actuals,
    };
  }, [budget]);

  const progressColor = useMemo(() => {
    if (!stats) return COLORS.primary;
    if (stats.pct < 70) return '#10B981';
    if (stats.pct < 90) return '#F59E0B';
    return '#EF4444';
  }, [stats]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Monthly Budget</Text>
        {stats && (
          <View style={styles.monthBadge}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
            <Text style={styles.monthBadgeText}>{stats.monthDisplay}</Text>
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadBudget(true)} tintColor={COLORS.primary} />
        }
      >
        {!budget ? (
          /* ── Empty State ── */
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="wallet-outline" size={48} color={COLORS.gray300} />
            </View>
            <Text style={styles.emptyTitle}>No Active Budget</Text>
            <Text style={styles.emptySubtitle}>
              Create an AI-powered budget based on your spending history. We'll suggest optimal limits for each category.
            </Text>
            <TouchableOpacity
              style={[styles.createBtn, isCreating && { opacity: 0.7 }]}
              onPress={handleCreateBudget}
              disabled={isCreating}
              activeOpacity={0.8}
            >
              {isCreating ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.createBtnText}>Analyzing Spending…</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color="#fff" />
                  <Text style={styles.createBtnText}>Create Smart Budget with AI</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.emptyHint}>Takes about 20–30 seconds to analyze your transactions</Text>
          </View>
        ) : stats ? (
          <>
            {/* ── Hero Budget Card ── */}
            <LinearGradient
              colors={[progressColor === '#10B981' ? COLORS.primary : progressColor, progressColor === '#10B981' ? '#025c45' : progressColor + 'CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <Text style={styles.heroLabel}>Total Budget</Text>
              <Text style={styles.heroAmount}>{formatRupiahWithSymbol(stats.totalLimit)}</Text>

              {/* Progress bar */}
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.min(stats.pct, 100)}%`, backgroundColor: 'rgba(255,255,255,0.9)' }]} />
              </View>
              <Text style={styles.progressLabel}>{stats.pct.toFixed(1)}% used</Text>

              <View style={styles.heroRow}>
                <View>
                  <Text style={styles.heroSubLabel}>Spent</Text>
                  <Text style={styles.heroSub}>{formatRupiahWithSymbol(stats.spent)}</Text>
                </View>
                <View style={styles.heroDivider} />
                <View>
                  <Text style={styles.heroSubLabel}>Remaining</Text>
                  <Text style={styles.heroSub}>{formatRupiahWithSymbol(Math.abs(stats.remaining))}</Text>
                </View>
              </View>

              {stats.pct > 90 && (
                <View style={styles.warningBanner}>
                  <Ionicons name="warning" size={14} color="#FEF3C7" />
                  <Text style={styles.warningBannerText}>
                    {stats.pct.toFixed(0)}% of budget used — watch your spending!
                  </Text>
                </View>
              )}
            </LinearGradient>

            {/* ── Quick Stats ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <View style={[styles.statIconWrap, { backgroundColor: COLORS.primary + '18' }]}>
                    <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.statValue}>{stats.daysRemaining}</Text>
                  <Text style={styles.statLabel}>Days Left</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={[styles.statIconWrap, { backgroundColor: '#F59E0B18' }]}>
                    <Ionicons name="trending-up-outline" size={20} color="#F59E0B" />
                  </View>
                  <Text style={styles.statValue} numberOfLines={1}>
                    {formatRupiahWithSymbol(stats.dailyAvg).replace('Rp\u00A0', 'Rp')}
                  </Text>
                  <Text style={styles.statLabel}>Daily Avg</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={[styles.statIconWrap, { backgroundColor: '#10B98118' }]}>
                    <Ionicons name="wallet-outline" size={20} color="#10B981" />
                  </View>
                  <Text style={styles.statValue} numberOfLines={1}>
                    {formatRupiahWithSymbol(Math.max(0, stats.safeDailySpend)).replace('Rp\u00A0', 'Rp')}
                  </Text>
                  <Text style={styles.statLabel}>Safe/Day</Text>
                </View>
              </View>
            </View>

            {/* ── Category Breakdown ── */}
            {stats.actuals?.category_breakdown?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Category Breakdown</Text>
                {stats.actuals.category_breakdown.map((cat, i) => {
                  const pct = cat.percentage_used;
                  const color = pct < 70 ? '#10B981' : pct < 90 ? '#F59E0B' : '#EF4444';
                  const isOver = pct > 100;
                  const icon = CATEGORY_ICONS[cat.category] || 'pricetag';
                  return (
                    <View key={i} style={styles.catCard}>
                      <View style={styles.catRow}>
                        <View style={styles.catLeft}>
                          <View style={[styles.catIcon, { backgroundColor: color + '18' }]}>
                            <Ionicons name={icon as any} size={18} color={color} />
                          </View>
                          <View>
                            <Text style={styles.catName}>{cat.category}</Text>
                            <Text style={styles.catSub}>
                              {formatRupiahWithSymbol(cat.actual)} / {formatRupiahWithSymbol(cat.planned)}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.catPct, { color: isOver ? '#EF4444' : color }]}>
                          {pct.toFixed(0)}%
                        </Text>
                      </View>
                      <View style={styles.catTrack}>
                        <View style={[styles.catFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
                      </View>
                      {isOver && (
                        <Text style={styles.catOverText}>
                          {formatRupiahWithSymbol(cat.actual - cat.planned)} over budget
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      {budget && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom > 0 ? insets.bottom + 20 : 40 }]}
          onPress={handleFAB}
          activeOpacity={0.85}
        >
          <Ionicons name="settings-outline" size={22} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle:  { fontSize: 17, fontWeight: '600', color: COLORS.gray800 },
  monthBadge:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  monthBadgeText:{ fontSize: 12, fontWeight: '600', color: COLORS.primary },

  // Empty State
  emptyState:   { alignItems: 'center', paddingHorizontal: 32, paddingTop: 60, paddingBottom: 24 },
  emptyIconWrap:{ width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle:   { fontSize: 17, fontWeight: '700', color: COLORS.gray800, marginBottom: 10 },
  emptySubtitle:{ fontSize: 13, color: COLORS.gray500, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  createBtn:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  createBtnText:{ fontSize: 14, fontWeight: '700', color: '#fff' },
  emptyHint:    { fontSize: 11, color: COLORS.gray400, marginTop: 14, fontStyle: 'italic' },

  // Hero Card
  heroCard:     { marginHorizontal: 20, borderRadius: 24, padding: 24, marginBottom: 8 },
  heroLabel:    { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginBottom: 6 },
  heroAmount:   { fontSize: 34, fontWeight: '800', color: '#fff', marginBottom: 16 },
  progressTrack:{ height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel:{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginBottom: 16 },
  heroRow:      { flexDirection: 'row', alignItems: 'center' },
  heroSubLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginBottom: 3 },
  heroSub:      { fontSize: 13, fontWeight: '700', color: '#fff' },
  heroDivider:  { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 24 },
  warningBanner:{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  warningBannerText: { fontSize: 11, color: '#FEF3C7', fontWeight: '500', flex: 1 },

  // Section
  section:      { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: COLORS.gray800, marginBottom: 14 },

  // Quick Stats
  statsRow:     { flexDirection: 'row', gap: 10 },
  statCard:     { flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 14, alignItems: 'center' },
  statIconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue:    { fontSize: 12, fontWeight: '700', color: COLORS.gray800, marginBottom: 2 },
  statLabel:    { fontSize: 10, color: COLORS.gray500, textAlign: 'center' },

  // Category Cards
  catCard:      { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 10 },
  catRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  catLeft:      { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  catIcon:      { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  catName:      { fontSize: 13, fontWeight: '600', color: COLORS.gray800, marginBottom: 2 },
  catSub:       { fontSize: 11, color: COLORS.gray500 },
  catPct:       { fontSize: 13, fontWeight: '700' },
  catTrack:     { height: 5, backgroundColor: COLORS.gray100, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  catFill:      { height: '100%', borderRadius: 3 },
  catOverText:  { fontSize: 11, color: '#EF4444', fontWeight: '600', marginTop: 2 },

  // FAB
  fab:          { position: 'absolute', right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
});
