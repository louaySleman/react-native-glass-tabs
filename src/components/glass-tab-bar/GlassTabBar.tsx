import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  TouchableWithoutFeedback,
  Animated,
  Text,
  requireNativeComponent,
  type LayoutChangeEvent,
  Easing,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { TabConfig } from '../../types/glassTabs';
import { DEFAULTS } from '../../config/defaults';
import { lighten } from '../../utils/colors';
import AnimatedTabIcon from './AnimatedTabIcon';
import { styles } from './styles';

/** Native glass background: GPU backdrop blur in Kotlin (GlassBarView). */
const GlassBarNativeView = requireNativeComponent<{
  glassConfig: {
    cornerRadius: number;
    opacity: number;
    blurRadius: number;
    effect: 'blur' | 'liquid';
    adaptiveIcons: boolean;
    backgroundOpacity?: number | null;
    backgroundColor: string;
    darkMode: boolean;
  };
  /** Bumped on every tab press: the native view plays a light haptic tick. */
  hapticToken?: number;
  onBackdropChange?: (e: { nativeEvent: { dark: boolean } }) => void;
  style: any;
}>('GlassBarNativeView');

/** Native smooth fade gradient — Kotlin LinearGradient shader. */
const GlassFadeNativeView = requireNativeComponent<{
  fadeConfig: { backgroundColor: string; darkMode: boolean };
  style: any;
}>('GlassFadeNativeView');

interface GlassTabBarProps extends BottomTabBarProps {
  tabs: TabConfig[];
  primaryColor: string;
  /** Unset: picked per look (flat / blur / liquid) for contrast on the glass. */
  inactiveColor?: string;
  backgroundColor: string;
  opacity: number;
  cornerRadius: number;
  floating: boolean;
  floatingMargin: number;
  labeled: boolean;
  blurRadius: number;
  glassEffect?: 'blur' | 'liquid';
  hapticFeedback?: boolean;
  adaptiveIconColors?: boolean;
  backgroundOpacity?: number;
  isDark: boolean;
}

/**
 * Android frosted glass tab bar.
 *
 * - Native GlassBarView: GPU backdrop blur of what is behind the bar
 * - Native GlassFadeView for smooth LinearGradient fade
 * - Animated selector that scales from center (Telegram-style)
 * - Icon crossfade between outline and filled states
 */
