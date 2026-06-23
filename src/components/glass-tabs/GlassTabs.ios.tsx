import React, { useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { GlassTabsProps, TabConfig } from '../../types/glassTabs';
import { DEFAULTS } from '../../config/defaults';
import {
  isLiquidGlassSupported,
  resolveIcon,
  resolveSfSymbol,
  isHeaderShown,
  buildHeaderOptions,
  buildScreenOptions,
  buildListeners,
  useIsDarkMode,
} from '../../utils/platform';
import { withAlpha } from '../../utils/colors';

const StandardTab = createBottomTabNavigator();

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

const canUseLiquidGlass =
  createNativeBottomTabNavigator != null && isLiquidGlassSupported();

/** iOS header defaults. */
const IOS_HEADER_DEFAULTS = {
  titleAlign: 'center' as const,
  titleStyle: { fontSize: 17, fontWeight: '600' as const },
};

/** Wraps screen in native stack for proper iOS header support (transparent, minimal). */
const NativeStackScreen: React.FC<{
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
    ...IOS_HEADER_DEFAULTS,
  });
  return (
    <Stack.Navigator
      screenOptions={{
        gestureEnabled: true,
        animation: 'slide_from_right',
        headerTransparent: true,
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name={`${tab.title}_Screen`}
        component={Component}
        options={headerOpts}
      />
    </Stack.Navigator>
  );
};

/** iOS 26+ liquid glass tab navigator. */
const LiquidGlassNavigator: React.FC<GlassTabsProps> = ({
  tabs,
  primaryColor = DEFAULTS.PRIMARY_COLOR,
  inactiveColor = DEFAULTS.INACTIVE_COLOR,
  backgroundColor = DEFAULTS.BACKGROUND_COLOR,
  hapticFeedback = DEFAULTS.HAPTIC_FEEDBACK,
  labeled = DEFAULTS.LABELED,
  translucent = DEFAULTS.TRANSLUCENT,
  colorScheme: colorSchemePref,
  initialRouteName,
  scrollEdgeAppearance,
  activeIndicatorColor,
  disablePageAnimations,
  sidebarAdaptable,
  tabBarHidden,
  minimizeBehavior,
  tabBarStyle,
}) => {
  const isDark = useIsDarkMode(colorSchemePref);
  const nativeTabRef = useRef(createNativeBottomTabNavigator!());
  const NativeTab = nativeTabRef.current;

  return (
    <NativeTab.Navigator
      initialRouteName={initialRouteName ?? tabs[0]?.name}
      labeled={labeled}
      hapticFeedbackEnabled={hapticFeedback}
      translucent={translucent}
      tabBarActiveTintColor={primaryColor}
      tabBarInactiveTintColor={inactiveColor}
      tabBarStyle={[{ backgroundColor }, tabBarStyle]}
      activeIndicatorColor={
        activeIndicatorColor ?? withAlpha(primaryColor, 0.18)
      }
      scrollEdgeAppearance={scrollEdgeAppearance}
      disablePageAnimations={disablePageAnimations}
      sidebarAdaptable={sidebarAdaptable}
      tabBarHidden={tabBarHidden}
      minimizeBehavior={minimizeBehavior}
    >
      {tabs.map((tab: TabConfig) => (
        <NativeTab.Screen
          key={tab.name}
          name={tab.name}
          options={{
            ...(labeled ? { tabBarLabel: tab.title } : {}),
            role: tab.role,
            tabBarIcon: () => ({
              sfSymbol: resolveSfSymbol(tab.renderIcon) || 'circle.fill',
            }),
            tabBarBadge: tab.badge != null ? String(tab.badge) : undefined,
            ...buildScreenOptions(tab),
          }}
          listeners={buildListeners(tab) as any}
        >
          {() => {
            if (createNativeStackNavigator && isHeaderShown(tab)) {
              return (
                <NativeStackScreen
                  component={tab.component}
                  tab={tab}
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

/** iOS 18- standard tab navigator. */
const StandardNavigator: React.FC<GlassTabsProps> = ({
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
  const borderColor = isDark
    ? withAlpha('#FFFFFF', 0.15)
    : withAlpha('#000000', 0.1);

  const screenOptions = React.useMemo(
    () => ({
      tabBarActiveTintColor: primaryColor,
      tabBarInactiveTintColor: effectiveInactive,
      tabBarShowLabel: labeled,
      lazy,
      tabBarStyle: [
        {
          backgroundColor: effectiveBg,
          borderTopColor: borderColor,
          borderTopWidth: 0.5,
        },
        tabBarStyle,
      ],
    }),
    [
      primaryColor,
      effectiveInactive,
      labeled,
      effectiveBg,
      borderColor,
      lazy,
      tabBarStyle,
    ]
  );

  return (
    <StandardTab.Navigator
      initialRouteName={initialRouteName ?? tabs[0]?.name}
      screenOptions={screenOptions}
    >
      {tabs.map((tab: TabConfig) => (
        <StandardTab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            ...buildHeaderOptions(tab, {
              backgroundColor: effectiveBg,
              isDark,
              ...IOS_HEADER_DEFAULTS,
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
      ))}
    </StandardTab.Navigator>
  );
};

/** iOS GlassTabs — liquid glass on iOS 26+, standard tabs on 18-. */
const GlassTabsIOS: React.FC<GlassTabsProps> = (props) => {
  if (canUseLiquidGlass) return <LiquidGlassNavigator {...props} />;
  return <StandardNavigator {...props} />;
};

export default GlassTabsIOS;
