import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API, TransactionOut } from '../services/api';
import { useFinance } from '../context/FinanceContext';
import { formatRupiah } from '../utils/format';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/theme';

type Editable = Pick<TransactionOut, 'id' | 'name' | 'amount' | 'category' | 'date'>;

export default function ExpensesScreen() {
    const { financialData } = useFinance();
    const navigation = useNavigation<any>();

    const activeMonthKey = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }, []);

    const [items, setItems] = useState<TransactionOut[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const selectionMode = selectedIds.size > 0;

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const list = await API.listTransactions(activeMonthKey);
            const expenses = (list.items || []).filter(it => it.type === 'expense');
            setItems(expenses);
        } catch (e: any) {
            setError(e?.message || 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, [activeMonthKey]);

    useEffect(() => { load(); }, [load]);
    useFocusEffect(
        useCallback(() => {
            // Refresh when screen gains focus (coming back from detail screen)
            load();
        }, [load])
    );

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
            'Delete expenses',
            `Delete ${selectedIds.size} selected item${selectedIds.size > 1 ? 's' : ''}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive', onPress: async () => {
                        try {
                            const ids = Array.from(selectedIds);
                            await Promise.all(ids.map(id => API.deleteTransaction(id)));
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
        const onPress = () => {
            if (selectionMode) {
                toggleSelect(item.id);
            } else {
                navigation.navigate('TransactionDetail', { transaction: item });
            }
        };
        const onLongPress = () => {
            if (!selectionMode) {
                setSelectedIds(new Set([item.id]));
            } else {
                toggleSelect(item.id);
            }
        };

        return (
            <TouchableOpacity activeOpacity={0.8} onPress={onPress} onLongPress={onLongPress}>
                <View style={[styles.row, isSelected && styles.rowSelected]}>
                    <View style={styles.rowLeft}>
                        {selectionMode && (
                            <View style={styles.checkboxWrap}>
                                <Ionicons name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={isSelected ? COLORS.primary : '#9CA3AF'} />
                            </View>
                        )}
                        <View style={styles.icon}>
                            <Ionicons name="arrow-down" size={20} color="#EF4444" />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.rowTitle} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.rowSub} numberOfLines={1}>{new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                        </View>
                    </View>
                    <View style={styles.rowRight}>
                        <Text style={styles.rowAmount}>-{formatRupiah(item.amount)}</Text>
                        <Text style={styles.rowCategory} numberOfLines={1}>{item.category}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // Configure header based on selection mode
    useEffect(() => {
        navigation.setOptions({
            title: selectionMode ? `${selectedIds.size} selected` : 'All Expenses',
            headerTitleStyle: { fontSize: 16 },
            headerLeft: selectionMode ? () => (
                <TouchableOpacity style={{ paddingHorizontal: 8 }} onPress={clearSelection}>
                    <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
            ) : undefined,
            headerRight: () => (
                selectionMode ? (
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
                ) : null
            ),
        });
    }, [navigation, selectionMode, selectedIds.size, items.length]);

    return (
        <SafeAreaView edges={['bottom']} style={styles.container}>
            {/* Header controlled via navigation options below */}
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
                            <Text style={{ color: '#6B7280' }}>No expenses this month.</Text>
                        </View>
                    ) : null}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E7EB',
    },
    rowSelected: {
        backgroundColor: '#EEF2FF',
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    rowRight: { alignItems: 'flex-end', marginLeft: 12, minWidth: 90 },
    icon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: '#FEE2E2' },
    checkboxWrap: { marginRight: 8 },
    rowTitle: { fontSize: 14, fontWeight: '500', color: '#111827' },
    rowSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    rowAmount: { fontSize: 14, fontWeight: '600', color: '#EF4444' },
    rowCategory: { fontSize: 12, color: '#1F2937', marginTop: 2 },
    // Removed inline edit modal styles
});
