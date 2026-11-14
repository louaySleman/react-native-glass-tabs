/**
 * Standalone glass containers: the tab bar's live blur and liquid glass, around any content.
 * @module components/glass-view
 */
import React, { useCallback } from 'react';
import {
  Platform,
  requireNativeComponent,
  StyleSheet,
  useColorScheme,
  View,
  type NativeSyntheticEvent,
  type ViewProps,
} from 'react-native';
import type { ColorSchemePreference } from '../../types/glassTabs';
import { hexToRgba } from '../../utils/colors';

export interface GlassViewProps extends ViewProps {
  /** `'blur'` (frosted, Android 13+) or `'liquid'` (iOS 26-style, Android 13+). Default `'blur'`. */
  effect?: 'blur' | 'liquid';
  /** Blur strength in px (1–25). Default 25. */
  blurRadius?: number;
  /** Tint colour over the glass (hex). Default: white, or #1C1C1E in dark mode. */
  tintColor?: string;
  /**
   * How much of the tint covers the glass, in percent (0–100). Default 47 for blur, 19 for
   * liquid glass. On Android 12 and below (no live blur) the tint is shown more strongly.
   */
  backgroundOpacity?: number;
  /**
   * Android: text and icons inside fade to white over dark content (or to near-black over
   * light content in dark mode) by themselves, natively. Default true. (On iOS the system
   * material handles legibility.)
   */
  adaptiveContent?: boolean;
  /** Force light/dark or follow the system. Default 'auto'. */
  colorScheme?: ColorSchemePreference;
  /** Called when what shows through the glass turns dark (`true`) or light (`false`). */
  onBackdropChange?: (dark: boolean) => void;
}

type NativeProps = ViewProps & {
  glassConfig: {
    cornerRadius: number;
    blurRadius: number;
    effect: 'blur' | 'liquid';
    backgroundColor: string;
    backgroundOpacity: number;
    opacity: number;
    adaptiveIcons: boolean;
    adaptiveContent: boolean;
    darkMode: boolean;
  };
  onBackdropChange?: (e: NativeSyntheticEvent<{ dark: boolean }>) => void;
};

const GlassNativeView =
  Platform.OS === 'android' || Platform.OS === 'ios'
    ? requireNativeComponent<NativeProps>('GlassNativeView')
    : null;

const DEFAULT_OPACITY = { blur: 47, liquid: 19 };

/**
 * A container with a live glass background: everything drawn behind it is blurred on the GPU
 * (`effect="liquid"` adds iOS 26-style edge refraction and a light rim). Only what's behind it
 * is captured, and only on frames the app draws anyway, so it costs very little.
 *
 * Android: live blur and liquid glass 13+ (older: a translucent tinted view of the same shape).
 * iOS: the system's own materials — liquid glass (UIGlassEffect) on iOS 26+, frosted blur
 * before that and for `effect="blur"`; they adapt to light / dark by themselves.
 */
export const GlassView: React.FC<GlassViewProps> = ({
  effect = 'blur',
  blurRadius = 25,
  tintColor,
  backgroundOpacity,
  adaptiveContent = true,
  colorScheme = 'auto',
  onBackdropChange,
  style,
  children,
  ...rest
}) => {
  const system = useColorScheme();
  const dark =
    colorScheme === 'auto' ? system === 'dark' : colorScheme === 'dark';
  const tint = tintColor ?? (dark ? '#1C1C1E' : '#FFFFFF');
  const pct = Math.max(
    0,
    Math.min(100, backgroundOpacity ?? DEFAULT_OPACITY[effect])
  );
  const flat = StyleSheet.flatten(style) ?? {};
  const radius = typeof flat.borderRadius === 'number' ? flat.borderRadius : 0;
  const handleBackdrop = useCallback(
    (e: NativeSyntheticEvent<{ dark: boolean }>) =>
      onBackdropChange?.(e.nativeEvent.dark),
    [onBackdropChange]
  );

  if (!GlassNativeView) {
    // No live blur here: a stronger translucent tint keeps content readable.
    const alpha = Math.min(0.94, pct / 100 + 0.5);
    return (
      <View
        style={[
          styles.clip,
          { backgroundColor: hexToRgba(tint, alpha) },
          style,
        ]}
        {...rest}
      >
        {children}
      </View>
    );
  }
  const glassConfig = {
    cornerRadius: radius,
    blurRadius,
    effect,
    backgroundColor: tint,
    backgroundOpacity: pct,
    // Without live blur (Android 12 and below) the flat tint uses this opacity.
    opacity: Math.min(0.94, pct / 100 + 0.5),
    adaptiveIcons: false,
    adaptiveContent,
    darkMode: dark,
  };
  if (Platform.OS === 'ios') {
    // iOS: React Native lays the children out as usual; the system glass sits behind them.
    return (
      <View {...rest} style={[styles.clip, style]}>
        <GlassNativeView
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          glassConfig={glassConfig}
        />
        {children}
      </View>
    );
  }
  // Android: the children live inside the glass view, which recolours text and icons natively.
  return (
    <GlassNativeView
      {...rest}
      style={[styles.clip, style]}
      glassConfig={glassConfig}
      onBackdropChange={handleBackdrop}
    >
      {children}
    </GlassNativeView>
  );
};

/** Frosted glass container (Android 13+). See {@link GlassView}. */
export const BlurView: React.FC<Omit<GlassViewProps, 'effect'>> = (props) => (
  <GlassView {...props} effect="blur" />
);

/** iOS 26-style liquid glass container (Android 13+). See {@link GlassView}. */
export const LiquidGlassView: React.FC<Omit<GlassViewProps, 'effect'>> = (
  props
) => <GlassView {...props} effect="liquid" />;

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
});

export default GlassView;
