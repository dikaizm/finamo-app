# Finamo - Commands & Usage Guide

## 🎯 Quick Commands Reference

### Development Commands

```bash
# Start development server
npm start

# Start with cache cleared
npm start -- --clear

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web browser
npm run web

# Install dependencies
npm install

# Update dependencies
npm update

# Check for issues
npx expo-doctor
```

## 💬 AI Natural Language Commands

### Expense Tracking

```
coffee $5
spent $50 on food
paid $100 for shopping
bought groceries $85
expense $30 transport
```

**Result**: Creates an expense transaction with:
- Amount extracted from text
- Category auto-detected
- Added to spending analysis

### Income Recording

```
earned $2000
received $500 income
salary $3000
got paid $1500
```

**Result**: Records income and updates:
- Monthly income total
- Balance calculation
- Income stats

### Reminders

```
remind me to pay credit card tomorrow
reminder to pay bills next week
remind me to check budget
set reminder for rent payment
```

**Result**: Creates reminder with:
- Parsed date/time
- Task description
- Notification scheduled

### Budget Planning

```
plan my budget for next month
create budget for this week
budget plan for the year
set budget goals
```

**Result**: Initiates budget creation:
- Time period identified
- Budget wizard started
- Goal setting prompted

### Savings Goals

```
save $1000 for vacation
add $500 to savings
saving goal: emergency fund $5000
put aside $200
```

**Result**: Creates/updates savings:
- Goal amount set
- Progress tracked
- Visual update

## 🎨 UI Interactions

### Home Screen

| Action | Result |
|--------|--------|
| Tap Balance Card | View details |
| Tap AI Advice | Get recommendations |
| Type in input bar | Process AI command |
| Tap category | View category details |
| Pull to refresh | Update data |

### Spending Screen

| Action | Result |
|--------|--------|
| Tap category card | View transactions |
| Tap transaction | View/edit details |
| Tap "See All" | View all transactions |
| Tap calendar icon | Change period |

### Saving Screen

| Action | Result |
|--------|--------|
| Tap + icon | Create new goal |
| Tap goal card | Edit goal |
| Tap action button | Quick action |
| Swipe goal | Delete option |

### Account Screen

| Action | Result |
|--------|--------|
| Tap profile | Edit profile |
| Toggle switch | Update setting |
| Tap menu item | Navigate to setting |
| Tap Sign Out | Log out |

## 🔧 Developer Actions

### Adding a Transaction

```typescript
import { useFinance } from '../context/FinanceContext';

const { addTransaction } = useFinance();

addTransaction({
  type: 'expense',
  category: 'Food',
  amount: 50,
  description: 'Lunch at restaurant',
  date: new Date(),
});
```

### Getting Financial Data

```typescript
const { financialData } = useFinance();

console.log(financialData.totalBalance);
console.log(financialData.monthlyExpense);
console.log(financialData.transactions);
```

### Using AI Service

```typescript
import AIService from '../services/AIService';

const command = await AIService.parseNaturalLanguage('coffee $5');
console.log(command.type);      // 'expense'
console.log(command.data.amount); // 5
console.log(command.data.category); // 'Others'
```

### Customizing Colors

```typescript
// src/constants/theme.ts
export const COLORS = {
  primary: '#YOUR_COLOR',
  // ... more colors
};

// Use in components
import { COLORS } from '../constants/theme';

<View style={{ backgroundColor: COLORS.primary }} />
```

## 📱 Testing Commands

### Test on Physical Device

```bash
# iOS (requires Expo Go app)
1. npm start
2. Open Expo Go on iPhone
3. Scan QR code

# Android (requires Expo Go app)
1. npm start
2. Open Expo Go on Android
3. Scan QR code
```

### Test on Simulator

```bash
# iOS Simulator (Mac only)
npm run ios

# Android Emulator
npm run android
```

## 🐛 Debug Commands

### View Logs

```bash
# All logs
npm start

# iOS logs only
npx react-native log-ios

# Android logs only
npx react-native log-android
```

### Clear Cache

```bash
# Expo cache
expo start -c

# Metro bundler cache
npx react-native start --reset-cache

# All caches
rm -rf node_modules .expo
npm install
npm start
```

### Fix Common Issues

```bash
# Port already in use
kill -9 $(lsof -ti:19000)

# Watchman issues (Mac)
watchman watch-del-all

# Clear all and restart
rm -rf node_modules package-lock.json
npm install
npm start -- --clear
```

## 🚀 Build Commands

### Development Build

```bash
# iOS development
eas build --profile development --platform ios

# Android development
eas build --profile development --platform android
```

### Production Build

```bash
# iOS production
eas build --profile production --platform ios

# Android production
eas build --profile production --platform android
```

### Submit to Stores

```bash
# Submit to App Store
eas submit --platform ios

# Submit to Google Play
eas submit --platform android
```

## 📊 Data Management

### Reset Demo Data

```typescript
// In FinanceContext.tsx
const resetData = () => {
  setFinancialData({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    monthlySaving: 0,
    transactions: [],
    spendingByCategory: {},
  });
};
```

### Export Data

```typescript
// Create export function
const exportData = () => {
  const json = JSON.stringify(financialData);
  // Save to file or share
};
```

## 🎯 Keyboard Shortcuts

### Development Server

| Key | Action |
|-----|--------|
| `i` | Open iOS simulator |
| `a` | Open Android emulator |
| `w` | Open web browser |
| `r` | Reload app |
| `m` | Toggle menu |
| `d` | Show developer menu |
| `shift + d` | Toggle performance monitor |

## 🌟 Pro Tips

### Faster Development

```bash
# Use Expo Go for instant updates
# No need to rebuild after code changes

# Enable Fast Refresh
# Changes appear in ~1 second

# Use TypeScript autocomplete
# Ctrl+Space for suggestions
```

### Better Testing

```typescript
// Mock AI responses for testing
AIService.parseNaturalLanguage = jest.fn()
  .mockResolvedValue({
    type: 'expense',
    data: { amount: 5, category: 'Food' }
  });
```

### Performance Optimization

```typescript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <View>{/* ... */}</View>;
});

// Use useMemo for expensive calculations
const total = useMemo(() => 
  transactions.reduce((sum, t) => sum + t.amount, 0),
  [transactions]
);
```

## 📖 Documentation Commands

```bash
# Generate documentation
npx typedoc

# Serve documentation locally
npx http-server docs

# Update README
# Edit README.md and commit
```

## 🔐 Security Commands

```bash
# Install secure storage
npm install expo-secure-store

# Set up environment variables
# Create .env file
# Add to .gitignore

# Use environment variables
import Constants from 'expo-constants';
const apiKey = Constants.manifest.extra.apiKey;
```

## ✅ Pre-Launch Checklist

```bash
# 1. Test on real devices
# 2. Check performance
# 3. Test all features
# 4. Update version number
# 5. Generate screenshots
# 6. Write release notes
# 7. Build production app
# 8. Submit to stores
```

---

**Need more help?** Check these files:
- `README.md` - Project overview
- `DEVELOPMENT.md` - Detailed guide
- `QUICKSTART.md` - Quick start
- `PROJECT_SUMMARY.md` - What's included
