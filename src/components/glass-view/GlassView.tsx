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
  /** `'blur'` (frosted, Android 12+) or `'liquid'` (iOS 26-style, Android 13+). Default `'blur'`. */
  effect?: 'blur' | 'liquid';
  /** Blur strength in px (1–25). Default 25. */
  blurRadius?: number;
  /** Tint colour over the glass (hex). Default: white, or #1C1C1E in dark mode. */
  tintColor?: string;
  /**
   * How much of the tint covers the glass, in percent (0–100). Default 47 for blur, 19 for
   * liquid glass. On Android 11 and below (no live blur) the tint is shown more strongly.
   */
  backgroundOpacity?: number;
  /**
   * Text and icons inside fade to white over dark content (or to near-black over light
   * content in dark mode) by themselves, natively. Default true.
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
  Platform.OS === 'android'
    ? requireNativeComponent<NativeProps>('GlassNativeView')
    : null;

const DEFAULT_OPACITY = { blur: 47, liquid: 19 };

/**
 * A container with a live glass background: everything drawn behind it is blurred on the GPU
 * (`effect="liquid"` adds iOS 26-style edge refraction and a light rim). Only what's behind it
 * is captured, and only on frames the app draws anyway, so it costs very little.
 *
 * Android 12+ (liquid glass 13+). Elsewhere (iOS, older Android) it renders a translucent
 * tinted view with the same shape, so layouts look right everywhere.
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
          { backgroundColor: hexToRgba(tint, alpha), overflow: 'hidden' },
          style,
        ]}
        {...rest}
      >
        {children}
      </View>
    );
  }
  return (
    <GlassNativeView
      {...rest}
      style={[styles.clip, style]}
      glassConfig={{
        cornerRadius: radius,
        blurRadius,
        effect,
        backgroundColor: tint,
        backgroundOpacity: pct,
        // Without live blur (Android 11 and below) the flat tint uses this opacity.
        opacity: Math.min(0.94, pct / 100 + 0.5),
        adaptiveIcons: false,
        adaptiveContent,
        darkMode: dark,
      }}
      onBackdropChange={handleBackdrop}
    >
      {children}
    </GlassNativeView>
  );
};

/** Frosted glass container (Android 12+). See {@link GlassView}. */
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
