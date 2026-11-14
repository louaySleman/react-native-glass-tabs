import React, { useState, useCallback } from 'react';
import { Platform, StatusBar, useColorScheme } from 'react-native';
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GlassTabs } from 'react-native-glass-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { createNativeIcon } from './src/utils/icons';
import {
  ConfigScreen,
  HomeScreen,
  SearchScreen,
  ChatScreen,
  ProfileScreen,
  DEFAULT_CONFIG,
} from './src/screens';
import type { AppConfig } from './src/screens';

/** iOS 27 sets a tab apart as a round button with the `prominent` role; iOS 26 did it for `search`. */
const SEARCH_ROLE =
  Platform.OS === 'ios' && parseInt(String(Platform.Version), 10) >= 27
    ? 'prominent'
    : 'search';

const App = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [chatBadge, setChatBadge] = useState(3);

  const updateConfig = useCallback((patch: Partial<AppConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }));
  }, []);

  const ConfigTab = useCallback(
    () => <ConfigScreen config={config} onUpdate={updateConfig} />,
    [config, updateConfig],
  );

  const ChatTab = useCallback(
    () => (
      <ChatScreen
        badgeCount={chatBadge}
        onIncrementBadge={() => setChatBadge(prev => prev + 1)}
        onDecrementBadge={() => setChatBadge(prev => Math.max(0, prev - 1))}
        onResetBadge={() => setChatBadge(0)}
      />
    ),
    [chatBadge],
  );

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          translucent
          backgroundColor="transparent"
        />
        <GlassTabs
          tabs={[
            {
              name: 'Home',
              component: HomeScreen,
              title: 'Home',
              header: false,
              renderIcon: {
                sfSymbol: 'house.fill',
                nativeIcon: createNativeIcon('home', 'home-outline'),
                render: ({ color, size, focused }) => (
                  <Ionicons
                    name={focused ? 'home' : 'home-outline'}
                    size={size}
                    color={color}
                  />
                ),
              },
            },
            {
              name: 'Search',
              component: SearchScreen,
              title: 'Search',
              role: SEARCH_ROLE,
              header: { title: 'Search' },
              renderIcon: {
                sfSymbol: 'magnifyingglass',
                nativeIcon: createNativeIcon('search', 'search-outline'),
                render: ({ color, size, focused }) => (
                  <Ionicons
                    name={focused ? 'search' : 'search-outline'}
                    size={size}
                    color={color}
                  />
                ),
              },
            },
            {
              name: 'Chat',
              component: ChatTab,
              title: 'Chats',
              badge: chatBadge || undefined,
              header: { title: 'Chats' },
              renderIcon: {
                sfSymbol: 'bubble.left.fill',
                nativeIcon: createNativeIcon(
                  'chatbubbles',
                  'chatbubbles-outline',
                ),
                render: ({ color, size, focused }) => (
                  <Ionicons
                    name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
                    size={size}
                    color={color}
                  />
                ),
              },
            },
            {
              name: 'Profile',
              component: ProfileScreen,
              title: 'Profile',
              header: false,
              renderIcon: {
                sfSymbol: 'person.crop.circle.fill',
                nativeIcon: createNativeIcon(
                  'person-circle',
                  'person-circle-outline',
                ),
                render: ({ color, size, focused }) => (
                  <Ionicons
                    name={focused ? 'person-circle' : 'person-circle-outline'}
                    size={size}
                    color={color}
                  />
                ),
              },
            },
            {
              name: 'Settings',
              component: ConfigTab,
              title: 'Settings',
              header: { title: 'Glass Tabs Settings' },
              renderIcon: {
                sfSymbol: 'gearshape.fill',
                nativeIcon: createNativeIcon('settings', 'settings-outline'),
                render: ({ color, size, focused }) => (
                  <Ionicons
                    name={focused ? 'settings' : 'settings-outline'}
                    size={size}
                    color={color}
                  />
                ),
              },
            },
          ]}
          primaryColor={config.primaryColor}
          floating={config.floating}
          labeled={config.labeled}
          hapticFeedback={config.hapticFeedback}
          blurRadius={config.blur ? 25 : 0}
          glassEffect={config.liquid ? 'liquid' : 'blur'}
          backgroundOpacity={config.glassOpacity}
          colorScheme={isDark ? 'dark' : 'light'}
        />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
