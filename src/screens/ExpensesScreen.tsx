import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, CheckCircle, Circle, PiggyBank, ShoppingCart } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { API, TransactionOut } from '../services/api';
import { formatRupiah } from '../utils/format';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/theme';

type FilterType = 'all' | 'expense' | 'income' | 'savings';

const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'expense', label: 'Expense' },
    { key: 'income', label: 'Income' },
    { key: 'savings', label: 'Savings' },
];

const TYPE_CONFIG: Record<string, { iconColor: string; iconBg: string; amountColor: string; prefix: string }> = {
    expense: { iconColor: '#EF4444', iconBg: '#FEE2E2', amountColor: '#EF4444', prefix: '-' },
    income:  { iconColor: '#10B981', iconBg: '#D1FAE5', amountColor: '#10B981', prefix: '+' },
    savings: { iconColor: '#6366F1', iconBg: '#EEF2FF', amountColor: '#6366F1', prefix: '+' },
};

function TypeIcon({ type }: { type: string }) {
    const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.expense;
    if (type === 'income') return <ArrowDown size={18} color={cfg.iconColor} strokeWidth={2} />;
    if (type === 'savings') return <PiggyBank size={18} color={cfg.iconColor} strokeWidth={2} />;
    return <ArrowUp size={18} color={cfg.iconColor} strokeWidth={2} />;
}

export default function ExpensesScreen() {
    const navigation = useNavigation<any>();

    const activeMonthKey = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }, []);

    const [allItems, setAllItems] = useState<TransactionOut[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const selectionMode = selectedIds.size > 0;

    const items = useMemo(() => {
        if (activeFilter === 'all') return allItems;
        return allItems.filter(it => it.type === activeFilter);
    }, [allItems, activeFilter]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const list = await API.listTransactions(activeMonthKey);
            setAllItems(list.items || []);
        } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to load transactions');
        } finally {
            setLoading(false);
        }
    }, [activeMonthKey]);

    useEffect(() => { load(); }, [load]);
    useFocusEffect(useCallback(() => { load(); }, [load]));

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try { await load(); } finally { setRefreshing(false); }
    }, [load]);

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const clearSelection = () => setSelectedIds(new Set());

    const selectAll = () => {
        if (selectedIds.size === items.length) {
            clearSelection();
        } else {
            setSelectedIds(new Set(items.map(i => i.id)));
        }
    };

    const deleteSelected = () => {
        if (selectedIds.size === 0) return;
        Alert.alert(
            'Delete transactions',
            `Delete ${selectedIds.size} selected item${selectedIds.size > 1 ? 's' : ''}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive', onPress: async () => {
                        try {
                            await Promise.all(Array.from(selectedIds).map(id => API.deleteTransaction(id)));
                            clearSelection();
                            await load();
                        } catch (e: any) {
                            Alert.alert('Delete failed', e?.message || 'Could not delete');
                        }
                    }
                }
            ]
        );
    };

    const keyExtractor = (item: TransactionOut) => String(item.id);

    const renderItem = ({ item }: { item: TransactionOut }) => {
        const isSelected = selectedIds.has(item.id);
        const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.expense;

        const onPress = () => {
            if (selectionMode) toggleSelect(item.id);
            else navigation.navigate('TransactionDetail', { transaction: item });
        };
        const onLongPress = () => {
            if (!selectionMode) setSelectedIds(new Set([item.id]));
            else toggleSelect(item.id);
        };

        return (
            <TouchableOpacity activeOpacity={0.8} onPress={onPress} onLongPress={onLongPress}>
                <View style={[styles.row, isSelected && styles.rowSelected]}>
                    <View style={styles.rowLeft}>
                        {selectionMode && (
                            <View style={styles.checkboxWrap}>
                                {isSelected
                                    ? <CheckCircle size={22} color={COLORS.primary} strokeWidth={2} />
                                    : <Circle size={22} color="#9CA3AF" strokeWidth={2} />}
                            </View>
                        )}
                        <View style={[styles.icon, { backgroundColor: cfg.iconBg }]}>
                            <TypeIcon type={item.type} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.rowTitle} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.rowSub} numberOfLines={1}>
                                {new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.rowRight}>
                        <Text style={[styles.rowAmount, { color: cfg.amountColor }]}>
                            {cfg.prefix}{formatRupiah(item.amount)}
                        </Text>
                        <Text style={styles.rowCategory} numberOfLines={1}>{item.category}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // Update header based on selection mode
    useEffect(() => {
        navigation.setOptions({
            title: selectionMode ? `${selectedIds.size} selected` : 'Transactions',
            headerTitleStyle: { fontSize: 16 },
            headerLeft: selectionMode ? () => (
                <TouchableOpacity style={{ paddingHorizontal: 8 }} onPress={clearSelection}>
                    <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
            ) : undefined,
            headerRight: () => selectionMode ? (
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity onPress={selectAll} style={{ paddingHorizontal: 8 }}>
                        <Text style={{ color: COLORS.primary, fontWeight: '600' }}>
                            {selectedIds.size === items.length ? 'Clear All' : 'Select All'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={deleteSelected} style={{ paddingHorizontal: 8 }}>
                        <Text style={{ color: '#EF4444', fontWeight: '600' }}>Delete</Text>
                    </TouchableOpacity>
                </View>
            ) : null,
        });
    }, [navigation, selectionMode, selectedIds.size, items.length]);

    return (
        <SafeAreaView edges={['bottom']} style={styles.container}>
            {/* Pill filters */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterBar}
                contentContainerStyle={styles.filterContent}
            >
                {FILTERS.map(f => (
                    <TouchableOpacity
                        key={f.key}
                        style={[styles.pill, activeFilter === f.key && styles.pillActive]}
                        onPress={() => { clearSelection(); setActiveFilter(f.key); }}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.pillText, activeFilter === f.key && styles.pillTextActive]}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {loading && !refreshing ? (
                <View style={{ padding: 20 }}>
                    <ActivityIndicator color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    onRefresh={onRefresh}
                    refreshing={refreshing}
                    ListEmptyComponent={!loading ? (
                        <View style={{ padding: 20 }}>
                            <Text style={{ color: '#6B7280' }}>No transactions this month.</Text>
                        </View>
                    ) : null}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },

    filterBar: { flexGrow: 0, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
    filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    pillActive: {
        backgroundColor: '#EEF2FF',
        borderColor: COLORS.primary,
    },
    pillText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
    pillTextActive: { color: COLORS.primary },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E7EB',
    },
    rowSelected: { backgroundColor: '#EEF2FF' },
    rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    rowRight: { alignItems: 'flex-end', marginLeft: 12, minWidth: 100 },
    icon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    checkboxWrap: { marginRight: 8 },
    rowTitle: { fontSize: 14, fontWeight: '500', color: '#111827' },
    rowSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    rowAmount: { fontSize: 14, fontWeight: '600' },
    rowCategory: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});
