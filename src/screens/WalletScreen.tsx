import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Wallet, X, Trash2, MoreHorizontal, ArrowLeftRight, CreditCard, Eye, Edit2, AlertTriangle } from 'lucide-react-native';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';
import { formatRupiahWithSymbol } from '../utils/format';
import {
  Account,
  getAccounts,
  getNetWorth,
  createAccount,
  updateAccount,
  deleteAccount,
  createTransfer,
} from '../services/accountService';

// ─── Helpers ────────────────────────────────────────────────────────────────

const ACCOUNT_TYPE_META: Record<
  Account['type'],
  { label: string; icon: string; color: string; isLiability: boolean }
> = {
  cash:        { label: 'Cash',        icon: 'cash',          color: '#10B981', isLiability: false },
  checking:    { label: 'Checking',    icon: 'card',          color: '#3B82F6', isLiability: false },
  savings:     { label: 'Savings',     icon: 'wallet',        color: COLORS.primary, isLiability: false },
  investment:  { label: 'Investment',  icon: 'trending-up',   color: '#8B5CF6', isLiability: false },
  e_wallet:    { label: 'E-Wallet',    icon: 'phone-portrait',color: '#F59E0B', isLiability: false },
  credit_card: { label: 'Credit Card', icon: 'card',          color: '#EF4444', isLiability: true  },
  loan:        { label: 'Loan',        icon: 'document-text', color: '#F97316', isLiability: true  },
};

