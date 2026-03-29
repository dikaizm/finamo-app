#!/bin/bash
cd /Users/dikaizm/Documents/PROGRAMMING/mobile-dev/finamo/finamo-app/src/screens

echo "Processing remaining screens..."

# BudgetScreen.tsx
sed -i '' 's/<Ionicons name="trending-up" size={\([^}]*\)} color="\([^"]*\)"/<TrendingUp size={\1} color="\2" strokeWidth={2}/g' BudgetScreen.tsx
sed -i '' 's/<Ionicons name="calculator" size={\([^}]*\)} color="\([^"]*\)"/<Calculator size={\1} color="\2" strokeWidth={2}/g' BudgetScreen.tsx
sed -i '' 's/<Ionicons name="add" size={\([^}]*\)} color="\([^"]*\)"/<Plus size={\1} color="\2" strokeWidth={2}/g' BudgetScreen.tsx

# ExpensesScreen.tsx  
sed -i '' 's/<Ionicons name="filter" size={\([^}]*\)} color="\([^"]*\)"/<Filter size={\1} color="\2" strokeWidth={2}/g' ExpensesScreen.tsx
sed -i '' 's/<Ionicons name="search" size={\([^}]*\)} color="\([^"]*\)"/<Search size={\1} color="\2" strokeWidth={2}/g' ExpensesScreen.tsx

# SavingScreen.tsx
sed -i '' 's/<Ionicons name="bulb" size={\([^}]*\)} color="\([^"]*\)"/<Lightbulb size={\1} color="\2" strokeWidth={2}/g' SavingScreen.tsx
sed -i '' 's/<Ionicons name="add" size={\([^}]*\)} color="\([^"]*\)"/<Plus size={\1} color="\2" strokeWidth={2}/g' SavingScreen.tsx
sed -i '' 's/<Ionicons name="close" size={\([^}]*\)} color="\([^"]*\)"/<X size={\1} color="\2" strokeWidth={2}/g' SavingScreen.tsx

# SpendingScreen.tsx
sed -i '' 's/<Ionicons name="pie-chart" size={\([^}]*\)} color="\([^"]*\)"/<PieChart size={\1} color="\2" strokeWidth={2}/g' SpendingScreen.tsx

# WalletScreen.tsx
sed -i '' 's/<Ionicons name="swap-horizontal" size={\([^}]*\)} color="\([^"]*\)"/<ArrowLeftRight size={\1} color="\2" strokeWidth={2}/g' WalletScreen.tsx
sed -i '' 's/<Ionicons name="add" size={\([^}]*\)} color="\([^"]*\)"/<Plus size={\1} color="\2" strokeWidth={2}/g' WalletScreen.tsx
sed -i '' 's/<Ionicons name="card" size={\([^}]*\)} color="\([^"]*\)"/<CreditCard size={\1} color="\2" strokeWidth={2}/g' WalletScreen.tsx
sed -i '' 's/<Ionicons name="eye" size={\([^}]*\)} color="\([^"]*\)"/<Eye size={\1} color="\2" strokeWidth={2}/g' WalletScreen.tsx
sed -i '' 's/<Ionicons name="trash" size={\([^}]*\)} color="\([^"]*\)"/<Trash2 size={\1} color="\2" strokeWidth={2}/g' WalletScreen.tsx
sed -i '' 's/<Ionicons name="create" size={\([^}]*\)} color="\([^"]*\)"/<Edit2 size={\1} color="\2" strokeWidth={2}/g' WalletScreen.tsx

echo "✓ Batch replacement done"
