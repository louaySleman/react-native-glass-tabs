import React, { useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { GlassTabs } from 'react-native-glass-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { createNativeIcon } from './src/utils/icons';
import {
  ConfigScreen,
  SearchScreen,
  ChatScreen,
  ProfileScreen,
  DEFAULT_CONFIG,
} from './src/screens';
import type { AppConfig } from './src/screens';

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
    <NavigationContainer  theme={isDark ? DarkTheme : DefaultTheme}>
      <GlassTabs
        tabs={[
          {
            name: 'Config',
            component: ConfigTab,
            title: 'Config',
            header: { title: 'Glass Tabs Config'},
            renderIcon: {
              sfSymbol: 'gearshape.fill',
              nativeIcon: createNativeIcon('settings', 'settings-outline'),
              render: ({ color, size, focused }) => (
                <Ionicons name={focused ? 'settings' : 'settings-outline'} size={size} color={color} />
              ),
            },
          },
          {
            name: 'Search',
            component: SearchScreen,
            title: 'Search',
            role: 'search',
            renderIcon: {
              sfSymbol: 'magnifyingglass',
              nativeIcon: createNativeIcon('search', 'search-outline'),
              render: ({ color, size, focused }) => (
                <Ionicons name={focused ? 'search' : 'search-outline'} size={size} color={color} />
              ),
            },
          },
          {
            name: 'Chat',
            component: ChatTab,
            title: 'Chat',
            badge: chatBadge || undefined,
            header: { title: 'Chat'},
            renderIcon: {
              sfSymbol: 'bubble.left.fill',
              nativeIcon: createNativeIcon('chatbubble', 'chatbubble-outline'),
              render: ({ color, size, focused }) => (
                <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={size} color={color} />
              ),
            },
          },
          {
            name: 'Profile',
            component: ProfileScreen,
            title: 'Profile',
            header: false,
            renderIcon: {
              sfSymbol: 'person.fill',
              nativeIcon: createNativeIcon('person', 'person-outline'),
              render: ({ color, size, focused }) => (
                <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
              ),
            },
          },
        ]}
        primaryColor={config.primaryColor}
        floating={config.floating}
        labeled={config.labeled}
        hapticFeedback={config.hapticFeedback}
        colorScheme={isDark ? 'dark' : 'light'}
      />
    </NavigationContainer>
  );
};

export default App;
