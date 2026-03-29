import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Trash2 } from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatRupiahWithSymbol } from '../utils/format';
import { COLORS } from '../constants/theme';
import { getBudgetById, BudgetWithActuals } from '../services/budgetService';

interface BudgetDetailScreenProps {
  route: any;
  navigation: any;
}

export default function BudgetDetailScreen({ route, navigation }: BudgetDetailScreenProps) {
  const [budget, setBudget] = useState<BudgetWithActuals | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const budgetId = route.params?.budgetId;

  useEffect(() => {
    if (budgetId) {
      loadBudget();
    }
  }, [budgetId]);

  const loadBudget = async () => {
    try {
      setIsLoading(true);
      const data = await getBudgetById(budgetId);
      setBudget(data);
    } catch (error) {
      console.error('[BudgetDetailScreen] Failed to load budget:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <View 24 #1F2937 />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Budget Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading budget...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!budget) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <View 24 #1F2937 />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Budget Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.emptyState}>
            <File size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Budget Found</Text>
            <Text style={styles.emptyMessage}>This budget may have been deleted or archived.</Text>
            <TouchableOpacity style={styles.backButtonLarge} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <View 24 #1F2937 />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Budget Details</Text>
        <TouchableOpacity 
          onPress={() => {/* TODO: Edit budget */}}
          disabled={!budgetId}
        >
          {budgetId ? (
            <Pencil size={24} color="#6B7280" strokeWidth={2} />
          ) : (
            <MoreHorizontal size={24} color="#D1D5DB" strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* Budget Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>{budget.title}</Text>
          <Text style={styles.monthLabel}>{budget.month}</Text>
          
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{budget.status.toUpperCase()}</Text>
          </View>
          
          <View style={styles.amountSection}>
            <Text style={styles.label}>Total Expense Target</Text>
            <Text style={styles.amount}>{formatRupiahWithSymbol(budget.total_expense_target)}</Text>
          </View>
          
          {budget.savings_target && (
            <View style={styles.amountSection}>
              <Text style={styles.label}>Savings Target</Text>
              <Text style={[styles.amount, { color: COLORS.success }]}>
                {formatRupiahWithSymbol(budget.savings_target)}
              </Text>
            </View>
          )}
          
          {budget.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionLabel}>Description</Text>
              <Text style={styles.description}>{budget.description}</Text>
            </View>
          )}
          
          {/* Metadata */}
          <View style={styles.metadata}>
            <View style={styles.metaItem}>
              <View 16 #6B7280 />
              <Text style={styles.metaText}>Created: {new Date(budget.created_at).toLocaleDateString('id-ID')}</Text>
            </View>
            
            {budget.created_by === 'ai_agent' && (
              <View style={styles.metaItem}>
                <Sparkles size={16} color="#6B7280" />
                <Text style={styles.metaText}>AI Generated</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Categories Section */}
        {budget.categories && budget.categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            {budget.categories.map((category, index) => (
              <View key={index} style={styles.categoryItem}>
                <View style={styles.categoryRow}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryAmount}>
                    {formatRupiahWithSymbol(category.planned_amount)}
                  </Text>
                </View>
                {category.notes && (
                  <Text style={styles.categoryNotes}>{category.notes}</Text>
                )}
              </View>
            ))}
          </View>
        )}
        
        {/* Notes Section */}
        {budget.notes && budget.notes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Recommendations</Text>
            {budget.notes.map((note, index) => (
              <View key={index} style={[
                styles.noteItem,
                note.note_type === 'warning' && styles.warningNote,
                note.note_type === 'recommendation' && styles.recommendationNote,
              ]}>
                <View style={styles.noteHeader}>
                  <Ionicons 
                    name={
                      note.note_type === 'warning' ? 'warning-outline' :
                      note.note_type === 'recommendation' ? 'lightbulb-outline' :
                      'document-text-outline'
                    } 
                    size={18} 
                    color={
                      note.note_type === 'warning' ? COLORS.warning :
                      note.note_type === 'recommendation' ? '#F59E0B' :
                      '#6B7280'
                    } 
                  />
                  <Text style={[
                    styles.noteType,
                    note.note_type === 'warning' && styles.warningText,
                    note.note_type === 'recommendation' && styles.recommendationText,
                  ]}>
                    {note.note_type.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.noteContent}>{note.content}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Action Buttons */}
        {budget.status === 'draft' && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButtonPrimary}>
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Activate Budget</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButtonSecondary}>
              <Trash2 size={20} color={COLORS.danger} strokeWidth={2} />
              <Text style={[styles.actionButtonText, { color: COLORS.danger }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  backButtonLarge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  content: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  monthLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  amountSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  amount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
  },
  descriptionSection: {
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  metadata: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  categoryItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  categoryNotes: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  noteItem: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  warningNote: {
    backgroundColor: '#FEF2F2',
  },
  recommendationNote: {
    backgroundColor: '#FFFBEB',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  noteType: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  warningText: {
    color: COLORS.danger,
  },
  recommendationText: {
    color: '#F59E0B',
  },
  noteContent: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonSecondary: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
