import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinance } from '../context/FinanceContext';

export default function SavingScreen() {
  const { financialData, addTransaction } = useFinance();
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');

  const savingsGoals = [
    { name: 'Emergency Fund', target: 10000, current: 5000, color: '#5B5FFF' },
    { name: 'Vacation', target: 3000, current: 1200, color: '#10B981' },
    { name: 'New Car', target: 20000, current: 8000, color: '#F59E0B' },
  ];

  const getProgress = (current: number, target: number) => {
    return ((current / target) * 100).toFixed(0);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Savings</Text>
          <TouchableOpacity onPress={() => setShowAddGoal(true)}>
            <Ionicons name="add-circle" size={28} color="#5B5FFF" />
          </TouchableOpacity>
        </View>

        {/* Total Savings Card */}
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.totalCard}
        >
          <Text style={styles.totalLabel}>Total Savings</Text>
          <Text style={styles.totalAmount}>
            ${financialData.monthlySaving.toLocaleString()}
          </Text>
          <Text style={styles.totalSubtext}>This month</Text>
        </LinearGradient>

        {/* Savings Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Savings Goals</Text>
          {savingsGoals.map((goal, index) => (
            <TouchableOpacity key={index} style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <View style={styles.goalLeft}>
                  <View style={[styles.goalIcon, { backgroundColor: goal.color + '20' }]}>
                    <Ionicons name="wallet" size={24} color={goal.color} />
                  </View>
                  <View>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={styles.goalProgress}>
                      ${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.goalPercentage}>
                  {getProgress(goal.current, goal.target)}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${getProgress(goal.current, goal.target)}%`,
                      backgroundColor: goal.color 
                    }
                  ]} 
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="trending-up" size={24} color="#5B5FFF" />
              </View>
              <Text style={styles.actionText}>Set Goal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="add" size={24} color="#10B981" />
              </View>
              <Text style={styles.actionText}>Add Savings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="analytics" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.actionText}>View Report</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Savings Tips</Text>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={24} color="#F59E0B" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Automate your savings</Text>
              <Text style={styles.tipDescription}>
                Set up automatic transfers to your savings account each month
              </Text>
            </View>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={24} color="#F59E0B" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Track your progress</Text>
              <Text style={styles.tipDescription}>
                Review your savings goals regularly and adjust as needed
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal
        visible={showAddGoal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddGoal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Savings Goal</Text>
              <TouchableOpacity onPress={() => setShowAddGoal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Goal name"
              value={goalName}
              onChangeText={setGoalName}
            />
            <TextInput
              style={styles.input}
              placeholder="Target amount"
              value={goalAmount}
              onChangeText={setGoalAmount}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.submitButton}>
              <Text style={styles.submitButtonText}>Create Goal</Text>
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalCard: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 24,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  totalSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  goalCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  goalProgress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  goalPercentage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '500',
    textAlign: 'center',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  input: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#5B5FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
