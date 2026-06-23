import React, { useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { GlassTabsProps, TabConfig } from '../../types/glassTabs';
import { DEFAULTS } from '../../config/defaults';
import {
  resolveIcon,
  resolveNativeIcon,
  isHeaderShown,
  buildHeaderOptions,
  buildScreenOptions,
  buildListeners,
  useIsDarkMode,
} from '../../utils/platform';
import { withAlpha } from '../../utils/colors';
import GlassTabBar from '../glass-tab-bar';

const Tab = createBottomTabNavigator();

let createNativeBottomTabNavigator: any = null;
let createNativeStackNavigator: any = null;

try {
  createNativeBottomTabNavigator =
    require('@bottom-tabs/react-navigation').createNativeBottomTabNavigator;
} catch (_) {}

try {
  createNativeStackNavigator =
    require('@react-navigation/native-stack').createNativeStackNavigator;
} catch (_) {}

/** Android header defaults — shared across all navigators for consistency. */
const ANDROID_HEADER_DEFAULTS = {
  titleAlign: 'left' as const,
  titleStyle: { fontSize: 20, fontWeight: '600' as const },
};

/**
 * Shared screen wrapper — wraps a screen in a native stack for consistent headers.
 * Used by ALL Android navigators so headers look identical.
 */
const StackScreen: React.FC<{
  component: React.ComponentType<any>;
  tab: TabConfig;
  backgroundColor?: string;
  isDark?: boolean;
}> = ({ component: Component, tab, backgroundColor, isDark }) => {
  const stackRef = useRef(createNativeStackNavigator!());
  const Stack = stackRef.current;
  const headerOpts = buildHeaderOptions(tab, {
    backgroundColor,
    isDark,
    ...ANDROID_HEADER_DEFAULTS,
  });
  return (
    <Stack.Navigator screenOptions={{ animation: 'none' }}>
      <Stack.Screen
        name={`${tab.name}_Screen`}
        component={Component}
        options={headerOpts}
      />
    </Stack.Navigator>
  );
};

/**
 * Renders a screen with consistent header handling.
 * If native-stack is available, wraps in StackScreen for native headers.
 * Otherwise falls back to inline header options for bottom-tabs.
 */
const renderScreen = (
  tab: TabConfig,
  backgroundColor: string,
  useStack: boolean,
  isDark?: boolean
) => {
  if (useStack && createNativeStackNavigator && isHeaderShown(tab)) {
    return () => (
      <StackScreen
        component={tab.component}
        tab={tab}
        backgroundColor={backgroundColor}
        isDark={isDark}
      />
    );
  }
  return undefined; // use component prop instead
};

/**
 * Android floating glass tab bar — custom pill with native GPU blur.
 */
const FloatingNavigator: React.FC<GlassTabsProps> = ({
  tabs,
  primaryColor = DEFAULTS.PRIMARY_COLOR,
  inactiveColor = DEFAULTS.INACTIVE_COLOR,
  backgroundColor = DEFAULTS.BACKGROUND_COLOR,
  opacity = DEFAULTS.OPACITY,
  cornerRadius = DEFAULTS.CORNER_RADIUS,
  floating = DEFAULTS.FLOATING,
  floatingMargin = DEFAULTS.TAB_BAR_MARGIN,
  labeled = DEFAULTS.LABELED,
  blurRadius = DEFAULTS.BLUR_RADIUS,
  colorScheme: colorSchemePref,
  initialRouteName,
  lazy,
}) => {
  const isDark = useIsDarkMode(colorSchemePref);
  const effectiveBg = isDark ? DEFAULTS.DARK_BACKGROUND : backgroundColor;
  const useStack = createNativeStackNavigator != null;

  const screenOptions = React.useMemo(
    () => ({
      tabBarStyle: {
        position: 'absolute' as const,
        backgroundColor: 'transparent',
      },
      tabBarShowLabel: false,
      lazy,
      // Hide bottom-tabs header when using native-stack for headers
      ...(useStack ? { headerShown: false } : {}),
    }),
    [useStack, lazy]
  );

  const renderTabBar = React.useCallback(
    (props: any) => (
      <GlassTabBar
        {...props}
        tabs={tabs}
        primaryColor={primaryColor}
        inactiveColor={inactiveColor}
        backgroundColor={backgroundColor}
        opacity={opacity}
        cornerRadius={cornerRadius}
        floating={floating}
        floatingMargin={floatingMargin}
        labeled={labeled}
        blurRadius={blurRadius}
        isDark={isDark}
      />
    ),
    [
      tabs,
      primaryColor,
      inactiveColor,
      backgroundColor,
      opacity,
      cornerRadius,
      floating,
      floatingMargin,
      labeled,
      blurRadius,
      isDark,
    ]
  );

  return (
    <Tab.Navigator
      initialRouteName={initialRouteName ?? tabs[0]?.name}
      tabBar={renderTabBar}
      screenOptions={screenOptions}
    >
      {tabs.map((tab: TabConfig) => {
        const children = renderScreen(tab, effectiveBg, useStack, isDark);
        return children ? (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            options={{
              tabBarIcon: ({
                color,
                size,
                focused,
              }: {
                color: string;
                size: number;
                focused: boolean;
              }) => resolveIcon(tab.renderIcon)({ color, size, focused }),
              ...buildScreenOptions(tab),
            }}
            listeners={buildListeners(tab) as any}
          >
            {children}
          </Tab.Screen>
        ) : (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
            options={{
              ...buildHeaderOptions(tab, {
                backgroundColor: effectiveBg,
                isDark,
                ...ANDROID_HEADER_DEFAULTS,
              }),
              tabBarIcon: ({
                color,
                size,
                focused,
              }: {
                color: string;
                size: number;
                focused: boolean;
              }) => resolveIcon(tab.renderIcon)({ color, size, focused }),
              ...buildScreenOptions(tab),
            }}
            listeners={buildListeners(tab) as any}
          />
        );
      })}
    </Tab.Navigator>
  );
};

/**
 * Android native Material 3 bottom navigation — used when floating is false.
 * Wraps each screen in a native stack for consistent header support.
 */
const NativeMaterialNavigator: React.FC<GlassTabsProps> = ({
  tabs,
  primaryColor = DEFAULTS.PRIMARY_COLOR,
  inactiveColor = DEFAULTS.INACTIVE_COLOR,
  backgroundColor = DEFAULTS.BACKGROUND_COLOR,
  labeled = DEFAULTS.LABELED,
  colorScheme: colorSchemePref,
  initialRouteName,
  activeIndicatorColor,
  rippleColor,
  tabBarHidden,
  tabBarStyle,
}) => {
  const isDark = useIsDarkMode(colorSchemePref);
  const effectiveBg = isDark ? DEFAULTS.DARK_BACKGROUND : backgroundColor;
  const effectiveInactive = isDark ? DEFAULTS.DARK_INACTIVE : inactiveColor;
  const nativeTabRef = useRef(createNativeBottomTabNavigator!());
  const NativeTab = nativeTabRef.current;

  return (
    <NativeTab.Navigator
      key={isDark ? 'dark' : 'light'}
      initialRouteName={initialRouteName ?? tabs[0]?.name}
      labeled={labeled}
      tabBarActiveTintColor={primaryColor}
      tabBarInactiveTintColor={effectiveInactive}
      activeIndicatorColor={
        activeIndicatorColor ?? withAlpha(primaryColor, 0.18)
      }
      rippleColor={rippleColor}
      tabBarHidden={tabBarHidden}
      tabBarStyle={[{ backgroundColor: effectiveBg }, tabBarStyle]}
    >
      {tabs.map((tab: TabConfig) => (
        <NativeTab.Screen
          key={tab.name}
          name={tab.name}
          options={{
            tabBarLabel: tab.title,
            tabBarIcon: ({ focused }: { focused: boolean }) => {
              const nativeIcon = resolveNativeIcon(tab.renderIcon);
              return nativeIcon
                ? focused
                  ? nativeIcon.filled
                  : nativeIcon.outline
                : undefined;
            },
            tabBarBadge: tab.badge != null ? String(tab.badge) : undefined,
            ...buildScreenOptions(tab),
          }}
          listeners={buildListeners(tab) as any}
        >
          {() => {
            if (createNativeStackNavigator && isHeaderShown(tab)) {
              return (
                <StackScreen
                  component={tab.component}
                  tab={tab}
                  backgroundColor={effectiveBg}
                  isDark={isDark}
                />
              );
            }
            return <tab.component />;
          }}
        </NativeTab.Screen>
      ))}
    </NativeTab.Navigator>
  );
};

/**
 * Android standard JS fallback bottom tabs — used when floating is false
 * and @bottom-tabs/react-navigation is not installed.
 */
const StandardFallbackNavigator: React.FC<GlassTabsProps> = ({
  tabs,
  primaryColor = DEFAULTS.PRIMARY_COLOR,
  inactiveColor = DEFAULTS.INACTIVE_COLOR,
  backgroundColor = DEFAULTS.BACKGROUND_COLOR,
  labeled = DEFAULTS.LABELED,
  colorScheme: colorSchemePref,
  initialRouteName,
  lazy,
  tabBarStyle,
}) => {
  const isDark = useIsDarkMode(colorSchemePref);
  const effectiveBg = isDark ? DEFAULTS.DARK_BACKGROUND : backgroundColor;
  const effectiveInactive = isDark ? DEFAULTS.DARK_INACTIVE : inactiveColor;
  const useStack = createNativeStackNavigator != null;

  const screenOptions = React.useMemo(
    () => ({
      tabBarActiveTintColor: primaryColor,
      tabBarInactiveTintColor: effectiveInactive,
      tabBarShowLabel: labeled,
      lazy,
      tabBarStyle: [
        {
          backgroundColor: effectiveBg,
          borderTopColor: withAlpha('#000000', 0.1),
          borderTopWidth: 0.5,
          elevation: 8,
        },
        tabBarStyle,
      ],
      ...(useStack ? { headerShown: false } : {}),
    }),
    [
      primaryColor,
      effectiveInactive,
      labeled,
      effectiveBg,
      useStack,
      lazy,
      tabBarStyle,
    ]
  );

  return (
    <Tab.Navigator
      initialRouteName={initialRouteName ?? tabs[0]?.name}
      screenOptions={screenOptions}
    >
      {tabs.map((tab: TabConfig) => {
        const children = renderScreen(tab, effectiveBg, useStack, isDark);
        return children ? (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            options={{
              tabBarIcon: ({
                color,
                size,
                focused,
              }: {
                color: string;
                size: number;
                focused: boolean;
              }) => resolveIcon(tab.renderIcon)({ color, size, focused }),
              tabBarBadge: tab.badge != null ? tab.badge : undefined,
              ...buildScreenOptions(tab),
            }}
            listeners={buildListeners(tab) as any}
          >
            {children}
          </Tab.Screen>
        ) : (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
            options={{
              ...buildHeaderOptions(tab, {
                backgroundColor: effectiveBg,
                isDark,
                ...ANDROID_HEADER_DEFAULTS,
              }),
              tabBarIcon: ({
                color,
                size,
                focused,
              }: {
                color: string;
                size: number;
                focused: boolean;
              }) => resolveIcon(tab.renderIcon)({ color, size, focused }),
              tabBarBadge: tab.badge != null ? tab.badge : undefined,
              ...buildScreenOptions(tab),
            }}
            listeners={buildListeners(tab) as any}
          />
        );
      })}
    </Tab.Navigator>
  );
};

/**
 * Android GlassTabs:
 * - floating=true  → custom glass pill with native GPU blur
 * - floating=false → native Material 3 BottomNavigationView (or JS fallback)
 */
const GlassTabsAndroid: React.FC<GlassTabsProps> = (props) => {
  const floating = props.floating ?? DEFAULTS.FLOATING;
  if (floating) return <FloatingNavigator {...props} />;
  if (createNativeBottomTabNavigator)
    return <NativeMaterialNavigator {...props} />;
  return <StandardFallbackNavigator {...props} />;
};

export default GlassTabsAndroid;
