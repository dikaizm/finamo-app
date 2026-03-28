// Test file to verify environment variable loading
import { Constants } from 'expo-constants';

console.log('=== Environment Variable Test ===');
console.log('EXPO_PUBLIC_API_BASE_URL:', process.env.EXPO_PUBLIC_API_BASE_URL);
console.log('Constants.expoConfig:', JSON.stringify(Constants.expoConfig, null, 2));
console.log('====================================');
