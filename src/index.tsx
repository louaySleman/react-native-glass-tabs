/**
 * react-native-glass-tabs
 *
 * Adaptive bottom tab navigation with glass effects for React Native.
 * @module react-native-glass-tabs
 */
import GlassTabs from './components/glass-tabs';

export { GlassTabs };
export { GlassView, BlurView, LiquidGlassView } from './components/glass-view';
export type { GlassViewProps } from './components/glass-view';
export default GlassTabs;
export type {
  GlassTabsProps,
  TabConfig,
  HeaderConfig,
  TabListeners,
  IconRenderProps,
  PlatformIcons,
  NativeIcon,
  SFSymbol,
  ColorSchemePreference,
} from './types/glassTabs';
