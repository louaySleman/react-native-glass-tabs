import type React from 'react';
import type {
  ImageSourcePropType,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';

/** Props passed to the user's renderIcon function. */
export interface IconRenderProps {
  color: string;
  size: number;
  focused: boolean;
}

/** Supported SF Symbol names for iOS 26+ liquid glass tab icons. */
export type SFSymbol =
  // Navigation & Home
  | 'house'
  | 'house.fill'
  // Search
  | 'magnifyingglass'
  | 'magnifyingglass.circle'
  | 'magnifyingglass.circle.fill'
  // Person & Profile
  | 'person'
  | 'person.fill'
  | 'person.circle'
  | 'person.circle.fill'
  | 'person.2'
  | 'person.2.fill'
  | 'person.crop.circle'
  | 'person.crop.circle.fill'
  // Communication
  | 'bubble.left'
  | 'bubble.left.fill'
  | 'bubble.right'
  | 'bubble.right.fill'
  | 'phone'
  | 'phone.fill'
  | 'envelope'
  | 'envelope.fill'
  | 'paperplane'
  | 'paperplane.fill'
  // Media
  | 'play'
  | 'play.fill'
  | 'play.circle'
  | 'play.circle.fill'
  | 'music.note'
  | 'music.note.list'
  | 'film'
  | 'film.fill'
  | 'camera'
  | 'camera.fill'
  | 'photo'
  | 'photo.fill'
  | 'video'
  | 'video.fill'
  // Common UI
  | 'gear'
  | 'gearshape'
  | 'gearshape.fill'
  | 'bell'
  | 'bell.fill'
  | 'bell.badge'
  | 'bell.badge.fill'
  | 'heart'
  | 'heart.fill'
  | 'star'
  | 'star.fill'
  | 'bookmark'
  | 'bookmark.fill'
  | 'tag'
  | 'tag.fill'
  | 'cart'
  | 'cart.fill'
  | 'bag'
  | 'bag.fill'
  // Content
  | 'doc'
  | 'doc.fill'
  | 'doc.text'
  | 'doc.text.fill'
  | 'folder'
  | 'folder.fill'
  | 'tray'
  | 'tray.fill'
  | 'archivebox'
  | 'archivebox.fill'
  // Maps & Location
  | 'map'
  | 'map.fill'
  | 'mappin'
  | 'mappin.circle'
  | 'mappin.circle.fill'
  | 'location'
  | 'location.fill'
  // Misc
  | 'square.grid.2x2'
  | 'square.grid.2x2.fill'
  | 'circle'
  | 'circle.fill'
  | 'plus'
  | 'plus.circle'
  | 'plus.circle.fill'
  | 'ellipsis'
  | 'ellipsis.circle'
  | 'ellipsis.circle.fill'
  | 'list.bullet'
  | 'clock'
  | 'clock.fill'
  | 'calendar'
  | 'globe'
  | 'shield'
  | 'shield.fill'
  | 'lock'
  | 'lock.fill'
  | 'key'
  | 'key.fill'
  | 'bolt'
  | 'bolt.fill'
  | 'wand.and.stars'
  | 'sparkles'
  | 'questionmark.circle'
  | 'questionmark.circle.fill'
  | 'info.circle'
  | 'info.circle.fill'
  | 'exclamationmark.triangle'
  | 'exclamationmark.triangle.fill';

/** Native image sources for Android Material 3 bottom tabs (non-floating). */
export interface NativeIcon {
  /** Icon shown when tab is focused. Use require('./icon-filled.png') or { uri: '...' }. */
  filled: ImageSourcePropType;
  /** Icon shown when tab is not focused. Use require('./icon-outline.png') or { uri: '...' }. */
  outline: ImageSourcePropType;
}

/** Platform-specific icon configuration. */
export interface PlatformIcons {
  /** SF Symbol name for iOS 26+ liquid glass (rendered natively by SwiftUI). */
  sfSymbol?: SFSymbol;
  /** Native image sources for Android Material 3 bottom tabs when `floating={false}`. */
  nativeIcon?: NativeIcon;
  /** Render function for JS-rendered tabs (floating glass pill, iOS < 26 fallback). */
  render: (props: IconRenderProps) => React.ReactNode;
}

/** Header configuration for a tab screen. */
export interface HeaderConfig {
  /** Override the header title (defaults to tab `title`). */
  title?: string;
  /** Render a component on the left side of the header. */
  left?: () => React.ReactNode;
  /** Render a component on the right side of the header. */
  right?: () => React.ReactNode;
  /** Custom header background style. */
  style?: StyleProp<ViewStyle>;
  /** Custom header title text style. */
  titleStyle?: StyleProp<TextStyle>;
  /** Header title alignment. */
  titleAlign?: 'left' | 'center';
  /** Header icon/back button tint color. */
  tintColor?: string;
  /** Make the header background transparent. */
  transparent?: boolean;
  /** Show/hide the header bottom shadow. */
  shadowVisible?: boolean;
  /** Enable large title header (iOS only, collapses on scroll). */
  largeTitle?: boolean;
  /** Fully replace the header with a custom component. Overrides all other header options. */
  render?: (props: { title: string }) => React.ReactNode;
}

/** Navigation event listeners for a tab screen. */
export interface TabListeners {
  /** Fired when the tab is pressed. Return `true` to prevent default navigation. */
  tabPress?: (e: { preventDefault: () => void }) => void;
  /** Fired when the tab is long-pressed. */
  tabLongPress?: () => void;
  /** Fired when the screen comes into focus. */
  focus?: () => void;
  /** Fired when the screen loses focus. */
  blur?: () => void;
}

/** Configuration for a single tab screen. */
export interface TabConfig {
  name: string;
  component: React.ComponentType<any>;
  title: string;
  renderIcon: ((props: IconRenderProps) => React.ReactNode) | PlatformIcons;
  role?: 'search';
  badge?: number | string;
  /**
   * Header configuration.
   * - `undefined` → default header shown with tab title
   * - `false` → no header
   * - `HeaderConfig` → header with custom options (title, left, right buttons, style)
   */
  header?: false | HeaderConfig;
  /** Accessibility label for the tab button (screen readers). */
  accessibilityLabel?: string;
  /** Test ID for the tab button (e2e testing). */
  testID?: string;
  /** Don't render the screen until it's first focused. Default: true. */
  lazy?: boolean;
  /** Navigation event listeners for this tab. */
  listeners?: TabListeners;
  /** Freeze the screen when it loses focus (improves performance). */
  freezeOnBlur?: boolean;
}

/** Color scheme preference. */
export type ColorSchemePreference = 'light' | 'dark' | 'auto';

/** Props for the GlassTabs component. */
export interface GlassTabsProps {
  tabs: TabConfig[];
  primaryColor?: string;
  inactiveColor?: string;
  backgroundColor?: string;
  /** Android glass opacity (0-1). Android floating only. */
  opacity?: number;
  /** Android pill corner radius (dp). Android floating only. */
  cornerRadius?: number;
  /** Android: `true` = floating glass pill, `false` = native Material 3. */
  floating?: boolean;
  /** Android floating margin (dp). Android floating only. */
  floatingMargin?: number;
  /** Enable haptic feedback on tab press. iOS only. */
  hapticFeedback?: boolean;
  /** Show text labels under icons. */
  labeled?: boolean;
  /** Android blur radius (px, API 31+). Android floating only. */
  blurRadius?: number;
  /** Initial active tab name. */
  initialRouteName?: string;
  /** Tab bar translucency. iOS only. */
  translucent?: boolean;
  /** Force light/dark mode or follow system. Default: 'auto'. */
  colorScheme?: ColorSchemePreference;
  /** Tab bar scroll edge appearance. iOS native only. */
  scrollEdgeAppearance?: 'default' | 'opaque' | 'transparent';
  /** Active tab indicator color. Android native & iOS native. */
  activeIndicatorColor?: string;
  /** Touch ripple color. Android native only. */
  rippleColor?: string;
  /** Disable page transition animations. iOS native only. */
  disablePageAnimations?: boolean;
  /** Tab bar adaptable sidebar style (iPadOS). iOS native only. */
  sidebarAdaptable?: boolean;
  /** Hide the tab bar completely. */
  tabBarHidden?: boolean;
  /** Tab bar minimize behavior. iOS 26+ only. */
  minimizeBehavior?: 'automatic' | 'onScrollDown' | 'onScrollUp' | 'never';
  /** Don't render screens until they are first focused. Default: true. */
  lazy?: boolean;
  /** Custom styles for the tab bar container (shadow, border, padding, etc.). */
  tabBarStyle?: StyleProp<ViewStyle>;
}
