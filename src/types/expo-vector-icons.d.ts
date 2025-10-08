// Local ambient module declaration to satisfy TypeScript since we rely on the version bundled with Expo.
// This avoids adding a direct dependency that caused duplicate doctor warnings earlier.
// If you later add @expo/vector-icons explicitly to package.json, you can remove this stub.
declare module '@expo/vector-icons' {
  import * as React from 'react';
  import { TextProps, StyleProp, TextStyle } from 'react-native';
  export interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle>;
  }
  export class Ionicons extends React.Component<IconProps> {}
  // For simplicity, export any other icon sets as any.
  const others: any;
  export default others;
}