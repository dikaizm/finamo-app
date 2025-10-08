# Finamo - Smart Financial Assistant

Finamo is a personal financial and productivity assistant powered by an agentic AI system. The app translates natural language prompts (e.g., "remind me to pay my credit card tomorrow" or "plan my budget for next week") into structured, executable To-Dos.

## 🎯 Features

- **AI-Powered Natural Language Processing**: Type commands like "coffee $5" or "remind me to pay bills tomorrow"
- **Real-time Financial Dashboard**: Track your total balance, income, expenses, and savings
- **Smart Spending Analysis**: Visual breakdown of spending by category with interactive charts
- **Savings Goals**: Set and track multiple savings goals with progress indicators
- **Cross-Platform**: Works on both iOS and Android
- **Beautiful UI**: Modern, intuitive interface with gradient cards and smooth animations

## 🏗️ Technology Stack

- **React Native**: Cross-platform mobile development
- **Expo**: Development framework and toolchain
- **TypeScript**: Type-safe code
- **React Navigation**: Navigation library
- **Context API**: State management
- **AI Integration**: Natural language command processing

## 📁 Project Structure

```
finamo-app/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx         # Main dashboard
│   │   ├── SpendingScreen.tsx     # Spending analysis
│   │   ├── SavingScreen.tsx       # Savings goals
│   │   └── AccountScreen.tsx      # User account settings
│   ├── context/
│   │   └── FinanceContext.tsx     # Global state management
│   └── services/
│       └── AIService.ts           # AI command processing
├── App.tsx                         # Main app component
├── package.json
└── app.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Run on your device**:
   - For iOS: Press `i` in the terminal or run `npm run ios`
   - For Android: Press `a` in the terminal or run `npm run android`
   - For Web: Press `w` in the terminal or run `npm run web`

### Running with Expo Go

1. Install Expo Go app on your phone (available on App Store and Google Play)
2. Scan the QR code shown in the terminal
3. The app will load on your device

## 💡 How to Use

### Natural Language Commands

The AI assistant understands various command types:

1. **Track Expenses**:
   - "coffee $5"
   - "spent $50 on food"
   - "paid $100 for shopping"

2. **Add Income**:
   - "earned $2000"
   - "received $500 income"

3. **Set Reminders**:
   - "remind me to pay credit card tomorrow"
   - "reminder to check budget next week"

4. **Plan Budget**:
   - "plan my budget for next month"
   - "create budget for this week"

5. **Savings Goals**:
   - "save $1000 for vacation"
   - "add $500 to savings"

### Features by Screen

#### Home Screen
- View total balance with growth percentage
- See monthly income, expenses, and savings
- Quick spending analysis by category
- AI input bar for natural language commands

#### Spending Screen
- Detailed spending breakdown by category
- Visual progress bars for each category
- Recent transaction history
- Spending percentage of income

#### Savings Screen
- Track multiple savings goals
- Visual progress indicators
- Quick actions for managing savings
- Savings tips and recommendations

#### Account Screen
- Profile management
- Security settings
- Notification preferences
- Support and help center

## 🤖 AI Integration

The app uses a custom AI service that:
- Parses natural language input
- Extracts relevant data (amounts, categories, dates)
- Converts commands into structured actions
- Provides financial advice based on spending patterns

To integrate with OpenAI or other AI services:
1. Open `src/services/AIService.ts`
2. Add your API key
3. Customize the parsing logic

## 🎨 Customization

### Colors
Main brand colors are defined in the styles:
- Primary: `#5B5FFF` (purple-blue)
- Success: `#10B981` (green)
- Warning: `#F59E0B` (amber)
- Danger: `#EF4444` (red)

### Adding New Features

1. Create a new screen in `src/screens/`
2. Add it to the navigation in `App.tsx`
3. Update the `FinanceContext` if needed
4. Add new AI command types in `AIService.ts`

## 📱 Screenshots

The app includes:
- Beautiful gradient cards
- Smooth animations
- Intuitive navigation
- Clean, modern design
- Responsive layout

## 🔒 Security

- Biometric authentication support
- Secure data storage
- Privacy-focused design
- Local data processing

## 🌟 Future Enhancements

- [ ] Bank account integration
- [ ] Bill payment reminders
- [ ] Investment tracking
- [ ] Advanced AI insights
- [ ] Recurring transactions
- [ ] Export to CSV
- [ ] Multi-currency support
- [ ] Dark mode

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, please open an issue in the repository or contact the development team.

---

Built with ❤️ using React Native and Expo
