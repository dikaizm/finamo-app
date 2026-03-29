import React, { useState, useEffect } from 'react';
import { X, Camera } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Dimensions,
  Alert,
  ActionSheetIOS,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { pickAndExtract } from '../services/ocrService';

export type TransactionType = 'income' | 'expense' | 'savings';

const { width } = Dimensions.get('window');

interface CategoryItem {
  name: string;
  icon: string;
  color: string;
}

const EXPENSE_CATEGORIES: CategoryItem[] = [
  { name: 'Food', icon: 'restaurant', color: '#EF4444' },
  { name: 'Shopping', icon: 'cart', color: '#F97316' },
  { name: 'Transport', icon: 'car', color: '#3B82F6' },
  { name: 'Bills', icon: 'document-text', color: '#8B5CF6' },
  { name: 'Health', icon: 'medical', color: '#EC4899' },
  { name: 'Education', icon: 'book', color: '#14B8A6' },
];

const INCOME_CATEGORIES: CategoryItem[] = [
  { name: 'Salary', icon: 'cash', color: '#10B981' },
  { name: 'Business', icon: 'briefcase', color: '#3B82F6' },
  { name: 'Freelance', icon: 'laptop', color: '#8B5CF6' },
  { name: 'Investment', icon: 'trending-up', color: '#F59E0B' },
  { name: 'Gift', icon: 'gift', color: '#EC4899' },
];

const SAVINGS_CATEGORIES: CategoryItem[] = [
  { name: 'Emergency Fund', icon: 'shield-checkmark', color: '#5B5FFF' },
  { name: 'Stocks', icon: 'pie-chart', color: '#10B981' },
  { name: 'Crypto', icon: 'bitcoin', color: '#F7931A' },
  { name: 'Gold', icon: 'diamond', color: '#FBBF24' },
  { name: 'Property', icon: 'business', color: '#7C3AED' },
];

interface ManualTransactionScreenProps {
  navigation: any;
  route: any;
}

