import React, { useState, useCallback, useEffect } from 'react';
import { PlusCircle, Wallet, Plus, X } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinance } from '../context/FinanceContext';
import { COLORS } from '../constants/theme';
import { formatRupiah, formatRupiahWithSymbol } from '../utils/format';
import { getAccounts, createAccount, Account } from '../services/accountService';

const SAVINGS_ICONS: Record<string, { icon: string; color: string }> = {
  savings:    { icon: 'wallet',          color: COLORS.primary },
  investment: { icon: 'trending-up',     color: '#8B5CF6' },
  cash:       { icon: 'cash',            color: '#10B981' },
  e_wallet:   { icon: 'phone-portrait',  color: '#F59E0B' },
};

export default function SavingScreen() {
  const { financialData } = useFinance();
  const [accounts, setAccounts]   = useState<Account[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName,      setNewName]      = useState('');
  const [newTarget,    setNewTarget]    = useState('');
  const [saving,       setSaving]       = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const all = await getAccounts();
      // Show savings + investment accounts on this screen
      setAccounts(all.filter(a => a.type === 'savings' || a.type === 'investment'));
    } catch (e) {
      console.error('[SavingScreen] load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalSaved = accounts.reduce((s, a) => s + Number(a.balance), 0);

  const handleAddGoal = async () => {
    if (!newName.trim()) return Alert.alert('Error', 'Enter a goal name');
    setSaving(true);
    try {
      await createAccount({
        name: newName.trim(),
        type: 'savings',
        balance: parseFloat(newTarget) || 0,
        institution: undefined,
      });
      setShowAddModal(false);
      setNewName(''); setNewTarget('');
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to create savings goal');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Savings</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)}>
            <PlusCircle size={28} color={COLORS.primary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Total Savings Card */}
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.totalCard}
        >
          <Text style={styles.totalLabel}>Total Saved</Text>
          <Text style={styles.totalAmount}>{formatRupiahWithSymbol(totalSaved)}</Text>
          <Text style={styles.totalSubtext}>
            This month +{formatRupiah(financialData.monthlySaving)}
          </Text>
        </LinearGradient>

        {/* Savings Accounts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Savings & Investments</Text>

          {accounts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No savings accounts</Text>
              <Text style={styles.emptySubtitle}>Add a savings or investment account to track your progress</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAddModal(true)}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.emptyBtnText}>Add Savings Account</Text>
              </TouchableOpacity>
            </View>
          ) : (
            accounts.map(acc => {
              const meta = SAVINGS_ICONS[acc.type] ?? { icon: 'wallet', color: COLORS.primary };
              return (
                <TouchableOpacity key={acc.id} style={styles.goalCard} activeOpacity={0.8}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalLeft}>
                      <View style={[styles.goalIcon, { backgroundColor: meta.color + '20' }]}>
                        <Ionicons name={meta.icon as any} size={24} color={meta.color} />
                      </View>
                      <View>
                        <Text style={styles.goalName}>{acc.name}</Text>
                        <Text style={styles.goalSub}>
                          {acc.institution ? acc.institution + ' · ' : ''}{acc.type === 'investment' ? 'Investment' : 'Savings'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.goalAmount, { color: meta.color }]}>
                      {formatRupiahWithSymbol(Number(acc.balance))}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Savings Tips</Text>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={24} color="#F59E0B" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Automate your savings</Text>
              <Text style={styles.tipDescription}>Set up automatic transfers to your savings account each month</Text>
            </View>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={24} color="#F59E0B" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>50/30/20 Rule</Text>
              <Text style={styles.tipDescription}>Allocate 20% of income to savings before spending on anything else</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Savings Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Savings Account</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Account Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Emergency Fund, Vacation"
              value={newName}
              onChangeText={setNewName}
            />
            <Text style={styles.fieldLabel}>Current Balance</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={newTarget}
              onChangeText={setNewTarget}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[styles.submitBtn, saving && { opacity: 0.7 }]}
              onPress={handleAddGoal}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Create</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle:  { fontSize: 17, fontWeight: '600', color: '#1F2937' },

  totalCard:    { marginHorizontal: 20, marginTop: 8, padding: 24, borderRadius: 24, elevation: 4, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  totalLabel:   { fontSize: 10, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
  totalAmount:  { fontSize: 36, fontWeight: '800', color: 'white', marginTop: 8 },
  totalSubtext: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 8 },

  section:      { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: '#1F2937', marginBottom: 16 },

  emptyState:   { alignItems: 'center', paddingVertical: 32 },
  emptyTitle:   { fontSize: 15, fontWeight: '700', color: '#1F2937', marginTop: 12, marginBottom: 6 },
  emptySubtitle:{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  emptyBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  goalCard:     { backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 12 },
  goalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalLeft:     { flexDirection: 'row', alignItems: 'center', flex: 1 },
  goalIcon:     { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  goalName:     { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  goalSub:      { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  goalAmount:   { fontSize: 15, fontWeight: '700' },

  tipCard:      { flexDirection: 'row', backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 12 },
  tipContent:   { flex: 1, marginLeft: 12 },
  tipTitle:     { fontSize: 12, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  tipDescription:{ fontSize: 11, color: '#6B7280', lineHeight: 18 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle:   { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  fieldLabel:   { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
  input:        { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14, fontSize: 14, color: '#1F2937', marginBottom: 16 },
  submitBtn:    { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  submitBtnText:{ color: '#fff', fontWeight: '700', fontSize: 15 },
});
