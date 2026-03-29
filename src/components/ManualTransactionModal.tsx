import React, { useState } from 'react';
import { XCircle } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';

export type TransactionType = 'income' | 'expense';

interface ManualTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (amount: number, category: string, description: string) => Promise<void>;
  type?: TransactionType;
  isSavings?: boolean;
}

export default function ManualTransactionModal({
  visible,
  onClose,
  onSubmit,
  type = 'expense',
  isSavings = false
}: ManualTransactionModalProps) {
  const [amount, setAmount] = useState<string>('0');
  const [selectedCategory, setSelectedCategory] = useState<string>(isSavings ? 'Emergency Fund' : 'Food');
  const [description, setDescription] = useState<string>('');

  // Update default category when isSavings changes
  React.useEffect(() => {
    setSelectedCategory(isSavings ? 'Emergency Fund' : 'Food');
  }, [isSavings]);

  const handleNumberPress = (num: string) => {
    if (num === 'DEL') {
      setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else if (num === '00' && amount === '0') {
      return;
    } else {
      setAmount(prev => prev === '0' ? num : prev + num);
    }
  };

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;
    
    await onSubmit(numAmount, selectedCategory, description.trim() || `${type === 'income' ? 'Income' : 'Expense'} - ${selectedCategory}`);
    setAmount('0');
    setDescription('');
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {isSavings ? 'Add Savings/Investment' : type === 'income' ? 'Add Income' : 'Add Expense'}
              </Text>
              <TouchableOpacity onPress={onClose}><XCircle size={28} color="#6B7280" strokeWidth={2} /></TouchableOpacity>
            </View>

            {/* Amount Display */}
            <View style={styles.amountDisplay}>
              <Text style={styles.currencySymbol}>Rp</Text>
              <Text style={styles.amountText}>{amount}</Text>
            </View>

            {/* Description Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder={isSavings ? "e.g., Emergency fund, Stock investment" : "e.g., Lunch at restaurant, Salary March"}
                value={description}
                onChangeText={setDescription}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Categories */}
            <View style={styles.categorySection}>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {(isSavings 
                  ? ['Emergency Fund', 'Stocks', 'Crypto', 'Gold', 'Mutual Funds', 'Property', 'Retirement', 'Others']
                  : ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Salary', 'Business', 'Others']
                ).map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.category, selectedCategory === cat && styles.categorySelected]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextSelected]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Keypad */}
            <View style={styles.keypad}>
              {[['1','2','3'],['4','5','6'],['7','8','9'],['.','0','DEL']].map((row, i) => (
                <View key={i} style={styles.keypadRow}>
                  {row.map(key => (
                    <TouchableOpacity key={key} style={styles.key} onPress={() => handleNumberPress(key)}>
                      <Text style={styles.keyText}>{key === 'DEL' ? '⌫' : key}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>

            {/* Submit */}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>
                {isSavings ? 'Add Savings/Investment' : type === 'income' ? 'Add Income' : 'Add Expense'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  scrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  container: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  
  amountDisplay: { 
    flexDirection: 'row', 
    alignItems: 'baseline', 
    justifyContent: 'center', 
    paddingVertical: 24, 
    marginHorizontal: 24, 
    backgroundColor: '#F9FAFB', 
    borderRadius: 16 
  },
  currencySymbol: { fontSize: 28, fontWeight: '600', color: '#5B5FFF', marginRight: 8 },
  amountText: { fontSize: 42, fontWeight: '700', color: '#1F2937' },
  
  inputSection: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
  descriptionInput: { 
    fontSize: 16, 
    color: '#1F2937', 
    backgroundColor: '#F3F4F6', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  
  categorySection: { paddingHorizontal: 24, paddingVertical: 12 },
  categoriesScroll: { paddingRight: 16 },
  category: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#F3F4F6', borderRadius: 20, marginRight: 12 },
  categorySelected: { backgroundColor: '#5B5FFF' },
  categoryText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  categoryTextSelected: { color: '#fff' },
  
  keypad: { paddingHorizontal: 24, paddingTop: 8 },
  keypadRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  key: { flex: 1, aspectRatio: 1.6, backgroundColor: '#F9FAFB', borderRadius: 16, marginHorizontal: 4, justifyContent: 'center', alignItems: 'center' },
  keyText: { fontSize: 28, fontWeight: '600', color: '#1F2937' },
  
  submitButton: { backgroundColor: '#5B5FFF', marginHorizontal: 24, marginTop: 24, borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
