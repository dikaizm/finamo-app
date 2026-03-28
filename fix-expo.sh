#!/bin/bash

# Finamo App - Fix Expo Issues

echo "🔧 Perbaiki Masalah Expo..."

# 1. Bersihkan cache Expo
echo "📁 Menghapus cache Expo..."
rm -rf .expo node_modules/.cache
echo "✅ Cache dibersihkan"

# 2. Bersihkan cache Node
echo "📁 Menghapus cache Node..."
rm -rf node_modules/.cache
echo "✅ Cache Node dibersihkan"

# 3. Install ulang node_modules
echo "📁 Install ulang dependencies..."
npm install --force
echo "✅ Dependencies di-install"

# 4. Start Expo
echo "🚀 Mulai Expo..."
npx expo start --clear --port 19000
