/**
 * Platform detection utilities.
 * @module utils/platform
 */
import type React from 'react';
import { Platform } from 'react-native';
import { useColorScheme } from 'react-native';
import type {
  ColorSchemePreference,
  HeaderConfig,
  IconRenderProps,
  NativeIcon,
  PlatformIcons,
  SFSymbol,
  TabConfig,
} from '../types/glassTabs';

/**
 * Check if the current device supports iOS liquid glass (iOS 26+).
 * @returns true on iOS 26+, false otherwise
 */
export const isLiquidGlassSupported = (): boolean => {
  if (Platform.OS !== 'ios') return false;
  const version =
    typeof Platform.Version === 'string'
      ? parseInt(Platform.Version, 10)
      : Platform.Version;
  return version >= 26;
};

/**
 * Get the Android API level. Returns 0 on non-Android platforms.
 */
export const getAndroidApiLevel = (): number => {
  if (Platform.OS !== 'android') return 0;
  return typeof Platform.Version === 'number' ? Platform.Version : 0;
};

/**
 * Resolves a renderIcon value to the JS render function.
 * Used by floating glass pill (Android) and standard tabs (iOS < 26).
 */
export const resolveIcon = (
  renderIcon: ((props: IconRenderProps) => React.ReactNode) | PlatformIcons
): ((props: IconRenderProps) => React.ReactNode) => {
  if (typeof renderIcon === 'function') return renderIcon;
  return renderIcon.render;
};

/**
 * Resolves the sfSymbol from a renderIcon config.
 * Used by iOS 26+ liquid glass navigator.
 */
export const resolveSfSymbol = (
  renderIcon: ((props: IconRenderProps) => React.ReactNode) | PlatformIcons
): SFSymbol | undefined => {
  if (typeof renderIcon === 'function') return undefined;
  return renderIcon.sfSymbol;
};

/**
 * Resolves the native icon images from a renderIcon config.
 * Used by Android Material 3 navigator (floating=false).
 */
export const resolveNativeIcon = (
  renderIcon: ((props: IconRenderProps) => React.ReactNode) | PlatformIcons
): NativeIcon | undefined => {
  if (typeof renderIcon === 'function') return undefined;
  return renderIcon.nativeIcon;
};

/**
 * Returns whether the header should be shown for a tab.
 */
export const isHeaderShown = (tab: TabConfig): boolean => {
  return tab.header !== false;
};

/**
 * Resolves header config to a HeaderConfig object or empty object.
 */
export const resolveHeaderConfig = (tab: TabConfig): HeaderConfig => {
  if (tab.header === false || tab.header === undefined) return {};
  return tab.header;
};

/**
 * Builds React Navigation screen options from a tab's header config.
 * Works with both @react-navigation/bottom-tabs and native-stack.
 */
export const buildHeaderOptions = (
  tab: TabConfig,
  defaults?: {
    backgroundColor?: string;
    titleAlign?: 'left' | 'center';
    titleStyle?: Record<string, any>;
    isDark?: boolean;
  }
): Record<string, any> => {
  const shown = isHeaderShown(tab);
  if (!shown) return { headerShown: false };

  const cfg = resolveHeaderConfig(tab);

  // Full custom header render — overrides everything else
  if (cfg.render) {
    return {
      headerShown: true,
      header: () => cfg.render!({ title: cfg.title ?? tab.title }),
    };
  }

  const options: Record<string, any> = {
    headerShown: true,
    title: cfg.title ?? tab.title,
  };

  if (cfg.left) options.headerLeft = cfg.left;
  if (cfg.right) options.headerRight = cfg.right;
  if (cfg.tintColor) options.headerTintColor = cfg.tintColor;
  if (cfg.shadowVisible !== undefined)
    options.headerShadowVisible = cfg.shadowVisible;
  if (cfg.transparent) options.headerTransparent = true;
  if (cfg.largeTitle) options.headerLargeTitle = true;

  // Style: merge defaults with user overrides
  const headerStyle: Record<string, any> = {};
  if (defaults?.backgroundColor && !cfg.transparent) {
    headerStyle.backgroundColor = defaults.backgroundColor;
  }
  if (cfg.style) Object.assign(headerStyle, cfg.style);
  if (Object.keys(headerStyle).length > 0) options.headerStyle = headerStyle;

  // Title style: merge defaults with user overrides, add dark mode text color
  const titleStyle: Record<string, any> = { ...(defaults?.titleStyle ?? {}) };
  if (defaults?.isDark && !titleStyle.color) {
    titleStyle.color = '#FFFFFF';
  }
  if (cfg.titleStyle) Object.assign(titleStyle, cfg.titleStyle);
  if (Object.keys(titleStyle).length > 0) options.headerTitleStyle = titleStyle;

  // Header tint color for back buttons / icons in dark mode
  if (defaults?.isDark && !cfg.tintColor) {
    options.headerTintColor = '#FFFFFF';
  }

  // Title alignment
  options.headerTitleAlign =
    cfg.titleAlign ??
    defaults?.titleAlign ??
    (Platform.OS === 'ios' ? 'center' : 'left');

  return options;
};

/**
 * Builds per-screen options from TabConfig for accessibility, testing, and behavior.
 * Returns options that can be spread into Screen's `options` prop.
 */
export const buildScreenOptions = (tab: TabConfig): Record<string, any> => {
  const opts: Record<string, any> = {};
  if (tab.accessibilityLabel)
    opts.tabBarAccessibilityLabel = tab.accessibilityLabel;
  if (tab.testID) opts.tabBarTestID = tab.testID;
  if (tab.lazy !== undefined) opts.lazy = tab.lazy;
  if (tab.freezeOnBlur !== undefined) opts.freezeOnBlur = tab.freezeOnBlur;
  return opts;
};

/**
 * Builds React Navigation `listeners` prop from TabConfig.listeners.
 * Maps our simplified listener API to React Navigation's event system.
 */
export const buildListeners = (
  tab: TabConfig
): Record<string, (e: any) => void> | undefined => {
  if (!tab.listeners) return undefined;
  const result: Record<string, (e: any) => void> = {};
  if (tab.listeners.tabPress) {
    const handler = tab.listeners.tabPress;
    result.tabPress = (e: any) =>
      handler({ preventDefault: () => e.preventDefault() });
  }
  if (tab.listeners.tabLongPress) {
    const handler = tab.listeners.tabLongPress;
    result.tabLongPress = () => handler();
  }
  if (tab.listeners.focus) {
    const handler = tab.listeners.focus;
    result.focus = () => handler();
  }
  if (tab.listeners.blur) {
    const handler = tab.listeners.blur;
    result.blur = () => handler();
  }
  return result;
};

/**
 * Hook to resolve the effective dark mode boolean from a ColorSchemePreference.
 * 'auto' follows the system, 'light'/'dark' forces the mode.
 */
export const useIsDarkMode = (preference?: ColorSchemePreference): boolean => {
  const systemScheme = useColorScheme();
  if (preference === 'dark') return true;
  if (preference === 'light') return false;
  return systemScheme === 'dark';
};
