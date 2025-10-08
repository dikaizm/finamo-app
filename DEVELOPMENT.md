# Finamo Development Guide

## Project Overview

Finamo is a smart financial assistant that uses AI to process natural language commands and help users manage their finances. The app is built with React Native and Expo for cross-platform compatibility.

## Architecture

### Component Structure

```
App (Navigation Container)
├── HomeScreen (Main Dashboard)
│   ├── Balance Card
│   ├── Income/Expense Stats
│   ├── Savings Summary
│   ├── AI Advice Card
│   ├── Spending Analysis
│   └── AI Input Bar
├── SpendingScreen (Expense Analysis)
│   ├── Overview Card
│   ├── Category Breakdown
│   └── Recent Transactions
├── SavingScreen (Goals & Savings)
│   ├── Total Savings Card
│   ├── Savings Goals
│   ├── Quick Actions
│   └── Tips
└── AccountScreen (User Settings)
    ├── Profile Card
    ├── Settings Menu
    └── Sign Out
```

### State Management

The app uses React Context API for global state management:

**FinanceContext** provides:
- `financialData`: Current financial state
- `addTransaction`: Add new transactions
- `updateBalance`: Update total balance

### AI Service

The `AIService` is a singleton class that handles:
1. Natural language parsing
2. Command extraction (type, action, data)
3. Financial advice generation

#### Supported Command Types:
- **reminder**: Set reminders for payments
- **budget**: Create budget plans
- **expense**: Track expenses
- **income**: Record income
- **saving**: Set savings goals
- **analysis**: Get financial insights

## Development Workflow

### Starting Development

```bash
# Install dependencies
npm install

# Start Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

### Adding New Features

#### 1. Add a New Screen

```typescript
// src/screens/NewScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text>New Screen</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});
```

#### 2. Add to Navigation

```typescript
// App.tsx
import NewScreen from './src/screens/NewScreen';

// Add to Tab.Navigator
<Tab.Screen name="New" component={NewScreen} />
```

#### 3. Update Context (if needed)

```typescript
// src/context/FinanceContext.tsx
// Add new state or functions
const [newData, setNewData] = useState(...);

const newFunction = () => {
  // Implementation
};

return (
  <FinanceContext.Provider value={{ 
    financialData, 
    addTransaction, 
    updateBalance,
    newData,
    newFunction 
  }}>
    {children}
  </FinanceContext.Provider>
);
```

## API Integration

### Integrating with OpenAI

```typescript
// src/services/AIService.ts
import axios from 'axios';

setApiKey(key: string) {
  this.apiKey = key;
}

async parseNaturalLanguage(input: string): Promise<AICommand> {
  // Call OpenAI API
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a financial assistant...'
        },
        {
          role: 'user',
          content: input
        }
      ]
    },
    {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  // Parse response and return AICommand
}
```

### Bank Integration Example

```typescript
// src/services/BankService.ts
export class BankService {
  async connectBank(bankId: string, credentials: any) {
    // Use Plaid or similar service
  }
  
  async getTransactions(accountId: string) {
    // Fetch transactions
  }
  
  async syncTransactions() {
    // Sync with local database
  }
}
```

## Styling Guidelines

### Color Palette

```typescript
// Use consistent colors from theme.ts
import { COLORS } from '../constants/theme';

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
  },
  text: {
    color: COLORS.text,
  },
});
```

### Component Patterns

#### Card Component
```typescript
<View style={styles.card}>
  {/* Content */}
</View>

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 12,
  },
});
```

#### Icon with Background
```typescript
<View style={styles.iconContainer}>
  <Ionicons name="wallet" size={24} color="#5B5FFF" />
</View>

const styles = StyleSheet.create({
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

## Testing

### Unit Tests

```bash
# Install testing dependencies
npm install --save-dev @testing-library/react-native jest

# Run tests
npm test
```

### Example Test

```typescript
// __tests__/AIService.test.ts
import AIService from '../src/services/AIService';

describe('AIService', () => {
  it('should parse expense command', async () => {
    const command = await AIService.parseNaturalLanguage('coffee $5');
    expect(command.type).toBe('expense');
    expect(command.data.amount).toBe(5);
  });
});
```

## Deployment

### iOS

```bash
# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### Android

```bash
# Build for Android
eas build --platform android

# Submit to Google Play
eas submit --platform android
```

## Troubleshooting

### Common Issues

1. **Metro bundler not starting**
   ```bash
   # Clear cache
   expo start -c
   ```

2. **Dependencies not found**
   ```bash
   # Reinstall dependencies
   rm -rf node_modules
   npm install
   ```

3. **iOS build fails**
   ```bash
   # Clean iOS build
   cd ios
   pod install
   cd ..
   ```

## Performance Optimization

### Image Optimization
- Use WebP format for images
- Implement lazy loading for lists
- Cache images locally

### Code Splitting
```typescript
// Use React.lazy for code splitting
const AccountScreen = React.lazy(() => import('./screens/AccountScreen'));
```

### Memoization
```typescript
import React, { useMemo } from 'react';

const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

## Security Best Practices

1. **Secure Storage**
   ```bash
   npm install expo-secure-store
   ```

2. **API Key Management**
   - Never commit API keys
   - Use environment variables
   - Implement key rotation

3. **Data Encryption**
   - Encrypt sensitive data
   - Use HTTPS for all requests
   - Implement certificate pinning

## Contributing

### Branch Strategy
- `main`: Production-ready code
- `develop`: Development branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes

### Commit Messages
```
feat: Add new savings goal feature
fix: Fix transaction list rendering
docs: Update README
style: Format code
refactor: Restructure AI service
test: Add unit tests for transactions
```

## Resources

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [OpenAI API](https://platform.openai.com/docs)

## Support

For questions or issues:
1. Check the documentation
2. Search existing issues
3. Create a new issue with details
4. Contact the development team
