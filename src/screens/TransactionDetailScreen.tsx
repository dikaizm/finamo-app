import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API, TransactionOut, TransactionUpdate } from '../services/api';
import { formatRupiah } from '../utils/format';
import { useNavigation, useRoute } from '@react-navigation/native';

type RouteParams = { transaction: TransactionOut };

export default function TransactionDetailScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const tx = route.params?.transaction as TransactionOut;

    const [name, setName] = useState(tx?.name || '');
    const [amount, setAmount] = useState<number>(tx?.amount || 0);
    const [category, setCategory] = useState(tx?.category || '');
    const [date, setDate] = useState((tx?.date || '').slice(0, 10));
    const [saving, setSaving] = useState(false);

    const dirty = useMemo(() => (
        name !== (tx?.name || '') ||
        amount !== (tx?.amount || 0) ||
        category !== (tx?.category || '') ||
        date !== (tx?.date || '').slice(0, 10)
    ), [name, amount, category, date, tx]);

    useEffect(() => {
        navigation.setOptions({
            title: 'Transaction Detail',
            headerTitleStyle: { fontSize: 16 },
            headerRight: () => dirty ? (
                <TouchableOpacity disabled={saving} onPress={async () => {
                    try {
                        setSaving(true);
                        const payload: TransactionUpdate = { name, amount, category, date };
                        await API.updateTransaction(tx.id, payload);
                        navigation.goBack();
                    } catch (e: any) {
                        Alert.alert('Save failed', e?.message || 'Could not save changes');
                    } finally {
                        setSaving(false);
                    }
                }}>
                    <Text style={{ color: '#5B5FFF', fontWeight: '600', paddingHorizontal: 8 }}>{saving ? 'Saving…' : 'Save'}</Text>
                </TouchableOpacity>
            ) : null,
        });
    }, [navigation, dirty, name, amount, category, date, saving, tx?.id]);

    if (!tx) return null;

    return (
        <SafeAreaView edges={['bottom']} style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <View style={styles.card}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput style={styles.input} value={name} onChangeText={setName} />

                    <Text style={styles.label}>Amount</Text>
                    <TextInput
                        style={styles.input}
                        value={String(amount)}
                        onChangeText={t => setAmount(Number(t.replace(/[^0-9.]/g, '')) || 0)}
                        keyboardType="numeric"
                    />
                    <Text style={styles.hint}>{formatRupiah(amount)}</Text>

                    <Text style={styles.label}>Category</Text>
                    <TextInput style={styles.input} value={category} onChangeText={setCategory} />

                    <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
                    <TextInput style={styles.input} value={date} onChangeText={setDate} />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    card: { backgroundColor: 'white', margin: 16, padding: 16, borderRadius: 12 },
    label: { fontSize: 12, color: '#6B7280', marginTop: 8 },
    input: { height: 40, borderWidth: StyleSheet.hairlineWidth, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, backgroundColor: '#F9FAFB', marginTop: 4 },
    hint: { fontSize: 12, color: '#6B7280', marginTop: 4 },
});