const ACCOUNT_TYPES = Object.entries(ACCOUNT_TYPE_META).map(([k, v]) => ({
  value: k as Account['type'],
  ...v,
}));

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function WalletScreen() {
  const insets = useSafeAreaInsets();

  const [accounts, setAccounts]   = useState<Account[]>([]);
  const [netWorth, setNetWorth]   = useState<{ net_worth: number; total_assets: number; total_liabilities: number } | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showAddModal,      setShowAddModal]      = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showEditModal,     setShowEditModal]     = useState(false);
  const [editTarget,        setEditTarget]        = useState<Account | null>(null);

  // Add account form
  const [newName,        setNewName]        = useState('');
  const [newType,        setNewType]        = useState<Account['type']>('cash');
  const [newBalance,     setNewBalance]     = useState('');
  const [newInstitution, setNewInstitution] = useState('');
  const [saving,         setSaving]         = useState(false);

  // Transfer form
  const [fromId,  setFromId]  = useState('');
  const [toId,    setToId]    = useState('');
  const [trfAmt,  setTrfAmt]  = useState('');
  const [trfDesc, setTrfDesc] = useState('');
  const [transferring, setTransferring] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [accs, nw] = await Promise.all([getAccounts(), getNetWorth()]);
      setAccounts(accs);
      setNetWorth(nw);
    } catch (e) {
      console.error('[WalletScreen] load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAddAccount = async () => {
    if (!newName.trim()) return Alert.alert('Error', 'Please enter account name');
    setSaving(true);
    try {
      await createAccount({
        name: newName.trim(),
        type: newType,
        balance: parseFloat(newBalance) || 0,
        institution: newInstitution.trim() || undefined,
      });
      setShowAddModal(false);
      setNewName(''); setNewType('cash'); setNewBalance(''); setNewInstitution('');
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to create account');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAccount = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      await updateAccount(editTarget.id, {
        name: editTarget.name,
        institution: editTarget.institution,
        balance: Number(editTarget.balance),
      });
      setShowEditModal(false);
      setEditTarget(null);
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to update account');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    if (!editTarget) return;
    Alert.alert(
      'Delete Account',
      `Delete "${editTarget.name}"? This cannot be undone. The account must have a zero balance.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await deleteAccount(editTarget.id);
              setShowEditModal(false);
              setEditTarget(null);
              load();
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.detail || 'Failed to delete account');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleTransfer = async () => {
    if (!fromId || !toId || !trfAmt) return Alert.alert('Error', 'Fill all transfer fields');
    if (fromId === toId) return Alert.alert('Error', 'Cannot transfer to same account');
    setTransferring(true);
    try {
      await createTransfer({
        from_account_id: fromId,
        to_account_id: toId,
        amount: parseFloat(trfAmt),
        description: trfDesc || undefined,
      });
      setShowTransferModal(false);
      setFromId(''); setToId(''); setTrfAmt(''); setTrfDesc('');
      load();
      Alert.alert('Success', 'Transfer completed');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  };

  // Group accounts by asset vs liability
  const assets      = accounts.filter(a => !ACCOUNT_TYPE_META[a.type]?.isLiability);
  const liabilities = accounts.filter(a =>  ACCOUNT_TYPE_META[a.type]?.isLiability);

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
          <Text style={styles.headerTitle}>Wallet</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => setShowTransferModal(true)}>
              <ArrowLeftRight size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={() => setShowAddModal(true)}>
              <Plus size={22} color={COLORS.primary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Net Worth Card */}
        <LinearGradient
          colors={[COLORS.primary, '#025c45']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.netWorthCard}
        >
          <Text style={styles.netWorthLabel}>Net Worth</Text>
          <Text style={styles.netWorthAmount}>
            {formatRupiahWithSymbol(netWorth?.net_worth ?? 0)}
          </Text>
          <View style={styles.netWorthRow}>
            <View>
              <Text style={styles.netWorthSubLabel}>Total Assets</Text>
              <Text style={styles.netWorthSub}>{formatRupiahWithSymbol(netWorth?.total_assets ?? 0)}</Text>
            </View>
            <View style={styles.netWorthDivider} />
            <View>
              <Text style={styles.netWorthSubLabel}>Liabilities</Text>
              <Text style={styles.netWorthSub}>{formatRupiahWithSymbol(netWorth?.total_liabilities ?? 0)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Empty state */}
        {accounts.length === 0 && (
          <View style={styles.emptyState}>
            <Wallet size={60} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No accounts yet</Text>
            <Text style={styles.emptySubtitle}>Add your bank, e-wallet, or cash account to track your balances</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAddModal(true)}>
              <Plus size={18} color="#fff" strokeWidth={2} />
              <Text style={styles.emptyBtnText}>Add Account</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Assets */}
        {assets.length > 0 && (
          <AccountSection
            title="Assets"
            accounts={assets}
            onEdit={acc => { setEditTarget(acc); setShowEditModal(true); }}
          />
        )}

        {/* Liabilities */}
        {liabilities.length > 0 && (
          <AccountSection
            title="Liabilities"
            accounts={liabilities}
            onEdit={acc => { setEditTarget(acc); setShowEditModal(true); }}
          />
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Add Account Modal ── */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Account</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Account Name</Text>
            <TextInput style={styles.input} placeholder="e.g. BCA Savings" value={newName} onChangeText={setNewName} />

            <Text style={styles.fieldLabel}>Account Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {ACCOUNT_TYPES.map(t => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.typeChip, newType === t.value && { backgroundColor: t.color + '20', borderColor: t.color }]}
                  onPress={() => setNewType(t.value)}
                >
                  <CreditCard size={16} color={newType === t.value ? t.color : '#9CA3AF'} strokeWidth={2} />
                  <Text style={[styles.typeChipText, newType === t.value && { color: t.color }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Initial Balance</Text>
            <View style={styles.currencyInput}>
              <Text style={styles.currencyPrefix}>Rp</Text>
              <TextInput
                style={styles.currencyTextInput}
                placeholder="0"
                value={newBalance ? Intl.NumberFormat('id-ID').format(Number(newBalance)) : ''}
                onChangeText={v => setNewBalance(v.replace(/\./g, '').replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.fieldLabel}>Institution (optional)</Text>
            <TextInput style={styles.input} placeholder="e.g. BCA, GoPay" value={newInstitution} onChangeText={setNewInstitution} />

            <TouchableOpacity style={[styles.submitBtn, saving && { opacity: 0.7 }]} onPress={handleAddAccount} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Add Account</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Edit Account Modal ── */}
      <Modal visible={showEditModal} animationType="slide" transparent onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Account</Text>
              <TouchableOpacity onPress={() => { setShowEditModal(false); setEditTarget(null); }}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Account Name</Text>
            <TextInput
              style={styles.input}
              value={editTarget?.name ?? ''}
              onChangeText={v => setEditTarget(prev => prev ? { ...prev, name: v } : prev)}
            />

            <Text style={styles.fieldLabel}>Balance</Text>
            <View style={styles.currencyInput}>
              <Text style={styles.currencyPrefix}>Rp</Text>
              <TextInput
                style={styles.currencyTextInput}
                placeholder="0"
                value={editTarget?.balance != null
                  ? Intl.NumberFormat('id-ID').format(Number(String(editTarget.balance).replace(/\./g, '').replace(/[^0-9]/g, '')) || 0)
                  : ''}
                onChangeText={v => {
                  const digits = v.replace(/\./g, '').replace(/[^0-9]/g, '');
                  setEditTarget(prev => prev ? { ...prev, balance: digits ? Number(digits) : 0 } : prev);
                }}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.fieldLabel}>Institution</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. BCA"
              value={editTarget?.institution ?? ''}
              onChangeText={v => setEditTarget(prev => prev ? { ...prev, institution: v } : prev)}
            />

            <TouchableOpacity style={[styles.submitBtn, saving && { opacity: 0.7 }]} onPress={handleUpdateAccount} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Save Changes</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.deleteBtn, saving && { opacity: 0.7 }]} onPress={handleDeleteAccount} disabled={saving}>
              <Trash2 size={18} color="#EF4444" strokeWidth={2} />
              <Text style={styles.deleteBtnText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Transfer Modal ── */}
      <Modal visible={showTransferModal} animationType="slide" transparent onRequestClose={() => setShowTransferModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transfer</Text>
              <TouchableOpacity onPress={() => setShowTransferModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>From Account</Text>
            <AccountPicker accounts={accounts} selectedId={fromId} onSelect={setFromId} />

            <Text style={styles.fieldLabel}>To Account</Text>
            <AccountPicker accounts={accounts} selectedId={toId} onSelect={setToId} />

            <Text style={styles.fieldLabel}>Amount</Text>
            <TextInput style={styles.input} placeholder="0" value={trfAmt} onChangeText={setTrfAmt} keyboardType="numeric" />

            <Text style={styles.fieldLabel}>Note (optional)</Text>
            <TextInput style={styles.input} placeholder="e.g. Monthly savings" value={trfDesc} onChangeText={setTrfDesc} />

            <TouchableOpacity style={[styles.submitBtn, transferring && { opacity: 0.7 }]} onPress={handleTransfer} disabled={transferring}>
              {transferring ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Transfer</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function AccountSection({ title, accounts, onEdit }: {
  title: string;
  accounts: Account[];
  onEdit: (a: Account) => void;
}) {
  const total = accounts.reduce((s, a) => s + Number(a.balance), 0);
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionTotal}>{formatRupiahWithSymbol(total)}</Text>
      </View>
      {accounts.map(acc => <AccountCard key={acc.id} account={acc} onEdit={() => onEdit(acc)} />)}
    </View>
  );
}

function AccountCard({ account, onEdit }: { account: Account; onEdit: () => void }) {
  const meta = ACCOUNT_TYPE_META[account.type];
  return (
    <TouchableOpacity style={styles.accountCard} onLongPress={onEdit} activeOpacity={0.8}>
      <View style={[styles.accountIcon, { backgroundColor: meta.color + '18' }]}>
        <CreditCard size={22} color={meta.color} strokeWidth={2} />
      </View>
      <View style={styles.accountInfo}>
        <Text style={styles.accountName}>{account.name}</Text>
        <Text style={styles.accountType}>{meta.label}{account.institution ? ` · ${account.institution}` : ''}</Text>
      </View>
      <View style={styles.accountRight}>
        <Text style={[styles.accountBalance, meta.isLiability && { color: '#EF4444' }]}>
          {meta.isLiability ? '−' : ''}{formatRupiahWithSymbol(Math.abs(Number(account.balance)))}
        </Text>
        <TouchableOpacity onPress={onEdit} style={styles.editBtn}>
          <MoreHorizontal size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function AccountPicker({ accounts, selectedId, onSelect }: {
  accounts: Account[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
      {accounts.map(a => {
        const meta = ACCOUNT_TYPE_META[a.type];
        const selected = a.id === selectedId;
        return (
          <TouchableOpacity
            key={a.id}
            style={[styles.pickerChip, selected && { backgroundColor: meta.color + '20', borderColor: meta.color }]}
            onPress={() => onSelect(a.id)}
          >
            <Text style={[styles.pickerChipText, selected && { color: meta.color, fontWeight: '700' }]}>{a.name}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle:  { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  headerActions:{ flexDirection: 'row', gap: 8 },
  headerBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' },

  netWorthCard: { marginHorizontal: 20, borderRadius: 24, padding: 24, marginBottom: 8 },
  netWorthLabel:{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginBottom: 8 },
  netWorthAmount:{ fontSize: 34, fontWeight: '800', color: '#fff', marginBottom: 16 },
  netWorthRow:  { flexDirection: 'row', alignItems: 'center' },
  netWorthSubLabel:{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  netWorthSub:  { fontSize: 13, fontWeight: '700', color: '#fff' },
  netWorthDivider:{ width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 24 },

  emptyState:   { alignItems: 'center', paddingHorizontal: 40, paddingTop: 48, paddingBottom: 24 },
  emptyTitle:   { fontSize: 17, fontWeight: '700', color: '#1F2937', marginTop: 16, marginBottom: 8 },
  emptySubtitle:{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  section:      { marginTop: 20, paddingHorizontal: 20 },
  sectionHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTotal: { fontSize: 13, fontWeight: '700', color: '#1F2937' },

  accountCard:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10 },
  accountIcon:  { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  accountInfo:  { flex: 1 },
  accountName:  { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  accountType:  { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  accountRight: { alignItems: 'flex-end' },
  accountBalance:{ fontSize: 14, fontWeight: '700', color: '#1F2937' },
  editBtn:      { marginTop: 4, padding: 2 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle:   { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  fieldLabel:   { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
  input:        { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14, fontSize: 14, color: '#1F2937', marginBottom: 16 },
  submitBtn:    { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  submitBtnText:{ color: '#fff', fontWeight: '700', fontSize: 15 },
  deleteBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' },
  deleteBtnText:{ color: '#EF4444', fontWeight: '600', fontSize: 14 },

  currencyInput:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, marginBottom: 16, paddingHorizontal: 14 },
  currencyPrefix:   { fontSize: 14, fontWeight: '600', color: '#6B7280', marginRight: 6 },
  currencyTextInput:{ flex: 1, paddingVertical: 14, fontSize: 14, color: '#1F2937' },

  typeChip:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: 'transparent', marginRight: 8 },
  typeChipText: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },

  pickerChip:   { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: 'transparent', marginRight: 8 },
  pickerChipText:{ fontSize: 12, fontWeight: '600', color: '#6B7280' },
});
