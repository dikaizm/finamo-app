import React from 'react';
import { XCircle, ChevronRight } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';

interface Option {
  type: 'income' | 'expense' | 'savings';
  label: string;
  icon: string;
  color: string;
  description: string;
}

const OPTIONS: Option[] = [
  { 
    type: 'expense', 
    label: 'Expense', 
    icon: 'arrow-down-circle', 
    color: '#EF4444',
    description: 'Money spent on purchases'
  },
  { 
    type: 'income', 
    label: 'Income', 
    icon: 'arrow-up-circle', 
    color: '#10B981',
    description: 'Money received'
  },
  { 
    type: 'savings', 
    label: 'Savings/Investment', 
    icon: 'wallet', 
    color: '#5B5FFF',
    description: 'Money saved or invested'
  },
];

interface TransactionTypeSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: 'income' | 'expense' | 'savings') => void;
}

export default function TransactionTypeSelector({
  visible,
  onClose,
  onSelect,
}: TransactionTypeSelectorProps) {
  const handleSelect = (type: 'income' | 'expense' | 'savings') => {
    onSelect(type);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add Transaction</Text>
            <TouchableOpacity onPress={onClose}>
              <XCircle size={28} color="#6B7280" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>What would you like to record?</Text>

          {/* Options */}
          {OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.type}
              style={[styles.option, { borderLeftColor: option.color }]}
              onPress={() => handleSelect(option.type)}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${option.color}20` }]}>
                {option.type === 'expense' ? (
                  <ArrowDown size={28} color={option.color} strokeWidth={2} />
                ) : option.type === 'income' ? (
                  <ArrowUp size={28} color={option.color} strokeWidth={2} />
                ) : (
                  <Wallet size={28} color={option.color} strokeWidth={2} />
                )}
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <ChevronRight size={24} color="#9CA3AF" strokeWidth={2} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
});
