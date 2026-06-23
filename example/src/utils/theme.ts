import { useColorScheme, StyleSheet } from 'react-native';

export interface Theme {
  isDark: boolean;
  colors: {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
  };
}

const LightTheme: Theme = {
  isDark: false,
  colors: {
    background: '#F2F2F7',
    card: '#FFFFFF',
    text: '#1C1C1E',
    textSecondary: '#8E8E93',
    border: '#E5E5EA',
    primary: '#007AFF',
  },
};

const DarkTheme: Theme = {
  isDark: true,
  colors: {
    background: '#000000',
    card: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#38383A',
    primary: '#0A84FF',
  },
};

export const useTheme = (): Theme => {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DarkTheme : LightTheme;
};

export const sharedStyles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigCard: {
    borderRadius: 16,
    height: 120,
    marginBottom: 12,
    padding: 20,
    justifyContent: 'center',
  },
  bigCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
});

export const CARD_COLORS = ['#FF2D55', '#5856D6', '#FF9500', '#34C759', '#007AFF', '#AF52DE', '#FF3B30', '#5AC8FA'];