const GlassTabBar: React.FC<GlassTabBarProps> = ({
  state,
  navigation,
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
  glassEffect = 'blur',
  hapticFeedback = true,
  adaptiveIconColors = true,
  backgroundOpacity,
  isDark,
}) => {
  const [hapticToken, setHapticToken] = useState(0);
  // Icon and selection colours that read well on each look: liquid glass is nearly clear, so
  // icons go near-black / near-white (like iOS) and the selection is a neutral glass capsule.
  // Liquid glass stays liquid with blur 0 (a clear lens); plain blur with radius 0 is flat.
  const look =
    glassEffect === 'liquid' ? 'liquid' : blurRadius <= 0 ? 'flat' : 'blur';
  // What shows through the glass, as measured by the native bar: dark content gets light icons
  // and light content dark icons, whatever the app's theme (like iOS). Until the first
  // measurement (and on the flat bar), the theme decides.
  const [backdropDark, setBackdropDark] = useState<boolean | null>(null);
  useEffect(() => setBackdropDark(null), [look, isDark]);
  const onDark =
    adaptiveIconColors && look !== 'flat' && backdropDark != null
      ? backdropDark
      : isDark;
  const onBackdropChange = useCallback(
    (e: { nativeEvent: { dark: boolean } }) =>
      setBackdropDark(e.nativeEvent.dark),
    []
  );
  /** Colours for icons, labels and the selection over a dark (true) or light (false) backdrop. */
  const palette = (dark: boolean) => ({
    idle:
      inactiveColor ??
      (look === 'liquid'
        ? dark
          ? DEFAULTS.LIQUID_INACTIVE_DARK
          : DEFAULTS.LIQUID_INACTIVE
        : look === 'blur'
        ? dark
          ? DEFAULTS.BLUR_INACTIVE_DARK
          : DEFAULTS.BLUR_INACTIVE
        : DEFAULTS.INACTIVE_COLOR),
    // On dark glass a saturated tint (e.g. #007AFF) is too dark to read: lift it a little.
    active:
      look !== 'flat' && dark ? lighten(primaryColor, 0.35) : primaryColor,
    selector:
      look === 'liquid'
        ? dark
          ? '#FFFFFF'
          : DEFAULTS.LIQUID_SELECTOR_LIGHT
        : primaryColor,
    selectorAlpha:
      look === 'liquid'
        ? dark
          ? DEFAULTS.LIQUID_SELECTOR_ALPHA_DARK
          : DEFAULTS.LIQUID_SELECTOR_ALPHA
        : DEFAULTS.SELECTOR_ALPHA,
  });
  // Both colour sets are drawn and cross-faded (on the native driver) when the backdrop flips,
  // so icons and labels fade between dark and light instead of jumping.
  const adaptive = look !== 'flat' && adaptiveIconColors;
  const lightSet = palette(false);
  const darkSet = palette(true);
  const fade = useRef(new Animated.Value(onDark ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(fade, {
      toValue: onDark ? 1 : 0,
      duration: DEFAULTS.CONTRAST_FADE_DURATION,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [onDark, fade]);
  const fadeOut = fade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const bgColor = isDark ? DEFAULTS.DARK_BACKGROUND : backgroundColor;
  const screenBgColor = isDark
    ? DEFAULTS.DARK_SCREEN_BACKGROUND
    : DEFAULTS.LIGHT_SCREEN_BACKGROUND;

  const selectorScales = useRef<Animated.Value[]>(
    tabs.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))
  ).current;

  const [tabLayouts, setTabLayouts] = useState<
    Record<number, { x: number; width: number; height: number }>
  >({});

  const glassConfig = useMemo(
    () => ({
      cornerRadius,
      opacity,
      blurRadius,
      effect: glassEffect,
      adaptiveIcons: adaptiveIconColors,
      backgroundOpacity:
        backgroundOpacity == null
          ? null
          : Math.max(0, Math.min(100, backgroundOpacity)),
      backgroundColor: bgColor,
      darkMode: isDark,
    }),
    [
      cornerRadius,
      opacity,
      blurRadius,
      glassEffect,
      adaptiveIconColors,
      backgroundOpacity,
      bgColor,
      isDark,
    ]
  );

  const fadeConfig = useMemo(
    () => ({ backgroundColor: screenBgColor, darkMode: isDark }),
    [screenBgColor, isDark]
  );

  useEffect(() => {
    const animations = selectorScales.map((scale, i) =>
      Animated.timing(scale, {
        toValue: state.index === i ? 1 : 0,
        duration: DEFAULTS.SELECTOR_DURATION,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );
    Animated.parallel(animations).start();
  }, [state.index, selectorScales]);

  const onTabLayout = useCallback((index: number, event: LayoutChangeEvent) => {
    const { x, width, height } = event.nativeEvent.layout;
    setTabLayouts((prev) => ({ ...prev, [index]: { x, width, height } }));
  }, []);

  return (
    <View style={styles.outerWrapper} pointerEvents="box-none">
      <GlassFadeNativeView
        fadeConfig={fadeConfig}
        style={styles.fadeGradient}
      />

      <View
        style={[
          styles.barWrapper,
          {
            paddingHorizontal: floating ? floatingMargin : 0,
            paddingBottom: floating ? floatingMargin + 16 : 16,
          },
        ]}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.barContainer,
            { maxWidth: DEFAULTS.MAX_TAB_BAR_WIDTH },
          ]}
        >
          <GlassBarNativeView
            glassConfig={glassConfig}
            hapticToken={hapticToken}
            onBackdropChange={adaptiveIconColors ? onBackdropChange : undefined}
            style={[styles.nativeGlass, { borderRadius: cornerRadius }]}
          />

          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;
            const tab = tabs[index]!;
            const layout = tabLayouts[index];

            const selectorScale = selectorScales[index]!.interpolate({
              inputRange: [0, 1],
              outputRange: [
                DEFAULTS.SELECTOR_SCALE_FROM,
                DEFAULTS.SELECTOR_SCALE_TO,
              ],
            });
            const selectorOpacity = selectorScales[index]!.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            });

            const onPress = () => {
              if (hapticFeedback) setHapticToken((t) => t + 1);
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <TouchableWithoutFeedback
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={tab.accessibilityLabel}
                testID={tab.testID}
              >
                <View
                  style={styles.tabItem}
                  onLayout={(e) => onTabLayout(index, e)}
                >
                  {(adaptive
                    ? [lightSet, darkSet]
                    : [onDark ? darkSet : lightSet]
                  ).map((set, layer) => {
                    const layerOpacity = adaptive
                      ? layer === 0
                        ? fadeOut
                        : fade
                      : 1;
                    const iconColor = isFocused ? set.active : set.idle;
                    return (
                      <React.Fragment key={layer}>
                        <Animated.View
                          style={[
                            styles.selector,
                            {
                              backgroundColor: set.selector,
                              opacity: Animated.multiply(
                                Animated.multiply(
                                  selectorOpacity,
                                  set.selectorAlpha
                                ),
                                layerOpacity
                              ),
                              borderRadius: layout
                                ? Math.min(
                                    layout.width - 12,
                                    DEFAULTS.TAB_BAR_HEIGHT - 12
                                  ) / 2
                                : 22,
                              transform: [{ scale: selectorScale }],
                            },
                          ]}
                        />
                        <Animated.View
                          style={[
                            layer === 1
                              ? styles.contentOverlay
                              : styles.content,
                            { opacity: layerOpacity },
                          ]}
                          importantForAccessibility={
                            layer === 1 ? 'no-hide-descendants' : 'auto'
                          }
                          pointerEvents="none"
                        >
                          <View style={styles.iconWrapper}>
                            <AnimatedTabIcon
                              tab={tab}
                              focused={isFocused}
                              color={iconColor}
                            />
                            {tab.badge != null && (
                              <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                  {typeof tab.badge === 'number' &&
                                  tab.badge > DEFAULTS.BADGE_MAX
                                    ? `${DEFAULTS.BADGE_MAX}+`
                                    : String(tab.badge)}
                                </Text>
                              </View>
                            )}
                          </View>
                          {labeled && (
                            <Text
                              style={[
                                styles.label,
                                { color: iconColor },
                                isFocused && styles.labelFocused,
                              ]}
                              numberOfLines={1}
                            >
                              {tab.title}
                            </Text>
                          )}
                        </Animated.View>
                      </React.Fragment>
                    );
                  })}
                </View>
              </TouchableWithoutFeedback>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default GlassTabBar;
