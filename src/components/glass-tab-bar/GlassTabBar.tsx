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

type BackdropEvent = { nativeEvent: { dark: boolean; segments?: boolean[] } };

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
    /** Measure each tab's slice of the bar separately (dark/light per tab). */
    segments: number;
  };
  /** Bumped on every tab press: the native view plays a light haptic tick. */
  hapticToken?: number;
  onBackdropChange?: (e: BackdropEvent) => void;
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

type Palette = {
  idle: string;
  active: string;
  selector: string;
  selectorAlpha: number;
};

/** Fades towards `target` (0 = light-backdrop colours, 1 = dark-backdrop colours). */
const fadeTo = (v: Animated.Value, target: number) =>
  Animated.timing(v, {
    toValue: target,
    duration: DEFAULTS.CONTRAST_FADE_DURATION,
    easing: Easing.inOut(Easing.ease),
    useNativeDriver: true,
  }).start();

/**
 * Android floating glass tab bar.
 *
 * - Native GlassBarView: GPU backdrop blur / liquid glass of what is behind the bar
 * - Native GlassFadeView for a smooth fade under the bar
 * - One selection pill that springs to the pressed tab, stretching on the way like a drop of
 *   liquid and squishing a little under the finger (all on the native driver)
 * - Icons and labels that fade between dark and light together with what shows through
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
  // Liquid glass stays liquid with blur 0 (a clear lens); plain blur with radius 0 is flat.
  const look =
    glassEffect === 'liquid' ? 'liquid' : blurRadius <= 0 ? 'flat' : 'blur';
  const adaptive = look !== 'flat' && adaptiveIconColors;

  // What shows through the glass, as measured by the native bar (the whole bar at once, so
  // every tab switches together). Until the first measurement (and on the flat bar) the app's
  // theme decides.
  const [backdropDark, setBackdropDark] = useState<boolean | null>(null);
  useEffect(() => setBackdropDark(null), [look, isDark]);
  const onBackdropChange = useCallback(
    (e: BackdropEvent) => setBackdropDark(e.nativeEvent.dark),
    []
  );
  const onDark = adaptive && backdropDark != null ? backdropDark : isDark;

  /** Colours for icons, labels and the selection over a dark (true) or light (false) backdrop. */
  const palette = (dark: boolean): Palette => ({
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
  const lightSet = palette(false);
  const darkSet = palette(true);

  // One fade for every icon, label and the selection pill: both colour sets are drawn and
  // cross-faded together, so the whole bar changes at once and nothing ever jumps.
  const fade = useRef(new Animated.Value(onDark ? 1 : 0)).current;
  useEffect(() => fadeTo(fade, onDark ? 1 : 0), [onDark, fade]);
  const fadeOut = fade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  const bgColor = isDark ? DEFAULTS.DARK_BACKGROUND : backgroundColor;
  const screenBgColor = isDark
    ? DEFAULTS.DARK_SCREEN_BACKGROUND
    : DEFAULTS.LIGHT_SCREEN_BACKGROUND;

  // ---- Selection pill: position (in tabs), stretch while travelling, squish while pressed ----
  const [tabW, setTabW] = useState(0);
  const pos = useRef(new Animated.Value(state.index)).current;
  const stretch = useRef(new Animated.Value(0)).current;
  const reach = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;
  const lastIndex = useRef(state.index);
  useEffect(() => {
    const from = lastIndex.current;
    lastIndex.current = state.index;
    if (from === state.index) return;
    // Further jumps stretch more, up to half the pill again.
    reach.setValue(Math.min(0.5, 0.14 + 0.12 * Math.abs(state.index - from)));
    Animated.parallel([
      Animated.spring(pos, {
        toValue: state.index,
        stiffness: 260,
        damping: 24,
        mass: 1,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(stretch, {
          toValue: 1,
          duration: 110,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(stretch, {
          toValue: 0,
          stiffness: 220,
          damping: 16,
          mass: 1,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [state.index, pos, stretch, reach]);
  const squish = (to: number) =>
    Animated.spring(press, {
      toValue: to,
      stiffness: 420,
      damping: 22,
      mass: 1,
      useNativeDriver: true,
    }).start();

  const pillH = DEFAULTS.TAB_BAR_HEIGHT - 12;
  const pillW = Math.max(0, tabW - 12);
  const pillStyle = {
    width: pillW,
    height: pillH,
    borderRadius: Math.min(pillW, pillH) / 2,
    transform: [
      { translateX: Animated.add(Animated.multiply(pos, tabW), 6) },
      {
        scaleX: Animated.multiply(
          Animated.add(1, Animated.multiply(stretch, reach)),
          press
        ),
      },
      {
        scaleY: Animated.multiply(
          Animated.subtract(1, Animated.multiply(stretch, 0.1)),
          press
        ),
      },
    ],
  };

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
      segments: 0,
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

  const onTabLayout = useCallback((index: number, event: LayoutChangeEvent) => {
    if (index === 0) setTabW(event.nativeEvent.layout.width);
  }, []);

  const sets: [Palette, number][] = adaptive
    ? [
        [lightSet, 0],
        [darkSet, 1],
      ]
    : [[isDark ? darkSet : lightSet, -1]];

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

          {tabW > 0 &&
            sets.map(([set, layer]) => (
              <Animated.View
                key={`pill-${layer}`}
                pointerEvents="none"
                style={[
                  styles.selector,
                  pillStyle,
                  {
                    backgroundColor: set.selector,
                    opacity:
                      layer === -1
                        ? set.selectorAlpha
                        : Animated.multiply(
                            layer === 1 ? fade : fadeOut,
                            set.selectorAlpha
                          ),
                  },
                ]}
              />
            ))}

          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;
            const tab = tabs[index]!;

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
              navigation.emit({ type: 'tabLongPress', target: route.key });
            };

            return (
              <TouchableWithoutFeedback
                key={route.key}
                onPress={onPress}
                onPressIn={() => squish(0.92)}
                onPressOut={() => squish(1)}
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
                  {sets.map(([set, layer]) => {
                    const layerOpacity =
                      layer === -1 ? 1 : layer === 1 ? fade : fadeOut;
                    const iconColor = isFocused ? set.active : set.idle;
                    return (
                      <Animated.View
                        key={layer}
                        style={[
                          layer === 1 ? styles.contentOverlay : styles.content,
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