export default function ManualTransactionScreen({ navigation, route }: ManualTransactionScreenProps) {
  const insets = useSafeAreaInsets();
  const initialType: TransactionType = route.params?.type || 'expense';
  
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [transactionType, setTransactionType] = useState<TransactionType>(initialType);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedDate] = useState<Date>(new Date()); // Always use current date for now
  const [isOCRLoading, setIsOCRLoading] = useState(false);

  // Hide tab bar
  useEffect(() => {
    navigation.setOptions({ tabBarStyle: { display: 'none' }, tabBarHidden: true });
    return () => {
      navigation.setOptions({ tabBarStyle: undefined, tabBarHidden: false });
    };
  }, []);

  const categories = transactionType === 'expense' 
    ? EXPENSE_CATEGORIES 
    : transactionType === 'income' 
      ? INCOME_CATEGORIES 
      : SAVINGS_CATEGORIES;

  useEffect(() => {
    setSelectedCategory(categories[0]);
  }, [transactionType]);

  const handleOCR = (source: 'camera' | 'gallery') => {
    setIsOCRLoading(true);
    pickAndExtract(source)
      .then((result) => {
        if (!result) return;
        if (result.amount) setAmount(String(Math.round(result.amount)));
        if (result.description) setDescription(result.description);
        if (result.category) {
          const match = categories.find(
            (c) => c.name.toLowerCase() === result.category!.toLowerCase()
          );
          if (match) setSelectedCategory(match);
        }
      })
      .catch((err) => Alert.alert('OCR Error', err.message))
      .finally(() => setIsOCRLoading(false));
  };

  const showOCROptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Choose from Gallery'], cancelButtonIndex: 0 },
        (index) => {
          if (index === 1) handleOCR('camera');
          if (index === 2) handleOCR('gallery');
        }
      );
    } else {
      Alert.alert('Scan Receipt', 'Choose image source', [
        { text: 'Camera', onPress: () => handleOCR('camera') },
        { text: 'Gallery', onPress: () => handleOCR('gallery') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleNumberPress = (num: string) => {
    if (num === 'DEL') {
      setAmount(prev => prev.slice(0, -1));
    } else if (num === '000') {
      setAmount(prev => prev + '000');
    } else {
      setAmount(prev => prev + num);
    }
  };

  const handleSubmit = () => {
    const numAmount = parseFloat(amount || '0');
    if (!numAmount || numAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    console.log('Submitting transaction:', {
      type: transactionType,
      category: selectedCategory?.name,
      amount: numAmount,
      description,
    });

    // Store transaction data temporarily
    (global as any).pendingTransaction = {
      type: transactionType === 'savings' ? 'expense' : transactionType,
      category: selectedCategory?.name || 'Others',
      amount: numAmount,
      description: description.trim() || `${transactionType === 'income' ? 'Income' : transactionType === 'savings' ? 'Savings' : 'Expense'} - ${selectedCategory?.name}`,
      date: selectedDate.toISOString(),
      isSavings: transactionType === 'savings',
    };
    
    navigation.goBack();
  };

  const getTypeConfig = () => {
    switch(transactionType) {
      case 'income':
        return { color: '#10B981', gradient: ['#D1FAE5', '#A7F3D0'] };
      case 'expense':
        return { color: '#EF4444', gradient: ['#FEE2E2', '#FCA5A5'] };
      case 'savings':
        return { color: '#5B5FFF', gradient: ['#E0E7FF', '#C7D2FE'] };
    }
  };

  const typeConfig = getTypeConfig();

  const formatAmount = () => {
    if (!amount) return '0';
    const num = parseFloat(amount);
    return num.toLocaleString('id-ID');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <X size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {transactionType === 'savings' ? 'Add Savings' :
           transactionType === 'income' ? 'Add Income' : 'Add Expense'}
        </Text>
        <TouchableOpacity onPress={showOCROptions} disabled={isOCRLoading}>
          {isOCRLoading
            ? <ActivityIndicator size="small" color={typeConfig.color} />
            : <Camera size={26} color={typeConfig.color} strokeWidth={2} />
          }
        </TouchableOpacity>
      </View>

      {/* Date Display - Read Only (Today's Date) */}
      <View style={styles.dateDisplay}>
        <CalendarDays size={20} color="#6B7280" />
        <Text style={styles.dateDisplayText}>{formatDate(selectedDate)}</Text>
      </View>

      <ScrollView 
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 200 }}
      >
        {/* Amount Card - Compact Single Line */}
        <View style={[styles.amountCard, { backgroundColor: typeConfig.gradient[0] }]}>
          <View style={styles.amountRow}>
            <Text style={[styles.rpSymbol, { color: typeConfig.color }]}>Rp</Text>
            <Text style={[styles.amountText, { color: typeConfig.color }]}>
              {formatAmount() || '0'}
            </Text>
          </View>
          
          {/* Description Inline */}
          <TouchableOpacity 
            style={styles.descriptionInline}
            onPress={() => setShowDescriptionModal(true)}
          >
            <Text style={description ? styles.descriptionValue : styles.descriptionPlaceholder}>
              {description || 'Add details (optional)'}
            </Text>
            <Pencil size={16} color={typeConfig.color} />
          </TouchableOpacity>
        </View>

        {/* Category Section */}
        <View style={styles.categorySection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.name}
                style={[
                  styles.categoryItem,
                  selectedCategory?.name === cat.name && { 
                    backgroundColor: `${cat.color}15`,
                    borderColor: cat.color,
                  }
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <CreditCard 
                  size={28} 
                  color={selectedCategory?.name === cat.name ? cat.color : '#9CA3AF'}
                  strokeWidth={2}
                />
                <Text style={[
                  styles.categoryName,
                  selectedCategory?.name === cat.name && { color: cat.color }
                ]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
            
            {/* More Button */}
            <TouchableOpacity style={styles.moreButton}>
              <Apps size={28} color="#9CA3AF" />
              <Text style={styles.moreText}>More</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Numpad - Fixed at Bottom */}
      <View style={styles.keypadContainer}>
        <View style={styles.keypadSection}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['0', '000', '⌫']
          ].map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.map((key) => (
                <TouchableOpacity
                  key={key}
                  style={styles.keypadKey}
                  onPress={() => handleNumberPress(key === '⌫' ? 'DEL' : key)}
                >
                  <Text style={styles.keypadKeyText}>{key}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { 
              backgroundColor: amount ? typeConfig.color : '#D1D5DB',
              marginBottom: insets.bottom
            }
          ]}
          onPress={handleSubmit}
          disabled={!amount}
        >
          <Text style={styles.submitButtonText}>
            {transactionType === 'savings' ? 'Add Savings' : 
             transactionType === 'income' ? 'Add Income' : 'Add Expense'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Description Modal */}
      <Modal
        visible={showDescriptionModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDescriptionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Details</Text>
              <TouchableOpacity onPress={() => setShowDescriptionModal(false)}>
                <X size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., Lunch at restaurant, Business meeting"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              autoFocus
              placeholderTextColor="#9CA3AF"
            />

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: typeConfig.color }]}
              onPress={() => setShowDescriptionModal(false)}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  
  // Date Display
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  dateDisplayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  
  // Amount Card - Compact Single Line
  amountCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  rpSymbol: {
    fontSize: 28,
    fontWeight: '700',
    marginRight: 8,
  },
  amountText: {
    fontSize: 36,
    fontWeight: '800',
    flex: 1,
  },
  descriptionInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    width: '100%',
    gap: 8,
  },
  descriptionPlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
    flex: 1,
  },
  descriptionValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  
  // Divider
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  
  // Category Section
  categorySection: {
    marginBottom: 8,
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    paddingRight: 10,
    paddingBottom: 8,
  },
  categoryItem: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 90,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  moreButton: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    width: 90,
  },
  moreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 8,
  },
  
  // Numpad Container
  keypadContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
  },
  keypadSection: {
    paddingHorizontal: 20,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  keypadKey: {
    width: (width - 56) / 3,
    height: 60,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadKeyText: {
    fontSize: 26,
    fontWeight: '600',
    color: '#1F2937',
  },
  
  // Submit Button
  submitButton: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // Description Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalInput: {
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  modalButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
