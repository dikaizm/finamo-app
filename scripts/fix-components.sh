#!/bin/bash
cd /Users/dikaizm/Documents/PROGRAMMING/mobile-dev/finamo/finamo-app/src

echo "Fixing components..."

# BudgetCard.tsx
sed -i '' 's/<Ionicons name="warning" size={\([^}]*\)} color="\([^"]*\)"/<AlertTriangle size={\1} color="\2" strokeWidth={2}/g' components/BudgetCard.tsx
sed -i '' 's/<Ionicons name="checkmark-circle" size={\([^}]*\)} color="\([^"]*\)"/<CheckCircle size={\1} color="\2" strokeWidth={2}/g' components/BudgetCard.tsx
# Add missing imports
sed -i '' '/from .lucide-react-native./s/$/, AlertTriangle, CheckCircle/' components/BudgetCard.tsx 2>/dev/null || \
sed -i '' '/import {/a\import { AlertTriangle, CheckCircle } from '\''lucide-react-native'\'';\' components/BudgetCard.tsx

# ChatMode.tsx  
sed -i '' 's/<Ionicons name="close" size={\([^}]*\)} color="\([^"]*\)"/<X size={\1} color="\2" strokeWidth={2}/g' components/ChatMode.tsx
# Multi-line ones need manual fix - skip for now

# LoggedOutModal.tsx
sed -i '' 's/<Ionicons name="alert-circle" size={\([^}]*\)} color="\([^"]*\)"/<AlertCircle size={\1} color="\2" strokeWidth={2}/g' components/LoggedOutModal.tsx

# LogoutModal.tsx
sed -i '' 's/<Ionicons name="log-out-outline" size={\([^}]*\)} color="\([^"]*\)"/<LogOut size={\1} color="\2" strokeWidth={2}/g' components/LogoutModal.tsx

# ManualTransactionModal.tsx
sed -i '' 's/<Ionicons name="close-circle" size={\([^}]*\)} color="\([^"]*\)"/<XCircle size={\1} color="\2" strokeWidth={2}/g' components/ManualTransactionModal.tsx

# StatsGrid.tsx
sed -i '' 's/<Ionicons name="trending-up" size={\([^}]*\)} color="\([^"]*\)"/<TrendingUp size={\1} color="\2" strokeWidth={2}/g' components/StatsGrid.tsx
sed -i '' 's/<Ionicons name="trending-down" size={\([^}]*\)} color="\([^"]*\)"/<TrendingDown size={\1} color="\2" strokeWidth={2}/g' components/StatsGrid.tsx

# TransactionTypeSelector.tsx
sed -i '' 's/<Ionicons name="close-circle" size={\([^}]*\)} color="\([^"]*\)"/<XCircle size={\1} color="\2" strokeWidth={2}/g' components/TransactionTypeSelector.tsx
sed -i '' 's/<Ionicons name="chevron-forward" size={\([^}]*\)} color="\([^"]*\)"/<ChevronRight size={\1} color="\2" strokeWidth={2}/g' components/TransactionTypeSelector.tsx

echo "✓ Components fixed (simple cases)"
