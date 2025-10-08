# Quick Start Guide - Finamo

## ✅ Installation Complete!

Your Finamo app has been successfully created with all the necessary files and dependencies installed.

## 🚀 Next Steps

### 1. Start the Development Server

```bash
npm start
```

This will start the Expo development server. You'll see a QR code in the terminal.

### 2. Run the App

**Option A: On Your Phone**
1. Install "Expo Go" app from App Store (iOS) or Google Play (Android)
2. Scan the QR code with your camera (iOS) or within Expo Go (Android)
3. The app will load on your device

**Option B: On Simulator/Emulator**
- For iOS: Press `i` in the terminal (requires Xcode)
- For Android: Press `a` in the terminal (requires Android Studio)
- For Web: Press `w` in the terminal

## 📱 App Features Overview

### Home Screen
- **Total Balance Card**: Shows your current financial status
- **Income/Expense Stats**: Monthly summary
- **AI Input Bar**: Type natural language commands
- **Spending Analysis**: Visual breakdown by category

### Natural Language Examples
Try typing these in the input bar at the bottom:
- `coffee $5` - Records a $5 coffee expense
- `spent $50 on food` - Adds food expense
- `earned $2000` - Records income
- `remind me to pay bills tomorrow` - Sets reminder
- `plan my budget for next month` - Creates budget plan

### Spending Screen
- View detailed spending by category
- See percentage of income spent
- Track recent transactions

### Savings Screen
- Set and track savings goals
- View progress with visual indicators
- Get savings tips

### Account Screen
- Manage profile settings
- Configure notifications
- Access security settings

## 🎨 Customization

### Change Colors
Edit `src/constants/theme.ts` to customize the color scheme:
```typescript
export const COLORS = {
  primary: '#5B5FFF',  // Change this to your brand color
  // ... other colors
};
```

### Add Your Logo
Replace the placeholder files in the `assets/` folder:
- `icon.png` - App icon (1024x1024)
- `splash.png` - Splash screen (1242x2436)
- `adaptive-icon.png` - Android adaptive icon (1024x1024)

### Integrate Real AI
Edit `src/services/AIService.ts`:
1. Add your OpenAI API key
2. Uncomment the API call code
3. Customize the AI prompts

## 🔧 Development Tools

### View the Project Structure
```bash
tree -I 'node_modules|.expo|.git' -L 3
```

### Clear Cache (if needed)
```bash
npm start -- --clear
```

### Check for Updates
```bash
npx expo-doctor
```

## 📚 Learning Resources

- **React Native**: https://reactnative.dev/docs/getting-started
- **Expo**: https://docs.expo.dev/
- **React Navigation**: https://reactnavigation.org/
- **TypeScript**: https://www.typescriptlang.org/docs/

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 19000
kill -9 $(lsof -ti:19000)
npm start
```

### Metro Bundler Issues
```bash
# Clear Metro cache
npx react-native start --reset-cache
```

### Dependencies Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📱 Testing on Different Devices

### iOS
- iPhone 14 Pro and newer (best experience)
- iOS 13.0 or higher required

### Android
- Android 5.0 or higher
- ARM64 recommended for better performance

## 🌟 What's Included

✅ Complete React Native + Expo setup
✅ 4 fully designed screens (Home, Spending, Saving, Account)
✅ AI natural language processing service
✅ Global state management with Context API
✅ Beautiful UI with gradients and animations
✅ Bottom tab navigation
✅ TypeScript for type safety
✅ Comprehensive documentation

## 🎯 Your First Task

1. Start the dev server: `npm start`
2. Open the app on your device
3. Try the AI input: type "coffee $5"
4. See the transaction added to your expenses!

## 💡 Pro Tips

- **Hot Reload**: Changes auto-refresh on save
- **Shake Device**: Opens developer menu
- **Debug**: Use Chrome DevTools for debugging
- **Fast Refresh**: Preserves component state on edit

## 🚀 Production Build

When ready to deploy:

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## 📧 Need Help?

- Check `DEVELOPMENT.md` for detailed development guide
- Read `README.md` for project overview
- Open an issue on GitHub
- Contact the development team

---

**Happy Coding! 🎉**

Start building your financial future with Finamo!
